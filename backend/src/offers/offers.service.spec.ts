import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { Offer } from './offer.entity';
import { Application } from '../applications/application.entity';
import { JobsService } from '../jobs/jobs.service';
import { OfferDrafterService } from './offer-drafter.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OfferStatus } from '../common/enums/offer-status.enum';
import { JobStatus } from '../common/enums/job.enum';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

describe('OffersService', () => {
  let service: OffersService;
  let offerModel: any;
  let applicationModel: any;
  let jobsService: jest.Mocked<JobsService>;
  let offerDrafterService: jest.Mocked<OfferDrafterService>;

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

  const baseApplication = {
    id: 'app-1',
    _id: 'app-1',
    jobPostingId: 'posting-1',
    candidateId: 'candidate-1',
    candidate: { firstName: 'Jane', lastName: 'Doe' },
    jobPosting: {
      id: 'posting-1',
      companyId: 'company-1',
      status: JobStatus.PUBLISHED,
    },
  };

  const baseOffer: any = {
    id: 'offer-1',
    _id: 'offer-1',
    applicationId: 'app-1',
    issuedById: 'recruiter-1',
    roleTitle: 'Senior Backend Engineer',
    salary: 130000,
    startDate: '2026-09-01',
    benefitsSummary: 'Health, PTO',
    status: OfferStatus.ISSUED,
    candidateResponse: null,
    draftedLetter: 'Draft letter body',
    letterApproved: false,
    application: baseApplication as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject: function () {
      return this;
    },
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  const mockQuery = (val: any) => ({
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(val),
  });

  beforeEach(async () => {
    offerModel = {
      create: jest.fn().mockResolvedValue(baseOffer),
      findOne: jest.fn().mockReturnValue(mockQuery(null)),
      findById: jest.fn().mockReturnValue(mockQuery(baseOffer)),
    };

    applicationModel = {
      findById: jest.fn().mockReturnValue(mockQuery(baseApplication)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        {
          provide: getModelToken(Offer.name),
          useValue: offerModel,
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
          provide: OfferDrafterService,
          useValue: { generateDraft: jest.fn() },
        },
        {
          provide: NotificationsService,
          useValue: { createAndSend: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(OffersService);
    jobsService = module.get(JobsService);
    offerDrafterService = module.get(OfferDrafterService);
  });

  describe('create', () => {
    it('creates an offer and auto-generates offer letter draft', async () => {
      jobsService.findOne.mockResolvedValue(baseApplication.jobPosting as any);
      offerDrafterService.generateDraft.mockResolvedValue(
        'Generated AI Letter',
      );

      const dto = {
        applicationId: 'app-1',
        roleTitle: 'Senior Backend Engineer',
        salary: 130000,
        startDate: '2026-09-01',
        benefitsSummary: 'Health, PTO',
      };

      const result = await service.create(dto, recruiter);

      expect(offerDrafterService.generateDraft).toHaveBeenCalled();
      expect(offerModel.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('rejects creating duplicate offer for the same application', async () => {
      offerModel.findOne.mockReturnValue(mockQuery(baseOffer));

      await expect(
        service.create(
          {
            applicationId: 'app-1',
            roleTitle: 'Role',
            salary: 100000,
            startDate: '2026-09-01',
            benefitsSummary: 'PTO',
          },
          recruiter,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('approveLetter', () => {
    it('sets letterApproved to true', async () => {
      const offerWithFalse = {
        ...baseOffer,
        letterApproved: false,
        save: jest.fn().mockResolvedValue(true),
      };
      offerModel.findById.mockReturnValue(mockQuery(offerWithFalse));
      jobsService.findOne.mockResolvedValue(baseApplication.jobPosting as any);

      const result = await service.approveLetter('offer-1', recruiter);
      expect(result.letterApproved).toBe(true);
    });
  });

  describe('respond', () => {
    it('allows candidate to respond to an approved offer', async () => {
      const approvedOffer = {
        ...baseOffer,
        letterApproved: true,
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ ...baseOffer, status: OfferStatus.ACCEPTED }),
      };
      offerModel.findById.mockReturnValue(mockQuery(approvedOffer));

      const result = await service.respond(
        'offer-1',
        { status: OfferStatus.ACCEPTED },
        candidate,
      );

      expect(result.status).toBe(OfferStatus.ACCEPTED);
    });

    it('rejects candidate response if offer letter is not yet approved by staff', async () => {
      const unapprovedOffer = {
        ...baseOffer,
        letterApproved: false,
      };
      offerModel.findById.mockReturnValue(mockQuery(unapprovedOffer));

      await expect(
        service.respond('offer-1', { status: OfferStatus.ACCEPTED }, candidate),
      ).rejects.toThrow(BadRequestException);
    });

    it('forbids candidate response if candidateId does not match', async () => {
      const approvedOffer = {
        ...baseOffer,
        letterApproved: true,
      };
      offerModel.findById.mockReturnValue(mockQuery(approvedOffer));

      await expect(
        service.respond(
          'offer-1',
          { status: OfferStatus.ACCEPTED },
          otherCandidate,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
