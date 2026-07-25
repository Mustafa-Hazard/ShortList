import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { JobStatus } from '../../common/enums/job.enum';

// Ignored for candidates (they always get PUBLISHED-only, forced in the
// service regardless of what's passed here) — applies to staff views only.
export class JobPostingQueryDto {
  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
