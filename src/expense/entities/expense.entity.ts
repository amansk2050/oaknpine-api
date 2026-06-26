import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Booking } from '../../room-booking/entities/booking.entity';
import { PackageBooking } from '../../package-booking/entities/package-booking.entity';

@Entity('booking_expenses')
export class BookingExpense {
  @ApiProperty({
    description: 'Unique identifier for the expense',
    example: '123e4567-e89b-12d3-a456-426614174090',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Expense category (food, vehicle, stay, guide, tickets, other)',
    example: 'vehicle',
  })
  @Column({ type: 'varchar', length: 100 })
  category: string;

  @ApiProperty({
    description: 'Expense title/short name',
    example: 'Darjeeling Cab Fuel & Driver',
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the expense',
    example: 'Cab charge for Darjeeling local sightseeing for 3 days',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Amount spent',
    example: 3500.0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'Date when expense was incurred',
    example: '2024-02-16',
  })
  @Column({ type: 'date', name: 'expense_date' })
  expenseDate: Date;

  @ApiPropertyOptional({
    description: 'Standard booking UUID this expense is associated with',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ApiPropertyOptional({
    description: 'Package booking UUID this expense is associated with',
    example: '123e4567-e89b-12d3-a456-426614174006',
  })
  @Column({ name: 'package_booking_id', type: 'uuid', nullable: true })
  packageBookingId: string;

  @ManyToOne(() => PackageBooking, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'package_booking_id' })
  packageBooking: PackageBooking;

  @ApiProperty({
    description: 'Timestamp when the expense record was created',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the expense record was last updated',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
