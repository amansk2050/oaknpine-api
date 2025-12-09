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
import { CustomPackage } from './custom-package.entity';

@Entity('custom_package_itineraries')
export class CustomPackageItinerary {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174006',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Custom package ID',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  @Column({ type: 'uuid' })
  customPackageId: string;

  @ApiProperty({
    description: 'Day number',
    example: 1,
  })
  @Column({ type: 'int' })
  dayNumber: number;

  @ApiProperty({
    description: 'Date for this day',
    example: '2024-03-15',
  })
  @Column({ type: 'date', nullable: true })
  date: Date;

  @ApiProperty({
    description: 'Title for the day',
    example: 'Arrival at Bagdogra & Transfer to Darjeeling',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    description: 'Destination for this day',
    example: 'Darjeeling',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100 })
  destination: string;

  @ApiProperty({
    description: 'Detailed activities',
  })
  @Column({ type: 'text' })
  activities: string;

  @ApiProperty({
    description: 'Places to visit',
    example: ['Tiger Hill', 'Batasia Loop', 'Mall Road'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  placesToVisit: string[];

  @ApiProperty({
    description: 'Accommodation name',
    example: 'Hotel XYZ, Darjeeling',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  accommodationName: string;

  @ApiProperty({
    description: 'Accommodation cost per night',
    example: 3000.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  accommodationCost: number;

  @ApiProperty({
    description: 'Meals included',
    example: ['breakfast', 'dinner'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  mealsIncluded: string[];

  @ApiProperty({
    description: 'Transport details',
    example: 'SUV transfer from Bagdogra to Darjeeling',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  transportDetails: string;

  @ApiProperty({
    description: 'Transport cost for this day',
    example: 2500.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  transportCost: number;

  @ApiProperty({
    description: 'Driving distance in km',
    example: 95,
  })
  @Column({ type: 'int', nullable: true })
  drivingDistanceKm: number;

  @ApiProperty({
    description: 'Notes for this day',
    example: 'Early morning departure recommended',
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({
    description: 'Estimated cost for this day',
    example: 5500.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedDayCost: number;

  @ApiProperty({
    description: 'Display order',
    example: 1,
  })
  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  // Relations
  @ApiProperty({
    description: 'Custom package this belongs to',
    type: () => CustomPackage,
  })
  @ManyToOne(() => CustomPackage, (pkg) => pkg.itineraries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customPackageId' })
  customPackage: CustomPackage;

  @ApiProperty({
    description: 'Timestamp when created',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when updated',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
