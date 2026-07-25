import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview } from './interview.entity';
import { Application } from '../applications/application.entity';
import { User } from '../users/user.entity';
import { Role } from '../common/enums/role.enum';
import { InterviewStatus } from '../common/enums/interview.enum';
import { JobsService } from '../jobs/jobs.service';
import { ApplicationsService } from '../applications/applications.service';
import { QuestionSuggesterService } from './question-suggester.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { ConfirmSlotDto } from './dto/confirm-slot.dto';
import { UpdateInterviewStatusDto } from './dto/update-interview-status.dto';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(Interview)
    private interviewsRepo: Repository<Interview>,
    @InjectRepository(Application)
    private applicationsRepo: Repository<Application>,
    private jobsService: JobsService,
    private applicationsService: ApplicationsService,
    private questionSuggesterService: QuestionSuggesterService,
    private notificationsService: NotificationsService,
  ) {}

  async schedule(dto: ScheduleInterviewDto, user: User): Promise<Interview> {
    const application = await this.applicationsRepo.findOne({
      where: { id: dto.applicationId },
    });
    if (!application) throw new NotFoundException('Application not found');

    // Confirm staff user belongs to the company owning this job posting
    await this.jobsService.findOne(application.jobPostingId, user);

    const interview = this.interviewsRepo.create({
      applicationId: dto.applicationId,
      proposedById: user.id,
      hiringManagerId: dto.hiringManagerId ?? null,
      type: dto.type,
      proposedSlots: dto.proposedSlots.map((s) => new Date(s)),
      status: InterviewStatus.PROPOSED,
      questions: [],
    });

    const saved = await this.interviewsRepo.save(interview);

    try {
      await this.notificationsService.createAndSend(
        application.candidateId,
        NotificationType.INTERVIEW_PROPOSED,
        {
          interviewId: saved.id,
          applicationId: saved.applicationId,
          type: saved.type,
          proposedSlots: saved.proposedSlots,
        },
      );
    } catch (err) {
      // Degrade-don't-block
    }

    return saved;
  }

  async confirmSlot(
    id: string,
    dto: ConfirmSlotDto,
    candidate: User,
  ): Promise<Interview> {
    const interview = await this.interviewsRepo.findOne({
      where: { id },
      relations: { application: true },
    });
    if (!interview) throw new NotFoundException('Interview not found');

    if (interview.application.candidateId !== candidate.id) {
      throw new ForbiddenException(
        'You do not have access to confirm this interview',
      );
    }

    const confirmedDate = new Date(dto.confirmedSlot);
    const isProposedSlot = interview.proposedSlots.some(
      (slot) => new Date(slot).getTime() === confirmedDate.getTime(),
    );

    if (!isProposedSlot) {
      throw new BadRequestException(
        'Confirmed slot must match one of the recruiter proposed time slots',
      );
    }

    interview.confirmedSlot = confirmedDate;
    interview.status = InterviewStatus.CONFIRMED;
    const saved = await this.interviewsRepo.save(interview);

    if (interview.proposedById) {
      try {
        await this.notificationsService.createAndSend(
          interview.proposedById,
          NotificationType.INTERVIEW_CONFIRMED,
          {
            interviewId: saved.id,
            applicationId: saved.applicationId,
            confirmedSlot: confirmedDate,
          },
        );
      } catch (err) {
        // Degrade-don't-block
      }
    }

    return saved;
  }

  async updateStatus(
    id: string,
    dto: UpdateInterviewStatusDto,
    user: User,
  ): Promise<Interview> {
    const interview = await this.getOwnedForStaff(id, user);
    interview.status = dto.status;
    return this.interviewsRepo.save(interview);
  }

  async generateQuestions(id: string, user: User): Promise<Interview> {
    const interview = await this.interviewsRepo.findOne({
      where: { id },
      relations: {
        application: {
          jobPosting: true,
          cv: true,
        },
      },
    });
    if (!interview) throw new NotFoundException('Interview not found');
    await this.jobsService.findOne(interview.application.jobPostingId, user);

    const app = interview.application;
    const questions = await this.questionSuggesterService.generateQuestions({
      jobPosting: app.jobPosting,
      cvText: app.cv?.extractedText ?? null,
      coverLetter: app.coverLetter,
      aiStrengths: app.aiStrengths,
      aiGaps: app.aiGaps,
      type: interview.type,
    });

    interview.questions = questions;
    return this.interviewsRepo.save(interview);
  }

  async findForApplication(
    applicationId: string,
    user: User,
  ): Promise<Interview[]> {
    // Reuses ApplicationsService.findOne to verify company/candidate access
    await this.applicationsService.findOne(applicationId, user);
    return this.interviewsRepo.find({
      where: { applicationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<Interview> {
    const interview = await this.interviewsRepo.findOne({
      where: { id },
      relations: { application: true },
    });
    if (!interview) throw new NotFoundException('Interview not found');

    if (user.role === Role.CANDIDATE) {
      if (interview.application.candidateId !== user.id) {
        throw new NotFoundException('Interview not found');
      }
      return interview;
    }

    await this.jobsService.findOne(interview.application.jobPostingId, user);
    return interview;
  }

  private async getOwnedForStaff(id: string, user: User): Promise<Interview> {
    const interview = await this.interviewsRepo.findOne({
      where: { id },
      relations: { application: true },
    });
    if (!interview) throw new NotFoundException('Interview not found');
    await this.jobsService.findOne(interview.application.jobPostingId, user);
    return interview;
  }
}
