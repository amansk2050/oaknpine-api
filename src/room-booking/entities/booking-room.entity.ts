import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Booking } from './booking.entity';
import { Room } from '../../homestay/entities/room.entity';

export enum RoomBookingStatus {
  RESERVED = 'reserved',
  OCCUPIED = 'occupied',
  CHECKED_OUT = 'checked_out',
  CANCELLED = 'cancelled',
}

@Entity('booking_rooms')
export class BookingRoom {
  @ApiProperty({
    description: 'Unique identifier for the booking room entry',
    example: '123e4567-e89b-12d3-a456-426614174006',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Booking ID this room belongs to',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @Column({ type: 'uuid' })
  bookingId: string;

  @ApiProperty({
    description: 'Room ID that is booked',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Column({ type: 'uuid' })
  roomId: string;

  @ApiProperty({
    description: 'Number of guests in this room',
    example: 2,
  })
  @Column({ type: 'int' })
  numberOfGuests: number;

  @ApiProperty({
    description: 'Room rate per night',
    example: 3000.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  ratePerNight: number;

  @ApiProperty({
    description: 'Total amount for this room',
    example: 9000.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @ApiProperty({
    description: 'Status of this room booking',
    enum: RoomBookingStatus,
    example: RoomBookingStatus.RESERVED,
    default: RoomBookingStatus.RESERVED,
  })
  @Column({
    type: 'enum',
    enum: RoomBookingStatus,
    default: RoomBookingStatus.RESERVED,
  })
  status: RoomBookingStatus;

  @ApiProperty({
    description: 'Is capacity fully utilized',
    example: false,
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  isFullyOccupied: boolean;

  @ApiProperty({
    description: 'Special notes for this room',
    example: 'Extra bed required',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({
    description: 'Booking entity this room belongs to',
    type: () => Booking,
  })
  @ManyToOne(() => Booking, (booking) => booking.rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @ApiProperty({
    description: 'Room entity that is booked',
    type: () => Room,
  })
  @ManyToOne(() => Room, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ApiProperty({
    description: 'Timestamp when the booking room was created',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
