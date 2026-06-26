import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() decorator
 *
 * Marks a route or controller as publicly accessible —
 * bypasses the BetterAuthGuard entirely.
 *
 * Usage:
 *   @Public()
 *   @Get('health')
 *   healthCheck() { return { status: 'ok' }; }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
