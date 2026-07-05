import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID, randomBytes, scrypt } from 'crypto';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { CreateOrganizationDto } from './dto/create-org.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EmailService } from '../email/email.service';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  roleType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  activeOrganizationId: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  session: AuthSession;
  token: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectDataSource() private readonly db: DataSource,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    try {
      // 1. Create Core Auth Tables if they do not exist (better-auth compatibility)
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS "user" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
            image TEXT,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS "session" (
            id TEXT PRIMARY KEY,
            "expiresAt" TIMESTAMP NOT NULL,
            token TEXT NOT NULL UNIQUE,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            "ipAddress" TEXT,
            "userAgent" TEXT,
            "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
            "activeOrganizationId" TEXT
        );
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS "account" (
            id TEXT PRIMARY KEY,
            "accountId" TEXT NOT NULL,
            "providerId" TEXT NOT NULL,
            "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
            "accessToken" TEXT,
            "refreshToken" TEXT,
            "idToken" TEXT,
            "accessTokenExpiresAt" TIMESTAMP,
            "refreshTokenExpiresAt" TIMESTAMP,
            scope TEXT,
            password TEXT,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS "verification" (
            id TEXT PRIMARY KEY,
            identifier TEXT NOT NULL,
            value TEXT NOT NULL,
            "expiresAt" TIMESTAMP NOT NULL,
            "createdAt" TIMESTAMP DEFAULT now(),
            "updatedAt" TIMESTAMP DEFAULT now()
        );
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS "organization" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT UNIQUE,
            logo TEXT,
            metadata TEXT,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS "member" (
            id TEXT PRIMARY KEY,
            "organizationId" TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
            "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
            role TEXT NOT NULL DEFAULT 'member',
            "createdAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS "invitation" (
            id TEXT PRIMARY KEY,
            "organizationId" TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            role TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            "expiresAt" TIMESTAMP NOT NULL,
            "inviterId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
        );
      `);

      // Create Indexes
      await this.db.query(`CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId")`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId")`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS "member_userId_idx" ON "member"("userId")`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS "member_organizationId_idx" ON "member"("organizationId")`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS "invitation_organizationId_idx" ON "invitation"("organizationId")`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"(identifier)`);

      this.logger.log('Database schema checked: Core auth tables and indexes ensured.');

      // 2. Ensure extra columns exist (migrations/updates)
      await this.db.query(
        `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "roleType" VARCHAR(50)`,
      );
      this.logger.log(
        'Database schema checked: "roleType" column ensured in "user" table.',
      );

      // 2b. B2B Invitation & Partner Account tables
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS "b2b_invitations" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "organizationId" VARCHAR(255) NOT NULL,
          "businessName" VARCHAR(255) NOT NULL,
          "invitedEmail" VARCHAR(255) NOT NULL,
          "invitationToken" VARCHAR(128) UNIQUE NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          "expiresAt" TIMESTAMP NOT NULL,
          "invitedByUserId" VARCHAR(255),
          "partnerAccountId" UUID,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS "b2b_partner_accounts" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" VARCHAR(255) UNIQUE NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS "b2b_partner_memberships" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "partnerAccountId" UUID NOT NULL REFERENCES b2b_partner_accounts(id) ON DELETE CASCADE,
          "organizationId" VARCHAR(255) NOT NULL,
          "invitationId" UUID,
          "businessName" VARCHAR(255) NOT NULL,
          "partnerBusinessName" VARCHAR(255),
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          "totalBookingsSent" INT NOT NULL DEFAULT 0,
          notes TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);

      // Extend b2b_booking_requests with new columns
      await this.db.query(`
        ALTER TABLE b2b_booking_requests
          ADD COLUMN IF NOT EXISTS "bookingTag" VARCHAR(30),
          ADD COLUMN IF NOT EXISTS "partnerAccountId" UUID,
          ADD COLUMN IF NOT EXISTS "partnerMembershipId" UUID;
      `).catch(() => {}); // Table may not exist yet if fresh install, entities will create it

      await this.db.query(`
        ALTER TABLE b2b_booking_requests ALTER COLUMN "partnerId" DROP NOT NULL;
      `).catch(() => {});

      await this.db.query(`
        UPDATE b2b_partner_memberships pm
        SET "partnerBusinessName" = COALESCE(
          NULLIF((SELECT u.name FROM "user" u JOIN b2b_partner_accounts pa ON pa."userId" = u.id WHERE pa.id = pm."partnerAccountId"), ''),
          (SELECT u.email FROM "user" u JOIN b2b_partner_accounts pa ON pa."userId" = u.id WHERE pa.id = pm."partnerAccountId"),
          'B2B Partner'
        )
        WHERE pm."partnerBusinessName" IS NULL OR pm."partnerBusinessName" = '';
      `).catch(() => {});

      await this.db.query(`CREATE INDEX IF NOT EXISTS "b2b_inv_org_idx" ON "b2b_invitations"("organizationId")`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS "b2b_inv_token_idx" ON "b2b_invitations"("invitationToken")`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS "b2b_pa_user_idx" ON "b2b_partner_accounts"("userId")`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS "b2b_pm_partner_idx" ON "b2b_partner_memberships"("partnerAccountId")`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS "b2b_pm_org_idx" ON "b2b_partner_memberships"("organizationId")`);

      this.logger.log('Database schema checked: B2B invitation and partner tables ensured.');

      // Business Profile additions to organization table
      await this.db.query(
        `ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50)`,
      );
      await this.db.query(
        `ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "email" VARCHAR(255)`,
      );
      await this.db.query(
        `ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "website" VARCHAR(255)`,
      );
      await this.db.query(
        `ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "address" TEXT`,
      );
      await this.db.query(
        `ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "gstin" VARCHAR(50)`,
      );
      await this.db.query(
        `ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "description" TEXT`,
      );
      await this.db.query(
        `ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "logo" VARCHAR(255)`,
      );
      await this.db.query(
        `ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`,
      );
      await this.db.query(
        `ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "isSubscribed" BOOLEAN NOT NULL DEFAULT TRUE`,
      );
      this.logger.log(
        'Database schema checked: organization business profile columns and isSubscribed ensured.',
      );

      // Backfill any homestays with NULL ownerId to the first available member user ID so they appear in Super Admin stats
      await this.db.query(
        `UPDATE homestays 
         SET "ownerId" = (SELECT "userId" FROM member LIMIT 1) 
         WHERE "ownerId" IS NULL AND (SELECT COUNT(*) FROM member) > 0`,
      );
      this.logger.log('Database schema checked: homestay ownerId backfilled.');

      // Ensure organization_id columns are type VARCHAR(255) to support string-based organization IDs (non-UUID)
      const tablesToAlter = [
        'homestays',
        'packages',
        'custom_packages',
        'leads',
        'bookings',
        'package_bookings',
        'booking_expenses',
      ];
      for (const table of tablesToAlter) {
        try {
          await this.db.query(
            `ALTER TABLE "${table}" ALTER COLUMN "organization_id" TYPE VARCHAR(255) USING "organization_id"::VARCHAR(255)`,
          );
        } catch (alterErr) {
          this.logger.debug(`Could not alter organization_id for ${table}: ${alterErr.message}`);
        }
      }

      // Backfill any NULL organization_id to the first available organization ID
      const [firstOrg] = await this.db.query<any[]>(
        `SELECT id FROM organization LIMIT 1`,
      );
      if (firstOrg?.id) {
        const orgId = firstOrg.id;
        await this.db.query(
          `UPDATE homestays SET "organization_id" = $1 WHERE "organization_id" IS NULL`,
          [orgId],
        );
        await this.db.query(
          `UPDATE packages SET "organization_id" = $1 WHERE "organization_id" IS NULL`,
          [orgId],
        );
        await this.db.query(
          `UPDATE custom_packages SET "organization_id" = $1 WHERE "organization_id" IS NULL`,
          [orgId],
        );
        await this.db.query(
          `UPDATE leads SET "organization_id" = $1 WHERE "organization_id" IS NULL`,
          [orgId],
        );
        await this.db.query(
          `UPDATE bookings SET "organization_id" = $1 WHERE "organization_id" IS NULL`,
          [orgId],
        );
        await this.db.query(
          `UPDATE package_bookings SET "organization_id" = $1 WHERE "organization_id" IS NULL`,
          [orgId],
        );
        await this.db.query(
          `UPDATE booking_expenses SET "organization_id" = $1 WHERE "organization_id" IS NULL`,
          [orgId],
        );
        this.logger.log('Database schema checked: all NULL organizationIds backfilled.');

        try {
          // First, link any orphaned payments
          await this.db.query(`
            UPDATE payments 
            SET package_booking_id = pb.id
            FROM package_bookings pb
            WHERE payments.package_booking_id IS NULL 
              AND (
                payments.notes = 'Payment for package booking ' || pb.booking_reference
                OR payments.notes LIKE '%' || pb.booking_reference || '%'
              )
          `);

          // Fetch all package bookings with paid amount
          const packageBookings = await this.db.query<any[]>(`
            SELECT id, booking_reference as "bookingReference", paid_amount as "paidAmount", created_at as "createdAt"
            FROM package_bookings
            WHERE paid_amount > 0
          `);

          for (const pb of packageBookings) {
            const payments = await this.db.query<any[]>(`
              SELECT id, amount, "paymentReference"
              FROM payments
              WHERE package_booking_id = $1
            `, [pb.id]);

            const manualPayments = payments.filter(p => !p.paymentReference.startsWith('PAY-PKG-INIT-'));
            const initPayment = payments.find(p => p.paymentReference.startsWith('PAY-PKG-INIT-'));

            const sumManual = manualPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const targetInitAmount = Number(pb.paidAmount) - sumManual;

            if (targetInitAmount > 0) {
              if (initPayment) {
                await this.db.query(`
                  UPDATE payments
                  SET amount = $1
                  WHERE id = $2
                `, [targetInitAmount, initPayment.id]);
              } else {
                await this.db.query(`
                  INSERT INTO payments (id, package_booking_id, "paymentReference", amount, "paymentMethod", "paymentType", status, "recordedBy", "paymentDate", notes)
                  VALUES (gen_random_uuid(), $1, $2, $3, 'other', 'full', 'completed', 'system', $4, 'Initial backfilled payment')
                `, [pb.id, `PAY-PKG-INIT-${pb.bookingReference}`, targetInitAmount, pb.createdAt]);
              }
            } else {
              if (initPayment) {
                await this.db.query(`
                  DELETE FROM payments
                  WHERE id = $1
                `, [initPayment.id]);
              }
            }
          }
          this.logger.log('Database schema checked: package booking payments reconciled and healed.');
        } catch (pbPayErr) {
          this.logger.debug(`Could not backfill/reconcile payments for package bookings: ${pbPayErr.message}`);
        }
      }
    } catch (err) {
      this.logger.error(
        'Failed to run migration checks in auth onModuleInit',
        err.stack,
      );
    }
  }

  /* ─── helpers ────────────────────────────────────────────────────────── */

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const key = await new Promise<Buffer>((resolve, reject) => {
      scrypt(
        password.normalize('NFKC'),
        salt,
        64, // dkLen
        {
          N: 16384,
          r: 16,
          p: 1,
          maxmem: 128 * 16384 * 16 * 2,
        },
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        },
      );
    });
    return `${salt}:${key.toString('hex')}`;
  }

  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    if (hash.startsWith('$2')) {
      return bcrypt.compare(password, hash);
    }
    const parts = hash.split(':');
    if (parts.length !== 2) return false;
    const [salt, key] = parts;
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      scrypt(
        password.normalize('NFKC'),
        salt,
        64, // dkLen
        {
          N: 16384,
          r: 16,
          p: 1,
          maxmem: 128 * 16384 * 16 * 2,
        },
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        },
      );
    });
    return derivedKey.toString('hex') === key;
  }

  private generateToken(bytes = 32): string {
    return randomBytes(bytes).toString('hex');
  }

  private sessionExpiry(days = 7): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }

  private buildAuthResponse(
    user: any,
    session: any,
    token: string,
  ): AuthResponse {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified ?? false,
        image: user.image ?? null,
        roleType: user.roleType ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      session: {
        id: session.id,
        userId: session.userId,
        token,
        expiresAt: session.expiresAt,
        activeOrganizationId: session.activeOrganizationId ?? null,
      },
      token,
    };
  }

  /* ─── sign up ────────────────────────────────────────────────────────── */

  async signUp(
    dto: SignUpDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    // Check duplicate email
    const [existing] = await this.db.query<{ id: string }[]>(
      `SELECT id FROM "user" WHERE email = $1 LIMIT 1`,
      [dto.email.toLowerCase().trim()],
    );
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const now = new Date();
    const userId = randomUUID();
    const accountId = randomUUID();
    const sessionId = randomUUID();
    const sessionToken = this.generateToken();
    const hashedPassword = await this.hashPassword(dto.password);
    const expiresAt = this.sessionExpiry();

    // Create user
    await this.db.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        dto.name.trim(),
        dto.email.toLowerCase().trim(),
        false,
        now,
        now,
      ],
    );

    // Create account (credential provider — stores hashed password)
    await this.db.query(
      `INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        accountId,
        dto.email.toLowerCase().trim(),
        'credential',
        userId,
        hashedPassword,
        now,
        now,
      ],
    );

    // Create session
    await this.db.query(
      `INSERT INTO session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        sessionId,
        expiresAt,
        sessionToken,
        now,
        now,
        ipAddress ?? null,
        userAgent ?? null,
        userId,
      ],
    );

    this.logger.log(`New user registered: ${dto.email}`);

    return this.buildAuthResponse(
      {
        id: userId,
        name: dto.name.trim(),
        email: dto.email.toLowerCase().trim(),
        emailVerified: false,
        image: null,
        roleType: null,
        createdAt: now,
        updatedAt: now,
      },
      { id: sessionId, userId, expiresAt, activeOrganizationId: null },
      sessionToken,
    );
  }

  /* ─── sign in ────────────────────────────────────────────────────────── */

  async signIn(
    dto: SignInDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const [user] = await this.db.query<any[]>(
      `SELECT * FROM "user" WHERE email = $1 LIMIT 1`,
      [dto.email.toLowerCase().trim()],
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const [account] = await this.db.query<any[]>(
      `SELECT * FROM account WHERE "userId" = $1 AND "providerId" = 'credential' LIMIT 1`,
      [user.id],
    );
    if (!account?.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await this.verifyPassword(dto.password, account.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const now = new Date();
    const sessionId = randomUUID();
    const sessionToken = this.generateToken();
    const expiresAt = this.sessionExpiry();

    await this.db.query(
      `INSERT INTO session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        sessionId,
        expiresAt,
        sessionToken,
        now,
        now,
        ipAddress ?? null,
        userAgent ?? null,
        user.id,
      ],
    );

    this.logger.log(`User signed in: ${dto.email}`);

    return this.buildAuthResponse(
      user,
      { id: sessionId, userId: user.id, expiresAt, activeOrganizationId: null },
      sessionToken,
    );
  }

  /* ─── get session ────────────────────────────────────────────────────── */

  async getSession(token: string): Promise<AuthResponse | null> {
    if (!token) return null;

    const rows = await this.db.query<any[]>(
      `SELECT
         s.id AS "sessionId", s."expiresAt", s."activeOrganizationId",
         u.id, u.name, u.email, u."emailVerified", u.image, u."roleType", u."createdAt", u."updatedAt"
       FROM session s
       JOIN "user" u ON s."userId" = u.id
       WHERE s.token = $1 AND s."expiresAt" > NOW()
       LIMIT 1`,
      [token],
    );

    if (!rows.length) return null;
    const row = rows[0];

    // Slide session expiry on use
    const newExpiry = this.sessionExpiry();
    await this.db.query(
      `UPDATE session SET "expiresAt" = $1, "updatedAt" = NOW() WHERE token = $2`,
      [newExpiry, token],
    );

    return this.buildAuthResponse(
      {
        id: row.id,
        name: row.name,
        email: row.email,
        emailVerified: row.emailVerified,
        image: row.image,
        roleType: row.roleType,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      {
        id: row.sessionId,
        userId: row.id,
        expiresAt: newExpiry,
        activeOrganizationId: row.activeOrganizationId,
      },
      token,
    );
  }

  /* ─── sign out ───────────────────────────────────────────────────────── */

  async signOut(token: string): Promise<void> {
    await this.db.query(`DELETE FROM session WHERE token = $1`, [token]);
  }

  async getUserOrganization(userId: string): Promise<string | null> {
    const rows = await this.db.query<any[]>(
      `SELECT "organizationId" FROM member WHERE "userId" = $1 LIMIT 1`,
      [userId],
    );
    return rows[0]?.organizationId ?? null;
  }

  async setActiveOrganization(token: string, orgId: string): Promise<void> {
    await this.db.query(
      `UPDATE session SET "activeOrganizationId" = $1, "updatedAt" = NOW() WHERE token = $2`,
      [orgId, token],
    );
  }

  /* ─── create organization ────────────────────────────────────────────── */

  async createOrganization(
    userId: string,
    dto: CreateOrganizationDto,
  ): Promise<{ organization: any; member: any }> {
    // Check slug uniqueness
    const [existing] = await this.db.query<any[]>(
      `SELECT id FROM organization WHERE slug = $1 LIMIT 1`,
      [dto.slug],
    );
    if (existing) {
      throw new ConflictException(
        'Workspace URL is already taken. Please choose another.',
      );
    }

    const now = new Date();
    const orgId = randomUUID();
    const memberId = randomUUID();

    await this.db.query(
      `INSERT INTO organization (id, name, slug, phone, email, "createdAt") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        orgId,
        dto.name.trim(),
        dto.slug,
        dto.phone ?? null,
        dto.email ?? null,
        now,
      ],
    );

    await this.db.query(
      `INSERT INTO member (id, "organizationId", "userId", role, "createdAt") VALUES ($1, $2, $3, $4, $5)`,
      [memberId, orgId, userId, 'owner', now],
    );

    // Set as active organization on all active sessions of this user
    await this.db.query(
      `UPDATE session SET "activeOrganizationId" = $1, "updatedAt" = NOW() WHERE "userId" = $2`,
      [orgId, userId],
    );

    this.logger.log(
      `Organization created: ${dto.name} (${dto.slug}) by user ${userId}`,
    );

    return {
      organization: {
        id: orgId,
        name: dto.name.trim(),
        slug: dto.slug,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        createdAt: now,
      },
      member: {
        id: memberId,
        organizationId: orgId,
        userId,
        role: 'owner',
        createdAt: now,
      },
    };
  }

  /* ─── request password reset ─────────────────────────────────────────── */

  async requestPasswordReset(
    dto: RequestPasswordResetDto,
  ): Promise<{ message: string }> {
    const [user] = await this.db.query<any[]>(
      `SELECT id, email FROM "user" WHERE email = $1 LIMIT 1`,
      [dto.email.toLowerCase().trim()],
    );

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        message:
          'If an account with that email exists, a reset link has been sent.',
      };
    }

    const token = this.generateToken(24);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const now = new Date();
    const verificationId = randomUUID();

    // Store in verification table
    await this.db.query(
      `INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        verificationId,
        `password-reset:${user.email}`,
        token,
        expiresAt,
        now,
        now,
      ],
    );

    const defaultRedirect =
      process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/reset-password`
        : 'http://localhost:4000/reset-password';

    const allowedRedirectPrefixes = [
      process.env.FRONTEND_URL,
      'http://localhost:4000',
      'http://localhost:3001',
    ].filter(Boolean) as string[];

    if (dto.redirectTo) {
      const isAllowed = allowedRedirectPrefixes.some((prefix) =>
        dto.redirectTo!.startsWith(prefix),
      );
      if (!isAllowed) {
        throw new BadRequestException('Invalid redirectTo URL');
      }
    }

    const resetUrl = `${dto.redirectTo || defaultRedirect}?token=${token}`;

    // Send the password reset email asynchronously
    this.emailService
      .sendPasswordResetLink(user.email, resetUrl)
      .catch((err) => {
        this.logger.error(
          `Failed to send password reset email: ${err.message}`,
          err.stack,
        );
      });

    return {
      message:
        'If an account with that email exists, a reset link has been sent.',
    };
  }

  /* ─── reset password ─────────────────────────────────────────────────── */

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    // Find the verification token
    const [verification] = await this.db.query<any[]>(
      `SELECT * FROM verification WHERE value = $1 AND "expiresAt" > NOW() LIMIT 1`,
      [dto.token],
    );
    if (!verification) {
      throw new BadRequestException(
        'Invalid or expired reset token. Please request a new link.',
      );
    }

    // Extract email from identifier (format: "password-reset:email@example.com")
    const email = verification.identifier.replace('password-reset:', '');
    const [user] = await this.db.query<any[]>(
      `SELECT id FROM "user" WHERE email = $1 LIMIT 1`,
      [email],
    );
    if (!user) throw new NotFoundException('User not found');

    const hashedPassword = await this.hashPassword(dto.newPassword);

    // Update password in account table
    await this.db.query(
      `UPDATE account SET password = $1, "updatedAt" = NOW() WHERE "userId" = $2 AND "providerId" = 'credential'`,
      [hashedPassword, user.id],
    );

    // Invalidate all sessions for this user (security best practice)
    await this.db.query(`DELETE FROM session WHERE "userId" = $1`, [user.id]);

    // Delete the used verification token
    await this.db.query(`DELETE FROM verification WHERE id = $1`, [
      verification.id,
    ]);

    this.logger.log(`Password reset completed for ${email}`);

    return {
      message:
        'Password updated successfully. Please sign in with your new password.',
    };
  }

  /* ─── Profile Endpoints ─── */

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<AuthUser> {
    const [user] = await this.db.query<any[]>(
      `SELECT * FROM "user" WHERE id = $1 LIMIT 1`,
      [userId],
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const name = dto.name !== undefined ? dto.name.trim() : user.name;
    const roleType = dto.roleType !== undefined ? dto.roleType : user.roleType;

    await this.db.query(
      `UPDATE "user" SET name = $1, "roleType" = $2, "updatedAt" = NOW() WHERE id = $3`,
      [name, roleType, userId],
    );

    const [updatedUser] = await this.db.query<any[]>(
      `SELECT * FROM "user" WHERE id = $1 LIMIT 1`,
      [userId],
    );

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      emailVerified: updatedUser.emailVerified ?? false,
      image: updatedUser.image ?? null,
      roleType: updatedUser.roleType ?? null,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async getProfile(userId: string): Promise<AuthUser> {
    const [user] = await this.db.query<any[]>(
      `SELECT * FROM "user" WHERE id = $1 LIMIT 1`,
      [userId],
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified ?? false,
      image: user.image ?? null,
      roleType: user.roleType ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getOrganization(orgId: string): Promise<any> {
    const rows = await this.db.query<any[]>(
      `SELECT * FROM organization WHERE id = $1 LIMIT 1`,
      [orgId],
    );
    if (!rows.length) {
      throw new NotFoundException('Organization not found');
    }
    return rows[0];
  }

  async updateOrganization(
    orgId: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      website?: string;
      address?: string;
      gstin?: string;
      description?: string;
      logo?: string;
    },
  ): Promise<any> {
    const org = await this.getOrganization(orgId);

    const name = data.name !== undefined ? data.name.trim() : org.name;
    const phone = data.phone !== undefined ? data.phone : org.phone;
    const email = data.email !== undefined ? data.email : org.email;
    const website = data.website !== undefined ? data.website : org.website;
    const address = data.address !== undefined ? data.address : org.address;
    const gstin = data.gstin !== undefined ? data.gstin : org.gstin;
    const description =
      data.description !== undefined ? data.description : org.description;
    const logo = data.logo !== undefined ? data.logo : org.logo;

    await this.db.query(
      `UPDATE organization
       SET name = $1, phone = $2, email = $3, website = $4, address = $5, gstin = $6, description = $7, logo = $8, "updatedAt" = NOW()
       WHERE id = $9`,
      [name, phone, email, website, address, gstin, description, logo, orgId],
    );

    return this.getOrganization(orgId);
  }

  async toggleSubscription(orgId: string, isSubscribed: boolean): Promise<any> {
    await this.db.query(
      `UPDATE organization SET "isSubscribed" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [isSubscribed, orgId],
    );
    return this.getOrganization(orgId);
  }

  async getSuperAdminStatistics(): Promise<any> {
    // 1. Total businesses
    const orgCountResult = await this.db.query(
      `SELECT COUNT(*) as count FROM organization`,
    );
    const totalBusinesses = parseInt(orgCountResult[0]?.count || '0');

    // 2. Total homestays
    const homestayCountResult = await this.db.query(
      `SELECT COUNT(*) as count FROM homestays`,
    );
    const totalHomestays = parseInt(homestayCountResult[0]?.count || '0');

    // 3. Total bookings (room bookings + package bookings)
    const bookingCountResult = await this.db.query(
      `SELECT COUNT(*) as count FROM bookings`,
    );
    const totalRoomBookings = parseInt(bookingCountResult[0]?.count || '0');

    const pkgBookingCountResult = await this.db.query(
      `SELECT COUNT(*) as count FROM package_bookings`,
    );
    const totalPackageBookings = parseInt(pkgBookingCountResult[0]?.count || '0');

    // 4. Detailed list of signed up businesses with their stats
    const businesses = await this.db.query(
      `SELECT
         org.id,
         org.name,
         org.slug,
         org."createdAt",
         org.email,
         org.phone,
         org.website,
         org.address,
         org.gstin,
         org."isSubscribed",
         (SELECT COUNT(*) FROM homestays h WHERE h."ownerId" IN (SELECT "userId" FROM member m WHERE m."organizationId" = org.id)) as "homestaysCount",
         (SELECT COUNT(*) FROM bookings b WHERE b."homestayId" IN (SELECT id FROM homestays h2 WHERE h2."ownerId" IN (SELECT "userId" FROM member m2 WHERE m2."organizationId" = org.id))) as "bookingsCount",
         (SELECT COUNT(*) FROM package_bookings pb 
          LEFT JOIN leads l ON l.id = pb.lead_id
          LEFT JOIN member m3 ON m3."userId" = COALESCE(pb.created_by, l."assignedTo")
          WHERE m3."organizationId" = org.id) as "packageBookingsCount"
       FROM organization org
       ORDER BY org."createdAt" DESC`,
    );

    const formattedBusinesses = businesses.map((b: any) => ({
      ...b,
      homestaysCount: parseInt(b.homestaysCount || '0'),
      bookingsCount:
        parseInt(b.bookingsCount || '0') +
        parseInt(b.packageBookingsCount || '0'),
    }));

    return {
      totalBusinesses,
      totalHomestays,
      totalBookings: totalRoomBookings + totalPackageBookings,
      businesses: formattedBusinesses,
    };
  }

  async getSuperAdminHomestays(): Promise<any[]> {
    const homestays = await this.db.query(`
      SELECT 
        h.*,
        org.name as "businessName",
        org.slug as "businessSlug"
      FROM homestays h
      LEFT JOIN member m ON m."userId" = h."ownerId"
      LEFT JOIN organization org ON org.id = m."organizationId"
      ORDER BY h."createdAt" DESC
    `);

    const rooms = await this.db.query(`
      SELECT * FROM rooms ORDER BY "roomNumber" ASC
    `);

    return homestays.map((h: any) => ({
      ...h,
      rooms: rooms.filter((r: any) => r.homestayId === h.id),
    }));
  }

  async getSuperAdminBookings(): Promise<any[]> {
    return await this.db.query(`
      SELECT 
        b.id,
        b."bookingReference" as "reference",
        b."guestName",
        'Room Booking' as "type",
        b."checkInDate" as "startDate",
        b."checkOutDate" as "endDate",
        b.status::text as "status",
        b."totalAmount"::float as "totalAmount",
        b."paidAmount"::float as "totalPaid",
        b."balanceAmount"::float as "pendingAmount",
        b."createdAt",
        org.name as "businessName",
        org.slug as "businessSlug"
      FROM bookings b
      LEFT JOIN organization org ON org.id = b.organization_id

      UNION ALL

      SELECT 
        pb.id,
        pb.booking_reference as "reference",
        pb.guest_name as "guestName",
        'Package Booking' as "type",
        pb.start_date as "startDate",
        pb.end_date as "endDate",
        pb.status::text as "status",
        pb.total_amount::float as "totalAmount",
        pb.paid_amount::float as "totalPaid",
        (pb.total_amount - pb.paid_amount)::float as "pendingAmount",
        pb.created_at as "createdAt",
        org.name as "businessName",
        org.slug as "businessSlug"
      FROM package_bookings pb
      LEFT JOIN organization org ON org.id = pb.organization_id
      ORDER BY "createdAt" DESC
    `);
  }

  async getPublicOrganization(orgId?: string, slug?: string): Promise<any> {
    if (!orgId && !slug) {
      throw new BadRequestException(
        'Either orgId or slug query parameter is required',
      );
    }

    let rows: any[] = [];
    if (orgId) {
      rows = await this.db.query<any[]>(
        `SELECT id, name, slug, phone, email, website, address, logo, description FROM organization WHERE id = $1`,
        [orgId],
      );
    } else {
      rows = await this.db.query<any[]>(
        `SELECT id, name, slug, phone, email, website, address, logo, description FROM organization WHERE slug = $1`,
        [slug],
      );
    }

    if (!rows.length) {
      return null;
    }
    return rows[0];
  }
}
