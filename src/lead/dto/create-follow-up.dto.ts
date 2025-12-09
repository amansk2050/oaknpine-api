import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import {
  FollowUpType,
  FollowUpOutcome,
} from '../entities/lead-follow-up.entity';

export class CreateFollowUpDto {
  @ApiProperty({
    description: 'Type of follow-up activity',
    enum: FollowUpType,
    example: FollowUpType.CALL,
  })
  @IsEnum(FollowUpType)
  @IsNotEmpty()
  type: FollowUpType;

  @ApiProperty({
    description: 'Outcome or result of the follow-up',
    enum: FollowUpOutcome,
    example: FollowUpOutcome.INTERESTED,
  })
  @IsEnum(FollowUpOutcome)
  @IsNotEmpty()
  outcome: FollowUpOutcome;

  @ApiProperty({
    description: 'Detailed notes about the follow-up',
    example:
      'Discussed pricing and availability for Feb 15-18. Customer interested in mountain view rooms.',
  })
  @IsString()
  @IsNotEmpty()
  notes: string;

  @ApiPropertyOptional({
    description: 'Duration of the follow-up in minutes',
    example: 15,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Date and time of the follow-up',
    example: '2024-01-20T10:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @ApiPropertyOptional({
    description: 'Next scheduled follow-up date',
    example: '2024-01-25T10:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  nextFollowUpDate?: string;

  @ApiPropertyOptional({
    description: 'User ID who performed the follow-up',
    example: '123e4567-e89b-12d3-a456-426614174010',
  })
  @IsString()
  @IsOptional()
  performedBy?: string;
}
