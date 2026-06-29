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

  async createPackage(
    createPackageDto: CreatePackageDto,
    tenantId: string,
  ): Promise<Package> {
    // Validate min price
    if (createPackageDto.basePricePerHead < createPackageDto.minPricePerHead) {
      throw new BadRequestException(
        'Base price cannot be less than minimum price',
      );
    }

    const destinationVal = createPackageDto.destination || createPackageDto.destinationsCovered?.[0] || 'Multiple';

    // Generate package code
    const packageCode = await this.generatePackageCode(
      destinationVal,
      createPackageDto.numberOfNights,
    );

    // Remove pricingTiers from the object passed to create()
    const {
      pricingTiers, // remove from spreading
      itineraries,
      inclusions,
      ...rest
    } = createPackageDto;

    // Create package without pricingTiers
    const pkg = this.packageRepository.create({
      ...rest,
      destination: destinationVal,
      packageCode,
      organizationId: tenantId,
      validFrom: createPackageDto.validFrom
        ? new Date(createPackageDto.validFrom)
        : null,
      validUntil: createPackageDto.validUntil
        ? new Date(createPackageDto.validUntil)
        : null,
    });

    const savedPackage = await this.packageRepository.save(pkg);

    // Create itineraries if provided
    if (itineraries?.length) {
      for (const itinerary of itineraries) {
        await this.addItinerary(savedPackage.id, itinerary, tenantId);
      }
    }

    // Create inclusions if provided
    if (inclusions?.length) {
      for (const inclusion of inclusions) {
        await this.addInclusion(savedPackage.id, inclusion, tenantId);
      }
    }

    // Create pricing tiers if provided
    if (pricingTiers?.length) {
      for (const tier of pricingTiers) {
        await this.addPricing(savedPackage.id, tier, tenantId);
      }
    }

    return await this.findPackageById(savedPackage.id, tenantId);
  }

  async findAllPackages(
    filterDto?: FilterPackageDto,
    tenantId?: string,
  ): Promise<Package[]> {
    const query = this.packageRepository.createQueryBuilder('package');

    if (!tenantId) {
      if (filterDto?.organizationId) {
        tenantId = filterDto.organizationId;
      } else if (filterDto?.organizationSlug) {
        const rows = await this.packageRepository.query(
          `SELECT id FROM organization WHERE slug = $1 LIMIT 1`,
          [filterDto.organizationSlug],
        );
        tenantId = rows[0]?.id;
      } else {
        const [firstOrg] = await this.packageRepository.query(
          `SELECT id FROM organization LIMIT 1`,
        );
        tenantId = firstOrg?.id;
      }
    }

    if (tenantId) {
      query.andWhere('package.organizationId = :tenantId', { tenantId });
    }

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

  async findPackageById(id: string, tenantId?: string): Promise<Package> {
    const where: any = { id };
    if (tenantId) {
      where.organizationId = tenantId;
    } else {
      where.status = PackageStatus.ACTIVE;
    }

    const pkg = await this.packageRepository.findOne({
      where,
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

  async findPackageByCode(code: string, tenantId?: string): Promise<Package> {
    const where: any = { packageCode: code };
    if (tenantId) {
      where.organizationId = tenantId;
    } else {
      where.status = PackageStatus.ACTIVE;
    }

    const pkg = await this.packageRepository.findOne({
      where,
      relations: ['itineraries', 'pricingTiers', 'inclusions'],
      order: {
        itineraries: { dayNumber: 'ASC' },
        pricingTiers: { numberOfPersons: 'ASC' },
        inclusions: { displayOrder: 'ASC' },
      },
    });

    if (!pkg) {
      throw new NotFoundException(`Package with code ${code} not found`);
    }

    return pkg;
  }

  async updatePackage(
    id: string,
    updatePackageDto: UpdatePackageDto,
    tenantId: string,
  ): Promise<Package> {
    const pkg = await this.findPackageById(id, tenantId);

    if (
      updatePackageDto.basePricePerHead !== undefined &&
      updatePackageDto.minPricePerHead !== undefined &&
      updatePackageDto.basePricePerHead < updatePackageDto.minPricePerHead
    ) {
      throw new BadRequestException(
        'Base price cannot be less than minimum price',
      );
    }

    const destinationVal = updatePackageDto.destination || updatePackageDto.destinationsCovered?.[0];

    Object.assign(pkg, {
      ...updatePackageDto,
      ...(destinationVal ? { destination: destinationVal } : {}),
      validFrom: updatePackageDto.validFrom
        ? new Date(updatePackageDto.validFrom)
        : pkg.validFrom,
      validUntil: updatePackageDto.validUntil
        ? new Date(updatePackageDto.validUntil)
        : pkg.validUntil,
    });

    return await this.packageRepository.save(pkg);
  }

  async deletePackage(id: string, tenantId: string): Promise<void> {
    const pkg = await this.findPackageById(id, tenantId);
    await this.packageRepository.delete(pkg.id);
  }

  async updatePackageStatus(
    id: string,
    status: PackageStatus,
    tenantId: string,
  ): Promise<Package> {
    const pkg = await this.findPackageById(id, tenantId);
    pkg.status = status;
    return await this.packageRepository.save(pkg);
  }

  // ==================== ITINERARY OPERATIONS ====================

  async addItinerary(
    packageId: string,
    dto: CreatePackageItineraryDto,
    tenantId: string,
  ): Promise<PackageItinerary> {
    await this.findPackageById(packageId, tenantId);

    const itinerary = this.itineraryRepository.create({
      ...dto,
      packageId,
    });

    return await this.itineraryRepository.save(itinerary);
  }

  async updateItinerary(
    itineraryId: string,
    dto: CreatePackageItineraryDto,
    tenantId: string,
  ): Promise<PackageItinerary> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { id: itineraryId },
      relations: ['package'],
    });

    if (!itinerary || itinerary.package?.organizationId !== tenantId) {
      throw new NotFoundException(`Itinerary with ID ${itineraryId} not found`);
    }

    Object.assign(itinerary, dto);
    return await this.itineraryRepository.save(itinerary);
  }

  async deleteItinerary(itineraryId: string, tenantId: string): Promise<void> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { id: itineraryId },
      relations: ['package'],
    });

    if (!itinerary || itinerary.package?.organizationId !== tenantId) {
      throw new NotFoundException(`Itinerary with ID ${itineraryId} not found`);
    }

    await this.itineraryRepository.delete(itineraryId);
  }

  // ==================== PRICING OPERATIONS ====================

  async addPricing(
    packageId: string,
    dto: CreatePackagePricingDto,
    tenantId: string,
  ): Promise<PackagePricing> {
    const pkg = await this.findPackageById(packageId, tenantId);

    // Validate floor price constraint
    if (dto.pricePerHead < pkg.minPricePerHead) {
      throw new BadRequestException(
        `Price per head cannot be less than minimum floor price (₹${pkg.minPricePerHead})`,
      );
    }

    // Check if group size already exists
    const existing = await this.pricingRepository.findOne({
      where: {
        packageId,
        numberOfPersons: dto.numberOfPersons,
        roomType: dto.roomType as any,
        seasonType: dto.seasonType as any,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Pricing tier for ${dto.numberOfPersons} persons already exists`,
      );
    }

    const pricing = this.pricingRepository.create({
      ...dto,
      packageId,
    });

    return await this.pricingRepository.save(pricing);
  }

  async updatePricing(
    pricingId: string,
    dto: UpdatePackagePricingDto,
    tenantId: string,
  ): Promise<PackagePricing> {
    const pricing = await this.pricingRepository.findOne({
      where: { id: pricingId },
      relations: ['package'],
    });

    if (!pricing || pricing.package?.organizationId !== tenantId) {
      throw new NotFoundException(`Pricing tier with ID ${pricingId} not found`);
    }

    // Validate floor price constraint
    if (dto.pricePerHead < pricing.package.minPricePerHead) {
      throw new BadRequestException(
        `Price per head cannot be less than minimum floor price (₹${pricing.package.minPricePerHead})`,
      );
    }

    Object.assign(pricing, dto);
    return await this.pricingRepository.save(pricing);
  }

  async deletePricing(pricingId: string, tenantId: string): Promise<void> {
    const pricing = await this.pricingRepository.findOne({
      where: { id: pricingId },
      relations: ['package'],
    });

    if (!pricing || pricing.package?.organizationId !== tenantId) {
      throw new NotFoundException(`Pricing tier with ID ${pricingId} not found`);
    }

    await this.pricingRepository.delete(pricingId);
  }

  async bulkUpdatePricing(
    packageId: string,
    tiers: CreatePackagePricingDto[],
    tenantId: string,
  ): Promise<PackagePricing[]> {
    const pkg = await this.findPackageById(packageId, tenantId);

    // Validate floor price constraint for all tiers
    for (const tier of tiers) {
      if (tier.pricePerHead < pkg.minPricePerHead) {
        throw new BadRequestException(
          `Price per head for ${tier.numberOfPersons} Pax cannot be less than floor price (₹${pkg.minPricePerHead})`,
        );
      }
    }

    // Delete existing pricing tiers
    await this.pricingRepository.delete({ packageId });

    // Save new pricing tiers
    const newTiers = [];
    for (const tier of tiers) {
      const pricing = this.pricingRepository.create({
        ...tier,
        packageId,
      });
      newTiers.push(await this.pricingRepository.save(pricing));
    }

    return newTiers;
  }

  async getPricingForPersons(
    packageId: string,
    persons: number,
    tenantId: string,
  ): Promise<PackagePricing[]> {
    await this.findPackageById(packageId, tenantId);

    return await this.pricingRepository.find({
      where: { packageId, numberOfPersons: persons },
    });
  }

  // ==================== INCLUSION OPERATIONS ====================

  async addInclusion(
    packageId: string,
    dto: CreatePackageInclusionDto,
    tenantId: string,
  ): Promise<PackageInclusion> {
    await this.findPackageById(packageId, tenantId);

    const inclusion = this.inclusionRepository.create({
      ...dto,
      packageId,
    });

    return await this.inclusionRepository.save(inclusion);
  }

  async updateInclusion(
    inclusionId: string,
    dto: CreatePackageInclusionDto,
    tenantId: string,
  ): Promise<PackageInclusion> {
    const inclusion = await this.inclusionRepository.findOne({
      where: { id: inclusionId },
      relations: ['package'],
    });

    if (!inclusion || inclusion.package?.organizationId !== tenantId) {
      throw new NotFoundException(`Inclusion with ID ${inclusionId} not found`);
    }

    Object.assign(inclusion, dto);
    return await this.inclusionRepository.save(inclusion);
  }

  async deleteInclusion(inclusionId: string, tenantId: string): Promise<void> {
    const inclusion = await this.inclusionRepository.findOne({
      where: { id: inclusionId },
      relations: ['package'],
    });

    if (!inclusion || inclusion.package?.organizationId !== tenantId) {
      throw new NotFoundException(`Inclusion with ID ${inclusionId} not found`);
    }

    await this.inclusionRepository.delete(inclusionId);
  }

  // ==================== CUSTOM PACKAGES ====================

  async createCustomPackage(
    dto: CreateCustomPackageDto,
    tenantId: string,
  ): Promise<CustomPackage> {
    const referenceCode = await this.generateCustomPackageReference();

    const { itineraries, ...rest } = dto;

    const customPkg = this.customPackageRepository.create({
      ...rest,
      referenceCode,
      organizationId: tenantId,
      travelStartDate: dto.travelStartDate ? new Date(dto.travelStartDate) : null,
      travelEndDate: dto.travelEndDate ? new Date(dto.travelEndDate) : null,
      quoteValidUntil: dto.quoteValidUntil ? new Date(dto.quoteValidUntil) : null,
    });

    const savedPackage = await this.customPackageRepository.save(customPkg);

    if (itineraries?.length) {
      for (const itinerary of itineraries) {
        await this.addCustomItinerary(savedPackage.id, itinerary, tenantId);
      }
    }

    return await this.findCustomPackageById(savedPackage.id, tenantId);
  }

  async findAllCustomPackages(
    filterDto: FilterCustomPackageDto,
    tenantId: string,
  ): Promise<CustomPackage[]> {
    const query = this.customPackageRepository.createQueryBuilder('cp');

    query.andWhere('cp.organizationId = :tenantId', { tenantId });

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

  async findCustomPackageById(id: string, tenantId: string): Promise<CustomPackage> {
    const customPackage = await this.customPackageRepository.findOne({
      where: { id, organizationId: tenantId },
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
    tenantId: string,
  ): Promise<CustomPackage> {
    const customPackage = await this.customPackageRepository.findOne({
      where: { referenceCode: reference, organizationId: tenantId },
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
    tenantId: string,
  ): Promise<CustomPackage> {
    const customPackage = await this.findCustomPackageById(id, tenantId);

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
    tenantId: string,
  ): Promise<CustomPackage> {
    const customPackage = await this.findCustomPackageById(id, tenantId);
    customPackage.status = status;
    return await this.customPackageRepository.save(customPackage);
  }

  async sendQuote(
    id: string,
    quotedPricePerHead: number,
    totalQuotedPrice: number,
    validUntil: string,
    tenantId: string,
  ): Promise<CustomPackage> {
    const customPackage = await this.findCustomPackageById(id, tenantId);

    customPackage.quotedPricePerHead = quotedPricePerHead;
    customPackage.totalQuotedPrice = totalQuotedPrice;
    customPackage.quoteValidUntil = new Date(validUntil);
    customPackage.status = CustomPackageStatus.QUOTE_SENT;

    return await this.customPackageRepository.save(customPackage);
  }

  async confirmCustomPackage(
    id: string,
    finalPrice: number,
    tenantId: string,
  ): Promise<CustomPackage> {
    const customPackage = await this.findCustomPackageById(id, tenantId);

    customPackage.finalPrice = finalPrice;
    customPackage.discountAmount =
      Number(customPackage.totalQuotedPrice || 0) - finalPrice;
    customPackage.status = CustomPackageStatus.CONFIRMED;

    return await this.customPackageRepository.save(customPackage);
  }

  async deleteCustomPackage(id: string, tenantId: string): Promise<void> {
    const customPackage = await this.findCustomPackageById(id, tenantId);
    await this.customPackageRepository.delete(customPackage.id);
  }

  // Custom Itinerary Operations
  async addCustomItinerary(
    customPackageId: string,
    dto: CreateCustomPackageItineraryDto,
    tenantId: string,
  ): Promise<CustomPackageItinerary> {
    await this.findCustomPackageById(customPackageId, tenantId);

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
    tenantId: string,
  ): Promise<CustomPackageItinerary> {
    const itinerary = await this.customItineraryRepository.findOne({
      where: { id: itineraryId },
      relations: ['customPackage'],
    });

    if (!itinerary || itinerary.customPackage?.organizationId !== tenantId) {
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

  async deleteCustomItinerary(itineraryId: string, tenantId: string): Promise<void> {
    const itinerary = await this.customItineraryRepository.findOne({
      where: { id: itineraryId },
      relations: ['customPackage'],
    });

    if (!itinerary || itinerary.customPackage?.organizationId !== tenantId) {
      throw new NotFoundException(
        `Custom itinerary with ID ${itineraryId} not found`,
      );
    }

    await this.customItineraryRepository.delete(itineraryId);
  }

  // ==================== STATISTICS ====================

  async getPackageStatistics(tenantId: string) {
    const totalPackages = await this.packageRepository.count({ where: { organizationId: tenantId } });
    const activePackages = await this.packageRepository.count({
      where: { status: PackageStatus.ACTIVE, organizationId: tenantId },
    });
    const draftPackages = await this.packageRepository.count({
      where: { status: PackageStatus.DRAFT, organizationId: tenantId },
    });
    const featuredPackages = await this.packageRepository.count({
      where: { isFeatured: true, organizationId: tenantId },
    });

    const totalCustomPackages = await this.customPackageRepository.count({ where: { organizationId: tenantId } });
    const draftCustom = await this.customPackageRepository.count({
      where: { status: CustomPackageStatus.DRAFT, organizationId: tenantId },
    });
    const quoteSent = await this.customPackageRepository.count({
      where: { status: CustomPackageStatus.QUOTE_SENT, organizationId: tenantId },
    });
    const confirmedCustom = await this.customPackageRepository.count({
      where: { status: CustomPackageStatus.CONFIRMED, organizationId: tenantId },
    });
    const completedCustom = await this.customPackageRepository.count({
      where: { status: CustomPackageStatus.COMPLETED, organizationId: tenantId },
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

  async getPopularPackages(limit: number = 5, tenantId?: string): Promise<Package[]> {
    if (!tenantId) {
      const [firstOrg] = await this.packageRepository.query(
        `SELECT id FROM organization LIMIT 1`,
      );
      tenantId = firstOrg?.id;
    }

    const where: any = { status: PackageStatus.ACTIVE };
    if (tenantId) {
      where.organizationId = tenantId;
    }

    return await this.packageRepository.find({
      where,
      order: { displayOrder: 'ASC' },
      take: limit,
      relations: ['pricingTiers'],
    });
  }

  async getFeaturedPackages(tenantId?: string): Promise<Package[]> {
    if (!tenantId) {
      const [firstOrg] = await this.packageRepository.query(
        `SELECT id FROM organization LIMIT 1`,
      );
      tenantId = firstOrg?.id;
    }

    const where: any = { status: PackageStatus.ACTIVE, isFeatured: true };
    if (tenantId) {
      where.organizationId = tenantId;
    }

    return await this.packageRepository.find({
      where,
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
