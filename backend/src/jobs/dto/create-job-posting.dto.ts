import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateJobPostingDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  department: string;

  @ApiProperty({ enum: JobType })
  @IsEnum(JobType)
  type: JobType;

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

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  requiredSkills: string[];

  @ApiProperty()
  @IsString()
  responsibilities: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cultureNotes?: string;

  @ApiPropertyOptional({
    description:
      'Full job description body — set by the AI JD Generator or written manually',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
