import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PackageBookingStatus } from '../entities/package-booking.entity';

export class UpdatePackageBookingStatusDto {
  @ApiProperty({
    description: 'New status for the booking',
    enum: PackageBookingStatus,
    example: PackageBookingStatus.CONFIRMED,
  })
  @IsEnum(PackageBookingStatus)
  status: PackageBookingStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change (required for cancellation)',
    example: 'Guest requested cancellation',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Cancellation reason (for cancelled status)',
    example: 'Change of plans',
  })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
