import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MaxLength,
} from 'class-validator';

export class CreateB2bPartnerDto {
  @ApiProperty({
    description: 'Business name of the partner',
    example: 'Sunshine Travels Pvt Ltd',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  businessName: string;

  @ApiProperty({
    description: 'Primary contact person name',
    example: 'Ramesh Kumar',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contactPerson: string;

  @ApiProperty({
    description: 'Partner email address',
    example: 'ramesh@sunshinetravels.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Partner phone number',
    example: '+91-9876543210',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Additional notes about this partner' })
  @IsOptional()
  @IsString()
  notes?: string;
}
