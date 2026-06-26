import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum B2bPartnerStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Entity('b2b_partners')
export class B2bPartner {
  @ApiProperty({ description: 'Unique identifier', example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Organization ID this partner belongs to',
    example: 'org-uuid',
  })
  @Column({ type: 'varchar', length: 255 })
  organizationId: string;

  @ApiProperty({
    description: 'Business name of the B2B partner',
    example: 'Sunshine Travels Pvt Ltd',
  })
  @Column({ type: 'varchar', length: 255 })
  businessName: string;

  @ApiProperty({
    description: 'Name of the primary contact person',
    example: 'Ramesh Kumar',
  })
  @Column({ type: 'varchar', length: 255 })
  contactPerson: string;

  @ApiProperty({
    description: 'Partner email address',
    example: 'ramesh@sunshinetravels.com',
  })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @ApiPropertyOptional({
    description: 'Partner phone number',
    example: '+91-9876543210',
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @ApiProperty({
    description:
      'Unique URL slug for this partner portal (used in shareable link)',
    example: 'sunshine-travels-abc123',
  })
  @Column({ type: 'varchar', length: 100, unique: true })
  uniqueSlug: string;

  @ApiProperty({
    description: 'Partner status',
    enum: B2bPartnerStatus,
    default: B2bPartnerStatus.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: B2bPartnerStatus,
    default: B2bPartnerStatus.ACTIVE,
  })
  status: B2bPartnerStatus;

  @ApiProperty({
    description: 'Total booking requests submitted by this partner',
    default: 0,
  })
  @Column({ type: 'int', default: 0 })
  totalRequestsSent: number;

  @ApiPropertyOptional({ description: 'Additional notes about this partner' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
