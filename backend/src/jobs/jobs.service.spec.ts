import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobPosting } from './job-posting.entity';
import { Application } from '../applications/application.entity';
import { JdGeneratorService } from './jd-generator.service';
import { JobStatus, JobType } from '../common/enums/job.enum';
import { ApplicationStage } from '../common/enums/application-stage.enum';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

describe('JobsService', () => {
  let service: JobsService;
  let jobPostingModel: any;
  let applicationModel: any;
  let jdGeneratorService: jest.Mocked<JdGeneratorService>;

  const recruiter: User = {
    id: 'user-recruiter',
    companyId: 'company-1',
    role: Role.RECRUITER,
  } as User;

  const candidate: User = {
    id: 'user-candidate',
    companyId: null,
    role: Role.CANDIDATE,
  } as User;

  const otherCompanyRecruiter: User = {
    id: 'user-other',
    companyId: 'company-2',
    role: Role.RECRUITER,
  } as User;

  const basePosting: any = {
    id: 'posting-1',
    _id: 'posting-1',
    companyId: 'company-1',
    createdById: 'user-recruiter',
    title: 'Backend Engineer',
    department: 'Engineering',
    type: JobType.FULL_TIME,
    status: JobStatus.DRAFT,
    requiredSkills: ['NestJS', 'PostgreSQL'],
    responsibilities: 'Build things',
    description: 'Initial description',
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject: function () {
      return this;
    },
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    basePosting.status = JobStatus.DRAFT;
    jobPostingModel = {
      create: jest.fn().mockImplementation((data) =>
        Promise.resolve({
          ...basePosting,
          ...data,
          toObject: () => ({ ...basePosting, ...data }),
        }),
      ),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([basePosting]),
        }),
      }),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(basePosting),
      }),
      deleteOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      }),
    };

    applicationModel = {
      aggregate: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getModelToken(JobPosting.name),
          useValue: jobPostingModel,
        },
        {
          provide: getModelToken(Application.name),
          useValue: applicationModel,
        },
        {
          provide: JdGeneratorService,
          useValue: { generateDescription: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(JobsService);
    jdGeneratorService = module.get(JdGeneratorService);
  });

  describe('create', () => {
    it('creates a job posting with AI-generated description when description is omitted', async () => {
      jdGeneratorService.generateDescription.mockResolvedValue(
        'Generated description',
      );

      const dto = {
        title: 'Backend Engineer',
        department: 'Engineering',
        type: JobType.FULL_TIME,
        requiredSkills: ['NestJS'],
        responsibilities: 'Build things',
      };

      const result = await service.create(dto as any, recruiter);

      expect(jdGeneratorService.generateDescription).toHaveBeenCalled();
      expect(jobPostingModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'company-1',
          createdById: 'user-recruiter',
          status: JobStatus.DRAFT,
          description: 'Generated description',
        }),
      );
      expect(result).toBeDefined();
    });

    it('rejects creation when the user has no company', async () => {
      await expect(service.create({} as any, candidate)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generateDescription', () => {
    it('generates description and updates the job posting', async () => {
      jdGeneratorService.generateDescription.mockResolvedValue(
        'Regenerated JD',
      );

      const result = await service.generateDescription('posting-1', recruiter);

      expect(jdGeneratorService.generateDescription).toHaveBeenCalled();
      expect(result.description).toBe('Regenerated JD');
    });

    it('fails loudly when AI generation throws an error', async () => {
      jdGeneratorService.generateDescription.mockRejectedValue(
        new Error('AI proxy error'),
      );

      await expect(
        service.generateDescription('posting-1', recruiter),
      ).rejects.toThrow('AI proxy error');
    });

    it('forbids generating description for posting owned by another company', async () => {
      jobPostingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(basePosting),
      });

      await expect(
        service.generateDescription('posting-1', otherCompanyRecruiter),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('returns only published postings for a candidate, ignoring status filter', async () => {
      await service.findAll({ status: JobStatus.DRAFT } as any, candidate);
      expect(jobPostingModel.find).toHaveBeenCalledWith({
        status: JobStatus.PUBLISHED,
      });
    });

    it('scopes results to the staff user company and applies status filter', async () => {
      await service.findAll({ status: JobStatus.PUBLISHED } as any, recruiter);
      expect(jobPostingModel.find).toHaveBeenCalledWith({
        companyId: 'company-1',
        status: JobStatus.PUBLISHED,
      });
    });
  });

  describe('findOne', () => {
    it('returns a published posting to a candidate', async () => {
      jobPostingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...basePosting,
          status: JobStatus.PUBLISHED,
        }),
      });

      const result = await service.findOne('posting-1', candidate);
      expect(result.status).toBe(JobStatus.PUBLISHED);
    });

    it('hides a non-published posting from a candidate as 404', async () => {
      jobPostingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(basePosting),
      });

      await expect(service.findOne('posting-1', candidate)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 404 when the posting does not exist', async () => {
      jobPostingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('missing', recruiter)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('forbids staff from another company', async () => {
      jobPostingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(basePosting),
      });

      await expect(
        service.findOne('posting-1', otherCompanyRecruiter),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('applies changes for the owning company', async () => {
      const result = await service.update(
        'posting-1',
        { title: 'Senior Backend Engineer' } as any,
        recruiter,
      );
      expect(result.title).toBe('Senior Backend Engineer');
    });

    it('rejects editing an archived posting', async () => {
      jobPostingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...basePosting,
          status: JobStatus.ARCHIVED,
        }),
      });

      await expect(
        service.update('posting-1', {} as any, recruiter),
      ).rejects.toThrow(BadRequestException);
    });

    it('forbids updating a posting owned by another company', async () => {
      await expect(
        service.update('posting-1', {} as any, otherCompanyRecruiter),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('deletes a draft posting', async () => {
      await service.remove('posting-1', recruiter);
      expect(jobPostingModel.deleteOne).toHaveBeenCalledWith({
        _id: 'posting-1',
      });
    });

    it('rejects deleting a non-draft posting', async () => {
      jobPostingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...basePosting,
          status: JobStatus.PUBLISHED,
        }),
      });

      await expect(service.remove('posting-1', recruiter)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('transition', () => {
    it('allows Draft -> Published', async () => {
      const result = await service.transition(
        'posting-1',
        JobStatus.PUBLISHED,
        recruiter,
      );
      expect(result.status).toBe(JobStatus.PUBLISHED);
    });

    it('rejects skipping a stage (Draft -> Closed)', async () => {
      await expect(
        service.transition('posting-1', JobStatus.CLOSED, recruiter),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects any transition out of Archived', async () => {
      jobPostingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...basePosting,
          status: JobStatus.ARCHIVED,
        }),
      });

      await expect(
        service.transition('posting-1', JobStatus.PUBLISHED, recruiter),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('stats', () => {
    it('aggregates stage counts, total applications, and days open via MongoDB pipeline', async () => {
      const posting = {
        ...basePosting,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      };
      jobPostingModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(posting),
      });

      applicationModel.aggregate.mockResolvedValue([
        { _id: ApplicationStage.APPLIED, count: 5 },
        { _id: ApplicationStage.SCREENED, count: 2 },
      ]);

      const result = await service.stats('posting-1', recruiter);

      expect(applicationModel.aggregate).toHaveBeenCalledWith([
        { $match: { jobPostingId: 'posting-1' } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]);
      expect(result.totalApplications).toBe(7);
      expect(result.stageCounts[ApplicationStage.APPLIED]).toBe(5);
      expect(result.stageCounts[ApplicationStage.SCREENED]).toBe(2);
      expect(result.stageCounts[ApplicationStage.HIRED]).toBe(0);
      expect(result.daysOpen).toBe(3);
    });

    it('forbids stats access from another company', async () => {
      await expect(
        service.stats('posting-1', otherCompanyRecruiter),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
