import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Offer, OfferDocument } from './offer.entity';
import {
  Application,
  ApplicationDocument,
} from '../applications/application.entity';
import { User } from '../users/user.entity';
import { Role } from '../common/enums/role.enum';
import { OfferStatus } from '../common/enums/offer-status.enum';
import { JobsService } from '../jobs/jobs.service';
import { OfferDrafterService } from './offer-drafter.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondOfferDto } from './dto/respond-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offer.name)
    private offerModel: Model<OfferDocument>,
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
    private jobsService: JobsService,
    private offerDrafterService: OfferDrafterService,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateOfferDto, user: User): Promise<Offer> {
    if (
      typeof dto.applicationId !== 'string' ||
      !/^[a-zA-Z0-9-]+$/.test(dto.applicationId)
    ) {
      throw new BadRequestException('Invalid application ID');
    }
    const application = await this.applicationModel
      .findById(dto.applicationId)
      .populate('candidate')
      .populate('jobPosting')
      .exec();
    if (!application) throw new NotFoundException('Application not found');

    await this.jobsService.findOne(application.jobPostingId, user);

    const existing = await this.offerModel
      .findOne({ applicationId: { $eq: String(dto.applicationId) } })
      .exec();
    if (existing) {
      throw new ConflictException(
        'An offer has already been issued for this application',
      );
    }

    let draftedLetter = dto.draftedLetter ?? null;
    if (!draftedLetter) {
      try {
        const candidateName = application.candidate
          ? `${application.candidate.firstName} ${application.candidate.lastName}`
          : 'Candidate';

        draftedLetter = await this.offerDrafterService.generateDraft({
          candidateName,
          roleTitle: dto.roleTitle,
          salary: dto.salary,
          startDate: dto.startDate,
          benefitsSummary: dto.benefitsSummary,
        });
      } catch {
        draftedLetter = null;
      }
    }

    const offer = await this.offerModel.create({
      applicationId: dto.applicationId,
      issuedById: user.id,
      roleTitle: dto.roleTitle,
      salary: dto.salary,
      startDate: dto.startDate,
      benefitsSummary: dto.benefitsSummary,
      draftedLetter,
      letterApproved: false,
      status: OfferStatus.ISSUED,
    });

    return offer.toObject();
  }

  async approveLetter(id: string, user: User): Promise<Offer> {
    const offer = await this.getOwnedForStaff(id, user);
    offer.letterApproved = true;
    await offer.save();

    try {
      const app = offer.application as any;
      await this.notificationsService.createAndSend(
        app.candidateId,
        NotificationType.OFFER_ISSUED,
        {
          offerId: offer.id,
          applicationId: offer.applicationId,
          roleTitle: offer.roleTitle,
          salary: offer.salary,
        },
      );
    } catch {
      // Degrade-don't-block
    }

    return offer.toObject();
  }

  async generateLetter(id: string, user: User): Promise<Offer> {
    const offer = await this.offerModel
      .findById(id)
      .populate({
        path: 'application',
        populate: [{ path: 'candidate' }, { path: 'jobPosting' }],
      })
      .exec();
    if (!offer) throw new NotFoundException('Offer not found');
    const appJobPostingId = (offer.application as any)?.jobPostingId;
    await this.jobsService.findOne(appJobPostingId, user);

    const candidate = (offer.application as any)?.candidate;
    const candidateName = candidate
      ? `${candidate.firstName} ${candidate.lastName}`
      : 'Candidate';

    const text = await this.offerDrafterService.generateDraft({
      candidateName,
      roleTitle: offer.roleTitle,
      salary: offer.salary,
      startDate: offer.startDate,
      benefitsSummary: offer.benefitsSummary,
    });

    offer.draftedLetter = text;
    await offer.save();
    return offer.toObject();
  }

  async respond(
    id: string,
    dto: RespondOfferDto,
    candidate: User,
  ): Promise<Offer> {
    const offer = await this.offerModel
      .findById(id)
      .populate('application')
      .exec();
    if (!offer) throw new NotFoundException('Offer not found');

    const appCandidateId = (offer.application as any)?.candidateId;
    if (appCandidateId !== candidate.id) {
      throw new ForbiddenException(
        'You do not have access to respond to this offer',
      );
    }

    if (!offer.letterApproved) {
      throw new BadRequestException(
        'Offer letter has not been approved by the employer yet',
      );
    }

    offer.status = dto.status;
    if (dto.candidateResponse !== undefined) {
      offer.candidateResponse = dto.candidateResponse;
    }

    await offer.save();

    if (offer.issuedById) {
      try {
        await this.notificationsService.createAndSend(
          offer.issuedById,
          NotificationType.OFFER_RESPONDED,
          {
            offerId: offer.id,
            applicationId: offer.applicationId,
            status: offer.status,
            candidateResponse: offer.candidateResponse,
          },
        );
      } catch {
        // Degrade-don't-block
      }
    }

    return offer.toObject();
  }

  async update(id: string, dto: UpdateOfferDto, user: User): Promise<Offer> {
    const offer = await this.getOwnedForStaff(id, user);
    Object.assign(offer, dto);
    await offer.save();
    return offer.toObject();
  }

  async findForApplication(applicationId: string, user: User): Promise<Offer> {
    const offer = await this.offerModel
      .findOne({ applicationId })
      .populate('application')
      .exec();
    if (!offer) throw new NotFoundException('Offer not found');

    if (user.role === Role.CANDIDATE) {
      const appCandidateId = (offer.application as any)?.candidateId;
      if (appCandidateId !== user.id || !offer.letterApproved) {
        throw new NotFoundException('Offer not found');
      }
      return offer;
    }

    const appJobPostingId = (offer.application as any)?.jobPostingId;
    await this.jobsService.findOne(appJobPostingId, user);
    return offer;
  }

  async findOne(id: string, user: User): Promise<Offer> {
    const offer = await this.offerModel
      .findById(id)
      .populate('application')
      .exec();
    if (!offer) throw new NotFoundException('Offer not found');

    if (user.role === Role.CANDIDATE) {
      const appCandidateId = (offer.application as any)?.candidateId;
      if (appCandidateId !== user.id || !offer.letterApproved) {
        throw new NotFoundException('Offer not found');
      }
      return offer;
    }

    const appJobPostingId = (offer.application as any)?.jobPostingId;
    await this.jobsService.findOne(appJobPostingId, user);
    return offer;
  }

  private async getOwnedForStaff(
    id: string,
    user: User,
  ): Promise<OfferDocument> {
    const offer = await this.offerModel
      .findById(id)
      .populate('application')
      .exec();
    if (!offer) throw new NotFoundException('Offer not found');
    const appJobPostingId = (offer.application as any)?.jobPostingId;
    await this.jobsService.findOne(appJobPostingId, user);
    return offer;
  }
}
