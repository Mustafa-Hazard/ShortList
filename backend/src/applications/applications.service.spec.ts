import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { Application } from './application.entity';
import { JobsService } from '../jobs/jobs.service';
import { CvScorerService } from './cv-scorer.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApplicationStage } from '../common/enums/application-stage.enum';
import { JobStatus, JobType } from '../common/enums/job.enum';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let applicationModel: any;
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

  const publishedPosting = {
    id: 'posting-1',
    companyId: 'company-1',
    status: JobStatus.PUBLISHED,
    type: JobType.FULL_TIME,
  };

  const baseApplication: any = {
    id: 'app-1',
    _id: 'app-1',
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
    toObject: () => baseApplication,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  const mockQuery = (val: any) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(val),
  });

  beforeEach(async () => {
    applicationModel = {
      create: jest.fn().mockResolvedValue(baseApplication),
      find: jest.fn().mockReturnValue(mockQuery([baseApplication])),
      findById: jest.fn().mockReturnValue(mockQuery(baseApplication)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: getModelToken(Application.name),
          useValue: applicationModel,
        },
        {
          provide: JobsService,
          useValue: { findOne: jest.fn(), findAll: jest.fn() },
        },
        {
          provide: CvScorerService,
          useValue: { score: jest.fn() },
        },
        {
          provide: NotificationsService,
          useValue: { createAndSend: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ApplicationsService);
    jobsService = module.get(JobsService);
    cvScorerService = module.get(CvScorerService);
  });

  describe('apply', () => {
    it('allows candidate to apply to a published posting', async () => {
      jobsService.findOne.mockResolvedValue(publishedPosting as any);

      const dto = {
        jobPostingId: 'posting-1',
        coverLetter: 'Hello',
        yearsOfExperience: 3,
      };

      const result = await service.apply(dto, candidate);

      expect(jobsService.findOne).toHaveBeenCalledWith('posting-1', candidate);
      expect(applicationModel.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('rejects applying to non-published posting', async () => {
      jobsService.findOne.mockResolvedValue({
        ...publishedPosting,
        status: JobStatus.DRAFT,
      } as any);

      await expect(
        service.apply({ jobPostingId: 'posting-1' }, candidate),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects duplicate application with ConflictException', async () => {
      jobsService.findOne.mockResolvedValue(publishedPosting as any);
      applicationModel.create.mockRejectedValue({ code: 11000 });

      await expect(
        service.apply({ jobPostingId: 'posting-1' }, candidate),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('transition', () => {
    it('allows Recruiter to advance Applied -> Screened', async () => {
      jobsService.findOne.mockResolvedValue(publishedPosting as any);

      const result = await service.transition(
        'app-1',
        ApplicationStage.SCREENED,
        recruiter,
      );

      expect(result).toBeDefined();
    });

    it('forbids Recruiter from moving Screened -> Shortlisted (Hiring Manager only)', async () => {
      applicationModel.findById.mockReturnValue(
        mockQuery({ ...baseApplication, stage: ApplicationStage.SCREENED }),
      );
      jobsService.findOne.mockResolvedValue(publishedPosting as any);

      await expect(
        service.transition('app-1', ApplicationStage.SHORTLISTED, recruiter),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('scoreApplication', () => {
    it('scores application using CvScorerService and caches results', async () => {
      jobsService.findOne.mockResolvedValue(publishedPosting as any);
      cvScorerService.score.mockResolvedValue({
        aiScore: 88,
        aiExtraction: { name: 'Test' },
        aiStrengths: ['TypeScript'],
        aiGaps: ['GraphQL'],
      });

      const result = await service.scoreApplication('app-1', recruiter);

      expect(cvScorerService.score).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
