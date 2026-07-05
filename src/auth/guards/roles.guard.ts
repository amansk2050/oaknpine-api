import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard — enforces role-based access at the NestJS guard layer.
 *
 * Apply alongside the global BetterAuthGuard using @UseGuards(RolesGuard)
 * on controller methods that require a specific role, combined with the
 * @Roles(...) decorator.
 *
 * Example:
 *   @UseGuards(RolesGuard)
 *   @Roles('super_admin')
 *   @Get('super-admin/statistics')
 *   getSuperAdminStatistics() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.roleType)) {
      throw new ForbiddenException('Insufficient privileges');
    }

    return true;
  }
}
