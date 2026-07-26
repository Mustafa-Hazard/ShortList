import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
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
  let offersRepo: jest.Mocked<any>;
  let applicationsRepo: jest.Mocked<any>;
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
    jobPostingId: 'posting-1',
    candidateId: 'candidate-1',
    candidate: { firstName: 'Jane', lastName: 'Doe' },
    jobPosting: {
      id: 'posting-1',
      companyId: 'company-1',
      status: JobStatus.PUBLISHED,
    },
  };

  const baseOffer: Offer = {
    id: 'offer-1',
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
  } as unknown as Offer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        {
          provide: getRepositoryToken(Offer),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
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
    offersRepo = module.get(getRepositoryToken(Offer));
    applicationsRepo = module.get(getRepositoryToken(Application));
    jobsService = module.get(JobsService);
    offerDrafterService = module.get(OfferDrafterService);
  });

  describe('create', () => {
    it('creates an offer and auto-generates offer letter draft', async () => {
      applicationsRepo.findOne.mockResolvedValue(baseApplication);
      jobsService.findOne.mockResolvedValue(baseApplication.jobPosting as any);
      offersRepo.findOne.mockResolvedValue(null);
      offerDrafterService.generateDraft.mockResolvedValue(
        'Generated AI Letter',
      );
      offersRepo.create.mockReturnValue(baseOffer);
      offersRepo.save.mockResolvedValue(baseOffer);

      const dto = {
        applicationId: 'app-1',
        roleTitle: 'Senior Backend Engineer',
        salary: 130000,
        startDate: '2026-09-01',
        benefitsSummary: 'Health, PTO',
      };

      const result = await service.create(dto, recruiter);

      expect(offerDrafterService.generateDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateName: 'Jane Doe',
          roleTitle: 'Senior Backend Engineer',
        }),
      );
      expect(offersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          draftedLetter: 'Generated AI Letter',
          letterApproved: false,
        }),
      );
      expect(result).toBe(baseOffer);
    });

    it('rejects creating duplicate offer for the same application', async () => {
      applicationsRepo.findOne.mockResolvedValue(baseApplication);
      jobsService.findOne.mockResolvedValue(baseApplication.jobPosting as any);
      offersRepo.findOne.mockResolvedValue(baseOffer);

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

    it('degrades gracefully if AI letter drafting throws error during creation', async () => {
      applicationsRepo.findOne.mockResolvedValue(baseApplication);
      jobsService.findOne.mockResolvedValue(baseApplication.jobPosting as any);
      offersRepo.findOne.mockResolvedValue(null);
      offerDrafterService.generateDraft.mockRejectedValue(
        new Error('AI service error'),
      );
      offersRepo.create.mockReturnValue(baseOffer);
      offersRepo.save.mockResolvedValue(baseOffer);

      await service.create(
        {
          applicationId: 'app-1',
          roleTitle: 'Senior Backend Engineer',
          salary: 130000,
          startDate: '2026-09-01',
          benefitsSummary: 'Health, PTO',
        },
        recruiter,
      );

      expect(offersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          draftedLetter: null,
        }),
      );
    });
  });

  describe('approveLetter', () => {
    it('sets letterApproved to true', async () => {
      offersRepo.findOne.mockResolvedValue({
        ...baseOffer,
        letterApproved: false,
      });
      jobsService.findOne.mockResolvedValue(baseApplication.jobPosting as any);
      offersRepo.save.mockImplementation((o: any) => Promise.resolve(o));

      const result = await service.approveLetter('offer-1', recruiter);

      expect(result.letterApproved).toBe(true);
    });
  });

  describe('generateLetter', () => {
    it('generates a new drafted letter via OfferDrafterService', async () => {
      offersRepo.findOne.mockResolvedValue({ ...baseOffer });
      jobsService.findOne.mockResolvedValue(baseApplication.jobPosting as any);
      offerDrafterService.generateDraft.mockResolvedValue(
        'New Regenerated Letter',
      );
      offersRepo.save.mockImplementation((o: any) => Promise.resolve(o));

      const result = await service.generateLetter('offer-1', recruiter);

      expect(result.draftedLetter).toBe('New Regenerated Letter');
    });
  });

  describe('respond', () => {
    it('allows candidate to respond to an approved offer', async () => {
      offersRepo.findOne.mockResolvedValue({
        ...baseOffer,
        letterApproved: true,
      });
      offersRepo.save.mockImplementation((o: any) => Promise.resolve(o));

      const result = await service.respond(
        'offer-1',
        { status: OfferStatus.ACCEPTED },
        candidate,
      );

      expect(result.status).toBe(OfferStatus.ACCEPTED);
    });

    it('rejects candidate response if offer letter is not yet approved by staff', async () => {
      offersRepo.findOne.mockResolvedValue({
        ...baseOffer,
        letterApproved: false,
      });

      await expect(
        service.respond('offer-1', { status: OfferStatus.ACCEPTED }, candidate),
      ).rejects.toThrow(BadRequestException);
    });

    it('forbids candidate response if candidateId does not match', async () => {
      offersRepo.findOne.mockResolvedValue({
        ...baseOffer,
        letterApproved: true,
      });

      await expect(
        service.respond(
          'offer-1',
          { status: OfferStatus.ACCEPTED },
          otherCandidate,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findForApplication & findOne', () => {
    it('hides unapproved offer from candidate as 404', async () => {
      offersRepo.findOne.mockResolvedValue({
        ...baseOffer,
        letterApproved: false,
      });

      await expect(service.findOne('offer-1', candidate)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns approved offer to candidate', async () => {
      offersRepo.findOne.mockResolvedValue({
        ...baseOffer,
        letterApproved: true,
      });

      const result = await service.findOne('offer-1', candidate);

      expect(result.id).toBe('offer-1');
    });

    it('returns unapproved offer to company staff member', async () => {
      offersRepo.findOne.mockResolvedValue({
        ...baseOffer,
        letterApproved: false,
      });
      jobsService.findOne.mockResolvedValue(baseApplication.jobPosting as any);

      const result = await service.findOne('offer-1', recruiter);

      expect(result.id).toBe('offer-1');
    });
  });
});
