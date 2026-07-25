import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty()
  @IsUUID()
  jobPostingId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverLetter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  salaryExpectation?: number;

  @ApiPropertyOptional({ description: 'ISO date, e.g. 2026-09-01' })
  @IsOptional()
  @IsDateString()
  availabilityDate?: string;
}
