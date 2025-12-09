import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { LeadStatus } from '../entities/lead.entity';

export class UpdateLeadStatusDto {
  @ApiProperty({
    description: 'New status for the lead',
    enum: LeadStatus,
    example: LeadStatus.QUALIFIED,
  })
  @IsEnum(LeadStatus)
  @IsNotEmpty()
  status: LeadStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change',
    example: 'Customer confirmed dates and budget',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Booking ID if status is CONVERTED',
    example: '123e4567-e89b-12d3-a456-426614174020',
  })
  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Reason if lead was lost',
    example: 'Price too high, went with competitor',
  })
  @IsString()
  @IsOptional()
  lostReason?: string;
}
