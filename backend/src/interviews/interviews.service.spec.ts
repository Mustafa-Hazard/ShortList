import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { Interview } from './interview.entity';
import { Application } from '../applications/application.entity';
import { JobsService } from '../jobs/jobs.service';
import { ApplicationsService } from '../applications/applications.service';
import { QuestionSuggesterService } from './question-suggester.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InterviewStatus, InterviewType } from '../common/enums/interview.enum';
import { JobStatus } from '../common/enums/job.enum';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

describe('InterviewsService', () => {
  let service: InterviewsService;
  let interviewsRepo: jest.Mocked<any>;
  let applicationsRepo: jest.Mocked<any>;
  let jobsService: jest.Mocked<JobsService>;
  let applicationsService: jest.Mocked<ApplicationsService>;
  let questionSuggesterService: jest.Mocked<QuestionSuggesterService>;

  const recruiter: User = {
    id: 'recruiter-1',
    role: Role.RECRUITER,
    companyId: 'company-1',
  } as User;

  const candidate: User = {
    id: 'candidate-1',
    role: Role.CANDIDATE,
    companyId: null,
  } as User;

  const otherCandidate: User = {
    ...candidate,
    id: 'candidate-2',
  } as User;

  const slot1 = new Date('2026-08-01T10:00:00Z');
  const slot2 = new Date('2026-08-01T14:00:00Z');

  const baseApplication = {
    id: 'app-1',
    jobPostingId: 'posting-1',
    candidateId: 'candidate-1',
    jobPosting: {
      id: 'posting-1',
      title: 'Backend Engineer',
      companyId: 'company-1',
      status: JobStatus.PUBLISHED,
    },
    cv: { extractedText: 'CV text' },
    aiStrengths: ['Node.js'],
    aiGaps: ['NestJS'],
  };

  const baseInterview: Interview = {
    id: 'interview-1',
    applicationId: 'app-1',
    proposedById: 'recruiter-1',
    hiringManagerId: null,
    type: InterviewType.TECHNICAL,
    proposedSlots: [slot1, slot2],
    confirmedSlot: null,
    status: InterviewStatus.PROPOSED,
    questions: [],
    application: baseApplication as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Interview;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewsService,
        {
          provide: getRepositoryToken(Interview),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Application),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: JobsService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: ApplicationsService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: QuestionSuggesterService,
          useValue: { generateQuestions: jest.fn() },
        },
        {
          provide: NotificationsService,
          useValue: { createAndSend: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(InterviewsService);
    interviewsRepo = module.get(getRepositoryToken(Interview));
    applicationsRepo = module.get(getRepositoryToken(Application));
    jobsService = module.get(JobsService);
    applicationsService = module.get(ApplicationsService);
    questionSuggesterService = module.get(QuestionSuggesterService);
  });

  describe('schedule', () => {
    it('schedules a proposed interview for staff member', async () => {
      applicationsRepo.findOne.mockResolvedValue(baseApplication);
      jobsService.findOne.mockResolvedValue(baseApplication.jobPosting as any);
      interviewsRepo.create.mockReturnValue(baseInterview);
      interviewsRepo.save.mockResolvedValue(baseInterview);

      const result = await service.schedule(
        {
          applicationId: 'app-1',
          type: InterviewType.TECHNICAL,
          proposedSlots: [slot1.toISOString(), slot2.toISOString()],
        },
        recruiter,
      );

      expect(interviewsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: 'app-1',
          type: InterviewType.TECHNICAL,
          status: InterviewStatus.PROPOSED,
        }),
      );
      expect(result).toBe(baseInterview);
    });

    it('throws NotFoundException when application does not exist', async () => {
      applicationsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.schedule(
          {
            applicationId: 'missing',
            type: InterviewType.TECHNICAL,
            proposedSlots: [slot1.toISOString()],
          },
          recruiter,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmSlot', () => {
    it('confirms a slot when candidate matches one of proposed slots', async () => {
      interviewsRepo.findOne.mockResolvedValue({ ...baseInterview });
      interviewsRepo.save.mockImplementation((i: any) => Promise.resolve(i));

      const result = await service.confirmSlot(
        'interview-1',
        { confirmedSlot: slot1.toISOString() },
        candidate,
      );

      expect(result.status).toBe(InterviewStatus.CONFIRMED);
      expect(result.confirmedSlot).toEqual(slot1);
    });

    it('forbids confirming interview belonging to another candidate', async () => {
      interviewsRepo.findOne.mockResolvedValue({ ...baseInterview });

      await expect(
        service.confirmSlot(
          'interview-1',
          { confirmedSlot: slot1.toISOString() },
          otherCandidate,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects confirmation if slot is not among proposed slots', async () => {
      interviewsRepo.findOne.mockResolvedValue({ ...baseInterview });

      await expect(
        service.confirmSlot(
          'interview-1',
          { confirmedSlot: new Date('2026-08-05T10:00:00Z').toISOString() },
          candidate,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('updates status for owning staff', async () => {
      interviewsRepo.findOne.mockResolvedValue({ ...baseInterview });
      jobsService.findOne.mockResolvedValue(baseApplication.jobPosting as any);
      interviewsRepo.save.mockImplementation((i: any) => Promise.resolve(i));

      const result = await service.updateStatus(
        'interview-1',
        { status: InterviewStatus.COMPLETED },
        recruiter,
      );

      expect(result.status).toBe(InterviewStatus.COMPLETED);
    });
  });

  describe('generateQuestions', () => {
    it('generates questions and attaches them to the interview', async () => {
      interviewsRepo.findOne.mockResolvedValue({ ...baseInterview });
      jobsService.findOne.mockResolvedValue(baseApplication.jobPosting as any);
      questionSuggesterService.generateQuestions.mockResolvedValue([
        { question: 'Q1', listenFor: 'A1' },
      ]);
      interviewsRepo.save.mockImplementation((i: any) => Promise.resolve(i));

      const result = await service.generateQuestions('interview-1', recruiter);

      expect(questionSuggesterService.generateQuestions).toHaveBeenCalledWith(
        expect.objectContaining({
          type: InterviewType.TECHNICAL,
        }),
      );
      expect(result.questions).toEqual([{ question: 'Q1', listenFor: 'A1' }]);
    });
  });

  describe('findForApplication', () => {
    it('returns interviews for an application after checking access', async () => {
      applicationsService.findOne.mockResolvedValue(baseApplication as any);
      interviewsRepo.find.mockResolvedValue([baseInterview]);

      const result = await service.findForApplication('app-1', recruiter);

      expect(applicationsService.findOne).toHaveBeenCalledWith(
        'app-1',
        recruiter,
      );
      expect(result).toEqual([baseInterview]);
    });
  });

  describe('findOne', () => {
    it('returns interview for candidate owner', async () => {
      interviewsRepo.findOne.mockResolvedValue(baseInterview);

      const result = await service.findOne('interview-1', candidate);

      expect(result).toBe(baseInterview);
    });

    it('hides interview from unauthorized candidate as 404', async () => {
      interviewsRepo.findOne.mockResolvedValue(baseInterview);

      await expect(
        service.findOne('interview-1', otherCandidate),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
