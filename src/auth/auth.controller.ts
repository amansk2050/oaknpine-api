import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { CreateOrganizationDto } from './dto/create-org.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateOrganizationDto } from './dto/update-org.dto';
import { CurrentTenant } from './decorators/current-tenant.decorator';
import { AuthUser } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* ── Sign Up ─────────────────────────────────────────────────────────── */
  @Public()
  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  async signUp(@Body() dto: SignUpDto, @Req() req: Request) {
    return this.authService.signUp(dto, req.ip, req.headers['user-agent']);
  }

  /* ── Sign In ─────────────────────────────────────────────────────────── */
  @Public()
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  async signIn(@Body() dto: SignInDto, @Req() req: Request) {
    return this.authService.signIn(dto, req.ip, req.headers['user-agent']);
  }

  /* ── Get Session ─────────────────────────────────────────────────────── */
  @Get('session')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current session and user' })
  async getSession(@Req() req: Request) {
    // At this point BetterAuthGuard has already validated the token
    // and attached user + session to the request
    return {
      user: (req as any).user,
      session: (req as any).session,
    };
  }

  /* ── Sign Out ────────────────────────────────────────────────────────── */
  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Invalidate current session' })
  async signOut(@Req() req: Request) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;
    if (token) {
      await this.authService.signOut(token);
    }
    return { message: 'Signed out successfully' };
  }

  /* ── Create Organization ─────────────────────────────────────────────── */
  @Post('organization/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new organization (workspace)' })
  async createOrganization(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.authService.createOrganization(user.id, dto);
  }

  /* ── Get Active Organization ─────────────────────────────────────────── */
  @Get('organization/current')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get details of the current organization' })
  async getCurrentOrganization(@CurrentTenant() tenantId: string) {
    if (!tenantId) {
      throw new NotFoundException('No active organization found');
    }
    return this.authService.getOrganization(tenantId);
  }

  /* ── Get Public Organization Info (branding details for customer pages) ── */
  @Public()
  @Get('organization/public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get details of the public organization' })
  async getPublicOrganization(
    @Query('orgId') orgId?: string,
    @Query('slug') slug?: string,
  ) {
    const org = await this.authService.getPublicOrganization(orgId, slug);
    if (!org) {
      throw new NotFoundException('No organization found');
    }
    return org;
  }

  /* ── Update Active Organization ──────────────────────────────────────── */
  @Patch('organization/current')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current organization details' })
  async updateCurrentOrganization(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    if (!tenantId) {
      throw new NotFoundException('No active organization found');
    }
    return this.authService.updateOrganization(tenantId, dto);
  }

  /* ── Request Password Reset ──────────────────────────────────────────── */
  @Public()
  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  /* ── Reset Password ──────────────────────────────────────────────────── */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /* ── Get Profile ─────────────────────────────────────────────────────── */
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile details' })
  async getProfile(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user.id);
  }

  /* ── Update Profile ──────────────────────────────────────────────────── */
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user profile (e.g. roleType)' })
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  /* ── Super Admin Statistics ──────────────────────────────────────────── */
  @Get('super-admin/statistics')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get global analytics for super admins' })
  async getSuperAdminStatistics(@CurrentUser() user: AuthUser) {
    if (user.roleType !== 'super_admin') {
      throw new UnauthorizedException('Super admin privileges required');
    }
    return this.authService.getSuperAdminStatistics();
  }

  @Get('super-admin/homestays')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all homestays globally for super admins' })
  async getSuperAdminHomestays(@CurrentUser() user: AuthUser) {
    if (user.roleType !== 'super_admin') {
      throw new UnauthorizedException('Super admin privileges required');
    }
    return this.authService.getSuperAdminHomestays();
  }

  @Get('super-admin/bookings')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all bookings globally for super admins' })
  async getSuperAdminBookings(@CurrentUser() user: AuthUser) {
    if (user.roleType !== 'super_admin') {
      throw new UnauthorizedException('Super admin privileges required');
    }
    return this.authService.getSuperAdminBookings();
  }
}
