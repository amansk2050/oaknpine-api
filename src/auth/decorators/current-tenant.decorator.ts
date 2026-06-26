import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentTenant() decorator
 *
 * Extracts the active organization ID (tenant) from the request object.
 * This is set by BetterAuthGuard from session.activeOrganizationId.
 *
 * Usage:
 *   @Get('bookings')
 *   getBookings(@CurrentTenant() tenantId: string) {
 *     return this.bookingService.findAll(tenantId);
 *   }
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId ?? null;
  },
);
