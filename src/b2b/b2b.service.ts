import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { B2bPartner, B2bPartnerStatus } from './entities/b2b-partner.entity';
import {
  B2bBookingRequest,
  B2bRequestStatus,
} from './entities/b2b-booking-request.entity';
import { GuestService } from '../guest/guest.service';
import { RoomBookingService } from '../room-booking/room-booking.service';
import { CreateB2bPartnerDto } from './dto/create-b2b-partner.dto';
import { CreateB2bBookingRequestDto } from './dto/create-b2b-booking-request.dto';
import { AcceptB2bBookingRequestDto } from './dto/accept-b2b-booking-request.dto';
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
    private readonly guestService: GuestService,
    private readonly roomBookingService: RoomBookingService,
  ) {}

  // 1. Generate/Create B2B Partner link
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

  // 3. List all partners for an organization
  async findAllPartners(organizationId: string): Promise<B2bPartner[]> {
    return this.partnerRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  // 4. Submit booking request via public portal (slug-based)
  async submitBookingRequest(
    slug: string,
    dto: CreateB2bBookingRequestDto,
  ): Promise<B2bBookingRequest> {
    const partner = await this.findPartnerBySlug(slug);

    const request = this.requestRepository.create({
      ...dto,
      partnerId: partner.id,
      checkInDate: new Date(dto.checkInDate),
      checkOutDate: new Date(dto.checkOutDate),
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
  // TC-12: sorted chronologically by check-in date or creation date
  async findBookingRequests(
    organizationId: string,
    sortBy: 'checkInDate' | 'createdAt' = 'checkInDate',
  ): Promise<B2bBookingRequest[]> {
    return this.requestRepository.find({
      where: { partner: { organizationId } },
      relations: ['partner'],
      order: { [sortBy]: 'ASC' }, // ascending chronological sort
    });
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

    if (request.partner.organizationId !== organizationId) {
      throw new BadRequestException(
        'Request does not belong to your organization',
      );
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

    // B. Create the Booking using RoomBookingService
    const booking = await this.roomBookingService.createBooking({
      guestId: guest.id,
      bookingSource: BookingSource.B2B,
      b2bPartnerId: request.partnerId,
      b2bBusinessName: request.partner.businessName,
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
    }, request.partner.organizationId);

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

    if (request.partner.organizationId !== organizationId) {
      throw new BadRequestException(
        'Request does not belong to your organization',
      );
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
}
