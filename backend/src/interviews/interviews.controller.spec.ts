import { Test, TestingModule } from '@nestjs/testing';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { InterviewStatus, InterviewType } from '../common/enums/interview.enum';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

describe('InterviewsController', () => {
  let controller: InterviewsController;
  let service: jest.Mocked<InterviewsService>;

  const recruiter = { id: 'recruiter-1', role: Role.RECRUITER } as User;
  const candidate = { id: 'candidate-1', role: Role.CANDIDATE } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewsController],
      providers: [
        {
          provide: InterviewsService,
          useValue: {
            schedule: jest.fn(),
            confirmSlot: jest.fn(),
            updateStatus: jest.fn(),
            generateQuestions: jest.fn(),
            findForApplication: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(InterviewsController);
    service = module.get(InterviewsService);
  });

  it('schedule delegates to service.schedule', async () => {
    const dto = {
      applicationId: 'app-1',
      type: InterviewType.TECHNICAL,
      proposedSlots: ['2026-08-01T10:00:00Z'],
    };
    await controller.schedule(dto, recruiter);
    expect(service.schedule).toHaveBeenCalledWith(dto, recruiter);
  });

  it('confirmSlot delegates to service.confirmSlot', async () => {
    const dto = { confirmedSlot: '2026-08-01T10:00:00Z' };
    await controller.confirmSlot('interview-1', dto, candidate);
    expect(service.confirmSlot).toHaveBeenCalledWith(
      'interview-1',
      dto,
      candidate,
    );
  });

  it('updateStatus delegates to service.updateStatus', async () => {
    const dto = { status: InterviewStatus.COMPLETED };
    await controller.updateStatus('interview-1', dto, recruiter);
    expect(service.updateStatus).toHaveBeenCalledWith(
      'interview-1',
      dto,
      recruiter,
    );
  });

  it('generateQuestions delegates to service.generateQuestions', async () => {
    await controller.generateQuestions('interview-1', recruiter);
    expect(service.generateQuestions).toHaveBeenCalledWith(
      'interview-1',
      recruiter,
    );
  });

  it('findForApplication delegates to service.findForApplication', async () => {
    await controller.findForApplication('app-1', recruiter);
    expect(service.findForApplication).toHaveBeenCalledWith('app-1', recruiter);
  });

  it('findOne delegates to service.findOne', async () => {
    await controller.findOne('interview-1', candidate);
    expect(service.findOne).toHaveBeenCalledWith('interview-1', candidate);
  });
});
