import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PackageType,
  PackageCategory,
  PackageStatus,
} from '../entities/package.entity';
import { MealType } from '../entities/package-itinerary.entity';
import { RoomType, SeasonType } from '../entities/package-pricing.entity';
import {
  InclusionType,
  InclusionCategory,
} from '../entities/package-inclusion.entity';

// Itinerary DTO
export class CreatePackageItineraryDto {
  @ApiProperty({ description: 'Day number', example: 1 })
  @IsNumber()
  @Min(1)
  dayNumber: number;

  @ApiProperty({
    description: 'Title for the day',
    example: 'Arrival & Kalimpong Sightseeing',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Detailed description',
    example: 'Arrive at NJP/Bagdogra...',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Places to visit',
    example: ['Durpin Monastery', 'Delo Hills'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  placesToVisit?: string[];

  @ApiPropertyOptional({
    description: 'Activities',
    example: ['Sightseeing', 'Photography'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activities?: string[];

  @ApiPropertyOptional({
    description: 'Meals included',
    enum: MealType,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(MealType, { each: true })
  mealsIncluded?: MealType[];

  @ApiPropertyOptional({
    description: 'Accommodation',
    example: 'Hotel in Kalimpong',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  accommodation?: string;

  @ApiPropertyOptional({ description: 'Driving distance in km', example: 85 })
  @IsOptional()
  @IsNumber()
  drivingDistanceKm?: number;

  @ApiPropertyOptional({ description: 'Driving time', example: '3 hours' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  drivingTime?: string;

  @ApiPropertyOptional({ description: 'Altitude', example: '4100 ft' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  altitude?: string;

  @ApiPropertyOptional({ description: 'Morning activities' })
  @IsOptional()
  @IsString()
  morningActivities?: string;

  @ApiPropertyOptional({ description: 'Afternoon activities' })
  @IsOptional()
  @IsString()
  afternoonActivities?: string;

  @ApiPropertyOptional({ description: 'Evening activities' })
  @IsOptional()
  @IsString()
  eveningActivities?: string;

  @ApiPropertyOptional({ description: 'Tips or notes' })
  @IsOptional()
  @IsString()
  tips?: string;

  @ApiPropertyOptional({ description: 'Images URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Has overnight stay', default: true })
  @IsOptional()
  @IsBoolean()
  hasOvernightStay?: boolean;
}

// Pricing DTO
export class CreatePackagePricingDto {
  @ApiProperty({
    description: 'Number of persons (2-8)',
    example: 2,
    minimum: 2,
    maximum: 8,
  })
  @IsNumber()
  @Min(2)
  @Max(8)
  numberOfPersons: number;

  @ApiPropertyOptional({
    description: 'Room type',
    enum: RoomType,
    default: RoomType.STANDARD,
  })
  @IsOptional()
  @IsEnum(RoomType)
  roomType?: RoomType;

  @ApiPropertyOptional({
    description: 'Season type',
    enum: SeasonType,
    default: SeasonType.REGULAR,
  })
  @IsOptional()
  @IsEnum(SeasonType)
  seasonType?: SeasonType;

  @ApiProperty({ description: 'Price per head', example: 4500 })
  @IsNumber()
  @Min(0)
  pricePerHead: number;

  @ApiPropertyOptional({
    description: 'Cost price per head (internal)',
    example: 3500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPricePerHead?: number;

  @ApiPropertyOptional({
    description: 'Minimum price per head (floor price)',
    example: 3800,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPricePerHead?: number;

  @ApiPropertyOptional({ description: 'Max discount percentage', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDiscountPercent?: number;

  @ApiPropertyOptional({
    description: 'Transport cost per head',
    example: 1500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  transportCost?: number;

  @ApiPropertyOptional({
    description: 'Accommodation cost per head',
    example: 2000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accommodationCost?: number;

  @ApiPropertyOptional({ description: 'Meal cost per head', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mealCost?: number;

  @ApiPropertyOptional({
    description: 'Sightseeing cost per head',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sightseeingCost?: number;

  @ApiPropertyOptional({ description: 'Valid from date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Valid until date' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Is default pricing', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Inclusion DTO
export class CreatePackageInclusionDto {
  @ApiProperty({ description: 'Inclusion or exclusion', enum: InclusionType })
  @IsEnum(InclusionType)
  type: InclusionType;

  @ApiProperty({ description: 'Category', enum: InclusionCategory })
  @IsEnum(InclusionCategory)
  category: InclusionCategory;

  @ApiProperty({
    description: 'Description',
    example: 'AC vehicle for all transfers',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ description: 'Icon name', example: 'car' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  iconName?: string;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Is highlight item', default: false })
  @IsOptional()
  @IsBoolean()
  isHighlight?: boolean;
}

// Main Package DTO
export class CreatePackageDto {
  @ApiProperty({
    description: 'Package name',
    example: '2N3D Kalimpong Heritage Tour',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Short title',
    example: 'Kalimpong Heritage',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  shortTitle?: string;

  @ApiProperty({ description: 'Description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Package type',
    enum: PackageType,
    default: PackageType.PREDEFINED,
  })
  @IsOptional()
  @IsEnum(PackageType)
  packageType?: PackageType;

  @ApiPropertyOptional({
    description: 'Category',
    enum: PackageCategory,
    default: PackageCategory.FAMILY,
  })
  @IsOptional()
  @IsEnum(PackageCategory)
  category?: PackageCategory;

  @ApiProperty({ description: 'Number of nights', example: 2 })
  @IsNumber()
  @Min(1)
  numberOfNights: number;

  @ApiProperty({ description: 'Number of days', example: 3 })
  @IsNumber()
  @Min(1)
  numberOfDays: number;

  @ApiProperty({ description: 'Primary destination', example: 'Kalimpong' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  destination: string;

  @ApiPropertyOptional({
    description: 'Starting point',
    example: 'NJP/Bagdogra',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  startingPoint?: string;

  @ApiPropertyOptional({ description: 'Ending point', example: 'NJP/Bagdogra' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  endingPoint?: string;

  @ApiPropertyOptional({
    description: 'Destinations covered',
    example: ['Kalimpong', 'Lava'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  destinationsCovered?: string[];

  @ApiPropertyOptional({
    description: 'Minimum persons',
    example: 2,
    default: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minPersons?: number;

  @ApiPropertyOptional({
    description: 'Maximum persons',
    example: 8,
    default: 8,
  })
  @IsOptional()
  @IsNumber()
  @Max(20)
  maxPersons?: number;

  @ApiProperty({
    description: 'Minimum price per head (floor price)',
    example: 3500,
  })
  @IsNumber()
  @Min(0)
  minPricePerHead: number;

  @ApiProperty({
    description: 'Base price per head for display',
    example: 4500,
  })
  @IsNumber()
  @Min(0)
  basePricePerHead: number;

  @ApiPropertyOptional({
    description: 'Best time to visit',
    example: 'March to June',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bestTimeToVisit?: string;

  @ApiPropertyOptional({ description: 'Difficulty level', example: 'Easy' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  difficultyLevel?: string;

  @ApiPropertyOptional({
    description: 'Suitable for',
    example: ['Families', 'Couples'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suitableFor?: string[];

  @ApiPropertyOptional({
    description: 'Highlights',
    example: ['Monastery visits', 'Tea gardens'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @ApiPropertyOptional({ description: 'Images URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Thumbnail image URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailImage?: string;

  @ApiPropertyOptional({
    description: 'Status',
    enum: PackageStatus,
    default: PackageStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(PackageStatus)
  status?: PackageStatus;

  @ApiPropertyOptional({ description: 'Is featured', default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Valid from date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Valid until date' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional({ description: 'Cancellation policy' })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({ description: 'Important notes' })
  @IsOptional()
  @IsString()
  importantNotes?: string;

  @ApiPropertyOptional({
    description: 'Tags',
    example: ['kalimpong', 'heritage'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Day-wise itineraries',
    type: [CreatePackageItineraryDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageItineraryDto)
  itineraries?: CreatePackageItineraryDto[];

  @ApiPropertyOptional({
    description: 'Pricing tiers (2-8 persons)',
    type: [CreatePackagePricingDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackagePricingDto)
  pricingTiers?: CreatePackagePricingDto[];

  @ApiPropertyOptional({
    description: 'Inclusions and exclusions',
    type: [CreatePackageInclusionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageInclusionDto)
  inclusions?: CreatePackageInclusionDto[];
}
