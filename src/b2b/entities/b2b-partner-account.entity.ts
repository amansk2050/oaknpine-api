import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Represents a B2B Partner user account.
 * One user can be a B2B partner for multiple businesses
 * via B2bPartnerMembership records.
 */
@Entity('b2b_partner_accounts')
export class B2bPartnerAccount {
  @ApiProperty({ description: 'Unique identifier', example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The user account ID (from the auth user table)',
    example: 'user-uuid',
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
