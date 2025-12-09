import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { Package } from './entities/package.entity';
import { PackageItinerary } from './entities/package-itinerary.entity';
import { PackagePricing } from './entities/package-pricing.entity';
import { PackageInclusion } from './entities/package-inclusion.entity';
import { CustomPackage } from './entities/custom-package.entity';
import { CustomPackageItinerary } from './entities/custom-package-itinerary.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Package,
      PackageItinerary,
      PackagePricing,
      PackageInclusion,
      CustomPackage,
      CustomPackageItinerary,
    ]),
  ],
  controllers: [PackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
