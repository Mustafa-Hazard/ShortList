import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobStatus } from '../common/enums/job.enum';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

describe('JobsController', () => {
  let controller: JobsController;
  let service: jest.Mocked<JobsService>;

  const recruiter = {
    id: 'user-1',
    role: Role.RECRUITER,
    companyId: 'company-1',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        {
          provide: JobsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            transition: jest.fn(),
            generateDescription: jest.fn(),
            stats: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(JobsController);
    service = module.get(JobsService);
  });

  it('create delegates to service.create with dto and current user', async () => {
    const dto = { title: 'Backend Engineer' } as any;
    await controller.create(dto, recruiter);
    expect(service.create).toHaveBeenCalledWith(dto, recruiter);
  });

  it('findAll delegates to service.findAll with query and current user', async () => {
    const query = { status: JobStatus.PUBLISHED } as any;
    await controller.findAll(query, recruiter);
    expect(service.findAll).toHaveBeenCalledWith(query, recruiter);
  });

  it('findOne delegates to service.findOne with id and current user', async () => {
    await controller.findOne('posting-1', recruiter);
    expect(service.findOne).toHaveBeenCalledWith('posting-1', recruiter);
  });

  it('update delegates to service.update with id, dto, and current user', async () => {
    const dto = { title: 'New Title' } as any;
    await controller.update('posting-1', dto, recruiter);
    expect(service.update).toHaveBeenCalledWith('posting-1', dto, recruiter);
  });

  it('remove delegates to service.remove with id and current user', async () => {
    await controller.remove('posting-1', recruiter);
    expect(service.remove).toHaveBeenCalledWith('posting-1', recruiter);
  });

  it('publish calls service.transition with PUBLISHED', async () => {
    await controller.publish('posting-1', recruiter);
    expect(service.transition).toHaveBeenCalledWith(
      'posting-1',
      JobStatus.PUBLISHED,
      recruiter,
    );
  });

  it('close calls service.transition with CLOSED', async () => {
    await controller.close('posting-1', recruiter);
    expect(service.transition).toHaveBeenCalledWith(
      'posting-1',
      JobStatus.CLOSED,
      recruiter,
    );
  });

  it('archive calls service.transition with ARCHIVED', async () => {
    await controller.archive('posting-1', recruiter);
    expect(service.transition).toHaveBeenCalledWith(
      'posting-1',
      JobStatus.ARCHIVED,
      recruiter,
    );
  });

  it('generateDescription delegates to service.generateDescription with id and current user', async () => {
    await controller.generateDescription('posting-1', recruiter);
    expect(service.generateDescription).toHaveBeenCalledWith(
      'posting-1',
      recruiter,
    );
  });

  it('stats delegates to service.stats with id and current user', async () => {
    await controller.stats('posting-1', recruiter);
    expect(service.stats).toHaveBeenCalledWith('posting-1', recruiter);
  });
});
