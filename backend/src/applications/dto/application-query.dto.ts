import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApplicationStage } from '../../common/enums/application-stage.enum';

export class ApplicationQueryDto {
  @ApiPropertyOptional({
    description: 'Required for staff — scopes the list to one posting',
  })
  @IsOptional()
  @IsUUID()
  jobPostingId?: string;

  @ApiPropertyOptional({ enum: ApplicationStage })
  @IsOptional()
  @IsEnum(ApplicationStage)
  stage?: ApplicationStage;
}
