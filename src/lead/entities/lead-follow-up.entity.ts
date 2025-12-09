import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Lead } from './lead.entity';

export enum FollowUpType {
  CALL = 'call',
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  MEETING = 'meeting',
  NOTE = 'note',
  OTHER = 'other',
}

export enum FollowUpOutcome {
  SUCCESSFUL = 'successful',
  NO_ANSWER = 'no_answer',
  BUSY = 'busy',
  CALLBACK_REQUESTED = 'callback_requested',
  NOT_INTERESTED = 'not_interested',
  INTERESTED = 'interested',
  BOOKING_CONFIRMED = 'booking_confirmed',
  NEED_MORE_INFO = 'need_more_info',
  OTHER = 'other',
}

@Entity('lead_follow_ups')
export class LeadFollowUp {
  @ApiProperty({
    description: 'Unique identifier for the follow-up',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Lead ID this follow-up belongs to',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @Column({ type: 'uuid' })
  leadId: string;

  @ApiProperty({
    description: 'Type of follow-up activity',
    enum: FollowUpType,
    example: FollowUpType.CALL,
  })
  @Column({ type: 'enum', enum: FollowUpType })
  type: FollowUpType;

  @ApiProperty({
    description: 'Outcome or result of the follow-up',
    enum: FollowUpOutcome,
    example: FollowUpOutcome.INTERESTED,
  })
  @Column({ type: 'enum', enum: FollowUpOutcome })
  outcome: FollowUpOutcome;

  @ApiProperty({
    description: 'Detailed notes about the follow-up',
    example:
      'Discussed pricing and availability for Feb 15-18. Customer interested in mountain view rooms.',
  })
  @Column({ type: 'text' })
  notes: string;

  @ApiProperty({
    description: 'Duration of the follow-up in minutes',
    example: 15,
    required: false,
  })
  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  @ApiProperty({
    description: 'Date and time of the follow-up',
    example: '2024-01-20T10:30:00Z',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  followUpDate: Date;

  @ApiProperty({
    description: 'Next scheduled follow-up date',
    example: '2024-01-25T10:00:00Z',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  nextFollowUpDate: Date;

  @ApiProperty({
    description: 'User ID who performed the follow-up',
    example: '123e4567-e89b-12d3-a456-426614174010',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  performedBy: string;

  @ApiProperty({
    description: 'Lead entity this follow-up belongs to',
    type: () => Lead,
  })
  @ManyToOne(() => Lead, (lead) => lead.followUps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @ApiProperty({
    description: 'Timestamp when the follow-up was recorded',
    example: '2024-01-20T10:35:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
