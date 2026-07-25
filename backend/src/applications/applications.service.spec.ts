import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { Application } from './application.entity';
import { JobsService } from '../jobs/jobs.service';
import { CvScorerService } from './cv-scorer.service';
import { ApplicationStage } from '../common/enums/application-stage.enum';
import { JobStatus, JobType } from '../common/enums/job.enum';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let applicationsRepo: jest.Mocked<any>;
  let jobsService: jest.Mocked<JobsService>;
  let cvScorerService: jest.Mocked<CvScorerService>;

  const candidate: User = {
    id: 'candidate-1',
    role: Role.CANDIDATE,
    companyId: null,
  } as User;

  const recruiter: User = {
    id: 'recruiter-1',
    role: Role.RECRUITER,
    companyId: 'company-1',
  } as User;

  const hiringManager: User = {
    id: 'hm-1',
    role: Role.HIRING_MANAGER,
    companyId: 'company-1',
  } as User;

  const publishedPosting = {
    id: 'posting-1',
    companyId: 'company-1',
    status: JobStatus.PUBLISHED,
    type: JobType.FULL_TIME,
  };

  const baseApplication: Application = {
    id: 'app-1',
    jobPostingId: 'posting-1',
    candidateId: 'candidate-1',
    coverLetter: null,
    yearsOfExperience: null,
    salaryExpectation: null,
    availabilityDate: null,
    stage: ApplicationStage.APPLIED,
    aiScore: null,
    aiExtraction: null,
    aiStrengths: null,
    aiGaps: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Application;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: getRepositoryToken(Application),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: JobsService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: CvScorerService,
          useValue: { score: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ApplicationsService);
    applicationsRepo = module.get(getRepositoryToken(Application));
    jobsService = module.get(JobsService);
    cvScorerService = module.get(CvScorerService);
  });

  describe('apply', () => {
    it('creates an application against a published posting', async () => {
      jobsService.findOne.mockResolvedValue(publishedPosting as any);
      applicationsRepo.create.mockReturnValue(baseApplication);
      applicationsRepo.save.mockResolvedValue(baseApplication);

      const result = await service.apply(
        { jobPostingId: 'posting-1' } as any,
        candidate,
      );

      expect(jobsService.findOne).toHaveBeenCalledWith('posting-1', candidate);
      expect(result).toBe(baseApplication);
    });

    it('rejects applying to a non-published posting', async () => {
      jobsService.findOne.mockResolvedValue({
        ...publishedPosting,
        status: JobStatus.DRAFT,
      } as any);

      await expect(
        service.apply({ jobPostingId: 'posting-1' } as any, candidate),
      ).rejects.toThrow(BadRequestException);
    });

    it('converts a unique-constraint violation into a 409', async () => {
      jobsService.findOne.mockResolvedValue(publishedPosting as any);
      applicationsRepo.create.mockReturnValue(baseApplication);

      const pgError = Object.assign(
        new QueryFailedError('query', [], new Error('duplicate')),
        { driverError: { code: '23505' } },
      );
      applicationsRepo.save.mockRejectedValue(pgError);

      await expect(
        service.apply({ jobPostingId: 'posting-1' } as any, candidate),
      ).rejects.toThrow(ConflictException);
    });

    it('rethrows unrelated database errors unchanged', async () => {
      jobsService.findOne.mockResolvedValue(publishedPosting as any);
      applicationsRepo.create.mockReturnValue(baseApplication);
      const otherError = new Error('connection lost');
      applicationsRepo.save.mockRejectedValue(otherError);

      await expect(
        service.apply({ jobPostingId: 'posting-1' } as any, candidate),
      ).rejects.toThrow('connection lost');
    });
  });

  describe('findMine', () => {
    it('scopes results to the requesting candidate', async () => {
      applicationsRepo.find.mockResolvedValue([baseApplication]);

      await service.findMine(candidate);

      expect(applicationsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { candidateId: 'candidate-1' } }),
      );
    });
  });

  describe('findForPosting', () => {
    it('requires jobPostingId', async () => {
      await expect(
        service.findForPosting({} as any, recruiter),
      ).rejects.toThrow(BadRequestException);
    });

    it('confirms posting ownership via JobsService before listing', async () => {
      jobsService.findOne.mockResolvedValue(publishedPosting as any);
      applicationsRepo.find.mockResolvedValue([baseApplication]);

      await service.findForPosting(
        { jobPostingId: 'posting-1' } as any,
        recruiter,
      );

      expect(jobsService.findOne).toHaveBeenCalledWith('posting-1', recruiter);
    });
  });

  describe('findOne', () => {
    it('returns the application to the owning candidate', async () => {
      applicationsRepo.findOne.mockResolvedValue(baseApplication);

      const result = await service.findOne('app-1', candidate);
      expect(result).toBe(baseApplication);
    });

    it('hides another candidate\'s application as 404', async () => {
      applicationsRepo.findOne.mockResolvedValue(baseApplication);

      await expect(
        service.findOne('app-1', { ...candidate, id: 'someone-else' } as User),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when the application does not exist', async () => {
      applicationsRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing', recruiter)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('checks company ownership via JobsService for staff', async () => {
      applicationsRepo.findOne.mockResolvedValue(baseApplication);
      jobsService.findOne.mockResolvedValue(publishedPosting as any);

      await service.findOne('app-1', recruiter);

      expect(jobsService.findOne).toHaveBeenCalledWith('posting-1', recruiter);
    });
  });

  describe('transition', () => {
    it('allows a recruiter to move Applied -> Screened', async () => {
      applicationsRepo.findOne.mockResolvedValue({ ...baseApplication });
      jobsService.findOne.mockResolvedValue(publishedPosting as any);
      applicationsRepo.save.mockImplementation((a: any) => Promise.resolve(a));

      const result = await service.transition(
        'app-1',
        ApplicationStage.SCREENED,
        recruiter,
      );

      expect(result.stage).toBe(ApplicationStage.SCREENED);
    });

    it('rejects a recruiter shortlisting directly (hiring manager only)', async () => {
      applicationsRepo.findOne.mockResolvedValue({
        ...baseApplication,
        stage: ApplicationStage.SCREENED,
      });
      jobsService.findOne.mockResolvedValue(publishedPosting as any);

      await expect(
        service.transition('app-1', ApplicationStage.SHORTLISTED, recruiter),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows a hiring manager to shortlist a screened application', async () => {
      applicationsRepo.findOne.mockResolvedValue({
        ...baseApplication,
        stage: ApplicationStage.SCREENED,
      });
      jobsService.findOne.mockResolvedValue(publishedPosting as any);
      applicationsRepo.save.mockImplementation((a: any) => Promise.resolve(a));

      const result = await service.transition(
        'app-1',
        ApplicationStage.SHORTLISTED,
        hiringManager,
      );

      expect(result.stage).toBe(ApplicationStage.SHORTLISTED);
    });

    it('rejects an invalid stage skip (Applied -> Shortlisted)', async () => {
      applicationsRepo.findOne.mockResolvedValue({ ...baseApplication });
      jobsService.findOne.mockResolvedValue(publishedPosting as any);

      await expect(
        service.transition('app-1', ApplicationStage.SHORTLISTED, hiringManager),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects any transition out of a terminal stage (Hired)', async () => {
      applicationsRepo.findOne.mockResolvedValue({
        ...baseApplication,
        stage: ApplicationStage.HIRED,
      });
      jobsService.findOne.mockResolvedValue(publishedPosting as any);

      await expect(
        service.transition('app-1', ApplicationStage.REJECTED, hiringManager),
      ).rejects.toThrow(BadRequestException);
    });

    it('propagates a cross-company ForbiddenException from JobsService', async () => {
      applicationsRepo.findOne.mockResolvedValue({ ...baseApplication });
      jobsService.findOne.mockRejectedValue(
        new ForbiddenException('You do not have access to this job posting'),
      );

      await expect(
        service.transition('app-1', ApplicationStage.SCREENED, recruiter),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('bulkTransition', () => {
    it('reports per-id success and failure without aborting the batch', async () => {
      applicationsRepo.findOne.mockImplementation(({ where: { id } }: any) => {
        if (id === 'app-1') return Promise.resolve({ ...baseApplication, id: 'app-1' });
        if (id === 'app-2')
          return Promise.resolve({
            ...baseApplication,
            id: 'app-2',
            stage: ApplicationStage.HIRED, // terminal -> will fail
          });
        return Promise.resolve(null); // app-3 -> not found
      });
      jobsService.findOne.mockResolvedValue(publishedPosting as any);
      applicationsRepo.save.mockImplementation((a: any) => Promise.resolve(a));

      const result = await service.bulkTransition(
        ['app-1', 'app-2', 'app-3'],
        ApplicationStage.SCREENED,
        recruiter,
      );

      expect(result.succeeded).toEqual(['app-1']);
      expect(result.failed.map((f) => f.id)).toEqual(['app-2', 'app-3']);
    });
  });

  describe('scoreApplication', () => {
    it('evaluates candidate CV/application and updates application AI fields', async () => {
      const mockApp = {
        ...baseApplication,
        jobPosting: publishedPosting,
        cv: { extractedText: 'CV text content' },
      };
      applicationsRepo.findOne.mockResolvedValue(mockApp as any);
      jobsService.findOne.mockResolvedValue(publishedPosting as any);
      cvScorerService.score.mockResolvedValue({
        aiScore: 88,
        aiExtraction: { name: 'Alice' },
        aiStrengths: ['Great experience'],
        aiGaps: ['None'],
      });
      applicationsRepo.save.mockImplementation((a: any) => Promise.resolve(a));

      const result = await service.scoreApplication('app-1', recruiter);

      expect(cvScorerService.score).toHaveBeenCalledWith(
        expect.objectContaining({
          cvText: 'CV text content',
        }),
      );
      expect(result.aiScore).toBe(88);
      expect(result.aiExtraction).toEqual({ name: 'Alice' });
      expect(result.aiStrengths).toEqual(['Great experience']);
      expect(result.aiGaps).toEqual(['None']);
    });

    it('throws NotFoundException when application does not exist', async () => {
      applicationsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.scoreApplication('missing-app', recruiter),
      ).rejects.toThrow(NotFoundException);
    });

    it('forbids scoring an application for another company', async () => {
      const otherCompanyRecruiter = { ...recruiter, companyId: 'company-2' };
      applicationsRepo.findOne.mockResolvedValue({ ...baseApplication, jobPosting: publishedPosting } as any);
      jobsService.findOne.mockRejectedValue(new ForbiddenException());

      await expect(
        service.scoreApplication('app-1', otherCompanyRecruiter as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
