import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * BetterAuthGuard — global guard for PineZone API.
 *
 * Validates every request by looking up the session token directly in the
 * database via AuthService.getSession(). No HTTP round-trips to any external
 * service — entirely self-contained in the NestJS backend.
 *
 * Token sources (in priority order):
 *  1. Authorization: Bearer <token>
 *  2. Cookie: pz_session=<token>
 *
 * After validation, attaches to the request:
 *  - req.user     → AuthUser
 *  - req.session  → AuthSession
 *  - req.tenantId → activeOrganizationId (multitenancy)
 *
 * Routes decorated with @Public() bypass this guard entirely.
 */
@Injectable()
export class BetterAuthGuard implements CanActivate {
  private readonly logger = new Logger(BetterAuthGuard.name);

  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();

    // 1. Try Authorization header
    const authHeader = request.headers['authorization'];
    let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    // 2. Fallback to cookie
    if (!token) {
      const cookieHeader = request.headers['cookie'] ?? '';
      const match = cookieHeader.match(/pz_session=([^;]+)/);
      token = match?.[1] ?? null;
    }

    if (token) {
      try {
        const sessionData = await this.authService.getSession(token);
        if (sessionData) {
          (request as any).user = sessionData.user;
          (request as any).session = sessionData.session;

          let tenantId = sessionData.session.activeOrganizationId ?? null;
          if (!tenantId) {
            // Fallback: Check if the user belongs to any organization
            const fallbackTenantId = await this.authService.getUserOrganization(
              sessionData.user.id,
            );
            if (fallbackTenantId) {
              tenantId = fallbackTenantId;
              await this.authService.setActiveOrganization(token, tenantId);
              (request as any).session.activeOrganizationId = tenantId;
            }
          }
          (request as any).tenantId = tenantId;

          this.logger.debug(
            `Auth OK (Session Resolved): ${sessionData.user.email} | tenant: ${(request as any).tenantId ?? 'none'}`,
          );
        }
      } catch (err) {
        if (!isPublic) {
          throw err;
        }
        this.logger.debug(`Bypassed session error on public route: ${err.message}`);
      }
    }

    if (isPublic) return true;

    if (!token || !(request as any).user) {
      throw new UnauthorizedException('No authentication credentials provided');
    }

    return true;
  }
}
