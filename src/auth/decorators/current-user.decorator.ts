import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { BetterAuthUser } from '../better-auth.service';

/**
 * @CurrentUser() decorator
 *
 * Extracts the authenticated user from the request object (set by BetterAuthGuard).
 *
 * Usage:
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: BetterAuthUser) {
 *     return user;
 *   }
 *
 * Optionally extract a specific field:
 *   @CurrentUser('email') email: string
 */
export const CurrentUser = createParamDecorator(
  (field: keyof BetterAuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: BetterAuthUser = request.user;
    return field ? user?.[field] : user;
  },
);
