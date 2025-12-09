import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  PackageType,
  PackageCategory,
  PackageStatus,
} from '../entities/package.entity';
import { CustomPackageStatus } from '../entities/custom-package.entity';

export class FilterPackageDto {
  @ApiPropertyOptional({
    description: 'Filter by package type',
    enum: PackageType,
  })
  @IsOptional()
  @IsEnum(PackageType)
  packageType?: PackageType;

  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: PackageCategory,
  })
  @IsOptional()
  @IsEnum(PackageCategory)
  category?: PackageCategory;

  @ApiPropertyOptional({ description: 'Filter by status', enum: PackageStatus })
  @IsOptional()
  @IsEnum(PackageStatus)
  status?: PackageStatus;

  @ApiPropertyOptional({
    description: 'Filter by destination',
    example: 'Kalimpong',
  })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional({
    description: 'Filter by number of nights',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  numberOfNights?: number;

  @ApiPropertyOptional({ description: 'Filter featured only', example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Search by name or tag' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class FilterCustomPackageDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: CustomPackageStatus,
  })
  @IsOptional()
  @IsEnum(CustomPackageStatus)
  status?: CustomPackageStatus;

  @ApiPropertyOptional({ description: 'Filter by assigned staff' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({
    description: 'Search by customer name, email, or title',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
