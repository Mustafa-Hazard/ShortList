import { Test, TestingModule } from '@nestjs/testing';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { OfferStatus } from '../common/enums/offer-status.enum';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

describe('OffersController', () => {
  let controller: OffersController;
  let service: jest.Mocked<OffersService>;

  const recruiter = { id: 'recruiter-1', role: Role.RECRUITER } as User;
  const candidate = { id: 'candidate-1', role: Role.CANDIDATE } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OffersController],
      providers: [
        {
          provide: OffersService,
          useValue: {
            create: jest.fn(),
            generateLetter: jest.fn(),
            approveLetter: jest.fn(),
            respond: jest.fn(),
            update: jest.fn(),
            findForApplication: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(OffersController);
    service = module.get(OffersService);
  });

  it('create delegates to service.create', async () => {
    const dto = {
      applicationId: 'app-1',
      roleTitle: 'Engineer',
      salary: 100000,
      startDate: '2026-09-01',
      benefitsSummary: 'PTO',
    };
    await controller.create(dto, recruiter);
    expect(service.create).toHaveBeenCalledWith(dto, recruiter);
  });

  it('generateLetter delegates to service.generateLetter', async () => {
    await controller.generateLetter('offer-1', recruiter);
    expect(service.generateLetter).toHaveBeenCalledWith('offer-1', recruiter);
  });

  it('approveLetter delegates to service.approveLetter', async () => {
    await controller.approveLetter('offer-1', recruiter);
    expect(service.approveLetter).toHaveBeenCalledWith('offer-1', recruiter);
  });

  it('respond delegates to service.respond', async () => {
    const dto = { status: OfferStatus.ACCEPTED };
    await controller.respond('offer-1', dto, candidate);
    expect(service.respond).toHaveBeenCalledWith('offer-1', dto, candidate);
  });

  it('update delegates to service.update', async () => {
    const dto = { salary: 110000 };
    await controller.update('offer-1', dto, recruiter);
    expect(service.update).toHaveBeenCalledWith('offer-1', dto, recruiter);
  });

  it('findForApplication delegates to service.findForApplication', async () => {
    await controller.findForApplication('app-1', candidate);
    expect(service.findForApplication).toHaveBeenCalledWith('app-1', candidate);
  });

  it('findOne delegates to service.findOne', async () => {
    await controller.findOne('offer-1', candidate);
    expect(service.findOne).toHaveBeenCalledWith('offer-1', candidate);
  });
});
