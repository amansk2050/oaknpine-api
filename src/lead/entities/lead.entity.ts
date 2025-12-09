import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { LeadFollowUp } from './lead-follow-up.entity';

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL_SENT = 'proposal_sent',
  NEGOTIATION = 'negotiation',
  CONVERTED = 'converted',
  LOST = 'lost',
  INACTIVE = 'inactive',
}

export enum LeadSource {
  WEBSITE = 'website',
  PHONE_CALL = 'phone_call',
  EMAIL = 'email',
  SOCIAL_MEDIA = 'social_media',
  REFERRAL = 'referral',
  WALK_IN = 'walk_in',
  ONLINE_AD = 'online_ad',
  BOOKING_PLATFORM = 'booking_platform',
  AGENT = 'agent',
  OTHER = 'other',
}

export enum LeadPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum LeadType {
  INDIVIDUAL = 'individual',
  CORPORATE = 'corporate',
  GROUP = 'group',
  FAMILY = 'family',
  WEDDING = 'wedding',
  EVENT = 'event',
}

@Entity('leads')
export class Lead {
  @ApiProperty({
    description: 'Unique identifier for the lead',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Full name of the lead',
    example: 'John Doe',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    description: 'Primary contact email',
    example: 'john.doe@example.com',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @ApiProperty({
    description: 'Primary contact phone number',
    example: '+91-9876543210',
    maxLength: 20,
  })
  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @ApiProperty({
    description: 'Alternate phone number',
    example: '+91-9876543211',
    maxLength: 20,
    required: false,
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  alternatePhone: string;

  @ApiProperty({
    description: 'Current status of the lead',
    enum: LeadStatus,
    example: LeadStatus.NEW,
  })
  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status: LeadStatus;

  @ApiProperty({
    description: 'Source from where the lead originated',
    enum: LeadSource,
    example: LeadSource.WEBSITE,
  })
  @Column({ type: 'enum', enum: LeadSource })
  source: LeadSource;

  @ApiProperty({
    description: 'Specific platform or channel name',
    example: 'Google Ads Campaign - Summer 2024',
    maxLength: 255,
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceDetails: string;

  @ApiProperty({
    description: 'Priority level of the lead',
    enum: LeadPriority,
    example: LeadPriority.MEDIUM,
    default: LeadPriority.MEDIUM,
  })
  @Column({ type: 'enum', enum: LeadPriority, default: LeadPriority.MEDIUM })
  priority: LeadPriority;

  @ApiProperty({
    description: 'Type of lead/booking',
    enum: LeadType,
    example: LeadType.FAMILY,
  })
  @Column({ type: 'enum', enum: LeadType, default: LeadType.INDIVIDUAL })
  leadType: LeadType;

  @ApiProperty({
    description: 'City of the lead',
    example: 'Mumbai',
    maxLength: 100,
    required: false,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @ApiProperty({
    description: 'State of the lead',
    example: 'Maharashtra',
    maxLength: 100,
    required: false,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @ApiProperty({
    description: 'Country of the lead',
    example: 'India',
    maxLength: 100,
    required: false,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @ApiProperty({
    description: 'Preferred check-in date',
    example: '2024-02-15',
    type: 'string',
    format: 'date',
    required: false,
  })
  @Column({ type: 'date', nullable: true })
  checkInDate: Date;

  @ApiProperty({
    description: 'Preferred check-out date',
    example: '2024-02-18',
    type: 'string',
    format: 'date',
    required: false,
  })
  @Column({ type: 'date', nullable: true })
  checkOutDate: Date;

  @ApiProperty({
    description: 'Number of adults',
    example: 2,
    required: false,
  })
  @Column({ type: 'int', nullable: true })
  numberOfAdults: number;

  @ApiProperty({
    description: 'Number of children',
    example: 1,
    required: false,
  })
  @Column({ type: 'int', nullable: true, default: 0 })
  numberOfChildren: number;

  @ApiProperty({
    description: 'Number of rooms required',
    example: 2,
    required: false,
  })
  @Column({ type: 'int', nullable: true })
  numberOfRooms: number;

  @ApiProperty({
    description: 'Budget range or amount',
    example: 15000.0,
    type: 'number',
    required: false,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budget: number;

  @ApiProperty({
    description: 'Interested homestay ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @Column({ type: 'uuid', nullable: true })
  interestedHomestayId: string;

  @ApiProperty({
    description: 'Special requirements or notes',
    example: 'Need rooms with mountain view, vegetarian food only',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  requirements: string;

  @ApiProperty({
    description: 'Internal notes about the lead',
    example: 'Very interested, ready to book if price matches',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({
    description: 'Assigned sales representative ID',
    example: '123e4567-e89b-12d3-a456-426614174010',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo: string;

  @ApiProperty({
    description: 'Date when lead was last contacted',
    example: '2024-01-20T10:30:00Z',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  lastContactedAt: Date;

  @ApiProperty({
    description: 'Date for next follow-up',
    example: '2024-01-25T10:00:00Z',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  nextFollowUpAt: Date;

  @ApiProperty({
    description: 'Estimated value of the booking',
    example: 25000.0,
    type: 'number',
    required: false,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedValue: number;

  @ApiProperty({
    description: 'Reason if lead was lost',
    example: 'Price too high, went with competitor',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  lostReason: string;

  @ApiProperty({
    description: 'Date when lead was converted to booking',
    example: '2024-01-22T14:30:00Z',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  convertedAt: Date;

  @ApiProperty({
    description: 'Booking ID if lead was converted',
    example: '123e4567-e89b-12d3-a456-426614174020',
    required: false,
  })
  @Column({ type: 'uuid', nullable: true })
  bookingId: string;

  @ApiProperty({
    description: 'Referral source name if applicable',
    example: 'Mr. Sharma - Previous Guest',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  referredBy: string;

  @ApiProperty({
    description: 'Company name for corporate leads',
    example: 'Tech Corp Pvt Ltd',
    maxLength: 255,
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  companyName: string;

  @ApiProperty({
    description: 'Lead score based on engagement (0-100)',
    example: 75,
    required: false,
  })
  @Column({ type: 'int', nullable: true, default: 0 })
  leadScore: number;

  @ApiProperty({
    description: 'Tags for categorizing leads',
    example: ['hot-lead', 'corporate', 'repeat-customer'],
    type: [String],
    required: false,
  })
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ApiProperty({
    description: 'Custom fields as JSON',
    example: { preferredActivities: ['trekking', 'sightseeing'] },
    required: false,
  })
  @Column({ type: 'json', nullable: true })
  customFields: Record<string, any>;

  @ApiProperty({
    description: 'Follow-up history for this lead',
    type: () => LeadFollowUp,
    isArray: true,
  })
  @OneToMany(() => LeadFollowUp, (followUp) => followUp.lead, {
    cascade: true,
  })
  followUps: LeadFollowUp[];

  @ApiProperty({
    description: 'Timestamp when the lead was created',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the lead was last updated',
    example: '2024-01-20T14:45:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
