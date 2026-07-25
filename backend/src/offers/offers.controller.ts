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
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondOfferDto } from './dto/respond-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

@ApiBearerAuth()
@ApiTags('offers')
@Controller('offers')
export class OffersController {
  constructor(private offersService: OffersService) {}

  @Roles(Role.RECRUITER, Role.ADMIN)
  @Post()
  create(@Body() dto: CreateOfferDto, @CurrentUser() user: User) {
    return this.offersService.create(dto, user);
  }

  @Roles(Role.RECRUITER, Role.HIRING_MANAGER, Role.ADMIN)
  @Post(':id/generate-letter')
  generateLetter(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.offersService.generateLetter(id, user);
  }

  @Roles(Role.RECRUITER, Role.HIRING_MANAGER, Role.ADMIN)
  @Post(':id/approve')
  approveLetter(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.offersService.approveLetter(id, user);
  }

  @Roles(Role.CANDIDATE)
  @Post(':id/respond')
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondOfferDto,
    @CurrentUser() user: User,
  ) {
    return this.offersService.respond(id, dto, user);
  }

  @Roles(Role.RECRUITER, Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfferDto,
    @CurrentUser() user: User,
  ) {
    return this.offersService.update(id, dto, user);
  }

  @Get('application/:applicationId')
  findForApplication(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @CurrentUser() user: User,
  ) {
    return this.offersService.findForApplication(applicationId, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.offersService.findOne(id, user);
  }
}
