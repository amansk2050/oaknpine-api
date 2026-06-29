import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PackageBookingRoom } from './package-booking-room.entity';
import { Payment } from '../../room-booking/entities/payment.entity';
import { Package } from '../../packages/entities/package.entity';
import { Lead } from '../../lead/entities/lead.entity';

export enum PackageBookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

@Entity('package_bookings')
export class PackageBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'booking_reference',
    type: 'varchar',
    length: 50,
    unique: true,
  })
  bookingReference: string;

  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @ManyToOne(() => Lead, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ name: 'package_id', type: 'uuid' })
  packageId: string;

  @ManyToOne(() => Package, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'package_id' })
  package: Package;

  @Column({ name: 'guest_name', type: 'varchar', length: 255 })
  guestName: string;

  @Column({ name: 'guest_email', type: 'varchar', length: 255 })
  guestEmail: string;

  @Column({ name: 'guest_phone', type: 'varchar', length: 20 })
  guestPhone: string;

  @Column({ name: 'number_of_adults', type: 'int' })
  numberOfAdults: number;

  @Column({ name: 'number_of_children', type: 'int', default: 0 })
  numberOfChildren: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'includes_homestay', type: 'boolean', default: false })
  includesHomestay: boolean;

  @Column({ name: 'homestay_nights', type: 'int', nullable: true })
  homestayNights: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: PackageBookingStatus,
    default: PackageBookingStatus.PENDING,
  })
  status: PackageBookingStatus;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    name: 'paid_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  paidAmount: number;

  @Column({
    name: 'balance_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  balanceAmount: number;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discountAmount: number;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  taxAmount: number;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ name: 'is_payment_complete', type: 'boolean', default: false })
  isPaymentComplete: boolean;

  @Column({ name: 'special_requests', type: 'text', nullable: true })
  specialRequests: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({
    name: 'expected_arrival_time',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  expectedArrivalTime: string;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy: string;

  @Column({ name: 'guest_details', type: 'json', nullable: true })
  guestDetails: Record<string, any>;

  @Column({ name: 'organization_id', type: 'varchar', length: 255, nullable: true })
  organizationId: string;

  @OneToMany(() => PackageBookingRoom, (pbr) => pbr.packageBooking, {
    cascade: true,
  })
  packageBookingRooms: PackageBookingRoom[];

  @OneToMany(() => Payment, (payment) => payment.packageBooking, {
    cascade: true,
  })
  payments: Payment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
