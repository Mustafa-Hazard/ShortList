import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CvService } from './cv.service';
import { cvMulterOptions } from './multer.config';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

@ApiBearerAuth()
@ApiTags('cv')
@Controller('cv')
export class CvController {
  constructor(private cvService: CvService) {}

  @Roles(Role.CANDIDATE)
  @ApiConsumes('multipart/form-data')
  @Post(':applicationId')
  @UseInterceptors(FileInterceptor('file', cvMulterOptions))
  upload(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new NotFoundException('No file was uploaded — expected a "file" field');
    }
    return this.cvService.upload(applicationId, file, user);
  }

  // No @Roles() — candidate-owner and staff-of-company both allowed;
  // the split is enforced inside CvService via ApplicationsService.findOne.
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.cvService.findOne(id, user);
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const { path, filename } = await this.cvService.getFilePath(id, user);
    res.download(path, filename);
  }
}
