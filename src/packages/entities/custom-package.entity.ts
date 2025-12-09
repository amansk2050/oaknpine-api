import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CustomPackageItinerary } from './custom-package-itinerary.entity';

export enum CustomPackageStatus {
  DRAFT = 'draft',
  QUOTE_SENT = 'quote_sent',
  NEGOTIATING = 'negotiating',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('custom_packages')
export class CustomPackage {
  @ApiProperty({
    description: 'Unique identifier for the custom package',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Custom package reference code',
    example: 'CPKG-2024-0001',
    maxLength: 50,
  })
  @Column({ type: 'varchar', length: 50, unique: true })
  referenceCode: string;

  @ApiProperty({
    description: 'Lead ID if created from a lead',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @Column({ type: 'uuid', nullable: true })
  leadId: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  customerName: string;

  @ApiProperty({
    description: 'Customer email',
    example: 'john.doe@example.com',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  customerEmail: string;

  @ApiProperty({
    description: 'Customer phone',
    example: '+91-9876543210',
    maxLength: 20,
  })
  @Column({ type: 'varchar', length: 20 })
  customerPhone: string;

  @ApiProperty({
    description: 'Package title/name',
    example: 'Custom North Bengal Tour',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    description: 'Destinations to cover',
    example: ['Darjeeling', 'Kalimpong', 'Gangtok'],
    type: [String],
  })
  @Column({ type: 'simple-array' })
  destinations: string[];

  @ApiProperty({
    description: 'Number of nights',
    example: 5,
  })
  @Column({ type: 'int' })
  numberOfNights: number;

  @ApiProperty({
    description: 'Number of days',
    example: 6,
  })
  @Column({ type: 'int' })
  numberOfDays: number;

  @ApiProperty({
    description: 'Number of adults',
    example: 4,
  })
  @Column({ type: 'int' })
  numberOfAdults: number;

  @ApiProperty({
    description: 'Number of children',
    example: 2,
  })
  @Column({ type: 'int', default: 0 })
  numberOfChildren: number;

  @ApiProperty({
    description: 'Travel start date',
    example: '2024-03-15',
  })
  @Column({ type: 'date' })
  travelStartDate: Date;

  @ApiProperty({
    description: 'Travel end date',
    example: '2024-03-20',
  })
  @Column({ type: 'date' })
  travelEndDate: Date;

  @ApiProperty({
    description: 'Customer budget',
    example: 50000.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  customerBudget: number;

  @ApiProperty({
    description: 'Quoted price per head',
    example: 8500.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quotedPricePerHead: number;

  @ApiProperty({
    description: 'Total quoted price',
    example: 51000.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalQuotedPrice: number;

  @ApiProperty({
    description: 'Final agreed price',
    example: 48000.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  finalPrice: number;

  @ApiProperty({
    description: 'Cost price for the package',
    example: 40000.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number;

  @ApiProperty({
    description: 'Discount amount given',
    example: 3000.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @ApiProperty({
    description: 'Current status',
    enum: CustomPackageStatus,
    example: CustomPackageStatus.QUOTE_SENT,
  })
  @Column({
    type: 'enum',
    enum: CustomPackageStatus,
    default: CustomPackageStatus.DRAFT,
  })
  status: CustomPackageStatus;

  @ApiProperty({
    description: 'Special requirements from customer',
    example: 'Vegetarian meals, wheelchair accessible rooms',
  })
  @Column({ type: 'text', nullable: true })
  specialRequirements: string;

  @ApiProperty({
    description: 'Accommodation preference',
    example: 'Deluxe rooms with mountain view',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  accommodationPreference: string;

  @ApiProperty({
    description: 'Transport preference',
    example: 'AC SUV',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  transportPreference: string;

  @ApiProperty({
    description: 'Meal preference',
    example: 'Vegetarian only',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  mealPreference: string;

  @ApiProperty({
    description: 'Internal notes',
    example: 'Customer wants luxury experience, flexible on budget',
  })
  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  @ApiProperty({
    description: 'Inclusions list',
    example: ['AC transport', 'All meals', 'Sightseeing'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  inclusions: string[];

  @ApiProperty({
    description: 'Exclusions list',
    example: ['Personal expenses', 'Entry fees', 'Tips'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  exclusions: string[];

  @ApiProperty({
    description: 'Booking ID if converted',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @Column({ type: 'uuid', nullable: true })
  bookingId: string;

  @ApiProperty({
    description: 'Assigned staff member',
    example: 'staff-uuid',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo: string;

  @ApiProperty({
    description: 'Quote validity date',
    example: '2024-02-28',
  })
  @Column({ type: 'date', nullable: true })
  quoteValidUntil: Date;

  // Relations
  @ApiProperty({
    description: 'Custom itineraries',
    type: () => CustomPackageItinerary,
    isArray: true,
  })
  @OneToMany(
    () => CustomPackageItinerary,
    (itinerary) => itinerary.customPackage,
    { cascade: true },
  )
  itineraries: CustomPackageItinerary[];

  @ApiProperty({
    description: 'Timestamp when created',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when last updated',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
