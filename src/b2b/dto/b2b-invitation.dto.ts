import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateB2bInvitationDto {
  @ApiProperty({
    description: 'Email address of the B2B partner to invite',
    example: 'partner@travelsco.com',
  })
  @IsEmail()
  @IsNotEmpty()
  invitedEmail: string;

  @ApiPropertyOptional({
    description: 'Optional internal notes for this partner',
    example: 'They manage corporate clients from Delhi',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class AcceptB2bInvitationDto {
  @ApiPropertyOptional({
    description: 'Business name of the partner (their own business)',
    example: 'Sunshine Travels Pvt Ltd',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  partnerBusinessName?: string;
}

export class UpdateBookingTagDto {
  @ApiProperty({
    description: 'Booking tag to apply',
    enum: ['soft_block', 'blocked_unpaid', 'blocked_paid'],
    example: 'soft_block',
  })
  @IsString()
  @IsNotEmpty()
  bookingTag: 'soft_block' | 'blocked_unpaid' | 'blocked_paid';
}

export class CreatePartnerBookingRequestDto {
  @ApiProperty({
    description: 'Membership ID — which business this request is for',
    example: 'membership-uuid',
  })
  @IsString()
  @IsNotEmpty()
  partnerMembershipId: string;

  @ApiProperty({
    description: 'Homestay UUID the request is for',
    example: 'homestay-uuid',
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
  @MaxLength(255)
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
  @MaxLength(20)
  guestPhone: string;

  @ApiProperty({
    description: 'Requested check-in date',
    example: '2024-03-01',
    type: 'string',
    format: 'date',
  })
  @IsString()
  @IsNotEmpty()
  checkInDate: string;

  @ApiProperty({
    description: 'Requested check-out date',
    example: '2024-03-04',
    type: 'string',
    format: 'date',
  })
  @IsString()
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
    description: 'Booking tag: soft_block / blocked_unpaid / blocked_paid',
    enum: ['soft_block', 'blocked_unpaid', 'blocked_paid'],
  })
  @IsOptional()
  @IsString()
  bookingTag?: 'soft_block' | 'blocked_unpaid' | 'blocked_paid';
}
