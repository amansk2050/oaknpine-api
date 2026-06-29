import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PackageBooking,
  PackageBookingStatus,
  PaymentStatus,
} from './entities/package-booking.entity';
import { PackageBookingRoom } from './entities/package-booking-room.entity';
import { CreatePackageBookingDto } from './dto/create-package-booking.dto';
import { UpdatePackageBookingDto } from './dto/update-package-booking.dto';
import { UpdatePackageBookingStatusDto } from './dto/update-package-booking-status.dto';
import { FilterPackageBookingDto } from './dto/filter-package-booking.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { LeadService } from '../lead/lead.service';
import { PackagesService } from '../packages/packages.service';
import { RoomBookingService } from '../room-booking/room-booking.service';
import { HomestayService } from '../homestay/homestay.service';
import { LeadStatus } from '../lead/entities/lead.entity';
import { BookingStatus } from '../room-booking/entities/booking.entity';
import { RoomStatus } from '../homestay/entities/room.entity';
import { Payment, PaymentStatus as RoomPaymentStatus } from '../room-booking/entities/payment.entity';

@Injectable()
export class PackageBookingService {
  constructor(
    @InjectRepository(PackageBooking)
    private readonly packageBookingRepository: Repository<PackageBooking>,
    @InjectRepository(PackageBookingRoom)
    private readonly packageBookingRoomRepository: Repository<PackageBookingRoom>,
    private readonly leadService: LeadService,
    private readonly packagesService: PackagesService,
    private readonly roomBookingService: RoomBookingService,
    private readonly homestayService: HomestayService,
  ) {}

  async createPackageBooking(
    createDto: CreatePackageBookingDto,
    tenantId?: string,
  ): Promise<PackageBooking> {
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      if (createDto.packageId) {
        const pkg = await this.packageBookingRepository.manager.query(
          `SELECT "organization_id" FROM packages WHERE id = $1`,
          [createDto.packageId],
        );
        resolvedTenantId = pkg?.[0]?.organization_id;
      }
      if (!resolvedTenantId && createDto.leadId) {
        const lead = await this.packageBookingRepository.manager.query(
          `SELECT "organization_id" FROM leads WHERE id = $1`,
          [createDto.leadId],
        );
        resolvedTenantId = lead?.[0]?.organization_id;
      }
      if (!resolvedTenantId) {
        const [firstOrg] = await this.packageBookingRepository.query(
          `SELECT id FROM organization LIMIT 1`,
        );
        resolvedTenantId = firstOrg?.id;
      }
    }

    // Validate lead exists
    const lead = await this.leadService.findLeadById(createDto.leadId, resolvedTenantId);

    // Validate package exists
    const packageEntity = await this.packagesService.findPackageById(
      createDto.packageId,
      resolvedTenantId,
    );

    // Calculate dates
    const startDate = new Date(createDto.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + packageEntity.numberOfDays - 1);

    // Validate homestay days if provided
    const includesHomestay =
      createDto.includesHomestay &&
      createDto.homestayDays &&
      createDto.homestayDays.length > 0;

    if (includesHomestay) {
      for (const homestayDay of createDto.homestayDays) {
        if (homestayDay.dayNumber > packageEntity.numberOfNights) {
          throw new BadRequestException(
            `Night ${homestayDay.dayNumber} exceeds package duration of ${packageEntity.numberOfNights} nights`,
          );
        }

        // Validate room exists and check availability
        const room = await this.homestayService.findRoomById(
          homestayDay.roomId,
          resolvedTenantId,
        );

        if (homestayDay.numberOfGuests > room.capacity) {
          throw new BadRequestException(
            `Room ${room.roomNumber} capacity is ${room.capacity}, cannot accommodate ${homestayDay.numberOfGuests} guests`,
          );
        }

        // Calculate check-in date for this night
        const nightCheckIn = new Date(startDate);
        nightCheckIn.setDate(
          nightCheckIn.getDate() + homestayDay.dayNumber - 1,
        );
        const nightCheckOut = new Date(nightCheckIn);
        nightCheckOut.setDate(nightCheckOut.getDate() + 1);

        // Check room availability
        await this.validateRoomAvailability(
          homestayDay.roomId,
          nightCheckIn,
          nightCheckOut,
          resolvedTenantId,
        );
      }
    }

    // Calculate amounts using pricing tiers or basePricePerHead from package
    let packagePrice = Number(packageEntity.basePricePerHead);

    // Try to find matching pricing tier
    if (packageEntity.pricingTiers && packageEntity.pricingTiers.length > 0) {
      const exactTier = packageEntity.pricingTiers.find(
        (tier) =>
          tier.numberOfPersons === createDto.numberOfAdults && tier.isActive,
      );
      if (exactTier) {
        // Use totalPrice directly if exact match
        packagePrice = Number(exactTier.totalPrice) / createDto.numberOfAdults;
      } else {
        // Find closest tier
        const activeTiers = packageEntity.pricingTiers
          .filter((tier) => tier.isActive)
          .sort((a, b) => a.numberOfPersons - b.numberOfPersons);
        const closestTier =
          activeTiers.find(
            (tier) => tier.numberOfPersons >= createDto.numberOfAdults,
          ) || activeTiers[activeTiers.length - 1];
        if (closestTier) {
          packagePrice =
            Number(closestTier.totalPrice) / closestTier.numberOfPersons;
        }
      }
    }

    const packageTotal = packagePrice * createDto.numberOfAdults;

    // Calculate homestay amount if included
    let homestayTotal = 0;
    if (includesHomestay) {
      for (const homestayDay of createDto.homestayDays) {
        const room = await this.homestayService.findRoomById(
          homestayDay.roomId,
          resolvedTenantId,
        );
        homestayTotal += Number(room.pricePerHead) * homestayDay.numberOfGuests;
      }
    }

    const subTotal = packageTotal + homestayTotal;
    const discountAmount = createDto.discountAmount || 0;
    const totalAmount = subTotal - discountAmount;

    // Generate booking reference
    const bookingReference = await this.generateBookingReference();

    // Create package booking
    const booking = this.packageBookingRepository.create({
      bookingReference,
      organizationId: resolvedTenantId,
      leadId: createDto.leadId,
      packageId: createDto.packageId,
      guestName: lead.name,
      guestEmail: lead.email,
      guestPhone: lead.phone,
      numberOfAdults: createDto.numberOfAdults,
      numberOfChildren: createDto.numberOfChildren || 0,
      startDate,
      endDate,
      includesHomestay: createDto.includesHomestay || false,
      homestayNights: includesHomestay ? createDto.homestayDays.length : null,
      totalAmount,
      balanceAmount: totalAmount,
      discountAmount,
      specialRequests: createDto.specialRequests,
      notes: createDto.notes,
      expectedArrivalTime: createDto.expectedArrivalTime,
      guestDetails: createDto.guestDetails,
      createdBy: createDto.createdBy,
      status: PackageBookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    });

    const savedBooking =
      await this.packageBookingRepository.save(booking);

    // Create room bookings for homestay - GROUP consecutive nights in same room
    if (includesHomestay) {
      // Group homestay days by roomId and find consecutive nights
      const groupedNights = this.groupConsecutiveNightsByRoom(
        createDto.homestayDays,
      );

      for (const group of groupedNights) {
        const checkIn = new Date(startDate);
        checkIn.setDate(checkIn.getDate() + group.startNight - 1);

        const checkOut = new Date(startDate);
        checkOut.setDate(checkOut.getDate() + group.endNight);

        const room = await this.homestayService.findRoomById(
          group.roomId,
          resolvedTenantId,
        );

        // Create ONE room booking for all consecutive nights in this room
        const roomBooking = await this.roomBookingService.createBooking({
          leadId: createDto.leadId,
          homestayId: room.homestayId,
          checkInDate: checkIn.toISOString().split('T')[0],
          checkOutDate: checkOut.toISOString().split('T')[0],
          rooms: [
            {
              roomId: group.roomId,
              numberOfGuests: group.numberOfGuests,
              notes: `Package Booking: ${bookingReference} - Night ${group.startNight}${group.startNight !== group.endNight ? ` to ${group.endNight}` : ''}`,
            },
          ],
          specialRequests: group.notes,
          notes: `Auto-created from Package Booking ${bookingReference}`,
        }, resolvedTenantId);

        // Create package booking room links for each night in the group
        for (const night of group.nights) {
          const checkInDate = new Date(startDate);
          checkInDate.setDate(checkInDate.getDate() + night - 1);
          const checkOutDate = new Date(checkInDate);
          checkOutDate.setDate(checkOutDate.getDate() + 1);

          const packageBookingRoom = this.packageBookingRoomRepository.create({
            packageBookingId: savedBooking.id,
            bookingId: roomBooking.id, // Same booking for all nights in this group
            roomId: group.roomId,
            nightNumber: night,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            pricePerNight: Number(room.pricePerHead) * group.numberOfGuests,
            isConfirmed: false,
          });

          await this.packageBookingRoomRepository.save(packageBookingRoom);
        }
      }
    }

    // Update lead status
    await this.leadService.updateLeadStatus(createDto.leadId, {
      status: LeadStatus.CONVERTED,
      bookingId: savedBooking.id,
    }, resolvedTenantId);

    return await this.findPackageBookingById(savedBooking.id, resolvedTenantId);
  }

  /**
   * Group consecutive nights by room into single bookings
   * Example: nights [1, 2, 3] in room A -> one booking for 3 nights
   *          nights [1, 2] in room A and night [3] in room B -> two separate bookings
   */
  private groupConsecutiveNightsByRoom(
    homestayDays: Array<{
      dayNumber: number;
      roomId: string;
      numberOfGuests: number;
      notes?: string;
    }>,
  ): Array<{
    roomId: string;
    numberOfGuests: number;
    notes?: string;
    nights: number[];
    startNight: number;
    endNight: number;
  }> {
    // Sort by dayNumber (which represents night number)
    const sorted = [...homestayDays].sort((a, b) => a.dayNumber - b.dayNumber);

    const groups: Array<{
      roomId: string;
      numberOfGuests: number;
      notes?: string;
      nights: number[];
      startNight: number;
      endNight: number;
    }> = [];

    for (const day of sorted) {
      // Check if this night can be added to an existing group
      const existingGroup = groups.find(
        (g) =>
          g.roomId === day.roomId &&
          g.numberOfGuests === day.numberOfGuests &&
          g.endNight === day.dayNumber - 1, // Must be consecutive
      );

      if (existingGroup) {
        // Add to existing group
        existingGroup.nights.push(day.dayNumber);
        existingGroup.endNight = day.dayNumber;
        if (day.notes) {
          existingGroup.notes = existingGroup.notes
            ? `${existingGroup.notes}; ${day.notes}`
            : day.notes;
        }
      } else {
        // Create new group
        groups.push({
          roomId: day.roomId,
          numberOfGuests: day.numberOfGuests,
          notes: day.notes,
          nights: [day.dayNumber],
          startNight: day.dayNumber,
          endNight: day.dayNumber,
        });
      }
    }

    return groups;
  }

  async findAllPackageBookings(
    filterDto: FilterPackageBookingDto,
    tenantId: string,
  ): Promise<PackageBooking[]> {
    const query = this.packageBookingRepository.createQueryBuilder('pb');

    query.where('pb.organizationId = :tenantId', { tenantId });

    if (filterDto?.packageId) {
      query.andWhere('pb.packageId = :packageId', {
        packageId: filterDto.packageId,
      });
    }

    if (filterDto?.status) {
      query.andWhere('pb.status = :status', { status: filterDto.status });
    }

    if (filterDto?.startDateAfter) {
      query.andWhere('pb.startDate >= :startDateAfter', {
        startDateAfter: new Date(filterDto.startDateAfter),
      });
    }

    if (filterDto?.startDateBefore) {
      query.andWhere('pb.startDate <= :startDateBefore', {
        startDateBefore: new Date(filterDto.startDateBefore),
      });
    }

    if (filterDto?.includesHomestay !== undefined) {
      query.andWhere('pb.includesHomestay = :includesHomestay', {
        includesHomestay: filterDto.includesHomestay,
      });
    }

    return await query
      .leftJoinAndSelect('pb.package', 'package')
      .leftJoinAndSelect('pb.lead', 'lead')
      .leftJoinAndSelect('pb.packageBookingRooms', 'pbr')
      .leftJoinAndSelect('pbr.room', 'room')
      .leftJoinAndSelect('pbr.booking', 'booking')
      .leftJoinAndSelect('pb.payments', 'payments')
      .orderBy('pb.createdAt', 'DESC')
      .getMany();
  }

  async findPackageBookingById(id: string, tenantId: string): Promise<PackageBooking> {
    const booking = await this.packageBookingRepository.findOne({
      where: { id, organizationId: tenantId },
      relations: [
        'package',
        'lead',
        'packageBookingRooms',
        'packageBookingRooms.room',
        'packageBookingRooms.booking',
        'payments',
      ],
    });

    if (!booking) {
      throw new NotFoundException(`Package booking with ID ${id} not found`);
    }

    return booking;
  }

  async findPackageBookingByReference(
    reference: string,
    tenantId: string,
  ): Promise<PackageBooking> {
    const booking = await this.packageBookingRepository.findOne({
      where: { bookingReference: reference, organizationId: tenantId },
      relations: [
        'package',
        'lead',
        'packageBookingRooms',
        'packageBookingRooms.room',
        'packageBookingRooms.booking',
        'payments',
      ],
    });

    if (!booking) {
      throw new NotFoundException(
        `Package booking with reference ${reference} not found`,
      );
    }

    return booking;
  }

  async updatePackageBooking(
    id: string,
    updateDto: UpdatePackageBookingDto,
    tenantId: string,
  ): Promise<PackageBooking> {
    const booking = await this.findPackageBookingById(id, tenantId);

    if (booking.status === PackageBookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled booking');
    }

    if (booking.status === PackageBookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot update a completed booking');
    }

    // Recalculate amounts if discount changed
    if (updateDto.discountAmount !== undefined) {
      const oldDiscount = Number(booking.discountAmount);
      const newDiscount = updateDto.discountAmount;
      const difference = newDiscount - oldDiscount;

      booking.totalAmount = Number(booking.totalAmount) - difference;
      booking.balanceAmount = Number(booking.balanceAmount) - difference;
    }

    Object.assign(booking, updateDto);
    return await this.packageBookingRepository.save(booking);
  }

  async updatePackageBookingStatus(
    id: string,
    updateStatusDto: UpdatePackageBookingStatusDto,
    tenantId: string,
  ): Promise<PackageBooking> {
    const booking = await this.findPackageBookingById(id, tenantId);

    booking.status = updateStatusDto.status;

    if (updateStatusDto.status === PackageBookingStatus.CANCELLED) {
      booking.cancelledAt = new Date();
      booking.cancellationReason = updateStatusDto.cancellationReason;

      // Cancel associated room bookings
      for (const pbr of booking.packageBookingRooms) {
        if (pbr.bookingId) {
          await this.roomBookingService.updateBookingStatus(pbr.bookingId, {
            status: BookingStatus.CANCELLED,
            cancellationReason: `Package booking ${booking.bookingReference} cancelled`,
          }, tenantId);
        }
      }
    }

    if (updateStatusDto.status === PackageBookingStatus.CONFIRMED) {
      // Confirm associated room bookings
      for (const pbr of booking.packageBookingRooms) {
        pbr.isConfirmed = true;
        await this.packageBookingRoomRepository.save(pbr);
      }
    }

    if (updateStatusDto.reason) {
      booking.notes = booking.notes
        ? `${booking.notes}\n\n[${new Date().toISOString()}] Status: ${updateStatusDto.status} - ${updateStatusDto.reason}`
        : `[${new Date().toISOString()}] Status: ${updateStatusDto.status} - ${updateStatusDto.reason}`;
    }

    return await this.packageBookingRepository.save(booking);
  }

  async addPayment(
    id: string,
    paymentDto: AddPaymentDto,
    tenantId: string,
  ): Promise<PackageBooking> {
    const booking = await this.findPackageBookingById(id, tenantId);

    if (booking.status === PackageBookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot add payment to cancelled booking');
    }

    // Update payment amounts for package booking
    booking.paidAmount = Number(booking.paidAmount) + paymentDto.amount;
    booking.balanceAmount =
      Number(booking.totalAmount) - Number(booking.paidAmount);
    booking.isPaymentComplete = booking.balanceAmount <= 0;

    // Update payment status
    if (booking.isPaymentComplete) {
      booking.paymentStatus = PaymentStatus.PAID;
    } else if (booking.paidAmount > 0) {
      booking.paymentStatus = PaymentStatus.PARTIAL;
    }

    // Auto-confirm if payment received
    if (
      booking.status === PackageBookingStatus.PENDING &&
      booking.paidAmount > 0
    ) {
      booking.status = PackageBookingStatus.CONFIRMED;

      // Confirm room bookings as well
      for (const pbr of booking.packageBookingRooms) {
        pbr.isConfirmed = true;
        await this.packageBookingRoomRepository.save(pbr);
      }
    }

    // Settle room booking payments if requested (default: true)
    const settleRoomBookings = paymentDto.settleRoomBookings !== false;
    const settledBookings: string[] = [];

    if (settleRoomBookings && booking.includesHomestay) {
      // Get unique room booking IDs
      const uniqueBookingIds = [
        ...new Set(
          booking.packageBookingRooms
            .filter((pbr) => pbr.bookingId)
            .map((pbr) => pbr.bookingId),
        ),
      ];

      // Distribute payment proportionally to room bookings
      for (const roomBookingId of uniqueBookingIds) {
        try {
          const roomBooking =
            await this.roomBookingService.findBookingById(roomBookingId, tenantId);

          // Calculate proportional amount based on room booking's share of total
          // For simplicity, we'll mark room bookings as paid if package is paid
          // Or add proportional payment
          if (booking.isPaymentComplete) {
            // If package is fully paid, mark room booking as fully paid too
            const remainingBalance = Number(roomBooking.balanceAmount);
            if (remainingBalance > 0) {
              await this.roomBookingService.addPayment(roomBookingId, {
                amount: remainingBalance,
                paymentMethod: paymentDto.paymentMethod as any,
                paymentType: paymentDto.paymentType as any,
                transactionId: paymentDto.transactionId,
                notes: `Auto-settled from Package Booking ${booking.bookingReference}`,
                recordedBy: paymentDto.recordedBy,
              }, tenantId);
              settledBookings.push(roomBooking.bookingReference);
            }
          } else {
            // Proportional distribution based on room booking value vs total room value
            const totalRoomValue = booking.packageBookingRooms.reduce(
              (sum, pbr) => sum + Number(pbr.pricePerNight),
              0,
            );

            if (totalRoomValue > 0) {
              const roomBookingRooms = booking.packageBookingRooms.filter(
                (pbr) => pbr.bookingId === roomBookingId,
              );
              const thisRoomValue = roomBookingRooms.reduce(
                (sum, pbr) => sum + Number(pbr.pricePerNight),
                0,
              );
              const proportion = thisRoomValue / totalRoomValue;
              const proportionalAmount = Math.round(
                paymentDto.amount * proportion,
              );

              if (
                proportionalAmount > 0 &&
                proportionalAmount <= Number(roomBooking.balanceAmount)
              ) {
                await this.roomBookingService.addPayment(roomBookingId, {
                  amount: proportionalAmount,
                  paymentMethod: paymentDto.paymentMethod as any,
                  paymentType: paymentDto.paymentType as any,
                  transactionId: paymentDto.transactionId,
                  notes: `Proportional payment from Package Booking ${booking.bookingReference}`,
                  recordedBy: paymentDto.recordedBy,
                }, tenantId);
                settledBookings.push(roomBooking.bookingReference);
              }
            }
          }
        } catch (error) {
          // Log but don't fail if room booking payment fails
          console.error(
            `Failed to settle payment for room booking ${roomBookingId}:`,
            error,
          );
        }
      }
    }

    // Add payment note
    let paymentNote = `[${new Date().toISOString()}] Payment: ₹${paymentDto.amount} via ${paymentDto.paymentMethod} (${paymentDto.paymentType})`;
    if (settledBookings.length > 0) {
      paymentNote += `\nRoom bookings settled: ${settledBookings.join(', ')}`;
    }
    booking.notes = booking.notes
      ? `${booking.notes}\n\n${paymentNote}`
      : paymentNote;

    // Record payment in global payments table
    const payment = new Payment();
    payment.packageBookingId = booking.id;
    payment.packageBooking = booking;
    payment.amount = paymentDto.amount;
    payment.paymentMethod = paymentDto.paymentMethod as any;
    payment.paymentType = paymentDto.paymentType as any;
    payment.transactionId = paymentDto.transactionId;
    payment.paymentReference = `PAY-PKG-${Date.now()}`;
    payment.status = RoomPaymentStatus.COMPLETED;
    payment.notes = paymentDto.notes || `Payment for package booking ${booking.bookingReference}`;
    payment.recordedBy = paymentDto.recordedBy;
    payment.paymentDate = new Date();

    await this.packageBookingRepository.manager.getRepository(Payment).save(payment);

    return await this.packageBookingRepository.save(booking);
  }

  async getPackageBookingStatistics(packageId: string, tenantId: string) {
    const query = this.packageBookingRepository.createQueryBuilder('pb');

    query.where('pb.organizationId = :tenantId', { tenantId });

    if (packageId) {
      query.andWhere('pb.packageId = :packageId', { packageId });
    }

    const totalBookings = await query.getCount();

    const confirmedBookings = await query
      .clone()
      .andWhere('pb.status = :status', {
        status: PackageBookingStatus.CONFIRMED,
      })
      .getCount();

    const completedBookings = await query
      .clone()
      .andWhere('pb.status = :status', {
        status: PackageBookingStatus.COMPLETED,
      })
      .getCount();

    const cancelledBookings = await query
      .clone()
      .andWhere('pb.status = :status', {
        status: PackageBookingStatus.CANCELLED,
      })
      .getCount();

    const totalRevenueResult = await query
      .clone()
      .andWhere('pb.status != :cancelled', {
        cancelled: PackageBookingStatus.CANCELLED,
      })
      .select('SUM(pb.totalAmount)', 'total')
      .getRawOne<{ total: string | null }>();

    const totalPaidResult = await query
      .clone()
      .select('SUM(pb.paidAmount)', 'total')
      .getRawOne<{ total: string | null }>();

    const homestayBookings = await query
      .clone()
      .andWhere('pb.includesHomestay = :includes', { includes: true })
      .getCount();

    const totalRevenue = Number(totalRevenueResult?.total ?? 0);
    const totalPaid = Number(totalPaidResult?.total ?? 0);

    return {
      totalBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      homestayBookings,
      totalRevenue,
      totalPaid,
      pendingAmount: totalRevenue - totalPaid,
    };
  }

  async getUpcomingPackageBookings(
    days: number = 7,
    tenantId?: string,
  ): Promise<PackageBooking[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    const query = this.packageBookingRepository
      .createQueryBuilder('pb')
      .where('pb.startDate >= :today', { today })
      .andWhere('pb.startDate <= :futureDate', { futureDate })
      .andWhere('pb.status IN (:...statuses)', {
        statuses: [
          PackageBookingStatus.CONFIRMED,
          PackageBookingStatus.PENDING,
        ],
      });

    if (tenantId) {
      query.andWhere('pb.organizationId = :tenantId', { tenantId });
    }

    return await query
      .leftJoinAndSelect('pb.package', 'package')
      .leftJoinAndSelect('pb.lead', 'lead')
      .orderBy('pb.startDate', 'ASC')
      .getMany();
  }

  private async validateRoomAvailability(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    tenantId: string,
  ): Promise<void> {
    const room = await this.homestayService.findRoomById(roomId, tenantId);

    if (
      room.status === RoomStatus.BLOCKED ||
      room.status === RoomStatus.MAINTENANCE
    ) {
      throw new ConflictException(
        `Room ${room.roomNumber} is not available for booking`,
      );
    }

    // Check overlapping bookings in package booking rooms
    const overlapping = await this.packageBookingRoomRepository
      .createQueryBuilder('pbr')
      .innerJoin('pbr.packageBooking', 'pb')
      .where('pbr.roomId = :roomId', { roomId })
      .andWhere('pb.organizationId = :tenantId', { tenantId })
      .andWhere('pb.status NOT IN (:...statuses)', {
        statuses: [PackageBookingStatus.CANCELLED],
      })
      .andWhere(
        '(pbr.checkInDate < :checkOut AND pbr.checkOutDate > :checkIn)',
        {
          checkIn,
          checkOut,
        },
      )
      .getMany();

    if (overlapping.length > 0) {
      throw new ConflictException(
        `Room ${room.roomNumber} is already booked for the selected dates`,
      );
    }
  }

  private async generateBookingReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.packageBookingRepository.count();
    return `PKG-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
