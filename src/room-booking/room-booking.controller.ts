import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { RoomBookingService } from './room-booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { FilterBookingDto } from './dto/filter-booking.dto';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';

@ApiTags('Booking Management')
@Controller('booking')
export class RoomBookingController {
  constructor(private readonly bookingService: RoomBookingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new booking',
    description:
      'Create a booking from a lead with room selection and availability validation',
  })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: Booking,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Room not available for selected dates',
  })
  createBooking(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.createBooking(createBookingDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all bookings',
    description:
      'Retrieve all bookings with optional filters for status, homestay, and dates',
  })
  @ApiQuery({ type: FilterBookingDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'List of bookings',
    type: [Booking],
  })
  findAllBookings(@Query() filterDto: FilterBookingDto) {
    return this.bookingService.findAllBookings(filterDto);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get booking statistics',
    description: 'Get overall statistics including revenue, bookings by status',
  })
  @ApiQuery({
    name: 'homestayId',
    required: false,
    description: 'Filter by homestay ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking statistics',
    schema: {
      example: {
        totalBookings: 150,
        confirmedBookings: 80,
        checkedInBookings: 30,
        cancelledBookings: 15,
        totalRevenue: 500000,
        totalPaid: 350000,
        pendingAmount: 150000,
      },
    },
  })
  getBookingStatistics(@Query('homestayId') homestayId?: string) {
    return this.bookingService.getBookingStatistics(homestayId);
  }

  @Get('check-ins/today')
  @ApiOperation({
    summary: "Get today's check-ins",
    description: 'Retrieve all bookings scheduled for check-in today',
  })
  @ApiQuery({
    name: 'homestayId',
    required: false,
    description: 'Filter by homestay ID',
  })
  @ApiResponse({
    status: 200,
    description: "Today's check-ins",
    type: [Booking],
  })
  getTodayCheckIns(@Query('homestayId') homestayId?: string) {
    return this.bookingService.getTodayCheckIns(homestayId);
  }

  @Get('check-outs/today')
  @ApiOperation({
    summary: "Get today's check-outs",
    description: 'Retrieve all bookings scheduled for check-out today',
  })
  @ApiQuery({
    name: 'homestayId',
    required: false,
    description: 'Filter by homestay ID',
  })
  @ApiResponse({
    status: 200,
    description: "Today's check-outs",
    type: [Booking],
  })
  getTodayCheckOuts(@Query('homestayId') homestayId?: string) {
    return this.bookingService.getTodayCheckOuts(homestayId);
  }

  @Get('reference/:reference')
  @ApiOperation({
    summary: 'Get booking by reference',
    description: 'Retrieve booking details using booking reference number',
  })
  @ApiParam({
    name: 'reference',
    description: 'Booking reference number',
    example: 'BKG-2024-0001',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking details',
    type: Booking,
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  findBookingByReference(@Param('reference') reference: string) {
    return this.bookingService.findBookingByReference(reference);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get booking by ID',
    description:
      'Retrieve detailed booking information including rooms, payments, and guest details',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking UUID',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking details',
    type: Booking,
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  findBookingById(@Param('id') id: string) {
    return this.bookingService.findBookingById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update booking',
    description: 'Update booking information (not for status changes)',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking UUID',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @ApiBody({ type: UpdateBookingDto })
  @ApiResponse({
    status: 200,
    description: 'Booking updated successfully',
    type: Booking,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update cancelled or checked-out booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  updateBooking(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingService.updateBooking(id, updateBookingDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update booking status',
    description: 'Change booking status (pending, confirmed, cancelled, etc.)',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking UUID',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @ApiBody({ type: UpdateBookingStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Booking status updated successfully',
    type: Booking,
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  updateBookingStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.updateBookingStatus(id, updateStatusDto);
  }

  @Patch(':id/check-in')
  @ApiOperation({
    summary: 'Check-in a booking',
    description: 'Process guest check-in and mark booking as checked-in',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking UUID',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @ApiBody({ type: CheckInDto })
  @ApiResponse({
    status: 200,
    description: 'Check-in successful',
    type: Booking,
  })
  @ApiResponse({
    status: 400,
    description: 'Only confirmed bookings can be checked in',
  })
  checkIn(@Param('id') id: string, @Body() checkInDto: CheckInDto) {
    return this.bookingService.checkIn(id, checkInDto);
  }

  @Patch(':id/check-out')
  @ApiOperation({
    summary: 'Check-out a booking',
    description: 'Process guest check-out and mark booking as completed',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking UUID',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @ApiBody({ type: CheckOutDto })
  @ApiResponse({
    status: 200,
    description: 'Check-out successful',
    type: Booking,
  })
  @ApiResponse({
    status: 400,
    description: 'Only checked-in bookings can be checked out',
  })
  checkOut(@Param('id') id: string, @Body() checkOutDto: CheckOutDto) {
    return this.bookingService.checkOut(id, checkOutDto);
  }

  // Payment Endpoints
  @Post(':bookingId/payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add payment',
    description: 'Record a payment for a booking',
  })
  @ApiParam({
    name: 'bookingId',
    description: 'Booking UUID',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment recorded successfully',
    type: Payment,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot add payment to cancelled booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  addPayment(
    @Param('bookingId') bookingId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.bookingService.addPayment(bookingId, createPaymentDto);
  }

  @Get(':bookingId/payments')
  @ApiOperation({
    summary: 'Get payments for booking',
    description: 'Retrieve all payment records for a specific booking',
  })
  @ApiParam({
    name: 'bookingId',
    description: 'Booking UUID',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @ApiResponse({
    status: 200,
    description: 'List of payments',
    type: [Payment],
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  findPaymentsByBooking(@Param('bookingId') bookingId: string) {
    return this.bookingService.findPaymentsByBooking(bookingId);
  }
}
