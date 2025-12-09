import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package, PackageStatus } from './entities/package.entity';
import { PackageItinerary } from './entities/package-itinerary.entity';
import { PackagePricing } from './entities/package-pricing.entity';
import { PackageInclusion } from './entities/package-inclusion.entity';
import {
  CustomPackage,
  CustomPackageStatus,
} from './entities/custom-package.entity';
import { CustomPackageItinerary } from './entities/custom-package-itinerary.entity';
import {
  CreatePackageDto,
  CreatePackageItineraryDto,
  CreatePackagePricingDto,
  CreatePackageInclusionDto,
} from './dto/create-package.dto';
import {
  UpdatePackageDto,
  UpdatePackagePricingDto,
} from './dto/update-package.dto';
import {
  CreateCustomPackageDto,
  CreateCustomPackageItineraryDto,
} from './dto/create-custom-package.dto';
import {
  UpdateCustomPackageDto,
  UpdateCustomPackageItineraryDto,
} from './dto/update-custom-package.dto';
import {
  FilterPackageDto,
  FilterCustomPackageDto,
} from './dto/filter-package.dto';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private packageRepository: Repository<Package>,
    @InjectRepository(PackageItinerary)
    private itineraryRepository: Repository<PackageItinerary>,
    @InjectRepository(PackagePricing)
    private pricingRepository: Repository<PackagePricing>,
    @InjectRepository(PackageInclusion)
    private inclusionRepository: Repository<PackageInclusion>,
    @InjectRepository(CustomPackage)
    private customPackageRepository: Repository<CustomPackage>,
    @InjectRepository(CustomPackageItinerary)
    private customItineraryRepository: Repository<CustomPackageItinerary>,
  ) {}

  // ==================== PREDEFINED PACKAGES ====================

  async createPackage(createPackageDto: CreatePackageDto): Promise<Package> {
    // Validate min price
    if (createPackageDto.basePricePerHead < createPackageDto.minPricePerHead) {
      throw new BadRequestException(
        'Base price cannot be less than minimum price',
      );
    }

    // Generate package code
    const packageCode = await this.generatePackageCode(
      createPackageDto.destination,
      createPackageDto.numberOfNights,
    );

    // Create package
    const pkg = this.packageRepository.create({
      ...createPackageDto,
      packageCode,
      validFrom: createPackageDto.validFrom
        ? new Date(createPackageDto.validFrom)
        : null,
      validUntil: createPackageDto.validUntil
        ? new Date(createPackageDto.validUntil)
        : null,
    });

    const savedPackage = await this.packageRepository.save(pkg);

    // Create itineraries if provided
    if (createPackageDto.itineraries?.length) {
      for (const itinerary of createPackageDto.itineraries) {
        await this.addItinerary(savedPackage.id, itinerary);
      }
    }

    // Create pricing tiers if provided
    if (createPackageDto.pricingTiers?.length) {
      for (const pricing of createPackageDto.pricingTiers) {
        await this.addPricing(savedPackage.id, pricing);
      }
    }

    // Create inclusions if provided
    if (createPackageDto.inclusions?.length) {
      for (const inclusion of createPackageDto.inclusions) {
        await this.addInclusion(savedPackage.id, inclusion);
      }
    }

    return await this.findPackageById(savedPackage.id);
  }

  async findAllPackages(filterDto?: FilterPackageDto): Promise<Package[]> {
    const query = this.packageRepository.createQueryBuilder('package');

    if (filterDto?.packageType) {
      query.andWhere('package.packageType = :packageType', {
        packageType: filterDto.packageType,
      });
    }

    if (filterDto?.category) {
      query.andWhere('package.category = :category', {
        category: filterDto.category,
      });
    }

    if (filterDto?.status) {
      query.andWhere('package.status = :status', { status: filterDto.status });
    }

    if (filterDto?.destination) {
      query.andWhere('package.destination LIKE :destination', {
        destination: `%${filterDto.destination}%`,
      });
    }

    if (filterDto?.numberOfNights) {
      query.andWhere('package.numberOfNights = :nights', {
        nights: filterDto.numberOfNights,
      });
    }

    if (filterDto?.isFeatured !== undefined) {
      query.andWhere('package.isFeatured = :featured', {
        featured: filterDto.isFeatured,
      });
    }

    if (filterDto?.search) {
      query.andWhere(
        '(package.name LIKE :search OR package.tags LIKE :search)',
        {
          search: `%${filterDto.search}%`,
        },
      );
    }

    return await query
      .leftJoinAndSelect('package.itineraries', 'itineraries')
      .leftJoinAndSelect('package.pricingTiers', 'pricingTiers')
      .leftJoinAndSelect('package.inclusions', 'inclusions')
      .orderBy('package.displayOrder', 'ASC')
      .addOrderBy('package.createdAt', 'DESC')
      .getMany();
  }

  async findPackageById(id: string): Promise<Package> {
    const pkg = await this.packageRepository.findOne({
      where: { id },
      relations: ['itineraries', 'pricingTiers', 'inclusions'],
      order: {
        itineraries: { dayNumber: 'ASC' },
        pricingTiers: { numberOfPersons: 'ASC' },
        inclusions: { displayOrder: 'ASC' },
      },
    });

    if (!pkg) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    return pkg;
  }

  async findPackageByCode(code: string): Promise<Package> {
    const pkg = await this.packageRepository.findOne({
      where: { packageCode: code },
      relations: ['itineraries', 'pricingTiers', 'inclusions'],
    });

    if (!pkg) {
      throw new NotFoundException(`Package with code ${code} not found`);
    }

    return pkg;
  }

  async updatePackage(
    id: string,
    updatePackageDto: UpdatePackageDto,
  ): Promise<Package> {
    const pkg = await this.findPackageById(id);

    // Validate min price if both are provided
    const minPrice =
      updatePackageDto.minPricePerHead ?? Number(pkg.minPricePerHead);
    const basePrice =
      updatePackageDto.basePricePerHead ?? Number(pkg.basePricePerHead);

    if (basePrice < minPrice) {
      throw new BadRequestException(
        'Base price cannot be less than minimum price',
      );
    }

    // Update dates
    if (updatePackageDto.validFrom) {
      pkg.validFrom = new Date(updatePackageDto.validFrom);
    }
    if (updatePackageDto.validUntil) {
      pkg.validUntil = new Date(updatePackageDto.validUntil);
    }

    Object.assign(pkg, updatePackageDto);
    return await this.packageRepository.save(pkg);
  }

  async deletePackage(id: string): Promise<void> {
    const result = await this.packageRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }
  }

  async updatePackageStatus(
    id: string,
    status: PackageStatus,
  ): Promise<Package> {
    const pkg = await this.findPackageById(id);
    pkg.status = status;
    return await this.packageRepository.save(pkg);
  }

  // ==================== ITINERARY OPERATIONS ====================

  async addItinerary(
    packageId: string,
    dto: CreatePackageItineraryDto,
  ): Promise<PackageItinerary> {
    await this.findPackageById(packageId);

    const itinerary = this.itineraryRepository.create({
      ...dto,
      packageId,
      displayOrder: dto.dayNumber,
    });

    return await this.itineraryRepository.save(itinerary);
  }

  async updateItinerary(
    itineraryId: string,
    dto: Partial<CreatePackageItineraryDto>,
  ): Promise<PackageItinerary> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { id: itineraryId },
    });
    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${itineraryId} not found`);
    }

    Object.assign(itinerary, dto);
    return await this.itineraryRepository.save(itinerary);
  }

  async deleteItinerary(itineraryId: string): Promise<void> {
    const result = await this.itineraryRepository.delete(itineraryId);
    if (result.affected === 0) {
      throw new NotFoundException(`Itinerary with ID ${itineraryId} not found`);
    }
  }

  // ==================== PRICING OPERATIONS ====================

  async addPricing(
    packageId: string,
    dto: CreatePackagePricingDto,
  ): Promise<PackagePricing> {
    const pkg = await this.findPackageById(packageId);

    // Validate against package min price
    if (dto.pricePerHead < Number(pkg.minPricePerHead)) {
      throw new BadRequestException(
        `Price per head (${dto.pricePerHead}) cannot be less than package minimum price (${pkg.minPricePerHead})`,
      );
    }

    // Check for duplicate pricing tier
    const existing = await this.pricingRepository.findOne({
      where: {
        packageId,
        numberOfPersons: dto.numberOfPersons,
        roomType: dto.roomType,
        seasonType: dto.seasonType,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Pricing for ${dto.numberOfPersons} persons with ${dto.roomType} room in ${dto.seasonType} season already exists`,
      );
    }

    const pricing = this.pricingRepository.create({
      ...dto,
      packageId,
      totalPrice: dto.pricePerHead * dto.numberOfPersons,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
    });

    return await this.pricingRepository.save(pricing);
  }

  async updatePricing(
    pricingId: string,
    dto: UpdatePackagePricingDto,
  ): Promise<PackagePricing> {
    const pricing = await this.pricingRepository.findOne({
      where: { id: pricingId },
      relations: ['package'],
    });

    if (!pricing) {
      throw new NotFoundException(`Pricing with ID ${pricingId} not found`);
    }

    // Validate against package min price
    const newPrice = dto.pricePerHead ?? Number(pricing.pricePerHead);
    if (newPrice < Number(pricing.package.minPricePerHead)) {
      throw new BadRequestException(
        `Price per head (${newPrice}) cannot be less than package minimum price (${pricing.package.minPricePerHead})`,
      );
    }

    if (dto.validFrom) {
      pricing.validFrom = new Date(dto.validFrom);
    }
    if (dto.validUntil) {
      pricing.validUntil = new Date(dto.validUntil);
    }

    Object.assign(pricing, dto);

    // Recalculate total
    pricing.totalPrice = Number(pricing.pricePerHead) * pricing.numberOfPersons;

    return await this.pricingRepository.save(pricing);
  }

  async deletePricing(pricingId: string): Promise<void> {
    const result = await this.pricingRepository.delete(pricingId);
    if (result.affected === 0) {
      throw new NotFoundException(`Pricing with ID ${pricingId} not found`);
    }
  }

  async bulkUpdatePricing(
    packageId: string,
    pricingTiers: CreatePackagePricingDto[],
  ): Promise<PackagePricing[]> {
    // Delete existing pricing
    await this.pricingRepository.delete({ packageId });

    // Add new pricing
    const results: PackagePricing[] = [];
    for (const tier of pricingTiers) {
      const pricing = await this.addPricing(packageId, tier);
      results.push(pricing);
    }

    return results;
  }

  async getPricingForPersons(
    packageId: string,
    numberOfPersons: number,
  ): Promise<PackagePricing> {
    const pricing = await this.pricingRepository.findOne({
      where: {
        packageId,
        numberOfPersons,
        isActive: true,
      },
    });

    if (!pricing) {
      throw new NotFoundException(
        `No pricing available for ${numberOfPersons} persons in this package`,
      );
    }

    return pricing;
  }

  // ==================== INCLUSION OPERATIONS ====================

  async addInclusion(
    packageId: string,
    dto: CreatePackageInclusionDto,
  ): Promise<PackageInclusion> {
    await this.findPackageById(packageId);

    const inclusion = this.inclusionRepository.create({
      ...dto,
      packageId,
    });

    return await this.inclusionRepository.save(inclusion);
  }

  async updateInclusion(
    inclusionId: string,
    dto: Partial<CreatePackageInclusionDto>,
  ): Promise<PackageInclusion> {
    const inclusion = await this.inclusionRepository.findOne({
      where: { id: inclusionId },
    });
    if (!inclusion) {
      throw new NotFoundException(`Inclusion with ID ${inclusionId} not found`);
    }

    Object.assign(inclusion, dto);
    return await this.inclusionRepository.save(inclusion);
  }

  async deleteInclusion(inclusionId: string): Promise<void> {
    const result = await this.inclusionRepository.delete(inclusionId);
    if (result.affected === 0) {
      throw new NotFoundException(`Inclusion with ID ${inclusionId} not found`);
    }
  }

  // ==================== CUSTOM PACKAGES ====================

  async createCustomPackage(
    dto: CreateCustomPackageDto,
  ): Promise<CustomPackage> {
    // Generate reference code
    const referenceCode = await this.generateCustomPackageReference();

    const customPackage = this.customPackageRepository.create({
      ...dto,
      referenceCode,
      travelStartDate: new Date(dto.travelStartDate),
      travelEndDate: new Date(dto.travelEndDate),
      status: CustomPackageStatus.DRAFT,
    });

    const savedPackage = await this.customPackageRepository.save(customPackage);

    // Create itineraries if provided
    if (dto.itineraries?.length) {
      for (const itinerary of dto.itineraries) {
        await this.addCustomItinerary(savedPackage.id, itinerary);
      }
    }

    return await this.findCustomPackageById(savedPackage.id);
  }

  async findAllCustomPackages(
    filterDto?: FilterCustomPackageDto,
  ): Promise<CustomPackage[]> {
    const query = this.customPackageRepository.createQueryBuilder('cp');

    if (filterDto?.status) {
      query.andWhere('cp.status = :status', { status: filterDto.status });
    }

    if (filterDto?.assignedTo) {
      query.andWhere('cp.assignedTo = :assignedTo', {
        assignedTo: filterDto.assignedTo,
      });
    }

    if (filterDto?.search) {
      query.andWhere(
        '(cp.customerName LIKE :search OR cp.customerEmail LIKE :search OR cp.title LIKE :search OR cp.referenceCode LIKE :search)',
        { search: `%${filterDto.search}%` },
      );
    }

    return await query
      .leftJoinAndSelect('cp.itineraries', 'itineraries')
      .orderBy('cp.createdAt', 'DESC')
      .getMany();
  }

  async findCustomPackageById(id: string): Promise<CustomPackage> {
    const customPackage = await this.customPackageRepository.findOne({
      where: { id },
      relations: ['itineraries'],
      order: {
        itineraries: { dayNumber: 'ASC' },
      },
    });

    if (!customPackage) {
      throw new NotFoundException(`Custom package with ID ${id} not found`);
    }

    return customPackage;
  }

  async findCustomPackageByReference(
    reference: string,
  ): Promise<CustomPackage> {
    const customPackage = await this.customPackageRepository.findOne({
      where: { referenceCode: reference },
      relations: ['itineraries'],
    });

    if (!customPackage) {
      throw new NotFoundException(
        `Custom package with reference ${reference} not found`,
      );
    }

    return customPackage;
  }

  async updateCustomPackage(
    id: string,
    dto: UpdateCustomPackageDto,
  ): Promise<CustomPackage> {
    const customPackage = await this.findCustomPackageById(id);

    if (dto.travelStartDate) {
      customPackage.travelStartDate = new Date(dto.travelStartDate);
    }
    if (dto.travelEndDate) {
      customPackage.travelEndDate = new Date(dto.travelEndDate);
    }
    if (dto.quoteValidUntil) {
      customPackage.quoteValidUntil = new Date(dto.quoteValidUntil);
    }

    Object.assign(customPackage, dto);
    return await this.customPackageRepository.save(customPackage);
  }

  async updateCustomPackageStatus(
    id: string,
    status: CustomPackageStatus,
  ): Promise<CustomPackage> {
    const customPackage = await this.findCustomPackageById(id);
    customPackage.status = status;
    return await this.customPackageRepository.save(customPackage);
  }

  async sendQuote(
    id: string,
    quotedPricePerHead: number,
    totalQuotedPrice: number,
    validUntil: string,
  ): Promise<CustomPackage> {
    const customPackage = await this.findCustomPackageById(id);

    customPackage.quotedPricePerHead = quotedPricePerHead;
    customPackage.totalQuotedPrice = totalQuotedPrice;
    customPackage.quoteValidUntil = new Date(validUntil);
    customPackage.status = CustomPackageStatus.QUOTE_SENT;

    return await this.customPackageRepository.save(customPackage);
  }

  async confirmCustomPackage(
    id: string,
    finalPrice: number,
  ): Promise<CustomPackage> {
    const customPackage = await this.findCustomPackageById(id);

    customPackage.finalPrice = finalPrice;
    customPackage.discountAmount =
      Number(customPackage.totalQuotedPrice || 0) - finalPrice;
    customPackage.status = CustomPackageStatus.CONFIRMED;

    return await this.customPackageRepository.save(customPackage);
  }

  async deleteCustomPackage(id: string): Promise<void> {
    const result = await this.customPackageRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Custom package with ID ${id} not found`);
    }
  }

  // Custom Itinerary Operations
  async addCustomItinerary(
    customPackageId: string,
    dto: CreateCustomPackageItineraryDto,
  ): Promise<CustomPackageItinerary> {
    await this.findCustomPackageById(customPackageId);

    const itinerary = this.customItineraryRepository.create({
      ...dto,
      customPackageId,
      date: dto.date ? new Date(dto.date) : null,
      displayOrder: dto.dayNumber,
    });

    return await this.customItineraryRepository.save(itinerary);
  }

  async updateCustomItinerary(
    itineraryId: string,
    dto: UpdateCustomPackageItineraryDto,
  ): Promise<CustomPackageItinerary> {
    const itinerary = await this.customItineraryRepository.findOne({
      where: { id: itineraryId },
    });
    if (!itinerary) {
      throw new NotFoundException(
        `Custom itinerary with ID ${itineraryId} not found`,
      );
    }

    if (dto.date) {
      itinerary.date = new Date(dto.date);
    }

    Object.assign(itinerary, dto);
    return await this.customItineraryRepository.save(itinerary);
  }

  async deleteCustomItinerary(itineraryId: string): Promise<void> {
    const result = await this.customItineraryRepository.delete(itineraryId);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Custom itinerary with ID ${itineraryId} not found`,
      );
    }
  }

  // ==================== STATISTICS ====================

  async getPackageStatistics() {
    const totalPackages = await this.packageRepository.count();
    const activePackages = await this.packageRepository.count({
      where: { status: PackageStatus.ACTIVE },
    });
    const draftPackages = await this.packageRepository.count({
      where: { status: PackageStatus.DRAFT },
    });
    const featuredPackages = await this.packageRepository.count({
      where: { isFeatured: true },
    });

    const totalCustomPackages = await this.customPackageRepository.count();
    const draftCustom = await this.customPackageRepository.count({
      where: { status: CustomPackageStatus.DRAFT },
    });
    const quoteSent = await this.customPackageRepository.count({
      where: { status: CustomPackageStatus.QUOTE_SENT },
    });
    const confirmedCustom = await this.customPackageRepository.count({
      where: { status: CustomPackageStatus.CONFIRMED },
    });
    const completedCustom = await this.customPackageRepository.count({
      where: { status: CustomPackageStatus.COMPLETED },
    });

    return {
      predefinedPackages: {
        total: totalPackages,
        active: activePackages,
        draft: draftPackages,
        featured: featuredPackages,
      },
      customPackages: {
        total: totalCustomPackages,
        draft: draftCustom,
        quoteSent,
        confirmed: confirmedCustom,
        completed: completedCustom,
      },
    };
  }

  async getPopularPackages(limit: number = 5): Promise<Package[]> {
    return await this.packageRepository.find({
      where: { status: PackageStatus.ACTIVE },
      order: { displayOrder: 'ASC' },
      take: limit,
      relations: ['pricingTiers'],
    });
  }

  async getFeaturedPackages(): Promise<Package[]> {
    return await this.packageRepository.find({
      where: { status: PackageStatus.ACTIVE, isFeatured: true },
      order: { displayOrder: 'ASC' },
      relations: ['pricingTiers', 'itineraries'],
    });
  }

  // ==================== HELPER METHODS ====================

  private async generatePackageCode(
    destination: string,
    nights: number,
  ): Promise<string> {
    const prefix = destination.substring(0, 3).toUpperCase();
    const count = await this.packageRepository.count();
    return `PKG-${prefix}-${nights}N${nights + 1}D-${String(count + 1).padStart(3, '0')}`;
  }

  private async generateCustomPackageReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.customPackageRepository.count();
    return `CPKG-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
