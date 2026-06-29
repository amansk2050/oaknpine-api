import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { PackageBookingService } from './package-booking.service';
import { PackageBooking } from './entities/package-booking.entity';
import { CreatePackageBookingDto } from './dto/create-package-booking.dto';
import { UpdatePackageBookingDto } from './dto/update-package-booking.dto';
import { UpdatePackageBookingStatusDto } from './dto/update-package-booking-status.dto';
import { FilterPackageBookingDto } from './dto/filter-package-booking.dto';
import { AddPaymentDto } from './dto/add-payment.dto';

@ApiTags('Package Bookings')
@Controller('package-bookings')
export class PackageBookingController {
  constructor(private readonly packageBookingService: PackageBookingService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new package booking' })
  @ApiResponse({
    status: 201,
    description: 'Package booking created successfully',
    type: PackageBooking,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Lead or Package not found' })
  @ApiResponse({ status: 409, description: 'Room not available' })
  async createPackageBooking(
    @Body() createDto: CreatePackageBookingDto,
    @CurrentTenant() tenantId?: string,
  ): Promise<PackageBooking> {
    return await this.packageBookingService.createPackageBooking(createDto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all package bookings with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of package bookings',
    type: [PackageBooking],
  })
  async findAllPackageBookings(
    @Query() filterDto: FilterPackageBookingDto,
    @CurrentTenant() tenantId: string,
  ): Promise<PackageBooking[]> {
    return await this.packageBookingService.findAllPackageBookings(filterDto, tenantId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get package booking statistics' })
  @ApiQuery({ name: 'packageId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Booking statistics' })
  async getStatistics(
    @Query('packageId') packageId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.packageBookingService.getPackageBookingStatistics(
      packageId,
      tenantId,
    );
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming package bookings' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 7 })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming bookings',
    type: [PackageBooking],
  })
  async getUpcomingBookings(
    @Query('days') days: number,
    @CurrentTenant() tenantId: string,
  ): Promise<PackageBooking[]> {
    return await this.packageBookingService.getUpcomingPackageBookings(days, tenantId);
  }

  @Get('reference/:reference')
  @ApiOperation({ summary: 'Get package booking by reference number' })
  @ApiParam({ name: 'reference', example: 'PKG-2024-0001' })
  @ApiResponse({
    status: 200,
    description: 'Package booking found',
    type: PackageBooking,
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findByReference(
    @Param('reference') reference: string,
    @CurrentTenant() tenantId: string,
  ): Promise<PackageBooking> {
    return await this.packageBookingService.findPackageBookingByReference(
      reference,
      tenantId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get package booking by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Package booking found',
    type: PackageBooking,
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findPackageBookingById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<PackageBooking> {
    return await this.packageBookingService.findPackageBookingById(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update package booking' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Booking updated',
    type: PackageBooking,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updatePackageBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePackageBookingDto,
    @CurrentTenant() tenantId: string,
  ): Promise<PackageBooking> {
    return await this.packageBookingService.updatePackageBooking(id, updateDto, tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update package booking status' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Status updated',
    type: PackageBooking,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdatePackageBookingStatusDto,
    @CurrentTenant() tenantId: string,
  ): Promise<PackageBooking> {
    return await this.packageBookingService.updatePackageBookingStatus(
      id,
      updateStatusDto,
      tenantId,
    );
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add payment to package booking' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Payment added',
    type: PackageBooking,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async addPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() paymentDto: AddPaymentDto,
    @CurrentTenant() tenantId: string,
  ): Promise<PackageBooking> {
    return await this.packageBookingService.addPayment(id, paymentDto, tenantId);
  }
}
