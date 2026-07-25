import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OfferStatus } from '../../common/enums/offer-status.enum';

export class RespondOfferDto {
  @ApiProperty({ enum: OfferStatus })
  @IsEnum(OfferStatus)
  status: OfferStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  candidateResponse?: string;
}
