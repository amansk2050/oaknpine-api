import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Request,
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
import {
  CreateB2bInvitationDto,
  AcceptB2bInvitationDto,
  UpdateBookingTagDto,
  CreatePartnerBookingRequestDto,
} from './dto/b2b-invitation.dto';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('B2B Integration')
@Controller('b2b')
export class B2bController {
  constructor(private readonly b2bService: B2bService) {}

  /* ─── Legacy: Protected Routes (Workspace Owner context) ─── */

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Legacy] Generate a new B2B Partner link' })
  @ApiResponse({ status: 201, description: 'Partner created successfully.' })
  @Post('partners')
  async createPartner(
    @Body() dto: CreateB2bPartnerDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.b2bService.createPartner(dto, tenantId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Legacy] List all B2B partners' })
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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking tag (soft_block / blocked_unpaid / blocked_paid)' })
  @ApiResponse({ status: 200, description: 'Tag updated.' })
  @Patch('requests/:id/tag')
  @HttpCode(HttpStatus.OK)
  async updateBookingTag(
    @Param('id') id: string,
    @Body() dto: UpdateBookingTagDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.b2bService.updateBookingTag(id, dto, tenantId);
  }

  /* ─── NEW: Invitation routes (Business side) ─── */

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a B2B partner invitation' })
  @ApiResponse({ status: 201, description: 'Invitation created.' })
  @Post('invitations')
  async createInvitation(
    @Body() dto: CreateB2bInvitationDto,
    @CurrentTenant() tenantId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    // Get business name from org (use tenantId to look up)
    const businessName = req.user?.organizationName || req.user?.name || 'Business';
    return this.b2bService.createInvitation(dto, tenantId, userId, businessName);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all invitations for the organization' })
  @ApiResponse({ status: 200, description: 'List of invitations.' })
  @Get('invitations')
  async findInvitations(@CurrentTenant() tenantId: string) {
    return this.b2bService.findInvitations(tenantId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all active B2B partner memberships for the organization' })
  @ApiResponse({ status: 200, description: 'List of active memberships.' })
  @Get('memberships')
  async findOrganizationMemberships(@CurrentTenant() tenantId: string) {
    return this.b2bService.findOrganizationMemberships(tenantId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke an invitation' })
  @ApiResponse({ status: 200, description: 'Invitation revoked.' })
  @Delete('invitations/:id')
  @HttpCode(HttpStatus.OK)
  async revokeInvitation(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.b2bService.revokeInvitation(id, tenantId);
  }

  /* ─── NEW: Partner-side routes (B2B Partner context) ─── */

  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated partner's dashboard data" })
  @ApiResponse({ status: 200, description: 'Partner dashboard data.' })
  @Get('partner/dashboard')
  async getPartnerDashboard(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.b2bService.getPartnerDashboard(userId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the partner's memberships (list of businesses)" })
  @ApiResponse({ status: 200, description: 'List of memberships.' })
  @Get('partner/memberships')
  async getPartnerMemberships(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.b2bService.getPartnerMemberships(userId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Get partner's booking requests (all businesses or filtered)" })
  @ApiResponse({ status: 200, description: 'Partner booking requests.' })
  @Get('partner/requests')
  async getPartnerBookingRequests(
    @Request() req: any,
    @Query('membershipId') membershipId?: string,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.b2bService.getPartnerBookingRequests(userId, membershipId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a booking request as an authenticated B2B partner' })
  @ApiResponse({ status: 201, description: 'Booking request submitted.' })
  @Post('partner/requests')
  async submitPartnerBookingRequest(
    @Body() dto: CreatePartnerBookingRequestDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.b2bService.submitPartnerBookingRequest(userId, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get homestays for a specific business (partner side)' })
  @ApiResponse({ status: 200, description: 'List of homestays.' })
  @Get('partner/memberships/:membershipId/homestays')
  async getHomestaysForBusiness(
    @Param('membershipId') membershipId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.b2bService.getHomestaysForBusiness(userId, membershipId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a B2B invitation (authenticated user)' })
  @ApiResponse({ status: 200, description: 'Invitation accepted, membership created.' })
  @Post('invitations/:token/accept')
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(
    @Param('token') token: string,
    @Body() dto: AcceptB2bInvitationDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.b2bService.acceptInvitation(token, userId, dto);
  }

  /* ─── Public Routes (for invitation landing page) ─── */

  @Public()
  @ApiOperation({ summary: 'Get invitation details by token (public)' })
  @ApiResponse({ status: 200, description: 'Invitation details.' })
  @ApiParam({ name: 'token', description: 'Invitation token from the link' })
  @Get('public/invitation/:token')
  async getInvitationByToken(@Param('token') token: string) {
    const invitation = await this.b2bService.getInvitationByToken(token);
    // Return only public-safe fields
    return {
      id: invitation.id,
      businessName: invitation.businessName,
      invitedEmail: invitation.invitedEmail,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    };
  }

  /* ─── Legacy Public Routes (Partner Portal context) ─── */

  @Public()
  @ApiOperation({ summary: '[Legacy] Get B2B Partner Portal details by unique slug' })
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
    summary: '[Legacy] Submit a booking request via public partner portal',
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
