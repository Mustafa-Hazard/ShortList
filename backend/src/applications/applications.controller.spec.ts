import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationStage } from '../common/enums/application-stage.enum';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

describe('ApplicationsController', () => {
  let controller: ApplicationsController;
  let service: jest.Mocked<ApplicationsService>;

  const candidate = { id: 'candidate-1', role: Role.CANDIDATE } as User;
  const recruiter = { id: 'recruiter-1', role: Role.RECRUITER } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        {
          provide: ApplicationsService,
          useValue: {
            apply: jest.fn(),
            findMine: jest.fn(),
            findForPosting: jest.fn(),
            findOne: jest.fn(),
            transition: jest.fn(),
            bulkTransition: jest.fn(),
            scoreApplication: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ApplicationsController);
    service = module.get(ApplicationsService);
  });

  it('apply delegates to service.apply with dto and current user', async () => {
    const dto = { jobPostingId: 'posting-1' } as any;
    await controller.apply(dto, candidate);
    expect(service.apply).toHaveBeenCalledWith(dto, candidate);
  });

  it('findMine delegates to service.findMine with current user', async () => {
    await controller.findMine(candidate);
    expect(service.findMine).toHaveBeenCalledWith(candidate);
  });

  it('findForPosting delegates to service.findForPosting with query and current user', async () => {
    const query = { jobPostingId: 'posting-1' } as any;
    await controller.findForPosting(query, recruiter);
    expect(service.findForPosting).toHaveBeenCalledWith(query, recruiter);
  });

  it('findOne delegates to service.findOne with id and current user', async () => {
    await controller.findOne('app-1', candidate);
    expect(service.findOne).toHaveBeenCalledWith('app-1', candidate);
  });

  it('transition delegates to service.transition with id, stage, and current user', async () => {
    const dto = { stage: ApplicationStage.SCREENED };
    await controller.transition('app-1', dto, recruiter);
    expect(service.transition).toHaveBeenCalledWith(
      'app-1',
      ApplicationStage.SCREENED,
      recruiter,
    );
  });

  it('bulkTransition delegates to service.bulkTransition with ids, stage, and current user', async () => {
    const dto = {
      applicationIds: ['app-1', 'app-2'],
      stage: ApplicationStage.SCREENED,
    };
    await controller.bulkTransition(dto, recruiter);
    expect(service.bulkTransition).toHaveBeenCalledWith(
      ['app-1', 'app-2'],
      ApplicationStage.SCREENED,
      recruiter,
    );
  });

  it('score delegates to service.scoreApplication with id and current user', async () => {
    await controller.score('app-1', recruiter);
    expect(service.scoreApplication).toHaveBeenCalledWith('app-1', recruiter);
  });
});
