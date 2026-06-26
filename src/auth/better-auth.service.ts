import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface BetterAuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BetterAuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  activeOrganizationId?: string | null;
}

export interface BetterAuthSessionResponse {
  user: BetterAuthUser;
  session: BetterAuthSession;
}

/**
 * BetterAuthService — verifies sessions by calling the Next.js better-auth endpoint.
 *
 * Flow:
 *   Client request → NestJS API
 *     → BetterAuthGuard → BetterAuthService.verifySession()
 *       → GET {FRONTEND_URL}/api/auth/get-session (with session cookie / Bearer token)
 *         → returns { user, session } or null
 */
@Injectable()
export class BetterAuthService {
  private readonly logger = new Logger(BetterAuthService.name);
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
  }

  /**
   * Verifies a session token against the better-auth endpoint.
   *
   * @param token  - Bearer token extracted from Authorization header
   * @param cookie - Raw Cookie header (fallback for cookie-based sessions)
   * @returns      - Parsed session+user payload or null if invalid
   */
  async verifySession(
    token?: string,
    cookie?: string,
  ): Promise<BetterAuthSessionResponse | null> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (cookie) {
        headers['Cookie'] = cookie;
      }

      const response = await axios.get<BetterAuthSessionResponse>(
        `${this.frontendUrl}/api/auth/get-session`,
        {
          headers,
          timeout: 5000,
          validateStatus: (status) => status < 500,
        },
      );

      if (response.status !== 200 || !response.data?.user) {
        return null;
      }

      return response.data;
    } catch (error) {
      this.logger.warn(
        `Session verification failed: ${(error as Error).message}`,
      );
      return null;
    }
  }
}
