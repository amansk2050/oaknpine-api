import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Package } from './package.entity';

export enum InclusionType {
  INCLUDED = 'included',
  EXCLUDED = 'excluded',
}

export enum InclusionCategory {
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation',
  MEALS = 'meals',
  SIGHTSEEING = 'sightseeing',
  PERMITS = 'permits',
  GUIDE = 'guide',
  ACTIVITIES = 'activities',
  TAXES = 'taxes',
  INSURANCE = 'insurance',
  OTHER = 'other',
}

@Entity('package_inclusions')
export class PackageInclusion {
  @ApiProperty({
    description: 'Unique identifier for the inclusion',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Package ID this inclusion belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid' })
  packageId: string;

  @ApiProperty({
    description: 'Type - whether this is an inclusion or exclusion',
    enum: InclusionType,
    example: InclusionType.INCLUDED,
  })
  @Column({ type: 'enum', enum: InclusionType })
  type: InclusionType;

  @ApiProperty({
    description: 'Category of the inclusion/exclusion',
    enum: InclusionCategory,
    example: InclusionCategory.TRANSPORT,
  })
  @Column({ type: 'enum', enum: InclusionCategory })
  category: InclusionCategory;

  @ApiProperty({
    description: 'Description of what is included/excluded',
    example: 'AC vehicle for all transfers and sightseeing',
    maxLength: 500,
  })
  @Column({ type: 'varchar', length: 500 })
  description: string;

  @ApiProperty({
    description: 'Icon name for UI display',
    example: 'car',
    maxLength: 50,
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  iconName: string;

  @ApiProperty({
    description: 'Display order',
    example: 1,
  })
  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @ApiProperty({
    description: 'Is this a highlight item to show prominently',
    example: true,
  })
  @Column({ type: 'boolean', default: false })
  isHighlight: boolean;

  // Relations
  @ApiProperty({
    description: 'Package this inclusion belongs to',
    type: () => Package,
  })
  @ManyToOne(() => Package, (pkg) => pkg.inclusions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'packageId' })
  package: Package;

  @ApiProperty({
    description: 'Timestamp when created',
  })
  @CreateDateColumn()
  createdAt: Date;
}
