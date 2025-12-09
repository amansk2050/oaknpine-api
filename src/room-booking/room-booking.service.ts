import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { BookingRoom, RoomBookingStatus } from './entities/booking-room.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { FilterBookingDto } from './dto/filter-booking.dto';
import { LeadService } from '../lead/lead.service';
import { HomestayService } from '../homestay/homestay.service';

@Injectable()
export class RoomBookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(BookingRoom)
    private bookingRoomRepository: Repository<BookingRoom>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private leadService: LeadService,
    private homestayService: HomestayService,
  ) {}

  // Booking CRUD Operations
  async createBooking(createBookingDto: CreateBookingDto): Promise<Booking> {
    const lead = await this.leadService.findLeadById(createBookingDto.leadId);
    const homestay = await this.homestayService.findHomestayById(
      createBookingDto.homestayId,
    );

    // Validate dates
    const checkIn = new Date(createBookingDto.checkInDate);
    const checkOut = new Date(createBookingDto.checkOutDate);

    if (checkOut <= checkIn) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }

    const numberOfNights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Check room availability
    for (const roomDto of createBookingDto.rooms) {
      await this.validateRoomAvailability(roomDto.roomId, checkIn, checkOut);

      // Validate room capacity
      const room = await this.homestayService.findRoomById(roomDto.roomId);
      if (roomDto.numberOfGuests > room.capacity) {
        throw new BadRequestException(
          `Room ${room.roomNumber} capacity is ${room.capacity}, cannot accommodate ${roomDto.numberOfGuests} guests`,
        );
      }

      // Verify room belongs to the homestay
      if (room.homestayId !== createBookingDto.homestayId) {
        throw new BadRequestException(
          `Room ${room.roomNumber} does not belong to this homestay`,
        );
      }
    }

    // Calculate amounts
    let totalAmount = 0;
    const bookingRooms: Partial<BookingRoom>[] = [];

    for (const roomDto of createBookingDto.rooms) {
      const room = await this.homestayService.findRoomById(roomDto.roomId);
      const roomTotal =
        room.pricePerHead * roomDto.numberOfGuests * numberOfNights;
      totalAmount += roomTotal;

      bookingRooms.push({
        roomId: roomDto.roomId,
        numberOfGuests: roomDto.numberOfGuests,
        ratePerNight: room.pricePerHead * roomDto.numberOfGuests,
        totalAmount: roomTotal,
        isFullyOccupied:
          roomDto.isFullyOccupied || roomDto.numberOfGuests === room.capacity,
        notes: roomDto.notes,
      });
    }

    // Apply discount
    const discountAmount = createBookingDto.discountAmount || 0;
    totalAmount -= discountAmount;

    // Calculate tax
    const taxPercentage = createBookingDto.taxPercentage || 0;
    const taxAmount = (totalAmount * taxPercentage) / 100;
    totalAmount += taxAmount;

    // Generate booking reference
    const bookingReference = await this.generateBookingReference();

    // Create booking without source field
    const booking = this.bookingRepository.create({
      bookingReference,
      leadId: createBookingDto.leadId,
      homestayId: createBookingDto.homestayId,
      guestName: lead.name,
      guestEmail: lead.email,
      guestPhone: lead.phone,
      numberOfAdults: lead.numberOfAdults || 1,
      numberOfChildren: lead.numberOfChildren || 0,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfNights,
      totalRooms: createBookingDto.rooms.length,
      totalAmount,
      discountAmount,
      taxAmount,
      balanceAmount: totalAmount,
      specialRequests: createBookingDto.specialRequests,
      notes: createBookingDto.notes,
      expectedArrivalTime: createBookingDto.expectedArrivalTime,
      guestDetails: createBookingDto.guestDetails,
      status: BookingStatus.PENDING,
    });

    const savedBooking = await this.bookingRepository.save(booking);

    // Create booking rooms
    for (const roomData of bookingRooms) {
      const bookingRoom = this.bookingRoomRepository.create({
        ...roomData,
        bookingId: savedBooking.id,
      });
      await this.bookingRoomRepository.save(bookingRoom);
    }

    // Update lead status
    await this.leadService.updateLeadStatus(createBookingDto.leadId, {
      status: 'converted' as any,
      bookingId: savedBooking.id,
    });

    return await this.findBookingById(savedBooking.id);
  }

  async findAllBookings(filterDto?: FilterBookingDto): Promise<Booking[]> {
    const query = this.bookingRepository.createQueryBuilder('booking');

    if (filterDto?.status) {
      query.andWhere('booking.status = :status', { status: filterDto.status });
    }

    if (filterDto?.homestayId) {
      query.andWhere('booking.homestayId = :homestayId', {
        homestayId: filterDto.homestayId,
      });
    }

    if (filterDto?.checkInAfter) {
      query.andWhere('booking.checkInDate >= :checkInAfter', {
        checkInAfter: new Date(filterDto.checkInAfter),
      });
    }

    if (filterDto?.checkInBefore) {
      query.andWhere('booking.checkInDate <= :checkInBefore', {
        checkInBefore: new Date(filterDto.checkInBefore),
      });
    }

    return await query
      .leftJoinAndSelect('booking.rooms', 'rooms')
      .leftJoinAndSelect('rooms.room', 'room')
      .leftJoinAndSelect('booking.payments', 'payments')
      .leftJoinAndSelect('booking.homestay', 'homestay')
      .orderBy('booking.createdAt', 'DESC')
      .getMany();
  }

  async findBookingById(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['rooms', 'rooms.room', 'payments', 'homestay', 'lead'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async findBookingByReference(reference: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingReference: reference },
      relations: ['rooms', 'rooms.room', 'payments', 'homestay', 'lead'],
    });

    if (!booking) {
      throw new NotFoundException(
        `Booking with reference ${reference} not found`,
      );
    }

    return booking;
  }

  async updateBooking(
    id: string,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    const booking = await this.findBookingById(id);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled booking');
    }

    if (booking.status === BookingStatus.CHECKED_OUT) {
      throw new BadRequestException('Cannot update a checked-out booking');
    }

    Object.assign(booking, updateBookingDto);
    return await this.bookingRepository.save(booking);
  }

  async updateBookingStatus(
    id: string,
    updateStatusDto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    const booking = await this.findBookingById(id);

    booking.status = updateStatusDto.status;

    if (updateStatusDto.status === BookingStatus.CANCELLED) {
      booking.cancelledAt = new Date();
      booking.cancellationReason = updateStatusDto.cancellationReason;

      // Update room statuses
      for (const bookingRoom of booking.rooms) {
        bookingRoom.status = RoomBookingStatus.CANCELLED;
        await this.bookingRoomRepository.save(bookingRoom);
      }
    }

    if (updateStatusDto.reason) {
      booking.notes = booking.notes
        ? `${booking.notes}\n\n[${new Date().toISOString()}] Status: ${updateStatusDto.status} - ${updateStatusDto.reason}`
        : `[${new Date().toISOString()}] Status: ${updateStatusDto.status} - ${updateStatusDto.reason}`;
    }

    return await this.bookingRepository.save(booking);
  }

  // Check-in/Check-out
  async checkIn(id: string, checkInDto: CheckInDto): Promise<Booking> {
    const booking = await this.findBookingById(id);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Only confirmed bookings can be checked in',
      );
    }

    booking.status = BookingStatus.CHECKED_IN;
    booking.actualCheckInTime = checkInDto.actualCheckInTime
      ? new Date(checkInDto.actualCheckInTime)
      : new Date();

    if (checkInDto.notes) {
      booking.notes = booking.notes
        ? `${booking.notes}\n\n[Check-in] ${checkInDto.notes}`
        : `[Check-in] ${checkInDto.notes}`;
    }

    // Update room statuses
    for (const bookingRoom of booking.rooms) {
      bookingRoom.status = RoomBookingStatus.OCCUPIED;
      await this.bookingRoomRepository.save(bookingRoom);
    }

    return await this.bookingRepository.save(booking);
  }

  async checkOut(id: string, checkOutDto: CheckOutDto): Promise<Booking> {
    const booking = await this.findBookingById(id);

    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new BadRequestException(
        'Only checked-in bookings can be checked out',
      );
    }

    booking.status = BookingStatus.CHECKED_OUT;
    booking.actualCheckOutTime = checkOutDto.actualCheckOutTime
      ? new Date(checkOutDto.actualCheckOutTime)
      : new Date();

    if (checkOutDto.notes) {
      booking.notes = booking.notes
        ? `${booking.notes}\n\n[Check-out] ${checkOutDto.notes}`
        : `[Check-out] ${checkOutDto.notes}`;
    }

    // Update room statuses
    for (const bookingRoom of booking.rooms) {
      bookingRoom.status = RoomBookingStatus.CHECKED_OUT;
      await this.bookingRoomRepository.save(bookingRoom);
    }

    return await this.bookingRepository.save(booking);
  }

  // Payment Operations
  async addPayment(
    bookingId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<Payment> {
    // Use findOne directly to avoid loading relations (specifically 'payments') which causes issues with save()
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot add payment to cancelled booking');
    }

    // Generate payment reference
    const paymentReference = await this.generatePaymentReference();

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      bookingId,
      paymentReference,
      paymentDate: createPaymentDto.paymentDate
        ? new Date(createPaymentDto.paymentDate)
        : new Date(),
      status: PaymentStatus.COMPLETED,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Update booking amounts
    booking.paidAmount =
      Number(booking.paidAmount) + Number(createPaymentDto.amount);
    booking.balanceAmount =
      Number(booking.totalAmount) - Number(booking.paidAmount);
    booking.isPaymentComplete = booking.balanceAmount <= 0;

    // Auto-confirm if advance paid
    if (booking.status === BookingStatus.PENDING && booking.paidAmount > 0) {
      booking.status = BookingStatus.CONFIRMED;
    }

    await this.bookingRepository.save(booking);

    return savedPayment;
  }

  async findPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    await this.findBookingById(bookingId);
    return await this.paymentRepository.find({
      where: { bookingId },
      order: { createdAt: 'DESC' },
    });
  }

  // Room Availability Check
  private async validateRoomAvailability(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<void> {
    // Check if room exists and is available
    const room = await this.homestayService.findRoomById(roomId);

    if (room.status === 'blocked' || room.status === 'maintenance') {
      throw new ConflictException(
        `Room ${room.roomNumber} is not available for booking`,
      );
    }

    // Check for overlapping bookings
    const overlappingBookings = await this.bookingRoomRepository
      .createQueryBuilder('br')
      .innerJoin('br.booking', 'b')
      .where('br.roomId = :roomId', { roomId })
      .andWhere('b.status NOT IN (:...statuses)', {
        statuses: [BookingStatus.CANCELLED, BookingStatus.CHECKED_OUT],
      })
      .andWhere('(b.checkInDate < :checkOut AND b.checkOutDate > :checkIn)', {
        checkIn,
        checkOut,
      })
      .getMany();

    if (overlappingBookings.length > 0) {
      throw new ConflictException(
        `Room ${room.roomNumber} is already booked for the selected dates`,
      );
    }
  }

  // Statistics
  async getBookingStatistics(homestayId?: string) {
    const query = this.bookingRepository.createQueryBuilder('booking');

    if (homestayId) {
      query.where('booking.homestayId = :homestayId', { homestayId });
    }

    const totalBookings = await query.getCount();
    const confirmedBookings = await query
      .clone()
      .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .getCount();
    const checkedInBookings = await query
      .clone()
      .andWhere('booking.status = :status', {
        status: BookingStatus.CHECKED_IN,
      })
      .getCount();
    const cancelledBookings = await query
      .clone()
      .andWhere('booking.status = :status', { status: BookingStatus.CANCELLED })
      .getCount();

    const totalRevenue = await query
      .clone()
      .select('SUM(booking.totalAmount)', 'total')
      .getRawOne();

    const totalPaid = await query
      .clone()
      .select('SUM(booking.paidAmount)', 'total')
      .getRawOne();

    return {
      totalBookings,
      confirmedBookings,
      checkedInBookings,
      cancelledBookings,
      totalRevenue: totalRevenue?.total || 0,
      totalPaid: totalPaid?.total || 0,
      pendingAmount: (totalRevenue?.total || 0) - (totalPaid?.total || 0),
    };
  }

  async getTodayCheckIns(homestayId?: string): Promise<Booking[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.checkInDate >= :today', { today })
      .andWhere('booking.checkInDate < :tomorrow', { tomorrow })
      .andWhere('booking.status = :status', {
        status: BookingStatus.CONFIRMED,
      });

    if (homestayId) {
      query.andWhere('booking.homestayId = :homestayId', { homestayId });
    }

    return await query
      .leftJoinAndSelect('booking.rooms', 'rooms')
      .leftJoinAndSelect('rooms.room', 'room')
      .getMany();
  }

  async getTodayCheckOuts(homestayId?: string): Promise<Booking[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.checkOutDate >= :today', { today })
      .andWhere('booking.checkOutDate < :tomorrow', { tomorrow })
      .andWhere('booking.status = :status', {
        status: BookingStatus.CHECKED_IN,
      });

    if (homestayId) {
      query.andWhere('booking.homestayId = :homestayId', { homestayId });
    }

    return await query
      .leftJoinAndSelect('booking.rooms', 'rooms')
      .leftJoinAndSelect('rooms.room', 'room')
      .getMany();
  }

  // Helper Methods
  private async generateBookingReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.bookingRepository.count();
    return `BKG-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generatePaymentReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.paymentRepository.count();
    return `PAY-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
