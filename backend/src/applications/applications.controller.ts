import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationQueryDto } from './dto/application-query.dto';
import { TransitionApplicationDto } from './dto/transition-application.dto';
import { BulkTransitionDto } from './dto/bulk-transition.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

@ApiBearerAuth()
@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @Roles(Role.CANDIDATE)
  @Post()
  apply(@Body() dto: CreateApplicationDto, @CurrentUser() user: User) {
    return this.applicationsService.apply(dto, user);
  }

  @Roles(Role.CANDIDATE)
  @Get('me')
  findMine(@CurrentUser() user: User) {
    return this.applicationsService.findMine(user);
  }

  @Roles(Role.RECRUITER, Role.HIRING_MANAGER, Role.ADMIN)
  @Get()
  findForPosting(@Query() query: ApplicationQueryDto, @CurrentUser() user: User) {
    return this.applicationsService.findForPosting(query, user);
  }

  // No @Roles() — candidates can view their own, staff can view their
  // company's; the split is enforced inside the service.
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.applicationsService.findOne(id, user);
  }

  @Roles(Role.RECRUITER, Role.HIRING_MANAGER, Role.ADMIN)
  @Post(':id/transition')
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionApplicationDto,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.transition(id, dto.stage, user);
  }

  @Roles(Role.RECRUITER, Role.HIRING_MANAGER, Role.ADMIN)
  @Post('bulk-transition')
  bulkTransition(@Body() dto: BulkTransitionDto, @CurrentUser() user: User) {
    return this.applicationsService.bulkTransition(dto.applicationIds, dto.stage, user);
  }

  @Roles(Role.RECRUITER, Role.HIRING_MANAGER, Role.ADMIN)
  @Post(':id/score')
  score(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.applicationsService.scoreApplication(id, user);
  }
}
