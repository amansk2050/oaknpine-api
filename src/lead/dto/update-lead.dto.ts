import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { CreateLeadDto } from './create-lead.dto';
import { LeadStatus } from '../entities/lead.entity';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @ApiPropertyOptional({
    description: 'Current status of the lead',
    enum: LeadStatus,
    example: LeadStatus.CONTACTED,
  })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional({
    description: 'Next scheduled follow-up date',
    example: '2024-01-25T10:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  nextFollowUpAt?: string;

  @ApiPropertyOptional({
    description: 'Lead score based on engagement (0-100)',
    example: 75,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  leadScore?: number;
}
