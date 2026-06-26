import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { GuestSource } from '../entities/guest.entity';

export class CreateGuestDto {
  @ApiProperty({ description: 'Full name of the guest', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Guest email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Guest phone number', example: '+91-9876543210' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({
    description: 'Guest address',
    example: '123 Main St, Mumbai',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Type of ID proof',
    example: 'Passport',
    enum: ['Passport', 'Aadhaar', 'Driving Licence', 'Voter ID'],
  })
  @IsOptional()
  @IsString()
  idProof?: string;

  @ApiPropertyOptional({ description: 'ID proof number', example: 'P1234567' })
  @IsOptional()
  @IsString()
  idNumber?: string;

  @ApiPropertyOptional({
    description: 'How the guest was added',
    enum: GuestSource,
    default: GuestSource.WALK_IN,
  })
  @IsOptional()
  @IsEnum(GuestSource)
  source?: GuestSource;

  @ApiPropertyOptional({
    description: 'Lead ID if this guest was converted from a lead',
  })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Internal notes about the guest' })
  @IsOptional()
  @IsString()
  notes?: string;
}
