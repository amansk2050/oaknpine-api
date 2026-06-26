import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdatePackageBookingDto {
  @ApiPropertyOptional({
    description: 'Special requests from guest',
    example: 'Vegetarian meals only',
  })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional({
    description: 'Internal notes',
    example: 'VIP guest',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Expected arrival time',
    example: '14:00',
  })
  @IsOptional()
  @IsString()
  expectedArrivalTime?: string;

  @ApiPropertyOptional({
    description: 'Discount amount',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Additional guest details',
  })
  @IsOptional()
  guestDetails?: Record<string, any>;
}
