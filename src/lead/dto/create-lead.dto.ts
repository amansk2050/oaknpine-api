import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  Min,
  IsUUID,
} from 'class-validator';
import {
  LeadStatus,
  LeadSource,
  LeadPriority,
  LeadType,
} from '../entities/lead.entity';

export class CreateLeadDto {
  @ApiProperty({
    description: 'Full name of the lead',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Primary contact email',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Primary contact phone number',
    example: '+91-9876543210',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({
    description: 'Alternate phone number',
    example: '+91-9876543211',
  })
  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @ApiProperty({
    description: 'Source from where the lead originated',
    enum: LeadSource,
    example: LeadSource.WEBSITE,
  })
  @IsEnum(LeadSource)
  source: LeadSource;

  @ApiPropertyOptional({
    description: 'Specific platform or channel name',
    example: 'Google Ads Campaign - Summer 2024',
  })
  @IsString()
  @IsOptional()
  sourceDetails?: string;

  @ApiPropertyOptional({
    description: 'Priority level of the lead',
    enum: LeadPriority,
    example: LeadPriority.MEDIUM,
    default: LeadPriority.MEDIUM,
  })
  @IsEnum(LeadPriority)
  @IsOptional()
  priority?: LeadPriority;

  @ApiPropertyOptional({
    description: 'Type of lead/booking',
    enum: LeadType,
    example: LeadType.FAMILY,
    default: LeadType.INDIVIDUAL,
  })
  @IsEnum(LeadType)
  @IsOptional()
  leadType?: LeadType;

  @ApiPropertyOptional({
    description: 'City of the lead',
    example: 'Mumbai',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'State of the lead',
    example: 'Maharashtra',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    description: 'Country of the lead',
    example: 'India',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Preferred check-in date',
    example: '2024-02-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  checkInDate?: string;

  @ApiPropertyOptional({
    description: 'Preferred check-out date',
    example: '2024-02-18',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  checkOutDate?: string;

  @ApiPropertyOptional({
    description: 'Number of adults',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  numberOfAdults?: number;

  @ApiPropertyOptional({
    description: 'Number of children',
    example: 1,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  numberOfChildren?: number;

  @ApiPropertyOptional({
    description: 'Number of rooms required',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  numberOfRooms?: number;

  @ApiPropertyOptional({
    description: 'Budget range or amount',
    example: 15000.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({
    description: 'Interested homestay ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  interestedHomestayId?: string;

  @ApiPropertyOptional({
    description: 'Special requirements or notes',
    example: 'Need rooms with mountain view, vegetarian food only',
  })
  @IsString()
  @IsOptional()
  requirements?: string;

  @ApiPropertyOptional({
    description: 'Internal notes about the lead',
    example: 'Very interested, ready to book if price matches',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Assigned sales representative ID',
    example: '123e4567-e89b-12d3-a456-426614174010',
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    description: 'Referral source name if applicable',
    example: 'Mr. Sharma - Previous Guest',
  })
  @IsString()
  @IsOptional()
  referredBy?: string;

  @ApiPropertyOptional({
    description: 'Company name for corporate leads',
    example: 'Tech Corp Pvt Ltd',
  })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorizing leads',
    example: ['hot-lead', 'corporate', 'repeat-customer'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  tags?: string[];
}
