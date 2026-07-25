import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateOfferDto {
  @ApiProperty()
  @IsUUID()
  applicationId: string;

  @ApiProperty()
  @IsString()
  roleTitle: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  salary: number;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsString()
  benefitsSummary: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  draftedLetter?: string;
}
