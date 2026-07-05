import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateB2bBookingRequestDto {
  @ApiProperty({
    description: 'Homestay UUID the request is for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  homestayId: string;

  @ApiProperty({
    description: 'Guest name on the request',
    example: 'Priya Sharma',
  })
  @IsString()
  @IsNotEmpty()
  guestName: string;

  @ApiPropertyOptional({
    description: 'Guest email',
    example: 'priya@example.com',
  })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @ApiProperty({ description: 'Guest phone', example: '+91-9876543210' })
  @IsString()
  @IsNotEmpty()
  guestPhone: string;

  @ApiProperty({
    description: 'Requested check-in date',
    example: '2024-03-01',
  })
  @IsDateString()
  @IsNotEmpty()
  checkInDate: string;

  @ApiProperty({
    description: 'Requested check-out date',
    example: '2024-03-04',
  })
  @IsDateString()
  @IsNotEmpty()
  checkOutDate: string;

  @ApiProperty({ description: 'Total number of guests', example: 4 })
  @IsNumber()
  @Min(1)
  numberOfGuests: number;

  @ApiPropertyOptional({
    description: 'Room type preferences',
    example: 'Mountain view preferred',
  })
  @IsOptional()
  @IsString()
  roomPreferences?: string;

  @ApiPropertyOptional({
    description: 'Additional message from the partner',
    example: 'VIP client, please prioritize',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    description: 'Booking tag set by partner: soft_block / blocked_unpaid / blocked_paid',
  })
  @IsOptional()
  @IsString()
  bookingTag?: string;
}
