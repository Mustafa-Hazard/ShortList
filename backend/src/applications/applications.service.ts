import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Application } from './application.entity';
import { ApplicationStage } from '../common/enums/application-stage.enum';
import { JobStatus } from '../common/enums/job.enum';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';
import { JobsService } from '../jobs/jobs.service';
import { CvScorerService } from './cv-scorer.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationQueryDto } from './dto/application-query.dto';

interface TransitionRule {
  to: ApplicationStage;
  roles: Role[];
}

// Each *edge* in the pipeline carries its own allowed roles, per the spec:
// "recruiters screen, hiring managers shortlist and decide". Rejected is
// reachable from any non-terminal stage but the role allowed to reject
// still varies by how far along the pipeline the application is.
const TRANSITIONS: Record<ApplicationStage, TransitionRule[]> = {
  [ApplicationStage.APPLIED]: [
    { to: ApplicationStage.SCREENED, roles: [Role.RECRUITER, Role.ADMIN] },
    { to: ApplicationStage.REJECTED, roles: [Role.RECRUITER, Role.ADMIN] },
  ],
  [ApplicationStage.SCREENED]: [
    {
      to: ApplicationStage.SHORTLISTED,
      roles: [Role.HIRING_MANAGER, Role.ADMIN],
    },
    {
      to: ApplicationStage.REJECTED,
      roles: [Role.RECRUITER, Role.HIRING_MANAGER, Role.ADMIN],
    },
  ],
  [ApplicationStage.SHORTLISTED]: [
    {
      to: ApplicationStage.INTERVIEW_SCHEDULED,
      roles: [Role.RECRUITER, Role.ADMIN],
    },
    {
      to: ApplicationStage.REJECTED,
      roles: [Role.HIRING_MANAGER, Role.ADMIN],
    },
  ],
  [ApplicationStage.INTERVIEW_SCHEDULED]: [
    { to: ApplicationStage.OFFER, roles: [Role.HIRING_MANAGER, Role.ADMIN] },
    {
      to: ApplicationStage.REJECTED,
      roles: [Role.HIRING_MANAGER, Role.ADMIN],
    },
  ],
  [ApplicationStage.OFFER]: [
    { to: ApplicationStage.HIRED, roles: [Role.HIRING_MANAGER, Role.ADMIN] },
    {
      to: ApplicationStage.REJECTED,
      roles: [Role.HIRING_MANAGER, Role.ADMIN],
    },
  ],
  [ApplicationStage.HIRED]: [],
  [ApplicationStage.REJECTED]: [],
};

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private applicationsRepo: Repository<Application>,
    private jobsService: JobsService,
    private cvScorerService: CvScorerService,
    private notificationsService: NotificationsService,
  ) {}

  async apply(dto: CreateApplicationDto, candidate: User): Promise<Application> {
    // Reuses JobsService.findOne, which already throws 404 for anything
    // non-published when called as a candidate — so an application can
    // never be created against a draft/closed/archived posting.
    const posting = await this.jobsService.findOne(dto.jobPostingId, candidate);
    if (posting.status !== JobStatus.PUBLISHED) {
      throw new BadRequestException('This job posting is not accepting applications');
    }

    const application = this.applicationsRepo.create({
      jobPostingId: dto.jobPostingId,
      candidateId: candidate.id,
      coverLetter: dto.coverLetter ?? null,
      yearsOfExperience: dto.yearsOfExperience ?? null,
      salaryExpectation: dto.salaryExpectation ?? null,
      availabilityDate: dto.availabilityDate ?? null,
      stage: ApplicationStage.APPLIED,
    });

    try {
      return await this.applicationsRepo.save(application);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as any).driverError?.code === UNIQUE_VIOLATION
      ) {
        throw new ConflictException('You have already applied to this job posting');
      }
      throw err;
    }
  }

  async findMine(candidate: User): Promise<Application[]> {
    return this.applicationsRepo.find({
      where: { candidateId: candidate.id },
      order: { createdAt: 'DESC' },
    });
  }

  async findForPosting(
    query: ApplicationQueryDto,
    user: User,
  ): Promise<Application[]> {
    if (!query.jobPostingId) {
      throw new BadRequestException('jobPostingId is required');
    }
    // Confirms the posting belongs to the staff member's company — throws
    // 403/404 exactly as JobsController's own routes would.
    await this.jobsService.findOne(query.jobPostingId, user);

    return this.applicationsRepo.find({
      where: {
        jobPostingId: query.jobPostingId,
        ...(query.stage ? { stage: query.stage } : {}),
      },
      // Shortlist sorted by AI score by default (nulls last), per spec.
      order: { aiScore: { direction: 'DESC', nulls: 'LAST' } as any },
    });
  }

  async findOne(id: string, user: User): Promise<Application> {
    const application = await this.applicationsRepo.findOne({ where: { id } });
    if (!application) throw new NotFoundException('Application not found');

    if (user.role === Role.CANDIDATE) {
      if (application.candidateId !== user.id) {
        throw new NotFoundException('Application not found');
      }
      return application;
    }

    // Staff: confirm the owning posting belongs to their company.
    await this.jobsService.findOne(application.jobPostingId, user);
    return application;
  }

  async transition(
    id: string,
    target: ApplicationStage,
    user: User,
  ): Promise<Application> {
    const application = await this.getOwnedForStaff(id, user);
    this.assertTransitionAllowed(application.stage, target, user.role);
    application.stage = target;
    const saved = await this.applicationsRepo.save(application);

    try {
      await this.notificationsService.createAndSend(
        application.candidateId,
        NotificationType.APPLICATION_STAGE_CHANGED,
        {
          applicationId: id,
          jobPostingId: application.jobPostingId,
          newStage: target,
        },
      );
    } catch (err) {
      // Degrade-don't-block
    }

    return saved;
  }

  async bulkTransition(
    ids: string[],
    target: ApplicationStage,
    user: User,
  ): Promise<{ succeeded: string[]; failed: { id: string; reason: string }[] }> {
    const succeeded: string[] = [];
    const failed: { id: string; reason: string }[] = [];

    // Sequential rather than Promise.all: each row's failure (wrong company,
    // invalid transition) must not affect the others, and we want a clear
    // per-id result rather than one failure aborting the whole batch.
    for (const id of ids) {
      try {
        await this.transition(id, target, user);
        succeeded.push(id);
      } catch (err) {
        failed.push({
          id,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return { succeeded, failed };
  }

  async scoreApplication(id: string, user: User): Promise<Application> {
    const application = await this.applicationsRepo.findOne({
      where: { id },
      relations: { jobPosting: true, cv: true },
    });
    if (!application) throw new NotFoundException('Application not found');
    await this.jobsService.findOne(application.jobPostingId, user);

    const scoreResult = await this.cvScorerService.score({
      jobPosting: application.jobPosting,
      cvText: application.cv?.extractedText ?? null,
      coverLetter: application.coverLetter,
      yearsOfExperience: application.yearsOfExperience,
      salaryExpectation: application.salaryExpectation,
    });

    application.aiScore = scoreResult.aiScore;
    application.aiExtraction = scoreResult.aiExtraction;
    application.aiStrengths = scoreResult.aiStrengths;
    application.aiGaps = scoreResult.aiGaps;

    return this.applicationsRepo.save(application);
  }

  private assertTransitionAllowed(
    from: ApplicationStage,
    to: ApplicationStage,
    role: Role,
  ): void {
    const rule = TRANSITIONS[from].find((r) => r.to === to);
    if (!rule) {
      throw new BadRequestException(`Cannot transition from ${from} to ${to}`);
    }
    if (!rule.roles.includes(role)) {
      throw new ForbiddenException(
        `This transition requires one of the following roles: ${rule.roles.join(', ')}`,
      );
    }
  }

  private async getOwnedForStaff(id: string, user: User): Promise<Application> {
    const application = await this.applicationsRepo.findOne({ where: { id } });
    if (!application) throw new NotFoundException('Application not found');
    // Throws 403/404 if this staff member's company doesn't own the posting.
    await this.jobsService.findOne(application.jobPostingId, user);
    return application;
  }
}
