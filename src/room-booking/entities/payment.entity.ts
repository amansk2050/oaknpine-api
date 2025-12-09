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

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  UPI = 'upi',
  BANK_TRANSFER = 'bank_transfer',
  ONLINE = 'online',
  CHEQUE = 'cheque',
  OTHER = 'other',
}

export enum PaymentType {
  ADVANCE = 'advance',
  PARTIAL = 'partial',
  FULL = 'full',
  REFUND = 'refund',
  CANCELLATION_CHARGE = 'cancellation_charge',
}

@Entity('payments')
export class Payment {
  @ApiProperty({
    description: 'Unique identifier for the payment',
    example: '123e4567-e89b-12d3-a456-426614174007',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Booking ID this payment belongs to',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @Column({ type: 'uuid' })
  bookingId: string;

  @ApiProperty({
    description: 'Payment reference/transaction number',
    example: 'PAY-2024-0001',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100, unique: true })
  paymentReference: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 5000.0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentMethod,
    example: PaymentMethod.UPI,
  })
  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Type of payment',
    enum: PaymentType,
    example: PaymentType.ADVANCE,
  })
  @Column({ type: 'enum', enum: PaymentType })
  paymentType: PaymentType;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.COMPLETED,
    default: PaymentStatus.PENDING,
  })
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Transaction ID from payment gateway',
    example: 'TXN123456789',
    maxLength: 255,
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionId: string;

  @ApiProperty({
    description: 'Payment gateway name',
    example: 'Razorpay',
    maxLength: 100,
    required: false,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentGateway: string;

  @ApiProperty({
    description: 'Payment date and time',
    example: '2024-01-15T14:30:00Z',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  paymentDate: Date;

  @ApiProperty({
    description: 'Notes about the payment',
    example: 'Advance payment received via UPI',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({
    description: 'User/Staff who recorded the payment',
    example: '123e4567-e89b-12d3-a456-426614174010',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  recordedBy: string;

  @ApiProperty({
    description: 'Payment receipt URL',
    example: 'https://example.com/receipts/PAY-2024-0001.pdf',
    required: false,
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  receiptUrl: string;

  @ApiProperty({
    description: 'Additional payment details as JSON',
    example: { bankName: 'HDFC Bank', accountNumber: '****1234' },
    required: false,
  })
  @Column({ type: 'json', nullable: true })
  paymentDetails: Record<string, any>;

  @ApiProperty({
    description: 'Booking entity this payment belongs to',
    type: () => Booking,
  })
  @ManyToOne(() => Booking, (booking) => booking.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @ApiProperty({
    description: 'Timestamp when the payment was recorded',
    example: '2024-01-15T14:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
