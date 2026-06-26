import {
  Controller,
  Get,
  Post,
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
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { B2bService } from './b2b.service';
import { CreateB2bPartnerDto } from './dto/create-b2b-partner.dto';
import { CreateB2bBookingRequestDto } from './dto/create-b2b-booking-request.dto';
import {
  AcceptB2bBookingRequestDto,
  RejectB2bBookingRequestDto,
} from './dto/accept-b2b-booking-request.dto';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('B2B Integration')
@Controller('b2b')
export class B2bController {
  constructor(private readonly b2bService: B2bService) {}

  /* ─── Protected Routes (Workspace Owner / operator context) ─── */

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a new B2B Partner link' })
  @ApiResponse({ status: 201, description: 'Partner created successfully.' })
  @Post('partners')
  async createPartner(
    @Body() dto: CreateB2bPartnerDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.b2bService.createPartner(dto, tenantId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all B2B partners' })
  @ApiResponse({ status: 200, description: 'Return list of partners.' })
  @Get('partners')
  async findAllPartners(@CurrentTenant() tenantId: string) {
    return this.b2bService.findAllPartners(tenantId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List pending/chronological requests queue' })
  @ApiResponse({ status: 200, description: 'Return requests queue.' })
  @Get('requests')
  async findBookingRequests(
    @CurrentTenant() tenantId: string,
    @Query('sortBy') sortBy?: 'checkInDate' | 'createdAt',
  ) {
    return this.b2bService.findBookingRequests(
      tenantId,
      sortBy || 'checkInDate',
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Accept a B2B booking request and create room booking',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking request accepted and booking created.',
  })
  @Post('requests/:id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptBookingRequest(
    @Param('id') id: string,
    @Body() dto: AcceptB2bBookingRequestDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.b2bService.acceptBookingRequest(id, dto, tenantId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a B2B booking request' })
  @ApiResponse({ status: 200, description: 'Booking request rejected.' })
  @Post('requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectBookingRequest(
    @Param('id') id: string,
    @Body() dto: RejectB2bBookingRequestDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.b2bService.rejectBookingRequest(
      id,
      dto.rejectionReason,
      tenantId,
    );
  }

  /* ─── Public Routes (Partner Portal context) ─── */

  @Public()
  @ApiOperation({ summary: 'Get B2B Partner Portal details by unique slug' })
  @ApiResponse({
    status: 200,
    description: 'Return partner portal configuration.',
  })
  @ApiParam({ name: 'slug', description: 'Unique slug of the B2B partner' })
  @Get('public/portal/:slug')
  async getPortalDetails(@Param('slug') slug: string) {
    return this.b2bService.getPortalDetails(slug);
  }

  @Public()
  @ApiOperation({
    summary: 'Submit a booking request via public partner portal',
  })
  @ApiResponse({
    status: 201,
    description: 'Booking request submitted successfully.',
  })
  @ApiParam({ name: 'slug', description: 'Unique slug of the B2B partner' })
  @Post('public/request/:slug')
  async submitBookingRequest(
    @Param('slug') slug: string,
    @Body() dto: CreateB2bBookingRequestDto,
  ) {
    return this.b2bService.submitBookingRequest(slug, dto);
  }
}
