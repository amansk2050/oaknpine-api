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
import { Homestay } from './homestay.entity';

export enum RoomType {
  VIEW = 'view',
  NON_VIEW = 'non_view',
}

export enum RoomStatus {
  AVAILABLE = 'available',
  BLOCKED = 'blocked',
  MAINTENANCE = 'maintenance',
}

@Entity('rooms')
export class Room {
  @ApiProperty({
    description: 'Unique identifier for the room',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Room number/identifier',
    example: '101',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100 })
  roomNumber: string;

  @ApiProperty({
    description: 'Name/title of the room',
    example: 'Deluxe Mountain View',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  roomName: string;

  @ApiProperty({
    description: 'Type of room based on view',
    enum: RoomType,
    example: RoomType.VIEW,
  })
  @Column({ type: 'enum', enum: RoomType })
  roomType: RoomType;

  @ApiProperty({
    description: 'Maximum number of people the room can accommodate',
    example: 3,
    minimum: 1,
  })
  @Column({ type: 'int' })
  capacity: number; // Max number of people

  @ApiProperty({
    description: 'Price per person per day',
    example: 1500.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerHead: number;

  @ApiProperty({
    description: 'Base price for the room (optional)',
    example: 3000.0,
    type: 'number',
    required: false,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  basePrice: number; // Base price for room (optional)

  @ApiProperty({
    description: 'Detailed description of the room',
    example: 'Spacious room with king-size bed and mountain view balcony',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'List of amenities in the room',
    example: ['AC', 'TV', 'WiFi', 'Geyser'],
    type: [String],
    required: false,
  })
  @Column({ type: 'simple-array', nullable: true })
  amenities: string[];

  @ApiProperty({
    description: 'Array of room image URLs',
    example: ['https://example.com/room1.jpg', 'https://example.com/room2.jpg'],
    type: [String],
    required: false,
  })
  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @ApiProperty({
    description: 'Current status of the room',
    enum: RoomStatus,
    example: RoomStatus.AVAILABLE,
    default: RoomStatus.AVAILABLE,
  })
  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.AVAILABLE })
  status: RoomStatus;

  @ApiProperty({
    description: 'Reason for blocking the room',
    example: 'Under renovation',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  blockReason: string;

  @ApiProperty({
    description: 'Date from which room is blocked',
    example: '2024-01-25',
    type: 'string',
    format: 'date',
    required: false,
  })
  @Column({ type: 'date', nullable: true })
  blockedFrom: Date;

  @ApiProperty({
    description: 'Date until which room is blocked',
    example: '2024-01-30',
    type: 'string',
    format: 'date',
    required: false,
  })
  @Column({ type: 'date', nullable: true })
  blockedUntil: Date;

  @ApiProperty({
    description: 'Floor number where room is located',
    example: 2,
    default: 0,
  })
  @Column({ type: 'int', default: 0 })
  floorNumber: number;

  @ApiProperty({
    description: 'ID of the homestay this room belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid' })
  homestayId: string;

  @ApiProperty({
    description: 'Homestay entity this room belongs to',
    type: () => Homestay,
  })
  @ManyToOne(() => Homestay, (homestay) => homestay.rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'homestayId' })
  homestay: Homestay;

  @ApiProperty({
    description: 'Timestamp when the room was created',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the room was last updated',
    example: '2024-01-20T14:45:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
