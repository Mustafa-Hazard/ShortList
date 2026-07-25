import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ApplicationStage } from '../../common/enums/application-stage.enum';

export class TransitionApplicationDto {
  @ApiProperty({ enum: ApplicationStage })
  @IsEnum(ApplicationStage)
  stage: ApplicationStage;
}
