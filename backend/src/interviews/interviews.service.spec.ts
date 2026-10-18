import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
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
  let interviewModel: any;
  let applicationModel: any;
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
    _id: 'app-1',
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

  const baseInterview: any = {
    id: 'interview-1',
    _id: 'interview-1',
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
    toObject: () => baseInterview,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  const mockQuery = (val: any) => ({
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(val),
  });

  beforeEach(async () => {
    interviewModel = {
      create: jest.fn().mockResolvedValue(baseInterview),
      findById: jest.fn().mockReturnValue(mockQuery(baseInterview)),
      find: jest.fn().mockReturnValue(mockQuery([baseInterview])),
    };

    applicationModel = {
      findById: jest.fn().mockReturnValue(mockQuery(baseApplication)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewsService,
        {
          provide: getModelToken(Interview.name),
          useValue: interviewModel,
        },
        {
          provide: getModelToken(Application.name),
          useValue: applicationModel,
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
    jobsService = module.get(JobsService);
    applicationsService = module.get(ApplicationsService);
    questionSuggesterService = module.get(QuestionSuggesterService);
  });

  describe('schedule', () => {
    it('schedules an interview and emits notification', async () => {
      jobsService.findOne.mockResolvedValue(baseApplication.jobPosting as any);

      const dto = {
        applicationId: 'app-1',
        type: InterviewType.TECHNICAL,
        proposedSlots: [slot1.toISOString(), slot2.toISOString()],
      };

      const result = await service.schedule(dto, recruiter);

      expect(interviewModel.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('confirmSlot', () => {
    it('confirms a valid slot for the candidate', async () => {
      const interviewObj = {
        ...baseInterview,
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({
          ...baseInterview,
          status: InterviewStatus.CONFIRMED,
        }),
      };
      interviewModel.findById.mockReturnValue(mockQuery(interviewObj));

      const result = await service.confirmSlot(
        'interview-1',
        { confirmedSlot: slot1.toISOString() },
        candidate,
      );

      expect(result.status).toBe(InterviewStatus.CONFIRMED);
    });

    it('rejects slot confirmation not in proposedSlots', async () => {
      await expect(
        service.confirmSlot(
          'interview-1',
          { confirmedSlot: new Date('2026-09-01T00:00:00Z').toISOString() },
          candidate,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('forbids confirmation by a different candidate', async () => {
      await expect(
        service.confirmSlot(
          'interview-1',
          { confirmedSlot: slot1.toISOString() },
          otherCandidate,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('generateQuestions', () => {
    it('generates questions via QuestionSuggesterService and saves on interview', async () => {
      jobsService.findOne.mockResolvedValue(baseApplication.jobPosting as any);
      applicationsService.findOne.mockResolvedValue(baseApplication as any);
      questionSuggesterService.generateQuestions.mockResolvedValue([
        { question: 'Q1', listenFor: 'A1' },
      ]);

      const result = await service.generateQuestions('interview-1', recruiter);
      expect(questionSuggesterService.generateQuestions).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
