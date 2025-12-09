import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { PackagesService } from './packages.service';
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
import { Package, PackageStatus } from './entities/package.entity';
import { PackageItinerary } from './entities/package-itinerary.entity';
import { PackagePricing } from './entities/package-pricing.entity';
import { PackageInclusion } from './entities/package-inclusion.entity';
import {
  CustomPackage,
  CustomPackageStatus,
} from './entities/custom-package.entity';
import { CustomPackageItinerary } from './entities/custom-package-itinerary.entity';

@ApiTags('Package Management')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  // ==================== PREDEFINED PACKAGES ====================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a predefined package',
    description:
      'Create a new predefined tour package with itinerary, pricing tiers (2-8 persons), and inclusions. Validates that prices are above the minimum floor price.',
  })
  @ApiBody({ type: CreatePackageDto })
  @ApiResponse({
    status: 201,
    description: 'Package created successfully',
    type: Package,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or price below minimum',
  })
  createPackage(@Body() createPackageDto: CreatePackageDto) {
    return this.packagesService.createPackage(createPackageDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all predefined packages',
    description:
      'Retrieve all predefined packages with optional filters for type, category, destination, and status',
  })
  @ApiQuery({ type: FilterPackageDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'List of packages',
    type: [Package],
  })
  findAllPackages(@Query() filterDto: FilterPackageDto) {
    return this.packagesService.findAllPackages(filterDto);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get package statistics',
    description: 'Get overall statistics for predefined and custom packages',
  })
  @ApiResponse({
    status: 200,
    description: 'Package statistics',
    schema: {
      example: {
        predefinedPackages: { total: 10, active: 8, draft: 2, featured: 3 },
        customPackages: {
          total: 25,
          draft: 5,
          quoteSent: 10,
          confirmed: 8,
          completed: 2,
        },
      },
    },
  })
  getPackageStatistics() {
    return this.packagesService.getPackageStatistics();
  }

  @Get('popular')
  @ApiOperation({
    summary: 'Get popular packages',
    description: 'Retrieve top popular active packages for display',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({
    status: 200,
    description: 'List of popular packages',
    type: [Package],
  })
  getPopularPackages(@Query('limit') limit?: number) {
    return this.packagesService.getPopularPackages(limit);
  }

  @Get('featured')
  @ApiOperation({
    summary: 'Get featured packages',
    description: 'Retrieve all featured active packages',
  })
  @ApiResponse({
    status: 200,
    description: 'List of featured packages',
    type: [Package],
  })
  getFeaturedPackages() {
    return this.packagesService.getFeaturedPackages();
  }

  @Get('code/:code')
  @ApiOperation({
    summary: 'Get package by code',
    description: 'Retrieve a package using its unique package code',
  })
  @ApiParam({
    name: 'code',
    description: 'Package code',
    example: 'PKG-KLM-2N3D-001',
  })
  @ApiResponse({ status: 200, description: 'Package details', type: Package })
  @ApiResponse({ status: 404, description: 'Package not found' })
  findPackageByCode(@Param('code') code: string) {
    return this.packagesService.findPackageByCode(code);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get package by ID',
    description:
      'Retrieve detailed package information including itinerary, pricing tiers, and inclusions',
  })
  @ApiParam({ name: 'id', description: 'Package UUID' })
  @ApiResponse({ status: 200, description: 'Package details', type: Package })
  @ApiResponse({ status: 404, description: 'Package not found' })
  findPackageById(@Param('id') id: string) {
    return this.packagesService.findPackageById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update package',
    description:
      'Update package details including name, description, min/base prices, and other information',
  })
  @ApiParam({ name: 'id', description: 'Package UUID' })
  @ApiBody({ type: UpdatePackageDto })
  @ApiResponse({
    status: 200,
    description: 'Package updated successfully',
    type: Package,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or price below minimum',
  })
  @ApiResponse({ status: 404, description: 'Package not found' })
  updatePackage(
    @Param('id') id: string,
    @Body() updatePackageDto: UpdatePackageDto,
  ) {
    return this.packagesService.updatePackage(id, updatePackageDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update package status',
    description: 'Change package status (active, inactive, draft)',
  })
  @ApiParam({ name: 'id', description: 'Package UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { status: { enum: ['active', 'inactive', 'draft'] } },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Status updated', type: Package })
  updatePackageStatus(
    @Param('id') id: string,
    @Body('status') status: PackageStatus,
  ) {
    return this.packagesService.updatePackageStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete package',
    description:
      'Permanently delete a package and all associated itineraries, pricing, and inclusions',
  })
  @ApiParam({ name: 'id', description: 'Package UUID' })
  @ApiResponse({ status: 204, description: 'Package deleted' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  deletePackage(@Param('id') id: string) {
    return this.packagesService.deletePackage(id);
  }

  // ==================== ITINERARY ENDPOINTS ====================

  @Post(':packageId/itineraries')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add itinerary to package',
    description: 'Add a day-wise itinerary entry to a predefined package',
  })
  @ApiParam({ name: 'packageId', description: 'Package UUID' })
  @ApiBody({ type: CreatePackageItineraryDto })
  @ApiResponse({
    status: 201,
    description: 'Itinerary added',
    type: PackageItinerary,
  })
  addItinerary(
    @Param('packageId') packageId: string,
    @Body() dto: CreatePackageItineraryDto,
  ) {
    return this.packagesService.addItinerary(packageId, dto);
  }

  @Put('itineraries/:itineraryId')
  @ApiOperation({
    summary: 'Update itinerary',
    description: 'Update an existing itinerary entry',
  })
  @ApiParam({ name: 'itineraryId', description: 'Itinerary UUID' })
  @ApiBody({ type: CreatePackageItineraryDto })
  @ApiResponse({
    status: 200,
    description: 'Itinerary updated',
    type: PackageItinerary,
  })
  updateItinerary(
    @Param('itineraryId') itineraryId: string,
    @Body() dto: Partial<CreatePackageItineraryDto>,
  ) {
    return this.packagesService.updateItinerary(itineraryId, dto);
  }

  @Delete('itineraries/:itineraryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete itinerary',
    description: 'Remove an itinerary entry from a package',
  })
  @ApiParam({ name: 'itineraryId', description: 'Itinerary UUID' })
  @ApiResponse({ status: 204, description: 'Itinerary deleted' })
  deleteItinerary(@Param('itineraryId') itineraryId: string) {
    return this.packagesService.deleteItinerary(itineraryId);
  }

  // ==================== PRICING ENDPOINTS ====================

  @Post(':packageId/pricing')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add pricing tier',
    description:
      'Add a pricing tier for specific number of persons (2-8). Validates against package minimum floor price.',
  })
  @ApiParam({ name: 'packageId', description: 'Package UUID' })
  @ApiBody({ type: CreatePackagePricingDto })
  @ApiResponse({
    status: 201,
    description: 'Pricing added',
    type: PackagePricing,
  })
  @ApiResponse({
    status: 400,
    description: 'Price below minimum or duplicate tier',
  })
  addPricing(
    @Param('packageId') packageId: string,
    @Body() dto: CreatePackagePricingDto,
  ) {
    return this.packagesService.addPricing(packageId, dto);
  }

  @Put('pricing/:pricingId')
  @ApiOperation({
    summary: 'Update pricing tier',
    description:
      'Update an existing pricing tier. Validates against package minimum floor price.',
  })
  @ApiParam({ name: 'pricingId', description: 'Pricing UUID' })
  @ApiBody({ type: UpdatePackagePricingDto })
  @ApiResponse({
    status: 200,
    description: 'Pricing updated',
    type: PackagePricing,
  })
  @ApiResponse({ status: 400, description: 'Price below minimum' })
  updatePricing(
    @Param('pricingId') pricingId: string,
    @Body() dto: UpdatePackagePricingDto,
  ) {
    return this.packagesService.updatePricing(pricingId, dto);
  }

  @Delete('pricing/:pricingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete pricing tier',
    description: 'Remove a pricing tier from a package',
  })
  @ApiParam({ name: 'pricingId', description: 'Pricing UUID' })
  @ApiResponse({ status: 204, description: 'Pricing deleted' })
  deletePricing(@Param('pricingId') pricingId: string) {
    return this.packagesService.deletePricing(pricingId);
  }

  @Put(':packageId/pricing/bulk')
  @ApiOperation({
    summary: 'Bulk update pricing tiers',
    description:
      'Replace all pricing tiers for a package with new ones. Useful for updating all prices at once (2-8 persons).',
  })
  @ApiParam({ name: 'packageId', description: 'Package UUID' })
  @ApiBody({ type: [CreatePackagePricingDto] })
  @ApiResponse({
    status: 200,
    description: 'All pricing tiers updated',
    type: [PackagePricing],
  })
  bulkUpdatePricing(
    @Param('packageId') packageId: string,
    @Body() pricingTiers: CreatePackagePricingDto[],
  ) {
    return this.packagesService.bulkUpdatePricing(packageId, pricingTiers);
  }

  @Get(':packageId/pricing/:numberOfPersons')
  @ApiOperation({
    summary: 'Get pricing for specific number of persons',
    description: 'Get the active pricing tier for a specific group size',
  })
  @ApiParam({ name: 'packageId', description: 'Package UUID' })
  @ApiParam({
    name: 'numberOfPersons',
    description: 'Number of persons (2-8)',
    example: 4,
  })
  @ApiResponse({
    status: 200,
    description: 'Pricing details',
    type: PackagePricing,
  })
  @ApiResponse({
    status: 404,
    description: 'No pricing found for this group size',
  })
  getPricingForPersons(
    @Param('packageId') packageId: string,
    @Param('numberOfPersons') numberOfPersons: number,
  ) {
    return this.packagesService.getPricingForPersons(
      packageId,
      numberOfPersons,
    );
  }

  // ==================== INCLUSION ENDPOINTS ====================

  @Post(':packageId/inclusions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add inclusion/exclusion',
    description: 'Add an inclusion or exclusion item to a package',
  })
  @ApiParam({ name: 'packageId', description: 'Package UUID' })
  @ApiBody({ type: CreatePackageInclusionDto })
  @ApiResponse({
    status: 201,
    description: 'Inclusion added',
    type: PackageInclusion,
  })
  addInclusion(
    @Param('packageId') packageId: string,
    @Body() dto: CreatePackageInclusionDto,
  ) {
    return this.packagesService.addInclusion(packageId, dto);
  }

  @Put('inclusions/:inclusionId')
  @ApiOperation({
    summary: 'Update inclusion',
    description: 'Update an existing inclusion/exclusion item',
  })
  @ApiParam({ name: 'inclusionId', description: 'Inclusion UUID' })
  @ApiBody({ type: CreatePackageInclusionDto })
  @ApiResponse({
    status: 200,
    description: 'Inclusion updated',
    type: PackageInclusion,
  })
  updateInclusion(
    @Param('inclusionId') inclusionId: string,
    @Body() dto: Partial<CreatePackageInclusionDto>,
  ) {
    return this.packagesService.updateInclusion(inclusionId, dto);
  }

  @Delete('inclusions/:inclusionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete inclusion',
    description: 'Remove an inclusion/exclusion item from a package',
  })
  @ApiParam({ name: 'inclusionId', description: 'Inclusion UUID' })
  @ApiResponse({ status: 204, description: 'Inclusion deleted' })
  deleteInclusion(@Param('inclusionId') inclusionId: string) {
    return this.packagesService.deleteInclusion(inclusionId);
  }

  // ==================== CUSTOM PACKAGES ====================

  @Post('custom')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create custom package',
    description:
      'Create a tailor-made package for a specific customer with custom itinerary and pricing',
  })
  @ApiBody({ type: CreateCustomPackageDto })
  @ApiResponse({
    status: 201,
    description: 'Custom package created',
    type: CustomPackage,
  })
  createCustomPackage(@Body() dto: CreateCustomPackageDto) {
    return this.packagesService.createCustomPackage(dto);
  }

  @Get('custom')
  @ApiOperation({
    summary: 'Get all custom packages',
    description: 'Retrieve all custom packages with optional filters',
  })
  @ApiQuery({ type: FilterCustomPackageDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'List of custom packages',
    type: [CustomPackage],
  })
  findAllCustomPackages(@Query() filterDto: FilterCustomPackageDto) {
    return this.packagesService.findAllCustomPackages(filterDto);
  }

  @Get('custom/reference/:reference')
  @ApiOperation({
    summary: 'Get custom package by reference',
    description: 'Retrieve a custom package using its reference code',
  })
  @ApiParam({
    name: 'reference',
    description: 'Reference code',
    example: 'CPKG-2024-0001',
  })
  @ApiResponse({
    status: 200,
    description: 'Custom package details',
    type: CustomPackage,
  })
  @ApiResponse({ status: 404, description: 'Custom package not found' })
  findCustomPackageByReference(@Param('reference') reference: string) {
    return this.packagesService.findCustomPackageByReference(reference);
  }

  @Get('custom/:id')
  @ApiOperation({
    summary: 'Get custom package by ID',
    description:
      'Retrieve detailed custom package information including itinerary',
  })
  @ApiParam({ name: 'id', description: 'Custom package UUID' })
  @ApiResponse({
    status: 200,
    description: 'Custom package details',
    type: CustomPackage,
  })
  @ApiResponse({ status: 404, description: 'Custom package not found' })
  findCustomPackageById(@Param('id') id: string) {
    return this.packagesService.findCustomPackageById(id);
  }

  @Put('custom/:id')
  @ApiOperation({
    summary: 'Update custom package',
    description:
      'Update custom package details, pricing, and customer information',
  })
  @ApiParam({ name: 'id', description: 'Custom package UUID' })
  @ApiBody({ type: UpdateCustomPackageDto })
  @ApiResponse({
    status: 200,
    description: 'Custom package updated',
    type: CustomPackage,
  })
  @ApiResponse({ status: 404, description: 'Custom package not found' })
  updateCustomPackage(
    @Param('id') id: string,
    @Body() dto: UpdateCustomPackageDto,
  ) {
    return this.packagesService.updateCustomPackage(id, dto);
  }

  @Patch('custom/:id/status')
  @ApiOperation({
    summary: 'Update custom package status',
    description:
      'Change custom package status (draft, quote_sent, negotiating, confirmed, cancelled, completed)',
  })
  @ApiParam({ name: 'id', description: 'Custom package UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          enum: [
            'draft',
            'quote_sent',
            'negotiating',
            'confirmed',
            'cancelled',
            'completed',
          ],
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated',
    type: CustomPackage,
  })
  updateCustomPackageStatus(
    @Param('id') id: string,
    @Body('status') status: CustomPackageStatus,
  ) {
    return this.packagesService.updateCustomPackageStatus(id, status);
  }

  @Patch('custom/:id/send-quote')
  @ApiOperation({
    summary: 'Send quote to customer',
    description: 'Set the quoted price and mark the package as quote sent',
  })
  @ApiParam({ name: 'id', description: 'Custom package UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quotedPricePerHead: { type: 'number', example: 8500 },
        totalQuotedPrice: { type: 'number', example: 51000 },
        validUntil: { type: 'string', format: 'date', example: '2024-02-28' },
      },
      required: ['quotedPricePerHead', 'totalQuotedPrice', 'validUntil'],
    },
  })
  @ApiResponse({ status: 200, description: 'Quote sent', type: CustomPackage })
  sendQuote(
    @Param('id') id: string,
    @Body()
    body: {
      quotedPricePerHead: number;
      totalQuotedPrice: number;
      validUntil: string;
    },
  ) {
    return this.packagesService.sendQuote(
      id,
      body.quotedPricePerHead,
      body.totalQuotedPrice,
      body.validUntil,
    );
  }

  @Patch('custom/:id/confirm')
  @ApiOperation({
    summary: 'Confirm custom package',
    description: 'Confirm the custom package with final agreed price',
  })
  @ApiParam({ name: 'id', description: 'Custom package UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { finalPrice: { type: 'number', example: 48000 } },
      required: ['finalPrice'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Package confirmed',
    type: CustomPackage,
  })
  confirmCustomPackage(
    @Param('id') id: string,
    @Body('finalPrice') finalPrice: number,
  ) {
    return this.packagesService.confirmCustomPackage(id, finalPrice);
  }

  @Delete('custom/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete custom package',
    description: 'Permanently delete a custom package and its itinerary',
  })
  @ApiParam({ name: 'id', description: 'Custom package UUID' })
  @ApiResponse({ status: 204, description: 'Custom package deleted' })
  @ApiResponse({ status: 404, description: 'Custom package not found' })
  deleteCustomPackage(@Param('id') id: string) {
    return this.packagesService.deleteCustomPackage(id);
  }

  // ==================== CUSTOM ITINERARY ENDPOINTS ====================

  @Post('custom/:customPackageId/itineraries')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add itinerary to custom package',
    description: 'Add a day-wise itinerary entry to a custom package',
  })
  @ApiParam({ name: 'customPackageId', description: 'Custom package UUID' })
  @ApiBody({ type: CreateCustomPackageItineraryDto })
  @ApiResponse({
    status: 201,
    description: 'Itinerary added',
    type: CustomPackageItinerary,
  })
  addCustomItinerary(
    @Param('customPackageId') customPackageId: string,
    @Body() dto: CreateCustomPackageItineraryDto,
  ) {
    return this.packagesService.addCustomItinerary(customPackageId, dto);
  }

  @Put('custom/itineraries/:itineraryId')
  @ApiOperation({
    summary: 'Update custom itinerary',
    description: 'Update an existing custom itinerary entry',
  })
  @ApiParam({ name: 'itineraryId', description: 'Itinerary UUID' })
  @ApiBody({ type: UpdateCustomPackageItineraryDto })
  @ApiResponse({
    status: 200,
    description: 'Itinerary updated',
    type: CustomPackageItinerary,
  })
  updateCustomItinerary(
    @Param('itineraryId') itineraryId: string,
    @Body() dto: UpdateCustomPackageItineraryDto,
  ) {
    return this.packagesService.updateCustomItinerary(itineraryId, dto);
  }

  @Delete('custom/itineraries/:itineraryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete custom itinerary',
    description: 'Remove an itinerary entry from a custom package',
  })
  @ApiParam({ name: 'itineraryId', description: 'Itinerary UUID' })
  @ApiResponse({ status: 204, description: 'Itinerary deleted' })
  deleteCustomItinerary(@Param('itineraryId') itineraryId: string) {
    return this.packagesService.deleteCustomItinerary(itineraryId);
  }
}
