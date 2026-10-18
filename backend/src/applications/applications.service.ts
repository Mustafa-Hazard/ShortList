import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application, ApplicationDocument } from './application.entity';
import { ApplicationStage } from '../common/enums/application-stage.enum';
import { Role } from '../common/enums/role.enum';
import { JobStatus } from '../common/enums/job.enum';
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

const TRANSITIONS: Record<ApplicationStage, TransitionRule[]> = {
  [ApplicationStage.APPLIED]: [
    { to: ApplicationStage.SCREENED, roles: [Role.RECRUITER, Role.ADMIN] },
    {
      to: ApplicationStage.REJECTED,
      roles: [Role.RECRUITER, Role.HIRING_MANAGER, Role.ADMIN],
    },
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

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
    private jobsService: JobsService,
    private cvScorerService: CvScorerService,
    private notificationsService: NotificationsService,
  ) {}

  async apply(
    dto: CreateApplicationDto,
    candidate: User,
  ): Promise<Application> {
    const posting = await this.jobsService.findOne(dto.jobPostingId, candidate);
    if (posting.status !== JobStatus.PUBLISHED) {
      throw new BadRequestException(
        'This job posting is not accepting applications',
      );
    }

    try {
      const application = await this.applicationModel.create({
        jobPostingId: dto.jobPostingId,
        candidateId: candidate.id,
        coverLetter: dto.coverLetter ?? null,
        yearsOfExperience: dto.yearsOfExperience ?? null,
        salaryExpectation: dto.salaryExpectation ?? null,
        availabilityDate: dto.availabilityDate ?? null,
        stage: ApplicationStage.APPLIED,
      });
      return application.toObject();
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ConflictException(
          'You have already applied to this job posting',
        );
      }
      throw err;
    }
  }

  async findMine(candidate: User): Promise<Application[]> {
    return this.applicationModel
      .find({ candidateId: candidate.id })
      .populate('candidate')
      .populate('jobPosting')
      .populate('cv')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findForPosting(
    query: ApplicationQueryDto,
    user: User,
  ): Promise<Application[]> {
    if (!query.jobPostingId) {
      const jobs = await this.jobsService.findAll({}, user);
      const jobIds = jobs.map((j) => j.id);
      if (jobIds.length === 0) return [];
      const filter: Record<string, any> = { jobPostingId: { $in: jobIds } };
      if (query.stage && typeof query.stage === 'string') {
        filter.stage = { $eq: String(query.stage) };
      }
      return this.applicationModel
        .find(filter)
        .populate('candidate')
        .populate('jobPosting')
        .populate('cv')
        .sort({ aiScore: -1 })
        .exec();
    }

    if (
      typeof query.jobPostingId !== 'string' ||
      !/^[a-zA-Z0-9-]+$/.test(query.jobPostingId)
    ) {
      throw new BadRequestException('Invalid job posting ID');
    }
    await this.jobsService.findOne(query.jobPostingId, user);
    const filter: Record<string, any> = {
      jobPostingId: { $eq: String(query.jobPostingId) },
    };
    if (query.stage && typeof query.stage === 'string') {
      filter.stage = { $eq: String(query.stage) };
    }
    return this.applicationModel
      .find(filter)
      .populate('candidate')
      .populate('jobPosting')
      .populate('cv')
      .sort({ aiScore: -1 })
      .exec();
  }

  async findOne(id: string, user: User): Promise<Application> {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9-]+$/.test(id)) {
      throw new BadRequestException('Invalid application ID');
    }
    const application = await this.applicationModel
      .findById(id)
      .populate('candidate')
      .populate('jobPosting')
      .populate('cv')
      .exec();
    if (!application) throw new NotFoundException('Application not found');

    if (user.role === Role.CANDIDATE) {
      if (application.candidateId !== user.id) {
        throw new NotFoundException('Application not found');
      }
      return application;
    }

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
    await application.save();
    const saved = await this.findOne(id, user);

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
    } catch {
      // Degrade-don't-block
    }

    return saved;
  }

  async bulkTransition(
    ids: string[],
    target: ApplicationStage,
    user: User,
  ): Promise<{
    succeeded: string[];
    failed: { id: string; reason: string }[];
  }> {
    const succeeded: string[] = [];
    const failed: { id: string; reason: string }[] = [];

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
    const application = await this.applicationModel
      .findById(id)
      .populate('candidate')
      .populate('jobPosting')
      .populate('cv')
      .exec();
    if (!application) throw new NotFoundException('Application not found');
    await this.jobsService.findOne(application.jobPostingId, user);

    const scoreResult = await this.cvScorerService.score({
      jobPosting: application.jobPosting as any,
      cvText: application.cv?.extractedText ?? null,
      coverLetter: application.coverLetter,
      yearsOfExperience: application.yearsOfExperience,
      salaryExpectation: application.salaryExpectation,
    });

    application.aiScore = scoreResult.aiScore;
    application.aiExtraction = scoreResult.aiExtraction;
    application.aiStrengths = scoreResult.aiStrengths;
    application.aiGaps = scoreResult.aiGaps;

    await application.save();
    return this.findOne(id, user);
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

  private async getOwnedForStaff(
    id: string,
    user: User,
  ): Promise<ApplicationDocument> {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9-]+$/.test(id)) {
      throw new BadRequestException('Invalid application ID');
    }
    const application = await this.applicationModel
      .findById(id)
      .populate('candidate')
      .populate('jobPosting')
      .populate('cv')
      .exec();
    if (!application) throw new NotFoundException('Application not found');
    await this.jobsService.findOne(application.jobPostingId, user);
    return application;
  }
}
