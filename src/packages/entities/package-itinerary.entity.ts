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

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
}

@Entity('package_itineraries')
export class PackageItinerary {
  @ApiProperty({
    description: 'Unique identifier for the itinerary',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Package ID this itinerary belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid' })
  packageId: string;

  @ApiProperty({
    description: 'Day number (1, 2, 3, etc.)',
    example: 1,
  })
  @Column({ type: 'int' })
  dayNumber: number;

  @ApiProperty({
    description: 'Title for the day',
    example: 'Arrival & Kalimpong Sightseeing',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    description: 'Detailed description of the day activities',
    example:
      'Arrive at NJP/Bagdogra. Meet and greet by our representative. Drive to Kalimpong...',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    description: 'Places to visit on this day',
    example: ['Durpin Monastery', 'Delo Hills', 'Flower Nurseries'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  placesToVisit: string[];

  @ApiProperty({
    description: 'Activities planned for this day',
    example: ['Sightseeing', 'Photography', 'Local market visit'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  activities: string[];

  @ApiProperty({
    description: 'Meals included this day',
    example: ['breakfast', 'dinner'],
    type: [String],
    enum: MealType,
  })
  @Column({ type: 'simple-array', nullable: true })
  mealsIncluded: MealType[];

  @ApiProperty({
    description: 'Accommodation/stay location for the night',
    example: 'Hotel in Kalimpong',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  accommodation: string;

  @ApiProperty({
    description: 'Approximate driving distance in km',
    example: 85,
  })
  @Column({ type: 'int', nullable: true })
  drivingDistanceKm: number;

  @ApiProperty({
    description: 'Approximate driving time',
    example: '3 hours',
    maxLength: 50,
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  drivingTime: string;

  @ApiProperty({
    description: 'Altitude of the destination',
    example: '4100 ft',
    maxLength: 50,
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  altitude: string;

  @ApiProperty({
    description: 'Morning activities (before noon)',
    example: 'Breakfast at hotel. Visit Durpin Monastery and Delo Hills.',
  })
  @Column({ type: 'text', nullable: true })
  morningActivities: string;

  @ApiProperty({
    description: 'Afternoon activities',
    example:
      'Lunch at local restaurant. Visit flower nurseries and local markets.',
  })
  @Column({ type: 'text', nullable: true })
  afternoonActivities: string;

  @ApiProperty({
    description: 'Evening activities',
    example: 'Return to hotel. Evening free for leisure. Dinner at hotel.',
  })
  @Column({ type: 'text', nullable: true })
  eveningActivities: string;

  @ApiProperty({
    description: 'Special tips or notes for this day',
    example: 'Carry warm clothes as evenings can be cold',
  })
  @Column({ type: 'text', nullable: true })
  tips: string;

  @ApiProperty({
    description: 'Images for this day',
    example: ['https://example.com/day1-1.jpg'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @ApiProperty({
    description: 'Is overnight stay included',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  hasOvernightStay: boolean;

  @ApiProperty({
    description: 'Display order within the package',
    example: 1,
  })
  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  // Relations
  @ApiProperty({
    description: 'Package this itinerary belongs to',
    type: () => Package,
  })
  @ManyToOne(() => Package, (pkg) => pkg.itineraries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'packageId' })
  package: Package;

  @ApiProperty({
    description: 'Timestamp when the itinerary was created',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the itinerary was last updated',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
