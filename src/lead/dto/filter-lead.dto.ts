import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';
import {
  LeadStatus,
  LeadSource,
  LeadPriority,
  LeadType,
} from '../entities/lead.entity';

export class FilterLeadDto {
  @ApiPropertyOptional({
    description: 'Filter by lead status',
    enum: LeadStatus,
    example: LeadStatus.NEW,
  })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional({
    description: 'Filter by lead source',
    enum: LeadSource,
    example: LeadSource.WEBSITE,
  })
  @IsEnum(LeadSource)
  @IsOptional()
  source?: LeadSource;

  @ApiPropertyOptional({
    description: 'Filter by priority',
    enum: LeadPriority,
    example: LeadPriority.HIGH,
  })
  @IsEnum(LeadPriority)
  @IsOptional()
  priority?: LeadPriority;

  @ApiPropertyOptional({
    description: 'Filter by lead type',
    enum: LeadType,
    example: LeadType.CORPORATE,
  })
  @IsEnum(LeadType)
  @IsOptional()
  leadType?: LeadType;

  @ApiPropertyOptional({
    description: 'Filter by assigned sales representative',
    example: '123e4567-e89b-12d3-a456-426614174010',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    description: 'Filter leads created after this date',
    example: '2024-01-01',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter leads created before this date',
    example: '2024-01-31',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  createdBefore?: string;
}
