import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { PackageBookingStatus } from '../entities/package-booking.entity';

export class FilterPackageBookingDto {
  @ApiPropertyOptional({
    description: 'Filter by package ID',
    example: '123e4567-e89b-12d3-a456-426614174010',
  })
  @IsOptional()
  @IsUUID()
  packageId?: string;

  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: PackageBookingStatus,
  })
  @IsOptional()
  @IsEnum(PackageBookingStatus)
  status?: PackageBookingStatus;

  @ApiPropertyOptional({
    description: 'Filter by start date after',
    example: '2024-02-01',
  })
  @IsOptional()
  @IsDateString()
  startDateAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date before',
    example: '2024-02-28',
  })
  @IsOptional()
  @IsDateString()
  startDateBefore?: string;

  @ApiPropertyOptional({
    description: 'Filter bookings with homestay only',
  })
  @IsOptional()
  includesHomestay?: boolean;
}
