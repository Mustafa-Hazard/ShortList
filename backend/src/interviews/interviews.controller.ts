import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { ConfirmSlotDto } from './dto/confirm-slot.dto';
import { UpdateInterviewStatusDto } from './dto/update-interview-status.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

@ApiBearerAuth()
@ApiTags('interviews')
@Controller('interviews')
export class InterviewsController {
  constructor(private interviewsService: InterviewsService) {}

  @Roles(Role.RECRUITER, Role.ADMIN)
  @Post()
  schedule(@Body() dto: ScheduleInterviewDto, @CurrentUser() user: User) {
    return this.interviewsService.schedule(dto, user);
  }

  @Roles(Role.CANDIDATE)
  @Post(':id/confirm')
  confirmSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmSlotDto,
    @CurrentUser() user: User,
  ) {
    return this.interviewsService.confirmSlot(id, dto, user);
  }

  @Roles(Role.RECRUITER, Role.HIRING_MANAGER, Role.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInterviewStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.interviewsService.updateStatus(id, dto, user);
  }

  @Roles(Role.RECRUITER, Role.HIRING_MANAGER, Role.ADMIN)
  @Post(':id/generate-questions')
  generateQuestions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.interviewsService.generateQuestions(id, user);
  }

  @Get('application/:applicationId')
  findForApplication(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @CurrentUser() user: User,
  ) {
    return this.interviewsService.findForApplication(applicationId, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.interviewsService.findOne(id, user);
  }
}
