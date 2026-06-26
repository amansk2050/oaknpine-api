import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GuestSource {
  WALK_IN = 'walk_in',
  LEAD = 'lead',
  B2B = 'b2b',
  ONLINE = 'online',
}

export enum ConfirmationEmailStatus {
  NOT_SENT = 'not_sent',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('guests')
export class Guest {
  @ApiProperty({
    description: 'Unique identifier for the guest',
    example: '123e4567-e89b-12d3-a456-426614174099',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Full name of the guest', example: 'John Doe' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiPropertyOptional({
    description: 'Guest email address',
    example: 'john.doe@example.com',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @ApiProperty({ description: 'Guest phone number', example: '+91-9876543210' })
  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @ApiPropertyOptional({
    description: 'Guest address',
    example: '123 Main St, Mumbai',
  })
  @Column({ type: 'text', nullable: true })
  address: string;

  @ApiPropertyOptional({ description: 'Type of ID proof', example: 'Passport' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  idProof: string;

  @ApiPropertyOptional({ description: 'ID proof number', example: 'P1234567' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  idNumber: string;

  @ApiProperty({
    description: 'How the guest was added',
    enum: GuestSource,
    example: GuestSource.WALK_IN,
    default: GuestSource.WALK_IN,
  })
  @Column({ type: 'enum', enum: GuestSource, default: GuestSource.WALK_IN })
  source: GuestSource;

  @ApiPropertyOptional({
    description: 'Associated lead ID if converted from a lead',
    example: '123e4567-...',
  })
  @Column({ type: 'uuid', nullable: true })
  leadId: string;

  @ApiPropertyOptional({ description: 'Internal notes about the guest' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({
    description: 'Total number of bookings by this guest',
    default: 0,
  })
  @Column({ type: 'int', default: 0 })
  totalBookings: number;

  @ApiProperty({
    description: 'Total amount spent by this guest',
    default: 0,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @ApiProperty({
    description: 'Confirmation email delivery status',
    enum: ConfirmationEmailStatus,
    default: ConfirmationEmailStatus.NOT_SENT,
  })
  @Column({
    type: 'enum',
    enum: ConfirmationEmailStatus,
    default: ConfirmationEmailStatus.NOT_SENT,
  })
  confirmationEmailStatus: ConfirmationEmailStatus;

  @ApiPropertyOptional({
    description: 'Timestamp when confirmation email was sent',
  })
  @Column({ type: 'timestamp', nullable: true })
  confirmationEmailSentAt: Date;

  @ApiProperty({
    description: 'Timestamp when the guest record was created',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the guest record was last updated',
    example: '2024-01-20T14:45:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
