import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { JobPostingQueryDto } from './dto/job-posting-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { JobStatus } from '../common/enums/job.enum';
import { User } from '../users/user.entity';

@ApiBearerAuth()
@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Roles(Role.RECRUITER, Role.ADMIN)
  @Post()
  create(@Body() dto: CreateJobPostingDto, @CurrentUser() user: User) {
    return this.jobsService.create(dto, user);
  }

  // No @Roles() — every authenticated role can list, visibility is scoped
  // inside the service (candidates: published-only across all companies;
  // staff: their own company, optional status filter).
  @Get()
  findAll(@Query() query: JobPostingQueryDto, @CurrentUser() user: User) {
    return this.jobsService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.jobsService.findOne(id, user);
  }

  @Roles(Role.RECRUITER, Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobPostingDto,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.update(id, dto, user);
  }

  @Roles(Role.RECRUITER, Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.jobsService.remove(id, user);
  }

  @Roles(Role.RECRUITER, Role.ADMIN)
  @Post(':id/publish')
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.jobsService.transition(id, JobStatus.PUBLISHED, user);
  }

  @Roles(Role.RECRUITER, Role.ADMIN)
  @Post(':id/close')
  close(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.jobsService.transition(id, JobStatus.CLOSED, user);
  }

  @Roles(Role.RECRUITER, Role.ADMIN)
  @Post(':id/archive')
  archive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.jobsService.transition(id, JobStatus.ARCHIVED, user);
  }

  @Roles(Role.RECRUITER, Role.HIRING_MANAGER, Role.ADMIN)
  @Get(':id/stats')
  stats(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.jobsService.stats(id, user);
  }
}
