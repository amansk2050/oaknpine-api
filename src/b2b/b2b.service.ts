import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { randomBytes } from 'crypto';
import { B2bPartner, B2bPartnerStatus } from './entities/b2b-partner.entity';
import {
  B2bBookingRequest,
  B2bRequestStatus,
  BookingTag,
} from './entities/b2b-booking-request.entity';
import { B2bInvitation, B2bInvitationStatus } from './entities/b2b-invitation.entity';
import { B2bPartnerAccount } from './entities/b2b-partner-account.entity';
import { B2bPartnerMembership, B2bMembershipStatus } from './entities/b2b-partner-membership.entity';
import { GuestService } from '../guest/guest.service';
import { RoomBookingService } from '../room-booking/room-booking.service';
import { CreateB2bPartnerDto } from './dto/create-b2b-partner.dto';
import { CreateB2bBookingRequestDto } from './dto/create-b2b-booking-request.dto';
import { AcceptB2bBookingRequestDto } from './dto/accept-b2b-booking-request.dto';
import {
  CreateB2bInvitationDto,
  AcceptB2bInvitationDto,
  UpdateBookingTagDto,
  CreatePartnerBookingRequestDto,
} from './dto/b2b-invitation.dto';
import { BookingSource } from '../room-booking/entities/booking.entity';
import { GuestSource } from '../guest/entities/guest.entity';
import { Homestay } from '../homestay/entities/homestay.entity';

@Injectable()
export class B2bService {
  private readonly logger = new Logger(B2bService.name);

  constructor(
    @InjectRepository(B2bPartner)
    private readonly partnerRepository: Repository<B2bPartner>,
    @InjectRepository(B2bBookingRequest)
    private readonly requestRepository: Repository<B2bBookingRequest>,
    @InjectRepository(B2bInvitation)
    private readonly invitationRepository: Repository<B2bInvitation>,
    @InjectRepository(B2bPartnerAccount)
    private readonly partnerAccountRepository: Repository<B2bPartnerAccount>,
    @InjectRepository(B2bPartnerMembership)
    private readonly membershipRepository: Repository<B2bPartnerMembership>,
    private readonly guestService: GuestService,
    private readonly roomBookingService: RoomBookingService,
  ) {}

  /* ──────────────────────────────────────────────────────────────────────
   * LEGACY: Slug-based partner portal (kept for backward compatibility)
   * ────────────────────────────────────────────────────────────────────── */

  // 1. Generate/Create B2B Partner link (legacy)
  async createPartner(
    dto: CreateB2bPartnerDto,
    organizationId: string,
  ): Promise<B2bPartner> {
    const cleanSlug = dto.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueSlug = `${cleanSlug}-${randomSuffix}`;

    const partner = this.partnerRepository.create({
      ...dto,
      organizationId,
      uniqueSlug,
      status: B2bPartnerStatus.ACTIVE,
      totalRequestsSent: 0,
    });

    const saved = await this.partnerRepository.save(partner);
    this.logger.log(
      `B2B Partner created: ${saved.businessName} with slug: ${saved.uniqueSlug}`,
    );
    return saved;
  }

  // 2. Find partner by unique slug (for public portal validation)
  async findPartnerBySlug(slug: string): Promise<B2bPartner> {
    const partner = await this.partnerRepository.findOne({
      where: { uniqueSlug: slug },
    });
    if (!partner) {
      throw new NotFoundException(`B2B Partner with slug ${slug} not found`);
    }
    if (partner.status !== B2bPartnerStatus.ACTIVE) {
      throw new BadRequestException(`B2B Partner is inactive or suspended`);
    }
    return partner;
  }

  // Helper to fetch B2B Portal config + homestays
  async getPortalDetails(slug: string): Promise<any> {
    const partner = await this.findPartnerBySlug(slug);
    const homestays = await this.partnerRepository.manager.find(Homestay, {
      select: ['id', 'name'],
      where: { status: 'active' },
      order: { name: 'ASC' },
    });
    return {
      partner: {
        id: partner.id,
        businessName: partner.businessName,
        contactPerson: partner.contactPerson,
        status: partner.status,
      },
      homestays,
    };
  }

  // 3. List all partners for an organization (legacy)
  async findAllPartners(organizationId: string): Promise<B2bPartner[]> {
    return this.partnerRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  // 4. Submit booking request via public portal (slug-based legacy)
  async submitBookingRequest(
    slug: string,
    dto: CreateB2bBookingRequestDto,
  ): Promise<B2bBookingRequest> {
    const partner = await this.findPartnerBySlug(slug);

    const { bookingTag, ...restDto } = dto;
    const request = this.requestRepository.create({
      ...restDto,
      partnerId: partner.id,
      checkInDate: new Date(dto.checkInDate),
      checkOutDate: new Date(dto.checkOutDate),
      bookingTag: bookingTag ? (bookingTag as BookingTag) : undefined,
      status: B2bRequestStatus.PENDING,
    });

    const saved = await this.requestRepository.save(request);

    // Update partner request counter
    partner.totalRequestsSent += 1;
    await this.partnerRepository.save(partner);

    this.logger.log(
      `B2B Request submitted by partner ${partner.businessName} (ID: ${saved.id})`,
    );
    return saved;
  }

  // 5. List all booking requests for an organization (queue)
  async findBookingRequests(
    organizationId: string,
    sortBy: 'checkInDate' | 'createdAt' = 'checkInDate',
  ): Promise<B2bBookingRequest[]> {
    // Fetch both legacy (slug-based) and new (invitation-based) requests
    const legacyRequests = await this.requestRepository.find({
      where: { partner: { organizationId } },
      relations: ['partner'],
      order: { [sortBy]: 'ASC' },
    });

    // Fetch invitation-based requests for this organization
    const memberships = await this.membershipRepository.find({
      where: { organizationId },
    });
    const membershipIds = memberships.map((m) => m.id);

    let invitationRequests: B2bBookingRequest[] = [];
    if (membershipIds.length > 0) {
      invitationRequests = await this.requestRepository.find({
        where: { partnerMembershipId: In(membershipIds) },
        relations: ['partnerMembership'],
        order: { [sortBy]: 'ASC' },
      });
    }

    // Merge and sort
    const allRequests = [...legacyRequests, ...invitationRequests].sort(
      (a, b) =>
        new Date(a[sortBy] || a.createdAt).getTime() -
        new Date(b[sortBy] || b.createdAt).getTime(),
    );

    return allRequests;
  }

  // 6. Accept a booking request
  async acceptBookingRequest(
    id: string,
    dto: AcceptB2bBookingRequestDto,
    organizationId: string,
  ): Promise<any> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['partner'],
    });

    if (!request) {
      throw new NotFoundException(`Booking request with ID ${id} not found`);
    }

    // Authorization: check legacy or new membership
    if (request.partnerId && request.partner) {
      if (request.partner.organizationId !== organizationId) {
        throw new BadRequestException(
          'Request does not belong to your organization',
        );
      }
    } else if (request.partnerMembershipId) {
      const membership = await this.membershipRepository.findOne({
        where: { id: request.partnerMembershipId },
      });
      if (!membership || membership.organizationId !== organizationId) {
        throw new ForbiddenException(
          'Request does not belong to your organization',
        );
      }
    }

    if (request.status !== B2bRequestStatus.PENDING) {
      throw new BadRequestException(
        `Request status is already ${request.status}`,
      );
    }

    // A. Find or create Guest
    let guest = await this.guestService.findGuestByEmailOrPhone(
      request.guestEmail,
      request.guestPhone,
    );
    if (!guest) {
      guest = await this.guestService.createGuest({
        name: request.guestName,
        email: request.guestEmail,
        phone: request.guestPhone,
        source: GuestSource.B2B,
      });
    }

    const businessName =
      request.partner?.businessName || 'B2B Partner';

    // B. Create the Booking using RoomBookingService
    const booking = await this.roomBookingService.createBooking(
      {
        guestId: guest.id,
        bookingSource: BookingSource.B2B,
        b2bPartnerId: request.partnerId || request.partnerAccountId,
        b2bBusinessName: businessName,
        homestayId: request.homestayId,
        checkInDate:
          request.checkInDate instanceof Date
            ? request.checkInDate.toISOString().split('T')[0]
            : new Date(request.checkInDate).toISOString().split('T')[0],
        checkOutDate:
          request.checkOutDate instanceof Date
            ? request.checkOutDate.toISOString().split('T')[0]
            : new Date(request.checkOutDate).toISOString().split('T')[0],
        rooms: dto.rooms,
        discountAmount: dto.discountAmount,
        taxPercentage: dto.taxPercentage,
        specialRequests: request.roomPreferences || request.message,
      },
      organizationId,
    );

    // C. Update request status
    request.status = B2bRequestStatus.ACCEPTED;
    request.bookingId = booking.id;
    await this.requestRepository.save(request);

    this.logger.log(
      `B2B Request ${id} accepted. Booking created: ${booking.id}`,
    );
    return { status: 'accepted', booking };
  }

  // 7. Reject a booking request
  async rejectBookingRequest(
    id: string,
    rejectionReason: string,
    organizationId: string,
  ): Promise<B2bBookingRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['partner'],
    });

    if (!request) {
      throw new NotFoundException(`Booking request with ID ${id} not found`);
    }

    // Authorization
    if (request.partnerId && request.partner) {
      if (request.partner.organizationId !== organizationId) {
        throw new BadRequestException(
          'Request does not belong to your organization',
        );
      }
    } else if (request.partnerMembershipId) {
      const membership = await this.membershipRepository.findOne({
        where: { id: request.partnerMembershipId },
      });
      if (!membership || membership.organizationId !== organizationId) {
        throw new ForbiddenException(
          'Request does not belong to your organization',
        );
      }
    }

    if (request.status !== B2bRequestStatus.PENDING) {
      throw new BadRequestException(
        `Request status is already ${request.status}`,
      );
    }

    request.status = B2bRequestStatus.REJECTED;
    request.rejectionReason = rejectionReason;

    const saved = await this.requestRepository.save(request);
    this.logger.log(`B2B Request ${id} rejected. Reason: ${rejectionReason}`);
    return saved;
  }

  /* ──────────────────────────────────────────────────────────────────────
   * NEW: Invitation-based B2B Partner system
   * ────────────────────────────────────────────────────────────────────── */

  // 8. Create an invitation (business sends invite to partner email)
  async createInvitation(
    dto: CreateB2bInvitationDto,
    organizationId: string,
    invitedByUserId: string,
    businessName: string,
  ): Promise<B2bInvitation> {
    // Check if there's already a pending invitation for this email + org
    const existing = await this.invitationRepository.findOne({
      where: {
        organizationId,
        invitedEmail: dto.invitedEmail.toLowerCase().trim(),
        status: B2bInvitationStatus.PENDING,
      },
    });
    if (existing && new Date(existing.expiresAt) > new Date()) {
      throw new ConflictException(
        'A pending invitation already exists for this email.',
      );
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

    const invitation = this.invitationRepository.create({
      organizationId,
      businessName,
      invitedEmail: dto.invitedEmail.toLowerCase().trim(),
      invitationToken: token,
      status: B2bInvitationStatus.PENDING,
      expiresAt,
      invitedByUserId,
    });

    const saved = await this.invitationRepository.save(invitation);
    this.logger.log(
      `B2B Invitation created for ${dto.invitedEmail} (org: ${organizationId})`,
    );
    return saved;
  }

  // 9. Get invitation by token (public — for landing page)
  async getInvitationByToken(token: string): Promise<B2bInvitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { invitationToken: token },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found or invalid.');
    }
    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = B2bInvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new BadRequestException('This invitation has expired.');
    }
    if (invitation.status === B2bInvitationStatus.REVOKED) {
      throw new BadRequestException('This invitation has been revoked.');
    }
    if (invitation.status === B2bInvitationStatus.ACCEPTED) {
      throw new BadRequestException('This invitation has already been accepted.');
    }
    return invitation;
  }

  // 10. Accept invitation (authenticated user accepts)
  async acceptInvitation(
    token: string,
    userId: string,
    dto: AcceptB2bInvitationDto,
  ): Promise<{ membership: B2bPartnerMembership; isNewAccount: boolean }> {
    const invitation = await this.getInvitationByToken(token);

    // Check if this user already has a partner account
    let partnerAccount = await this.partnerAccountRepository.findOne({
      where: { userId },
    });
    let isNewAccount = false;

    if (!partnerAccount) {
      partnerAccount = this.partnerAccountRepository.create({ userId });
      partnerAccount = await this.partnerAccountRepository.save(partnerAccount);
      isNewAccount = true;
    }

    // Check if membership already exists for this org
    const existingMembership = await this.membershipRepository.findOne({
      where: {
        partnerAccountId: partnerAccount.id,
        organizationId: invitation.organizationId,
      },
    });
    if (existingMembership) {
      throw new ConflictException(
        'You are already a partner with this business.',
      );
    }

    // Load user to get default partner name
    const userRows = await this.membershipRepository.manager.query(
      `SELECT name, email FROM "user" WHERE id = $1 LIMIT 1`,
      [userId],
    );
    const user = userRows[0];
    const defaultName = user ? (user.name || user.email) : 'B2B Partner';

    // Create membership
    const membership = this.membershipRepository.create({
      partnerAccountId: partnerAccount.id,
      organizationId: invitation.organizationId,
      invitationId: invitation.id,
      businessName: invitation.businessName,
      partnerBusinessName: dto.partnerBusinessName?.trim() || defaultName,
      status: B2bMembershipStatus.ACTIVE,
      totalBookingsSent: 0,
    });
    const savedMembership = await this.membershipRepository.save(membership);

    // Update invitation status
    invitation.status = B2bInvitationStatus.ACCEPTED;
    invitation.partnerAccountId = partnerAccount.id;
    await this.invitationRepository.save(invitation);

    this.logger.log(
      `B2B Invitation accepted by user ${userId}. Membership created: ${savedMembership.id}`,
    );
    return { membership: savedMembership, isNewAccount };
  }

  // 11. List invitations for an organization
  async findInvitations(organizationId: string): Promise<B2bInvitation[]> {
    return this.invitationRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  // 11b. List B2B partner memberships for an organization
  async findOrganizationMemberships(organizationId: string): Promise<B2bPartnerMembership[]> {
    return this.membershipRepository.find({
      where: { organizationId, status: B2bMembershipStatus.ACTIVE },
      order: { partnerBusinessName: 'ASC' },
    });
  }

  // 12. Revoke invitation
  async revokeInvitation(
    id: string,
    organizationId: string,
  ): Promise<B2bInvitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { id, organizationId },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found.');
    }
    invitation.status = B2bInvitationStatus.REVOKED;
    return this.invitationRepository.save(invitation);
  }

  // 13. Update booking tag
  async updateBookingTag(
    requestId: string,
    dto: UpdateBookingTagDto,
    organizationId: string,
  ): Promise<B2bBookingRequest> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['partner'],
    });
    if (!request) {
      throw new NotFoundException(`Booking request ${requestId} not found`);
    }

    // Authorization
    if (request.partnerId && request.partner) {
      if (request.partner.organizationId !== organizationId) {
        throw new ForbiddenException('Access denied');
      }
    } else if (request.partnerMembershipId) {
      const membership = await this.membershipRepository.findOne({
        where: { id: request.partnerMembershipId, organizationId },
      });
      if (!membership) throw new ForbiddenException('Access denied');
    }

    request.bookingTag = dto.bookingTag as BookingTag;
    return this.requestRepository.save(request);
  }

  /* ──────────────────────────────────────────────────────────────────────
   * B2B Partner Dashboard (partner-side)
   * ────────────────────────────────────────────────────────────────────── */

  // 14. Get partner account by userId
  async getPartnerAccountByUserId(userId: string): Promise<B2bPartnerAccount> {
    let account = await this.partnerAccountRepository.findOne({
      where: { userId },
    });
    if (!account) {
      account = this.partnerAccountRepository.create({ userId });
      account = await this.partnerAccountRepository.save(account);
    }
    return account;
  }

  // 15. Get partner dashboard data
  async getPartnerDashboard(userId: string): Promise<any> {
    const account = await this.getPartnerAccountByUserId(userId);

    const memberships = await this.membershipRepository.find({
      where: { partnerAccountId: account.id, status: B2bMembershipStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    // Get booking stats per membership
    const stats = await Promise.all(
      memberships.map(async (m) => {
        const requests = await this.requestRepository.find({
          where: { partnerMembershipId: m.id },
          order: { createdAt: 'DESC' },
        });

        return {
          membership: m,
          totalRequests: requests.length,
          pendingRequests: requests.filter((r) => r.status === B2bRequestStatus.PENDING).length,
          acceptedRequests: requests.filter((r) => r.status === B2bRequestStatus.ACCEPTED).length,
          rejectedRequests: requests.filter((r) => r.status === B2bRequestStatus.REJECTED).length,
          recentRequests: requests.slice(0, 5),
        };
      }),
    );

    return {
      partnerAccount: account,
      businessCount: memberships.length,
      memberships: stats,
      totalRequestsAllTime: stats.reduce((s, m) => s + m.totalRequests, 0),
      totalAccepted: stats.reduce((s, m) => s + m.acceptedRequests, 0),
    };
  }

  // 16. Get partner's booking requests (all businesses or filtered by membership)
  async getPartnerBookingRequests(
    userId: string,
    membershipId?: string,
  ): Promise<B2bBookingRequest[]> {
    const account = await this.getPartnerAccountByUserId(userId);

    let membershipIds: string[];
    if (membershipId) {
      // Verify this membership belongs to this partner
      const membership = await this.membershipRepository.findOne({
        where: { id: membershipId, partnerAccountId: account.id },
      });
      if (!membership) throw new ForbiddenException('Access denied');
      membershipIds = [membershipId];
    } else {
      const memberships = await this.membershipRepository.find({
        where: { partnerAccountId: account.id },
      });
      membershipIds = memberships.map((m) => m.id);
    }

    if (membershipIds.length === 0) return [];

    return this.requestRepository
      .createQueryBuilder('req')
      .where('req.partnerMembershipId IN (:...ids)', { ids: membershipIds })
      .orderBy('req.createdAt', 'DESC')
      .getMany();
  }

  // 17. Submit booking request as an authenticated partner
  async submitPartnerBookingRequest(
    userId: string,
    dto: CreatePartnerBookingRequestDto,
  ): Promise<B2bBookingRequest> {
    const account = await this.getPartnerAccountByUserId(userId);

    // Verify membership
    const membership = await this.membershipRepository.findOne({
      where: {
        id: dto.partnerMembershipId,
        partnerAccountId: account.id,
        status: B2bMembershipStatus.ACTIVE,
      },
    });
    if (!membership) {
      throw new ForbiddenException(
        'You are not an active partner for this business.',
      );
    }

    const request = this.requestRepository.create({
      partnerAccountId: account.id,
      partnerMembershipId: membership.id,
      homestayId: dto.homestayId,
      guestName: dto.guestName,
      guestEmail: dto.guestEmail,
      guestPhone: dto.guestPhone,
      checkInDate: new Date(dto.checkInDate),
      checkOutDate: new Date(dto.checkOutDate),
      numberOfGuests: dto.numberOfGuests,
      roomPreferences: dto.roomPreferences,
      message: dto.message,
      bookingTag: dto.bookingTag as any,
      status: B2bRequestStatus.PENDING,
    });

    const saved = await this.requestRepository.save(request);

    // Update membership booking count
    membership.totalBookingsSent += 1;
    await this.membershipRepository.save(membership);

    this.logger.log(
      `Authenticated B2B partner (userId: ${userId}) submitted request ${saved.id} for org ${membership.organizationId}`,
    );
    return saved;
  }

  // 18. Get partner's memberships (for selecting business when creating booking)
  async getPartnerMemberships(userId: string): Promise<B2bPartnerMembership[]> {
    const account = await this.getPartnerAccountByUserId(userId);
    return this.membershipRepository.find({
      where: { partnerAccountId: account.id, status: B2bMembershipStatus.ACTIVE },
      order: { businessName: 'ASC' },
    });
  }

  // 19. Get homestays for a specific business (partner side)
  async getHomestaysForBusiness(
    userId: string,
    membershipId: string,
  ): Promise<Homestay[]> {
    const account = await this.getPartnerAccountByUserId(userId);
    const membership = await this.membershipRepository.findOne({
      where: { id: membershipId, partnerAccountId: account.id },
    });
    if (!membership) throw new ForbiddenException('Access denied');

    return this.partnerRepository.manager.find(Homestay, {
      select: ['id', 'name'],
      where: {
        status: 'active',
        organizationId: membership.organizationId as any,
      },
      order: { name: 'ASC' },
    });
  }
}
