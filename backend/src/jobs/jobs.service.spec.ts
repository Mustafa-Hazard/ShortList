import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobPosting } from './job-posting.entity';
import { Application } from '../applications/application.entity';
import { JobStatus, JobType } from '../common/enums/job.enum';
import { ApplicationStage } from '../common/enums/application-stage.enum';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

describe('JobsService', () => {
  let service: JobsService;
  let jobPostingsRepo: jest.Mocked<any>;
  let applicationsRepo: jest.Mocked<any>;

  const recruiter: User = {
    id: 'user-1',
    email: 'recruiter@acme.dev',
    passwordHash: '',
    firstName: 'Rita',
    lastName: 'Recruiter',
    role: Role.RECRUITER,
    companyId: 'company-1',
    refreshTokenHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const candidate: User = {
    ...recruiter,
    id: 'user-2',
    role: Role.CANDIDATE,
    companyId: null,
  } as User;

  const otherCompanyRecruiter: User = {
    ...recruiter,
    id: 'user-3',
    companyId: 'company-2',
  } as User;

  const basePosting: JobPosting = {
    id: 'posting-1',
    companyId: 'company-1',
    createdById: 'user-1',
    title: 'Backend Engineer',
    department: 'Engineering',
    type: JobType.FULL_TIME,
    salaryMin: 60000,
    salaryMax: 90000,
    requiredSkills: ['NestJS', 'PostgreSQL'],
    responsibilities: 'Build things',
    cultureNotes: null,
    description: null,
    status: JobStatus.DRAFT,
    applications: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as JobPosting;

  beforeEach(async () => {
    const queryBuilderMock = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getRepositoryToken(JobPosting),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Application),
          useValue: {
            createQueryBuilder: jest.fn(() => queryBuilderMock),
          },
        },
      ],
    }).compile();

    service = module.get(JobsService);
    jobPostingsRepo = module.get(getRepositoryToken(JobPosting));
    applicationsRepo = module.get(getRepositoryToken(Application));
    (applicationsRepo as any).__queryBuilderMock = queryBuilderMock;
  });

  describe('create', () => {
    it('creates a draft posting scoped to the recruiter company', async () => {
      jobPostingsRepo.create.mockReturnValue(basePosting);
      jobPostingsRepo.save.mockResolvedValue(basePosting);

      const dto = {
        title: 'Backend Engineer',
        department: 'Engineering',
        type: JobType.FULL_TIME,
        requiredSkills: ['NestJS'],
        responsibilities: 'Build things',
      };

      const result = await service.create(dto as any, recruiter);

      expect(jobPostingsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'company-1',
          createdById: 'user-1',
          status: JobStatus.DRAFT,
        }),
      );
      expect(result).toBe(basePosting);
    });

    it('rejects creation when the user has no company', async () => {
      await expect(
        service.create({} as any, candidate),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns only published postings for a candidate, ignoring status filter', async () => {
      jobPostingsRepo.find.mockResolvedValue([basePosting]);

      await service.findAll({ status: JobStatus.DRAFT } as any, candidate);

      expect(jobPostingsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: JobStatus.PUBLISHED },
        }),
      );
    });

    it('scopes results to the staff user company and applies status filter', async () => {
      jobPostingsRepo.find.mockResolvedValue([basePosting]);

      await service.findAll({ status: JobStatus.PUBLISHED } as any, recruiter);

      expect(jobPostingsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: 'company-1', status: JobStatus.PUBLISHED },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns a published posting to a candidate', async () => {
      jobPostingsRepo.findOne.mockResolvedValue({
        ...basePosting,
        status: JobStatus.PUBLISHED,
      });

      const result = await service.findOne('posting-1', candidate);
      expect(result.status).toBe(JobStatus.PUBLISHED);
    });

    it('hides a non-published posting from a candidate as 404', async () => {
      jobPostingsRepo.findOne.mockResolvedValue(basePosting); // status DRAFT

      await expect(
        service.findOne('posting-1', candidate),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when the posting does not exist', async () => {
      jobPostingsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('missing', recruiter),
      ).rejects.toThrow(NotFoundException);
    });

    it('forbids staff from another company', async () => {
      jobPostingsRepo.findOne.mockResolvedValue(basePosting);

      await expect(
        service.findOne('posting-1', otherCompanyRecruiter),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('applies changes for the owning company', async () => {
      jobPostingsRepo.findOne.mockResolvedValue({ ...basePosting });
      jobPostingsRepo.save.mockImplementation((p: any) => Promise.resolve(p));

      const result = await service.update(
        'posting-1',
        { title: 'Senior Backend Engineer' } as any,
        recruiter,
      );

      expect(result.title).toBe('Senior Backend Engineer');
    });

    it('rejects editing an archived posting', async () => {
      jobPostingsRepo.findOne.mockResolvedValue({
        ...basePosting,
        status: JobStatus.ARCHIVED,
      });

      await expect(
        service.update('posting-1', {} as any, recruiter),
      ).rejects.toThrow(BadRequestException);
    });

    it('forbids updating a posting owned by another company', async () => {
      jobPostingsRepo.findOne.mockResolvedValue(basePosting);

      await expect(
        service.update('posting-1', {} as any, otherCompanyRecruiter),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('deletes a draft posting', async () => {
      jobPostingsRepo.findOne.mockResolvedValue({ ...basePosting });
      jobPostingsRepo.remove.mockResolvedValue(undefined);

      await service.remove('posting-1', recruiter);

      expect(jobPostingsRepo.remove).toHaveBeenCalled();
    });

    it('rejects deleting a non-draft posting', async () => {
      jobPostingsRepo.findOne.mockResolvedValue({
        ...basePosting,
        status: JobStatus.PUBLISHED,
      });

      await expect(
        service.remove('posting-1', recruiter),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('transition', () => {
    it('allows Draft -> Published', async () => {
      jobPostingsRepo.findOne.mockResolvedValue({ ...basePosting });
      jobPostingsRepo.save.mockImplementation((p: any) => Promise.resolve(p));

      const result = await service.transition(
        'posting-1',
        JobStatus.PUBLISHED,
        recruiter,
      );

      expect(result.status).toBe(JobStatus.PUBLISHED);
    });

    it('rejects skipping a stage (Draft -> Closed)', async () => {
      jobPostingsRepo.findOne.mockResolvedValue({ ...basePosting });

      await expect(
        service.transition('posting-1', JobStatus.CLOSED, recruiter),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects any transition out of Archived', async () => {
      jobPostingsRepo.findOne.mockResolvedValue({
        ...basePosting,
        status: JobStatus.ARCHIVED,
      });

      await expect(
        service.transition('posting-1', JobStatus.PUBLISHED, recruiter),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('stats', () => {
    it('aggregates stage counts, total applications, and days open', async () => {
      const posting = {
        ...basePosting,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      };
      jobPostingsRepo.findOne.mockResolvedValue(posting);

      const qb = (applicationsRepo as any).__queryBuilderMock;
      qb.getRawMany.mockResolvedValue([
        { stage: ApplicationStage.APPLIED, count: '5' },
        { stage: ApplicationStage.SCREENED, count: '2' },
      ]);

      const result = await service.stats('posting-1', recruiter);

      expect(result.totalApplications).toBe(7);
      expect(result.stageCounts[ApplicationStage.APPLIED]).toBe(5);
      expect(result.stageCounts[ApplicationStage.SCREENED]).toBe(2);
      expect(result.stageCounts[ApplicationStage.HIRED]).toBe(0);
      expect(result.daysOpen).toBe(3);
    });

    it('forbids stats access from another company', async () => {
      jobPostingsRepo.findOne.mockResolvedValue(basePosting);

      await expect(
        service.stats('posting-1', otherCompanyRecruiter),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
