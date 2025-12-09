import { PartialType } from '@nestjs/swagger';
import {
  CreatePackageDto,
  CreatePackageItineraryDto,
  CreatePackagePricingDto,
  CreatePackageInclusionDto,
} from './create-package.dto';

export class UpdatePackageDto extends PartialType(CreatePackageDto) {}

export class UpdatePackageItineraryDto extends PartialType(
  CreatePackageItineraryDto,
) {}

export class UpdatePackagePricingDto extends PartialType(
  CreatePackagePricingDto,
) {}

export class UpdatePackageInclusionDto extends PartialType(
  CreatePackageInclusionDto,
) {}
