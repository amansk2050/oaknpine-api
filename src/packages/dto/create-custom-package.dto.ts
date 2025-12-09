import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  IsDateString,
  IsEmail,
  IsUUID,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomPackageStatus } from '../entities/custom-package.entity';

// Custom Itinerary DTO
export class CreateCustomPackageItineraryDto {
  @ApiProperty({ description: 'Day number', example: 1 })
  @IsNumber()
  @Min(1)
  dayNumber: number;

  @ApiPropertyOptional({ description: 'Specific date for this day' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: 'Title',
    example: 'Arrival at Bagdogra & Transfer to Darjeeling',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Destination', example: 'Darjeeling' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  destination: string;

  @ApiProperty({ description: 'Activities description' })
  @IsString()
  @IsNotEmpty()
  activities: string;

  @ApiPropertyOptional({
    description: 'Places to visit',
    example: ['Tiger Hill', 'Mall Road'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  placesToVisit?: string[];

  @ApiPropertyOptional({
    description: 'Accommodation name',
    example: 'Hotel XYZ',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  accommodationName?: string;

  @ApiPropertyOptional({
    description: 'Accommodation cost per night',
    example: 3000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accommodationCost?: number;

  @ApiPropertyOptional({
    description: 'Meals included',
    example: ['breakfast', 'dinner'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mealsIncluded?: string[];

  @ApiPropertyOptional({
    description: 'Transport details',
    example: 'SUV transfer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  transportDetails?: string;

  @ApiPropertyOptional({ description: 'Transport cost', example: 2500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  transportCost?: number;

  @ApiPropertyOptional({ description: 'Driving distance in km', example: 95 })
  @IsOptional()
  @IsNumber()
  drivingDistanceKm?: number;

  @ApiPropertyOptional({ description: 'Notes for this day' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Estimated cost for this day',
    example: 5500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedDayCost?: number;
}

// Main Custom Package DTO
export class CreateCustomPackageDto {
  @ApiPropertyOptional({
    description: 'Lead ID if from lead',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiProperty({ description: 'Customer name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customerName: string;

  @ApiProperty({ description: 'Customer email', example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @ApiProperty({ description: 'Customer phone', example: '+91-9876543210' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  customerPhone: string;

  @ApiProperty({
    description: 'Package title',
    example: 'Custom North Bengal Tour',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Destinations',
    example: ['Darjeeling', 'Kalimpong', 'Gangtok'],
  })
  @IsArray()
  @IsString({ each: true })
  destinations: string[];

  @ApiProperty({ description: 'Number of nights', example: 5 })
  @IsNumber()
  @Min(1)
  numberOfNights: number;

  @ApiProperty({ description: 'Number of days', example: 6 })
  @IsNumber()
  @Min(1)
  numberOfDays: number;

  @ApiProperty({ description: 'Number of adults', example: 4 })
  @IsNumber()
  @Min(1)
  numberOfAdults: number;

  @ApiPropertyOptional({
    description: 'Number of children',
    example: 2,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  numberOfChildren?: number;

  @ApiProperty({ description: 'Travel start date', example: '2024-03-15' })
  @IsDateString()
  travelStartDate: string;

  @ApiProperty({ description: 'Travel end date', example: '2024-03-20' })
  @IsDateString()
  travelEndDate: string;

  @ApiPropertyOptional({ description: 'Customer budget', example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  customerBudget?: number;

  @ApiPropertyOptional({ description: 'Special requirements' })
  @IsOptional()
  @IsString()
  specialRequirements?: string;

  @ApiPropertyOptional({
    description: 'Accommodation preference',
    example: 'Deluxe rooms',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  accommodationPreference?: string;

  @ApiPropertyOptional({
    description: 'Transport preference',
    example: 'AC SUV',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  transportPreference?: string;

  @ApiPropertyOptional({
    description: 'Meal preference',
    example: 'Vegetarian only',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  mealPreference?: string;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({
    description: 'Inclusions',
    example: ['AC transport', 'All meals'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  inclusions?: string[];

  @ApiPropertyOptional({
    description: 'Exclusions',
    example: ['Personal expenses', 'Entry fees'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exclusions?: string[];

  @ApiPropertyOptional({ description: 'Assigned staff', example: 'staff-uuid' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  assignedTo?: string;

  @ApiPropertyOptional({
    description: 'Custom itineraries',
    type: [CreateCustomPackageItineraryDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomPackageItineraryDto)
  itineraries?: CreateCustomPackageItineraryDto[];
}
