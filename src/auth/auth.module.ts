import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BetterAuthGuard } from './guards/better-auth.guard';

/**
 * AuthModule — PineZone authentication & authorization
 *
 * All auth lives here:
 *  - AuthService    — sign-up, sign-in, session management, org creation, password reset
 *  - AuthController — REST endpoints at /api/v1/auth/*
 *  - BetterAuthGuard — global guard applied to all routes (use @Public() to opt out)
 *
 * Session tokens are stored in the `session` table (compatible with better-auth schema).
 * Passwords are hashed with bcrypt (saltRounds = 12).
 *
 * Decorators (import directly from their files):
 *  - @CurrentUser()   src/auth/decorators/current-user.decorator
 *  - @CurrentTenant() src/auth/decorators/current-tenant.decorator
 *  - @Public()        src/auth/decorators/public.decorator
 */
@Module({
  imports: [
    // Required for @InjectDataSource() in AuthService
    TypeOrmModule.forFeature([]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: BetterAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
