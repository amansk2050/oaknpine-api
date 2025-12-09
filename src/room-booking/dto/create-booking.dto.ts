import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BookingRoomDto {
  @ApiProperty({
    description: 'Room UUID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({
    description: 'Number of guests in this room',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  numberOfGuests: number;

  @ApiPropertyOptional({
    description: 'Is the room fully occupied',
    example: false,
  })
  @IsOptional()
  isFullyOccupied?: boolean;

  @ApiPropertyOptional({
    description: 'Notes specific to this room',
    example: 'Extra bed required',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBookingDto {
  @ApiProperty({
    description: 'Lead UUID from which booking is created',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({
    description: 'Homestay UUID where booking is made',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  homestayId: string;

  @ApiProperty({
    description: 'Check-in date',
    example: '2024-02-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  checkInDate: string;

  @ApiProperty({
    description: 'Check-out date',
    example: '2024-02-18',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  checkOutDate: string;

  @ApiProperty({
    description: 'Rooms to be booked with guest count',
    type: [BookingRoomDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingRoomDto)
  rooms: BookingRoomDto[];

  @ApiPropertyOptional({
    description: 'Discount amount',
    example: 500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Tax percentage',
    example: 12,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercentage?: number;

  @ApiPropertyOptional({
    description: 'Special requests from guest',
    example: 'Early check-in required',
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
}
