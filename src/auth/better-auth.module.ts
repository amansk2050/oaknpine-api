import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BetterAuthService } from './better-auth.service';
import { BetterAuthGuard } from './guards/better-auth.guard';

/**
 * BetterAuthModule
 *
 * Provides:
 *  - BetterAuthService   — verifies sessions via the Next.js frontend
 *  - BetterAuthGuard     — registered as APP_GUARD (applies globally)
 *
 * Exports:
 *  - BetterAuthService   — so other modules can call verifySession() directly
 *
 * Decorators available globally (import from their file paths):
 *  - @CurrentUser()     → src/auth/decorators/current-user.decorator
 *  - @CurrentTenant()   → src/auth/decorators/current-tenant.decorator
 *  - @Public()          → src/auth/decorators/public.decorator
 */
@Module({
  imports: [ConfigModule],
  providers: [
    BetterAuthService,
    {
      /**
       * Register BetterAuthGuard as a global guard.
       * Every route is protected by default. Use @Public() to opt out.
       */
      provide: APP_GUARD,
      useClass: BetterAuthGuard,
    },
  ],
  exports: [BetterAuthService],
})
export class BetterAuthModule {}
