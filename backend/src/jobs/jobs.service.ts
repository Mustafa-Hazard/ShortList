import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPosting } from './job-posting.entity';
import { Application } from '../applications/application.entity';
import { JobStatus, JobType } from '../common/enums/job.enum';
import { ApplicationStage } from '../common/enums/application-stage.enum';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { JobPostingQueryDto } from './dto/job-posting-query.dto';
import { JdGeneratorService } from './jd-generator.service';

// Linear forward-only lifecycle: Draft -> Published -> Closed -> Archived.
// No reopening a closed posting and no skipping stages — each is its own
// endpoint (see JobsController) so each transition can carry its own rules
// later (e.g. "can't close if there are unresolved shortlisted candidates")
// without one catch-all PATCH silently accepting any status.
const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus | null> = {
  [JobStatus.DRAFT]: JobStatus.PUBLISHED,
  [JobStatus.PUBLISHED]: JobStatus.CLOSED,
  [JobStatus.CLOSED]: JobStatus.ARCHIVED,
  [JobStatus.ARCHIVED]: null,
};

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(JobPosting)
    private jobPostingsRepo: Repository<JobPosting>,
    @InjectRepository(Application)
    private applicationsRepo: Repository<Application>,
    private jdGeneratorService: JdGeneratorService,
  ) {}

  async create(dto: CreateJobPostingDto, user: User): Promise<JobPosting> {
    if (!user.companyId) {
      throw new BadRequestException(
        'User is not associated with a company and cannot create job postings',
      );
    }

    let description = dto.description;
    if (!description || description.trim() === '') {
      try {
        description = await this.jdGeneratorService.generateDescription({
          title: dto.title,
          department: dto.department,
          type: dto.type,
          salaryMin: dto.salaryMin ?? null,
          salaryMax: dto.salaryMax ?? null,
          requiredSkills: dto.requiredSkills,
          responsibilities: dto.responsibilities,
          cultureNotes: dto.cultureNotes ?? null,
        });
      } catch {
        // Degrade-don't-block: If AI proxy fails during auto-generation,
        // fall back gracefully so job creation succeeds.
        description = dto.description ?? null;
      }
    }

    const posting = this.jobPostingsRepo.create({
      ...dto,
      description,
      companyId: user.companyId,
      createdById: user.id,
      status: JobStatus.DRAFT,
    });
    return this.jobPostingsRepo.save(posting);
  }

  async generateDescription(id: string, user: User): Promise<JobPosting> {
    const posting = await this.getOwnedForStaff(id, user);
    const description = await this.jdGeneratorService.generateDescription({
      title: posting.title,
      department: posting.department,
      type: posting.type,
      salaryMin: posting.salaryMin ?? null,
      salaryMax: posting.salaryMax ?? null,
      requiredSkills: posting.requiredSkills,
      responsibilities: posting.responsibilities,
      cultureNotes: posting.cultureNotes ?? null,
    });
    posting.description = description;
    return this.jobPostingsRepo.save(posting);
  }

  async findAll(query: JobPostingQueryDto, user: User): Promise<JobPosting[]> {
    // Candidates get the public job board: published postings across every
    // company, no draft/closed/archived leakage, status filter ignored.
    if (user.role === Role.CANDIDATE) {
      return this.jobPostingsRepo.find({
        where: { status: JobStatus.PUBLISHED },
        order: { createdAt: 'DESC' },
      });
    }

    // Staff (recruiter, hiring manager, admin) see only their own company's
    // postings, optionally filtered by status.
    return this.jobPostingsRepo.find({
      where: {
        companyId: user.companyId ?? undefined,
        ...(query.status ? { status: query.status } : {}),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<JobPosting> {
    const posting = await this.jobPostingsRepo.findOne({ where: { id } });
    if (!posting) throw new NotFoundException('Job posting not found');

    if (user.role === Role.CANDIDATE) {
      // Don't reveal that a draft/closed/archived posting exists at all.
      if (posting.status !== JobStatus.PUBLISHED) {
        throw new NotFoundException('Job posting not found');
      }
      return posting;
    }

    if (posting.companyId !== user.companyId) {
      throw new ForbiddenException(
        'You do not have access to this job posting',
      );
    }
    return posting;
  }

  async update(
    id: string,
    dto: UpdateJobPostingDto,
    user: User,
  ): Promise<JobPosting> {
    const posting = await this.getOwnedForStaff(id, user);
    if (posting.status === JobStatus.ARCHIVED) {
      throw new BadRequestException('Archived postings cannot be edited');
    }
    Object.assign(posting, dto);
    return this.jobPostingsRepo.save(posting);
  }

  async remove(id: string, user: User): Promise<void> {
    const posting = await this.getOwnedForStaff(id, user);
    if (posting.status !== JobStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft postings can be deleted — publish, close, or archive it instead',
      );
    }
    await this.jobPostingsRepo.remove(posting);
  }

  async transition(
    id: string,
    target: JobStatus,
    user: User,
  ): Promise<JobPosting> {
    const posting = await this.getOwnedForStaff(id, user);
    const next = ALLOWED_TRANSITIONS[posting.status];
    if (next !== target) {
      throw new BadRequestException(
        `Cannot transition from ${posting.status} to ${target}`,
      );
    }
    posting.status = target;
    return this.jobPostingsRepo.save(posting);
  }

  async stats(id: string, user: User) {
    const posting = await this.getOwnedForStaff(id, user);

    const rows = await this.applicationsRepo
      .createQueryBuilder('application')
      .select('application.stage', 'stage')
      .addSelect('COUNT(*)', 'count')
      .where('application.jobPostingId = :id', { id })
      .groupBy('application.stage')
      .getRawMany<{ stage: ApplicationStage; count: string }>();

    const stageCounts = Object.fromEntries(
      Object.values(ApplicationStage).map((stage) => [stage, 0]),
    ) as Record<ApplicationStage, number>;
    let totalApplications = 0;
    for (const row of rows) {
      const count = parseInt(row.count, 10);
      stageCounts[row.stage] = count;
      totalApplications += count;
    }

    const daysOpen = Math.floor(
      (Date.now() - posting.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      jobPostingId: id,
      status: posting.status,
      totalApplications,
      stageCounts,
      daysOpen,
    };
  }

  async generateDescriptionDirect(
    title: string,
    department: string,
    requiredSkills: string[],
  ): Promise<string> {
    return this.jdGeneratorService.generateDescription({
      title,
      department,
      type: JobType.FULL_TIME,
      salaryMin: null,
      salaryMax: null,
      requiredSkills: requiredSkills || [],
      responsibilities: 'Core engineering responsibilities',
      cultureNotes: null,
    });
  }

  // Shared by update/remove/transition/stats: load a posting and confirm the
  // requesting staff member belongs to the company that owns it. Candidates
  // never call these paths (guarded at the controller with @Roles).
  private async getOwnedForStaff(id: string, user: User): Promise<JobPosting> {
    const posting = await this.jobPostingsRepo.findOne({ where: { id } });
    if (!posting) throw new NotFoundException('Job posting not found');
    if (posting.companyId !== user.companyId) {
      throw new ForbiddenException(
        'You do not have access to this job posting',
      );
    }
    return posting;
  }
}
