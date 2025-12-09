import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';

export class FilterBookingDto {
  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Filter by homestay ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  homestayId?: string;

  @ApiPropertyOptional({
    description: 'Filter bookings with check-in after this date',
    example: '2024-02-01',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  checkInAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter bookings with check-in before this date',
    example: '2024-02-28',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  checkInBefore?: string;
}
