import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Interview, InterviewDocument } from './interview.entity';
import {
  Application,
  ApplicationDocument,
} from '../applications/application.entity';
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
    @InjectModel(Interview.name)
    private interviewModel: Model<InterviewDocument>,
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
    private jobsService: JobsService,
    private applicationsService: ApplicationsService,
    private questionSuggesterService: QuestionSuggesterService,
    private notificationsService: NotificationsService,
  ) {}

  async schedule(dto: ScheduleInterviewDto, user: User): Promise<Interview> {
    if (
      typeof dto.applicationId !== 'string' ||
      !/^[a-zA-Z0-9-]+$/.test(dto.applicationId)
    ) {
      throw new BadRequestException('Invalid application ID');
    }
    const application = await this.applicationModel
      .findById(dto.applicationId)
      .exec();
    if (!application) throw new NotFoundException('Application not found');

    await this.jobsService.findOne(application.jobPostingId, user);

    const interview = await this.interviewModel.create({
      applicationId: dto.applicationId,
      proposedById: user.id,
      hiringManagerId: dto.hiringManagerId ?? null,
      type: dto.type,
      proposedSlots: dto.proposedSlots.map((s) => new Date(s)),
      status: InterviewStatus.PROPOSED,
      questions: [],
    });

    try {
      await this.notificationsService.createAndSend(
        application.candidateId,
        NotificationType.INTERVIEW_PROPOSED,
        {
          interviewId: interview.id,
          applicationId: interview.applicationId,
          type: interview.type,
          proposedSlots: interview.proposedSlots,
        },
      );
    } catch {
      // Degrade-don't-block
    }

    return interview.toObject();
  }

  async confirmSlot(
    id: string,
    dto: ConfirmSlotDto,
    candidate: User,
  ): Promise<Interview> {
    const interview = await this.interviewModel
      .findById(id)
      .populate('application')
      .exec();
    if (!interview) throw new NotFoundException('Interview not found');

    const appCandidateId = (interview.application as any)?.candidateId;
    if (appCandidateId !== candidate.id) {
      throw new ForbiddenException(
        'You do not have access to confirm this interview',
      );
    }

    const slot = new Date(dto.confirmedSlot);
    const validSlot = interview.proposedSlots.some(
      (s) => new Date(s).getTime() === slot.getTime(),
    );
    if (!validSlot) {
      throw new BadRequestException(
        'Confirmed slot must be one of the proposed slots',
      );
    }

    interview.confirmedSlot = slot;
    interview.status = InterviewStatus.CONFIRMED;
    await interview.save();

    if (interview.proposedById) {
      try {
        await this.notificationsService.createAndSend(
          interview.proposedById,
          NotificationType.INTERVIEW_CONFIRMED,
          {
            interviewId: interview.id,
            applicationId: interview.applicationId,
            confirmedSlot: interview.confirmedSlot,
          },
        );
      } catch {
        // Degrade-don't-block
      }
    }

    return interview.toObject();
  }

  async updateStatus(
    id: string,
    dto: UpdateInterviewStatusDto,
    user: User,
  ): Promise<Interview> {
    const interview = await this.getOwnedForStaff(id, user);
    interview.status = dto.status;
    await interview.save();
    return interview.toObject();
  }

  async generateQuestions(id: string, user: User): Promise<Interview> {
    const interview = await this.getOwnedForStaff(id, user);
    const application = await this.applicationsService.findOne(
      interview.applicationId,
      user,
    );

    const questions = await this.questionSuggesterService.generateQuestions({
      jobPosting: application.jobPosting as any,
      cvText: application.cv?.extractedText ?? null,
      coverLetter: application.coverLetter,
      aiStrengths: application.aiStrengths,
      aiGaps: application.aiGaps,
      type: interview.type,
    });

    interview.questions = questions;
    await interview.save();
    return interview.toObject();
  }

  async updateQuestions(
    id: string,
    questions: any[],
    user: User,
  ): Promise<Interview> {
    const interview = await this.getOwnedForStaff(id, user);
    interview.questions = questions;
    await interview.save();
    return interview.toObject();
  }

  async findForApplication(
    applicationId: string,
    user: User,
  ): Promise<Interview[]> {
    await this.applicationsService.findOne(applicationId, user);
    return this.interviewModel
      .find({ applicationId })
      .populate('application')
      .populate('proposedBy')
      .populate('hiringManager')
      .exec();
  }

  async findOne(id: string, user: User): Promise<Interview> {
    const interview = await this.interviewModel
      .findById(id)
      .populate('application')
      .populate('proposedBy')
      .populate('hiringManager')
      .exec();
    if (!interview) throw new NotFoundException('Interview not found');

    if (user.role === Role.CANDIDATE) {
      const appCandidateId = (interview.application as any)?.candidateId;
      if (appCandidateId !== user.id) {
        throw new NotFoundException('Interview not found');
      }
      return interview;
    }

    const appJobPostingId = (interview.application as any)?.jobPostingId;
    await this.jobsService.findOne(appJobPostingId, user);
    return interview;
  }

  private async getOwnedForStaff(
    id: string,
    user: User,
  ): Promise<InterviewDocument> {
    const interview = await this.interviewModel
      .findById(id)
      .populate('application')
      .exec();
    if (!interview) throw new NotFoundException('Interview not found');
    const appJobPostingId = (interview.application as any)?.jobPostingId;
    await this.jobsService.findOne(appJobPostingId, user);
    return interview;
  }
}
