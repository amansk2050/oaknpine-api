import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PackageHomestayDayDto {
  @ApiProperty({
    description: 'Day number of the package (1, 2, 3, etc.)',
    example: 2,
  })
  @IsInt()
  @Min(1)
  dayNumber: number;

  @ApiProperty({
    description: 'Room ID for homestay on this day',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  roomId: string;

  @ApiProperty({
    description: 'Number of guests for this room',
    example: 2,
  })
  @IsInt()
  @Min(1)
  numberOfGuests: number;

  @ApiPropertyOptional({
    description: 'Notes for this room booking',
    example: 'Early check-in requested',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePackageBookingDto {
  @ApiProperty({
    description: 'Lead ID from which this booking is created',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsUUID()
  leadId: string;

  @ApiProperty({
    description: 'Package ID being booked',
    example: '123e4567-e89b-12d3-a456-426614174010',
  })
  @IsUUID()
  packageId: string;

  @ApiProperty({
    description: 'Start date of the package',
    example: '2024-02-15',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Number of adults',
    example: 2,
  })
  @IsInt()
  @Min(1)
  numberOfAdults: number;

  @ApiPropertyOptional({
    description: 'Number of children',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfChildren?: number;

  @ApiPropertyOptional({
    description: 'Whether package includes homestay',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includesHomestay?: boolean;

  @ApiPropertyOptional({
    description: 'Homestay bookings for specific days',
    type: [PackageHomestayDayDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageHomestayDayDto)
  homestayDays?: PackageHomestayDayDto[];

  @ApiPropertyOptional({
    description: 'Discount amount to apply',
    example: 500,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Tax percentage to apply',
    example: 18,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercentage?: number;

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
    description: 'Additional guest details',
    example: { idProof: 'Passport', idNumber: 'P1234567' },
  })
  @IsOptional()
  guestDetails?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'User who created the booking',
    example: 'admin@example.com',
  })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
