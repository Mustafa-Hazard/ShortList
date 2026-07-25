import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { JobType } from '../../common/enums/job.enum';

// Status is deliberately excluded here — stage transitions go through the
// dedicated /publish, /close, /archive endpoints so each transition can
// enforce its own rules rather than accepting any status value via PATCH.
export class UpdateJobPostingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ enum: JobType })
  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsibilities?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cultureNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
