import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import {
  Guest,
  GuestSource,
  ConfirmationEmailStatus,
} from './entities/guest.entity';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { FilterGuestDto } from './dto/filter-guest.dto';

@Injectable()
export class GuestService {
  private readonly logger = new Logger(GuestService.name);

  constructor(
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
  ) {}

  /* ─── Create ─────────────────────────────────────────────────────────── */

  async createGuest(dto: CreateGuestDto): Promise<Guest> {
    const guest = this.guestRepository.create({
      ...dto,
      source: dto.source ?? GuestSource.WALK_IN,
    });
    const saved = await this.guestRepository.save(guest);
    this.logger.log(
      `Guest created: ${saved.name} (${saved.id}) via ${saved.source}`,
    );
    return saved;
  }

  /* ─── Read All ────────────────────────────────────────────────────────── */

  async findAllGuests(filterDto?: FilterGuestDto): Promise<Guest[]> {
    const query = this.guestRepository.createQueryBuilder('guest');

    if (filterDto?.source) {
      query.andWhere('guest.source = :source', { source: filterDto.source });
    }

    if (filterDto?.confirmationEmailStatus) {
      query.andWhere('guest.confirmationEmailStatus = :status', {
        status: filterDto.confirmationEmailStatus,
      });
    }

    if (filterDto?.search) {
      query.andWhere(
        '(guest.name ILIKE :search OR guest.phone ILIKE :search OR guest.email ILIKE :search)',
        { search: `%${filterDto.search}%` },
      );
    }

    return query.orderBy('guest.createdAt', 'DESC').getMany();
  }

  /* ─── Read One ────────────────────────────────────────────────────────── */

  async findGuestById(id: string): Promise<Guest> {
    const guest = await this.guestRepository.findOne({ where: { id } });
    if (!guest) {
      throw new NotFoundException(`Guest with ID ${id} not found`);
    }
    return guest;
  }

  async findGuestByEmailOrPhone(
    email?: string,
    phone?: string,
  ): Promise<Guest | null> {
    if (!email && !phone) return null;
    const conditions: any[] = [];
    if (email) conditions.push({ email });
    if (phone) conditions.push({ phone });
    return this.guestRepository.findOne({ where: conditions });
  }

  /* ─── Update ──────────────────────────────────────────────────────────── */

  async updateGuest(id: string, dto: UpdateGuestDto): Promise<Guest> {
    const guest = await this.findGuestById(id);
    Object.assign(guest, dto);
    return this.guestRepository.save(guest);
  }

  /* ─── Delete ──────────────────────────────────────────────────────────── */

  async deleteGuest(id: string): Promise<void> {
    const guest = await this.findGuestById(id);
    await this.guestRepository.remove(guest);
    this.logger.log(`Guest deleted: ${id}`);
  }

  /* ─── Stats ───────────────────────────────────────────────────────────── */

  async getGuestStats() {
    const total = await this.guestRepository.count();
    const walkIn = await this.guestRepository.count({
      where: { source: GuestSource.WALK_IN },
    });
    const fromLead = await this.guestRepository.count({
      where: { source: GuestSource.LEAD },
    });
    const fromB2b = await this.guestRepository.count({
      where: { source: GuestSource.B2B },
    });

    return { total, walkIn, fromLead, fromB2b };
  }

  /* ─── Email Tracking (TC-24) ──────────────────────────────────────────── */

  async getEmailDeliveryReport() {
    const sent = await this.guestRepository.find({
      where: { confirmationEmailStatus: ConfirmationEmailStatus.SENT },
      order: { confirmationEmailSentAt: 'DESC' },
    });
    const notSent = await this.guestRepository.find({
      where: { confirmationEmailStatus: ConfirmationEmailStatus.NOT_SENT },
      order: { createdAt: 'DESC' },
    });
    const failed = await this.guestRepository.find({
      where: { confirmationEmailStatus: ConfirmationEmailStatus.FAILED },
      order: { createdAt: 'DESC' },
    });

    return {
      summary: {
        sent: sent.length,
        notSent: notSent.length,
        failed: failed.length,
      },
      sent,
      notSent,
      failed,
    };
  }

  /* ─── Internal helpers (called by booking service) ───────────────────── */

  async incrementBookingCount(guestId: string, amount: number): Promise<void> {
    const guest = await this.findGuestById(guestId);
    guest.totalBookings += 1;
    guest.totalSpent = Number(guest.totalSpent) + Number(amount);
    await this.guestRepository.save(guest);
  }

  async markConfirmationEmailSent(guestId: string): Promise<void> {
    await this.guestRepository.update(guestId, {
      confirmationEmailStatus: ConfirmationEmailStatus.SENT,
      confirmationEmailSentAt: new Date(),
    });
  }

  async markConfirmationEmailFailed(guestId: string): Promise<void> {
    await this.guestRepository.update(guestId, {
      confirmationEmailStatus: ConfirmationEmailStatus.FAILED,
    });
  }
}
