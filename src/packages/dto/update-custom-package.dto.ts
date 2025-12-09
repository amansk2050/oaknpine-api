import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  CreateCustomPackageDto,
  CreateCustomPackageItineraryDto,
} from './create-custom-package.dto';
import { CustomPackageStatus } from '../entities/custom-package.entity';

export class UpdateCustomPackageDto extends PartialType(
  CreateCustomPackageDto,
) {
  @ApiPropertyOptional({ description: 'Status', enum: CustomPackageStatus })
  @IsOptional()
  @IsEnum(CustomPackageStatus)
  status?: CustomPackageStatus;

  @ApiPropertyOptional({ description: 'Quoted price per head', example: 8500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quotedPricePerHead?: number;

  @ApiPropertyOptional({ description: 'Total quoted price', example: 51000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalQuotedPrice?: number;

  @ApiPropertyOptional({ description: 'Final agreed price', example: 48000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  finalPrice?: number;

  @ApiPropertyOptional({ description: 'Cost price', example: 40000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ description: 'Discount amount', example: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Quote validity date' })
  @IsOptional()
  @IsDateString()
  quoteValidUntil?: string;

  @ApiPropertyOptional({ description: 'Booking ID if converted' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;
}

export class UpdateCustomPackageItineraryDto extends PartialType(
  CreateCustomPackageItineraryDto,
) {}
