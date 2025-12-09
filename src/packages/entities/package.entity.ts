import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PackageItinerary } from './package-itinerary.entity';
import { PackagePricing } from './package-pricing.entity';
import { PackageInclusion } from './package-inclusion.entity';

export enum PackageType {
  PREDEFINED = 'predefined',
  CUSTOM = 'custom',
}

export enum PackageStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

export enum PackageCategory {
  ADVENTURE = 'adventure',
  HONEYMOON = 'honeymoon',
  FAMILY = 'family',
  BUDGET = 'budget',
  LUXURY = 'luxury',
  WEEKEND_GETAWAY = 'weekend_getaway',
  PILGRIMAGE = 'pilgrimage',
  WILDLIFE = 'wildlife',
  CULTURAL = 'cultural',
}

@Entity('packages')
export class Package {
  @ApiProperty({
    description: 'Unique identifier for the package',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Package code for reference',
    example: 'PKG-KLM-2N3D-001',
    maxLength: 50,
  })
  @Column({ type: 'varchar', length: 50, unique: true })
  packageCode: string;

  @ApiProperty({
    description: 'Name of the package',
    example: '2N3D Kalimpong Heritage Tour',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    description: 'Short title for display',
    example: 'Kalimpong Heritage',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  shortTitle: string;

  @ApiProperty({
    description: 'Detailed description of the package',
    example:
      'Experience the serene beauty of Kalimpong with this 2 nights and 3 days package...',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    description: 'Type of package - predefined or custom',
    enum: PackageType,
    example: PackageType.PREDEFINED,
  })
  @Column({ type: 'enum', enum: PackageType, default: PackageType.PREDEFINED })
  packageType: PackageType;

  @ApiProperty({
    description: 'Category of the package',
    enum: PackageCategory,
    example: PackageCategory.FAMILY,
  })
  @Column({
    type: 'enum',
    enum: PackageCategory,
    default: PackageCategory.FAMILY,
  })
  category: PackageCategory;

  @ApiProperty({
    description: 'Number of nights',
    example: 2,
  })
  @Column({ type: 'int' })
  numberOfNights: number;

  @ApiProperty({
    description: 'Number of days',
    example: 3,
  })
  @Column({ type: 'int' })
  numberOfDays: number;

  @ApiProperty({
    description: 'Primary destination/location',
    example: 'Kalimpong',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100 })
  destination: string;

  @ApiProperty({
    description: 'Starting point of the tour',
    example: 'NJP/Bagdogra',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  startingPoint: string;

  @ApiProperty({
    description: 'Ending point of the tour',
    example: 'NJP/Bagdogra',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  endingPoint: string;

  @ApiProperty({
    description: 'Destinations covered in the package',
    example: ['Kalimpong', 'Lava', 'Lolegaon'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  destinationsCovered: string[];

  @ApiProperty({
    description: 'Minimum number of persons required',
    example: 2,
  })
  @Column({ type: 'int', default: 2 })
  minPersons: number;

  @ApiProperty({
    description: 'Maximum number of persons allowed',
    example: 8,
  })
  @Column({ type: 'int', default: 8 })
  maxPersons: number;

  @ApiProperty({
    description: 'Minimum price per head (floor price - cannot go below this)',
    example: 3500.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  minPricePerHead: number;

  @ApiProperty({
    description: 'Base/starting price per head for display',
    example: 4500.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePricePerHead: number;

  @ApiProperty({
    description: 'Best time to visit',
    example: 'March to June, September to November',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  bestTimeToVisit: string;

  @ApiProperty({
    description: 'Difficulty level',
    example: 'Easy',
    maxLength: 50,
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  difficultyLevel: string;

  @ApiProperty({
    description: 'Suitable for',
    example: ['Families', 'Couples', 'Senior Citizens'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  suitableFor: string[];

  @ApiProperty({
    description: 'Highlights of the package',
    example: [
      'Scenic monastery visits',
      'Local cuisine experience',
      'Tea garden tour',
    ],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  highlights: string[];

  @ApiProperty({
    description: 'Package images URLs',
    example: ['https://example.com/pkg1.jpg'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @ApiProperty({
    description: 'Thumbnail image URL',
    example: 'https://example.com/pkg1-thumb.jpg',
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailImage: string;

  @ApiProperty({
    description: 'Current status of the package',
    enum: PackageStatus,
    example: PackageStatus.ACTIVE,
  })
  @Column({ type: 'enum', enum: PackageStatus, default: PackageStatus.DRAFT })
  status: PackageStatus;

  @ApiProperty({
    description: 'Is this a featured package',
    example: true,
  })
  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @ApiProperty({
    description: 'Display order for sorting',
    example: 1,
  })
  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @ApiProperty({
    description: 'Validity start date for the package',
    example: '2024-01-01',
  })
  @Column({ type: 'date', nullable: true })
  validFrom: Date;

  @ApiProperty({
    description: 'Validity end date for the package',
    example: '2024-12-31',
  })
  @Column({ type: 'date', nullable: true })
  validUntil: Date;

  @ApiProperty({
    description: 'Terms and conditions',
    example: 'Package is non-refundable...',
  })
  @Column({ type: 'text', nullable: true })
  termsAndConditions: string;

  @ApiProperty({
    description: 'Cancellation policy',
    example: '50% refund if cancelled 7 days before...',
  })
  @Column({ type: 'text', nullable: true })
  cancellationPolicy: string;

  @ApiProperty({
    description: 'Important notes for the package',
    example: 'ID proof mandatory for all travelers',
  })
  @Column({ type: 'text', nullable: true })
  importantNotes: string;

  @ApiProperty({
    description: 'Tags for search and categorization',
    example: ['kalimpong', 'heritage', 'monastery'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ApiProperty({
    description: 'SEO meta title',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  metaTitle: string;

  @ApiProperty({
    description: 'SEO meta description',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  metaDescription: string;

  @ApiProperty({
    description: 'Custom fields as JSON',
    example: { transportType: 'SUV', mealsIncluded: true },
  })
  @Column({ type: 'json', nullable: true })
  customFields: Record<string, any>;

  // Relations
  @ApiProperty({
    description: 'Day-wise itinerary',
    type: () => PackageItinerary,
    isArray: true,
  })
  @OneToMany(() => PackageItinerary, (itinerary) => itinerary.package, {
    cascade: true,
  })
  itineraries: PackageItinerary[];

  @ApiProperty({
    description: 'Pricing tiers based on group size',
    type: () => PackagePricing,
    isArray: true,
  })
  @OneToMany(() => PackagePricing, (pricing) => pricing.package, {
    cascade: true,
  })
  pricingTiers: PackagePricing[];

  @ApiProperty({
    description: 'Inclusions and exclusions',
    type: () => PackageInclusion,
    isArray: true,
  })
  @OneToMany(() => PackageInclusion, (inclusion) => inclusion.package, {
    cascade: true,
  })
  inclusions: PackageInclusion[];

  @ApiProperty({
    description: 'Timestamp when the package was created',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the package was last updated',
    example: '2024-01-20T14:45:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
