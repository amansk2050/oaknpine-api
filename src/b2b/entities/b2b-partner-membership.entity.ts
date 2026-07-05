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
import { B2bPartnerAccount } from './b2b-partner-account.entity';

export enum B2bMembershipStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

/**
 * Links a B2B partner account to a specific business (organization).
 * One partner can have memberships in multiple organizations.
 */
@Entity('b2b_partner_memberships')
export class B2bPartnerMembership {
  @ApiProperty({ description: 'Unique identifier', example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The B2B partner account',
    example: 'partner-account-uuid',
  })
  @Column({ type: 'uuid' })
  partnerAccountId: string;

  @ApiProperty({
    description: 'Organization ID of the business this partner serves',
    example: 'org-uuid',
  })
  @Column({ type: 'varchar', length: 255 })
  organizationId: string;

  @ApiProperty({
    description: 'The invitation that created this membership',
    example: 'invitation-uuid',
  })
  @Column({ type: 'uuid', nullable: true })
  invitationId: string;

  @ApiProperty({
    description: 'Display name of the business (cached for performance)',
    example: 'Oakn & Pine Resort',
  })
  @Column({ type: 'varchar', length: 255 })
  businessName: string;

  @ApiProperty({
    description: 'Partner name / business name on the partner side',
    example: 'Sunshine Travels Pvt Ltd',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  partnerBusinessName: string;

  @ApiProperty({
    description: 'Membership status',
    enum: B2bMembershipStatus,
    default: B2bMembershipStatus.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: B2bMembershipStatus,
    default: B2bMembershipStatus.ACTIVE,
  })
  status: B2bMembershipStatus;

  @ApiProperty({
    description: 'Total booking requests submitted by this partner to this business',
    default: 0,
  })
  @Column({ type: 'int', default: 0 })
  totalBookingsSent: number;

  @ApiPropertyOptional({ description: 'Internal notes about this membership' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => B2bPartnerAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partnerAccountId' })
  partnerAccount: B2bPartnerAccount;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
