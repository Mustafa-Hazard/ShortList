import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class ConfirmSlotDto {
  @ApiProperty()
  @IsDateString()
  confirmedSlot: string;
}
