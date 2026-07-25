import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { InterviewStatus } from '../../common/enums/interview.enum';

export class UpdateInterviewStatusDto {
  @ApiProperty({ enum: InterviewStatus })
  @IsEnum(InterviewStatus)
  status: InterviewStatus;
}
