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
import { B2bPartner } from './b2b-partner.entity';
import { B2bPartnerMembership } from './b2b-partner-membership.entity';

export enum B2bRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum BookingTag {
  SOFT_BLOCK = 'soft_block',       // Yellow — tentative hold
  BLOCKED_UNPAID = 'blocked_unpaid', // Blue — confirmed, payment pending
  BLOCKED_PAID = 'blocked_paid',   // Green — confirmed and paid
}

@Entity('b2b_booking_requests')
export class B2bBookingRequest {
  @ApiProperty({ description: 'Unique identifier', example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyOptional({ description: 'B2B Partner UUID (nullable for new invitations)', example: 'partner-uuid' })
  @Column({ type: 'uuid', nullable: true })
  partnerId: string;

  @ApiProperty({
    description: 'Homestay UUID the request is for',
    example: 'homestay-uuid',
  })
  @Column({ type: 'uuid' })
  homestayId: string;

  @ApiProperty({
    description: 'Guest name on the request',
    example: 'Priya Sharma',
  })
  @Column({ type: 'varchar', length: 255 })
  guestName: string;

  @ApiPropertyOptional({
    description: 'Guest email',
    example: 'priya@example.com',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  guestEmail: string;

  @ApiProperty({ description: 'Guest phone', example: '+91-9876543210' })
  @Column({ type: 'varchar', length: 20 })
  guestPhone: string;

  @ApiProperty({
    description: 'Requested check-in date',
    example: '2024-03-01',
    type: 'string',
    format: 'date',
  })
  @Column({ type: 'date' })
  checkInDate: Date;

  @ApiProperty({
    description: 'Requested check-out date',
    example: '2024-03-04',
    type: 'string',
    format: 'date',
  })
  @Column({ type: 'date' })
  checkOutDate: Date;

  @ApiProperty({ description: 'Total number of guests', example: 4 })
  @Column({ type: 'int' })
  numberOfGuests: number;

  @ApiPropertyOptional({
    description: 'Room type preferences',
    example: 'Mountain view preferred',
  })
  @Column({ type: 'text', nullable: true })
  roomPreferences: string;

  @ApiPropertyOptional({
    description: 'Additional message from the partner',
    example: 'VIP client, please prioritize',
  })
  @Column({ type: 'text', nullable: true })
  message: string;

  @ApiProperty({
    description: 'Current status of the request',
    enum: B2bRequestStatus,
    default: B2bRequestStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: B2bRequestStatus,
    default: B2bRequestStatus.PENDING,
  })
  status: B2bRequestStatus;

  @ApiPropertyOptional({ description: 'Reason for rejection if rejected' })
  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @ApiPropertyOptional({
    description: 'Booking ID created when request is accepted',
  })
  @Column({ type: 'uuid', nullable: true })
  bookingId: string;

  @ApiPropertyOptional({
    description: 'Booking tag set by the business: soft_block / blocked_unpaid / blocked_paid',
    enum: BookingTag,
  })
  @Column({ type: 'enum', enum: BookingTag, nullable: true })
  bookingTag: BookingTag;

  @ApiPropertyOptional({
    description: 'Partner account ID (for invitation-based partners)',
    example: 'partner-account-uuid',
  })
  @Column({ type: 'uuid', nullable: true })
  partnerAccountId: string;

  @ApiPropertyOptional({
    description: 'Partner membership ID linking partner to the specific business',
    example: 'membership-uuid',
  })
  @Column({ type: 'uuid', nullable: true })
  partnerMembershipId: string;

  @ApiPropertyOptional({
    description: 'B2B Partner Membership details',
    type: () => B2bPartnerMembership,
  })
  @ManyToOne(() => B2bPartnerMembership, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'partnerMembershipId' })
  partnerMembership: B2bPartnerMembership;

  @ApiProperty({
    description: 'Partner who submitted this request',
    type: () => B2bPartner,
  })
  @ManyToOne(() => B2bPartner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partnerId' })
  partner: B2bPartner;

  @ApiProperty({
    description: 'Timestamp when request was created',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
