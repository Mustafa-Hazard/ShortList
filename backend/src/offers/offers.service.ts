import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './offer.entity';
import { Application } from '../applications/application.entity';
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
    @InjectRepository(Offer)
    private offersRepo: Repository<Offer>,
    @InjectRepository(Application)
    private applicationsRepo: Repository<Application>,
    private jobsService: JobsService,
    private offerDrafterService: OfferDrafterService,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateOfferDto, user: User): Promise<Offer> {
    const application = await this.applicationsRepo.findOne({
      where: { id: dto.applicationId },
      relations: { candidate: true, jobPosting: true },
    });
    if (!application) throw new NotFoundException('Application not found');

    // Confirm staff user belongs to the company owning this posting
    await this.jobsService.findOne(application.jobPostingId, user);

    const existing = await this.offersRepo.findOne({
      where: { applicationId: dto.applicationId },
    });
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
      } catch (err) {
        // Degrade-don't-block: If AI drafting fails, offer creation succeeds with null draft.
        draftedLetter = null;
      }
    }

    const offer = this.offersRepo.create({
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

    return this.offersRepo.save(offer);
  }

  async approveLetter(id: string, user: User): Promise<Offer> {
    const offer = await this.getOwnedForStaff(id, user);
    offer.letterApproved = true;
    const saved = await this.offersRepo.save(offer);

    try {
      await this.notificationsService.createAndSend(
        offer.application.candidateId,
        NotificationType.OFFER_ISSUED,
        {
          offerId: saved.id,
          applicationId: saved.applicationId,
          roleTitle: saved.roleTitle,
          salary: saved.salary,
        },
      );
    } catch (err) {
      // Degrade-don't-block
    }

    return saved;
  }

  async generateLetter(id: string, user: User): Promise<Offer> {
    const offer = await this.offersRepo.findOne({
      where: { id },
      relations: {
        application: {
          candidate: true,
          jobPosting: true,
        },
      },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    await this.jobsService.findOne(offer.application.jobPostingId, user);

    const candidateName = offer.application.candidate
      ? `${offer.application.candidate.firstName} ${offer.application.candidate.lastName}`
      : 'Candidate';

    const text = await this.offerDrafterService.generateDraft({
      candidateName,
      roleTitle: offer.roleTitle,
      salary: offer.salary,
      startDate: offer.startDate,
      benefitsSummary: offer.benefitsSummary,
    });

    offer.draftedLetter = text;
    return this.offersRepo.save(offer);
  }

  async respond(
    id: string,
    dto: RespondOfferDto,
    candidate: User,
  ): Promise<Offer> {
    const offer = await this.offersRepo.findOne({
      where: { id },
      relations: { application: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');

    if (offer.application.candidateId !== candidate.id) {
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

    const saved = await this.offersRepo.save(offer);

    if (offer.issuedById) {
      try {
        await this.notificationsService.createAndSend(
          offer.issuedById,
          NotificationType.OFFER_RESPONDED,
          {
            offerId: saved.id,
            applicationId: saved.applicationId,
            status: saved.status,
            candidateResponse: saved.candidateResponse,
          },
        );
      } catch (err) {
        // Degrade-don't-block
      }
    }

    return saved;
  }

  async update(
    id: string,
    dto: UpdateOfferDto,
    user: User,
  ): Promise<Offer> {
    const offer = await this.getOwnedForStaff(id, user);
    Object.assign(offer, dto);
    return this.offersRepo.save(offer);
  }

  async findForApplication(
    applicationId: string,
    user: User,
  ): Promise<Offer> {
    const offer = await this.offersRepo.findOne({
      where: { applicationId },
      relations: { application: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');

    if (user.role === Role.CANDIDATE) {
      if (offer.application.candidateId !== user.id || !offer.letterApproved) {
        throw new NotFoundException('Offer not found');
      }
      return offer;
    }

    await this.jobsService.findOne(offer.application.jobPostingId, user);
    return offer;
  }

  async findOne(id: string, user: User): Promise<Offer> {
    const offer = await this.offersRepo.findOne({
      where: { id },
      relations: { application: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');

    if (user.role === Role.CANDIDATE) {
      if (offer.application.candidateId !== user.id || !offer.letterApproved) {
        throw new NotFoundException('Offer not found');
      }
      return offer;
    }

    await this.jobsService.findOne(offer.application.jobPostingId, user);
    return offer;
  }

  private async getOwnedForStaff(id: string, user: User): Promise<Offer> {
    const offer = await this.offersRepo.findOne({
      where: { id },
      relations: { application: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    await this.jobsService.findOne(offer.application.jobPostingId, user);
    return offer;
  }
}
