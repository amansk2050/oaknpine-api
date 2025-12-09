import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Lead } from '../../lead/entities/lead.entity';
import { Homestay } from '../../homestay/entities/homestay.entity';
import { BookingRoom } from './booking-room.entity';
import { Payment } from './payment.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('bookings')
export class Booking {
  @ApiProperty({
    description: 'Unique identifier for the booking',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Unique booking reference number',
    example: 'BKG-2024-0001',
    maxLength: 50,
  })
  @Column({ type: 'varchar', length: 50, unique: true })
  bookingReference: string;

  @ApiProperty({
    description: 'Lead ID from which this booking was created',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @Column({ type: 'uuid' })
  leadId: string;

  @ApiProperty({
    description: 'Homestay ID where booking is made',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid' })
  homestayId: string;

  @ApiProperty({
    description: 'Primary guest name',
    example: 'John Doe',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  guestName: string;

  @ApiProperty({
    description: 'Primary guest email',
    example: 'john.doe@example.com',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  guestEmail: string;

  @ApiProperty({
    description: 'Primary guest phone',
    example: '+91-9876543210',
    maxLength: 20,
  })
  @Column({ type: 'varchar', length: 20 })
  guestPhone: string;

  @ApiProperty({
    description: 'Number of adults',
    example: 2,
  })
  @Column({ type: 'int' })
  numberOfAdults: number;

  @ApiProperty({
    description: 'Number of children',
    example: 1,
    default: 0,
  })
  @Column({ type: 'int', default: 0 })
  numberOfChildren: number;

  @ApiProperty({
    description: 'Check-in date',
    example: '2024-02-15',
    type: 'string',
    format: 'date',
  })
  @Column({ type: 'date' })
  checkInDate: Date;

  @ApiProperty({
    description: 'Check-out date',
    example: '2024-02-18',
    type: 'string',
    format: 'date',
  })
  @Column({ type: 'date' })
  checkOutDate: Date;

  @ApiProperty({
    description: 'Number of nights',
    example: 3,
  })
  @Column({ type: 'int' })
  numberOfNights: number;

  @ApiProperty({
    description: 'Total number of rooms booked',
    example: 2,
  })
  @Column({ type: 'int' })
  totalRooms: number;

  @ApiProperty({
    description: 'Current status of the booking',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @ApiProperty({
    description: 'Total amount for the booking',
    example: 15000.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @ApiProperty({
    description: 'Total amount paid',
    example: 5000.0,
    type: 'number',
    default: 0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @ApiProperty({
    description: 'Remaining balance amount',
    example: 10000.0,
    type: 'number',
    default: 0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balanceAmount: number;

  @ApiProperty({
    description: 'Discount amount applied',
    example: 500.0,
    type: 'number',
    default: 0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @ApiProperty({
    description: 'Tax amount',
    example: 1500.0,
    type: 'number',
    default: 0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @ApiProperty({
    description: 'Special requests from guest',
    example: 'Early check-in required, vegetarian meals',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  specialRequests: string;

  @ApiProperty({
    description: 'Internal notes about the booking',
    example: 'VIP guest, arrange welcome drink',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({
    description: 'Cancellation reason if booking is cancelled',
    example: 'Guest changed travel plans',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @ApiProperty({
    description: 'Date when booking was cancelled',
    example: '2024-02-10T15:30:00Z',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @ApiProperty({
    description: 'Actual check-in timestamp',
    example: '2024-02-15T14:00:00Z',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  actualCheckInTime: Date;

  @ApiProperty({
    description: 'Actual check-out timestamp',
    example: '2024-02-18T11:00:00Z',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  actualCheckOutTime: Date;

  @ApiProperty({
    description: 'Expected arrival time',
    example: '14:00',
    maxLength: 10,
    required: false,
  })
  @Column({ type: 'varchar', length: 10, nullable: true })
  expectedArrivalTime: string;

  @ApiProperty({
    description: 'Is payment completed',
    example: false,
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  isPaymentComplete: boolean;

  @ApiProperty({
    description: 'User/Staff who created the booking',
    example: '123e4567-e89b-12d3-a456-426614174010',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string;

  @ApiProperty({
    description: 'Additional guest details as JSON',
    example: {
      address: '123 Main St, Mumbai',
      idProof: 'Passport',
      idNumber: 'P1234567',
    },
    required: false,
  })
  @Column({ type: 'json', nullable: true })
  guestDetails: Record<string, any>;

  @ApiProperty({
    description: 'Lead entity associated with this booking',
    type: () => Lead,
  })
  @ManyToOne(() => Lead, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @ApiProperty({
    description: 'Homestay entity where booking is made',
    type: () => Homestay,
  })
  @ManyToOne(() => Homestay, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'homestayId' })
  homestay: Homestay;

  @ApiProperty({
    description: 'Rooms included in this booking',
    type: () => BookingRoom,
    isArray: true,
  })
  @OneToMany(() => BookingRoom, (bookingRoom) => bookingRoom.booking, {
    cascade: true,
  })
  rooms: BookingRoom[];

  @ApiProperty({
    description: 'Payment records for this booking',
    type: () => Payment,
    isArray: true,
  })
  @OneToMany(() => Payment, (payment) => payment.booking, { cascade: true })
  payments: Payment[];

  @ApiProperty({
    description: 'Timestamp when the booking was created',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the booking was last updated',
    example: '2024-01-20T14:45:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
