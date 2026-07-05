import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum B2bInvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

@Entity('b2b_invitations')
export class B2bInvitation {
  @ApiProperty({ description: 'Unique identifier', example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Organization ID (business) that sent this invitation',
    example: 'org-uuid',
  })
  @Column({ type: 'varchar', length: 255 })
  organizationId: string;

  @ApiProperty({
    description: 'Name of the business who sent the invitation (for display)',
    example: 'Oakn & Pine Resort',
  })
  @Column({ type: 'varchar', length: 255 })
  businessName: string;

  @ApiProperty({
    description: 'Email address of the invited B2B partner',
    example: 'partner@travelsco.com',
  })
  @Column({ type: 'varchar', length: 255 })
  invitedEmail: string;

  @ApiProperty({
    description: 'Unique token used in the invitation link',
    example: 'a3f9b2c1d4e5...',
  })
  @Column({ type: 'varchar', length: 128, unique: true })
  invitationToken: string;

  @ApiProperty({
    description: 'Current status of the invitation',
    enum: B2bInvitationStatus,
    default: B2bInvitationStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: B2bInvitationStatus,
    default: B2bInvitationStatus.PENDING,
  })
  status: B2bInvitationStatus;

  @ApiProperty({
    description: 'When this invitation expires',
    example: '2024-03-01T00:00:00Z',
  })
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @ApiPropertyOptional({
    description: 'User ID who sent the invitation (the business owner)',
    example: 'user-uuid',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  invitedByUserId: string;

  @ApiPropertyOptional({
    description: 'Partner account ID once the invitation is accepted',
    example: 'partner-account-uuid',
  })
  @Column({ type: 'uuid', nullable: true })
  partnerAccountId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
