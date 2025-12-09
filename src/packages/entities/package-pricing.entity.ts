import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Package } from './package.entity';

export enum RoomType {
  STANDARD = 'standard',
  DELUXE = 'deluxe',
  PREMIUM = 'premium',
  LUXURY = 'luxury',
}

export enum SeasonType {
  REGULAR = 'regular',
  PEAK = 'peak',
  OFF_SEASON = 'off_season',
  FESTIVE = 'festive',
}

@Entity('package_pricing')
export class PackagePricing {
  @ApiProperty({
    description: 'Unique identifier for the pricing',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Package ID this pricing belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid' })
  packageId: string;

  @ApiProperty({
    description: 'Number of persons for this pricing tier',
    example: 2,
  })
  @Column({ type: 'int' })
  numberOfPersons: number;

  @ApiProperty({
    description: 'Room type for this pricing',
    enum: RoomType,
    example: RoomType.STANDARD,
  })
  @Column({ type: 'enum', enum: RoomType, default: RoomType.STANDARD })
  roomType: RoomType;

  @ApiProperty({
    description: 'Season type for this pricing',
    enum: SeasonType,
    example: SeasonType.REGULAR,
  })
  @Column({ type: 'enum', enum: SeasonType, default: SeasonType.REGULAR })
  seasonType: SeasonType;

  @ApiProperty({
    description: 'Price per head for this tier',
    example: 4500.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerHead: number;

  @ApiProperty({
    description: 'Total package price (pricePerHead * numberOfPersons)',
    example: 9000.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @ApiProperty({
    description: 'Cost price per head (for internal margin calculation)',
    example: 3500.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPricePerHead: number;

  @ApiProperty({
    description: 'Minimum price per head (cannot sell below this)',
    example: 3800.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minPricePerHead: number;

  @ApiProperty({
    description: 'Maximum discount allowed in percentage',
    example: 10,
  })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  maxDiscountPercent: number;

  @ApiProperty({
    description: 'Transport cost included per head',
    example: 1500.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  transportCost: number;

  @ApiProperty({
    description: 'Accommodation cost included per head',
    example: 2000.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  accommodationCost: number;

  @ApiProperty({
    description: 'Meal cost included per head',
    example: 500.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  mealCost: number;

  @ApiProperty({
    description: 'Sightseeing/activity cost included per head',
    example: 500.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sightseeingCost: number;

  @ApiProperty({
    description: 'Valid from date for this pricing',
    example: '2024-01-01',
  })
  @Column({ type: 'date', nullable: true })
  validFrom: Date;

  @ApiProperty({
    description: 'Valid until date for this pricing',
    example: '2024-12-31',
  })
  @Column({ type: 'date', nullable: true })
  validUntil: Date;

  @ApiProperty({
    description: 'Is this the default pricing for display',
    example: true,
  })
  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @ApiProperty({
    description: 'Is this pricing currently active',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Additional notes about this pricing',
    example: 'Includes all taxes and service charges',
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relations
  @ApiProperty({
    description: 'Package this pricing belongs to',
    type: () => Package,
  })
  @ManyToOne(() => Package, (pkg) => pkg.pricingTiers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'packageId' })
  package: Package;

  @ApiProperty({
    description: 'Timestamp when the pricing was created',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the pricing was last updated',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
