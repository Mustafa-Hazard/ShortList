import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobPosting, JobPostingDocument } from './job-posting.entity';
import {
  Application,
  ApplicationDocument,
} from '../applications/application.entity';
import { JobStatus, JobType } from '../common/enums/job.enum';
import { ApplicationStage } from '../common/enums/application-stage.enum';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { JobPostingQueryDto } from './dto/job-posting-query.dto';
import { JdGeneratorService } from './jd-generator.service';

const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus | null> = {
  [JobStatus.DRAFT]: JobStatus.PUBLISHED,
  [JobStatus.PUBLISHED]: JobStatus.CLOSED,
  [JobStatus.CLOSED]: JobStatus.ARCHIVED,
  [JobStatus.ARCHIVED]: null,
};

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(JobPosting.name)
    private jobPostingModel: Model<JobPostingDocument>,
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
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
        description = dto.description ?? null;
      }
    }

    const posting = await this.jobPostingModel.create({
      ...dto,
      description,
      companyId: user.companyId,
      createdById: user.id,
      status: JobStatus.DRAFT,
    });
    return posting.toObject();
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
    await posting.save();
    return posting.toObject();
  }

  async findAll(query: JobPostingQueryDto, user: User): Promise<JobPosting[]> {
    if (user.role === Role.CANDIDATE) {
      return this.jobPostingModel
        .find({ status: JobStatus.PUBLISHED })
        .sort({ createdAt: -1 })
        .exec();
    }

    const filter: Record<string, any> = {};
    if (user.companyId) {
      filter.companyId = user.companyId;
    }
    if (query.status) {
      if (
        typeof query.status !== 'string' ||
        !/^[a-zA-Z0-9_-]+$/.test(query.status)
      ) {
        throw new BadRequestException('Invalid status filter');
      }
      filter.status = query.status;
    }

    return this.jobPostingModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, user: User): Promise<JobPosting> {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9-]+$/.test(id)) {
      throw new BadRequestException('Invalid job posting ID');
    }
    const posting = await this.jobPostingModel.findById(id).exec();
    if (!posting) throw new NotFoundException('Job posting not found');

    if (user.role === Role.CANDIDATE) {
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
    await posting.save();
    return posting.toObject();
  }

  async remove(id: string, user: User): Promise<void> {
    const posting = await this.getOwnedForStaff(id, user);
    if (posting.status !== JobStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft postings can be deleted — publish, close, or archive it instead',
      );
    }
    await this.jobPostingModel.deleteOne({ _id: id }).exec();
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
    await posting.save();
    return posting.toObject();
  }

  async stats(id: string, user: User) {
    const posting = await this.getOwnedForStaff(id, user);

    const rows = await this.applicationModel.aggregate<{
      _id: ApplicationStage;
      count: number;
    }>([
      { $match: { jobPostingId: id } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]);

    const stageCounts = Object.fromEntries(
      Object.values(ApplicationStage).map((stage) => [stage, 0]),
    ) as Record<ApplicationStage, number>;
    let totalApplications = 0;
    for (const row of rows) {
      stageCounts[row._id] = row.count;
      totalApplications += row.count;
    }

    const daysOpen = Math.floor(
      (Date.now() - new Date(posting.createdAt).getTime()) /
        (1000 * 60 * 60 * 24),
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

  private async getOwnedForStaff(
    id: string,
    user: User,
  ): Promise<JobPostingDocument> {
    const posting = await this.jobPostingModel.findById(id).exec();
    if (!posting) throw new NotFoundException('Job posting not found');
    if (posting.companyId !== user.companyId) {
      throw new ForbiddenException(
        'You do not have access to this job posting',
      );
    }
    return posting;
  }
}
