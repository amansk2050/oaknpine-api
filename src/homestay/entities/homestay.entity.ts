import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Room } from './room.entity';

@Entity('homestays')
export class Homestay {
  @ApiProperty({
    description: 'Unique identifier for the homestay',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Name of the homestay',
    example: 'Mountain View Homestay',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    description: 'Detailed description of the homestay',
    example:
      'A cozy homestay with beautiful mountain views and modern amenities',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    description: 'Full address of the homestay',
    example: '123 Hill Station Road, Near Central Park',
    maxLength: 500,
  })
  @Column({ type: 'varchar', length: 500 })
  address: string;

  @ApiProperty({
    description: 'City where the homestay is located',
    example: 'Shimla',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100 })
  city: string;

  @ApiProperty({
    description: 'State where the homestay is located',
    example: 'Himachal Pradesh',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100 })
  state: string;

  @ApiProperty({
    description: 'Postal code',
    example: '171001',
    maxLength: 20,
  })
  @Column({ type: 'varchar', length: 20 })
  pincode: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 31.1048,
    required: false,
  })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 77.1734,
    required: false,
  })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+91-9876543210',
    maxLength: 20,
  })
  @Column({ type: 'varchar', length: 20 })
  contactNumber: string;

  @ApiProperty({
    description: 'Contact email address',
    example: 'contact@mountainview.com',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @ApiProperty({
    description: 'Total number of rooms in the homestay',
    example: 10,
    default: 0,
  })
  @Column({ type: 'int', default: 0 })
  totalRooms: number;

  @ApiProperty({
    description: 'Array of image URLs',
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    type: [String],
    required: false,
  })
  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @ApiProperty({
    description: 'List of amenities available',
    example: ['WiFi', 'Parking', 'Restaurant', 'Room Service'],
    type: [String],
    required: false,
  })
  @Column({ type: 'simple-array', nullable: true })
  amenities: string[];

  @ApiProperty({
    description: 'Current status of the homestay',
    example: 'active',
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active',
  })
  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @ApiProperty({
    description: 'Owner/User ID who owns this homestay',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  ownerId: string;

  @ApiProperty({
    description: 'List of rooms in this homestay',
    type: () => Room,
    isArray: true,
  })
  @OneToMany(() => Room, (room) => room.homestay, { cascade: true })
  rooms: Room[];

  @ApiProperty({
    description: 'Timestamp when the homestay was created',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the homestay was last updated',
    example: '2024-01-20T14:45:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
