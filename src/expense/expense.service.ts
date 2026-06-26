import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingExpense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Booking, BookingStatus } from '../room-booking/entities/booking.entity';
import { PackageBooking, PackageBookingStatus } from '../package-booking/entities/package-booking.entity';
import { PackageBookingRoom } from '../package-booking/entities/package-booking-room.entity';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(BookingExpense)
    private readonly expenseRepository: Repository<BookingExpense>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(PackageBooking)
    private readonly packageBookingRepository: Repository<PackageBooking>,
  ) {}

  async createExpense(createExpenseDto: CreateExpenseDto): Promise<BookingExpense> {
    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      expenseDate: new Date(createExpenseDto.expenseDate),
    });
    return await this.expenseRepository.save(expense);
  }

  async findExpensesByBookingId(bookingId: string): Promise<BookingExpense[]> {
    return await this.expenseRepository.find({
      where: { bookingId },
      order: { expenseDate: 'DESC' },
    });
  }

  async findExpensesByPackageBookingId(packageBookingId: string): Promise<BookingExpense[]> {
    return await this.expenseRepository.find({
      where: { packageBookingId },
      order: { expenseDate: 'DESC' },
    });
  }

  async updateExpense(id: string, updateExpenseDto: UpdateExpenseDto): Promise<BookingExpense> {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    Object.assign(expense, {
      ...updateExpenseDto,
      expenseDate: updateExpenseDto.expenseDate
        ? new Date(updateExpenseDto.expenseDate)
        : expense.expenseDate,
    });

    return await this.expenseRepository.save(expense);
  }

  async deleteExpense(id: string): Promise<void> {
    const result = await this.expenseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
  }

  async getProfitStatistics() {
    // 1. Calculate direct room booking revenue (excluding bookings linked to package bookings)
    const directRoomResult = await this.bookingRepository.createQueryBuilder('booking')
      .where('booking.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('pbr.booking_id')
          .from(PackageBookingRoom, 'pbr')
          .where('pbr.booking_id IS NOT NULL')
          .getQuery();
        return 'booking.id NOT IN ' + subQuery;
      })
      .select('SUM(booking.totalAmount)', 'sum')
      .getRawOne();

    const directRoomRevenue = parseFloat(directRoomResult?.sum || '0');

    // 2. Calculate package bookings revenue
    const packageResult = await this.packageBookingRepository.createQueryBuilder('pb')
      .where('pb.status != :cancelled', { cancelled: PackageBookingStatus.CANCELLED })
      .select('SUM(pb.totalAmount)', 'sum')
      .getRawOne();

    const packageRevenue = parseFloat(packageResult?.sum || '0');

    // Total unique revenue
    const totalRevenue = directRoomRevenue + packageRevenue;

    // 3. Calculate sum of all expenses
    const expenseResult = await this.expenseRepository.createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'sum')
      .getRawOne();

    const totalExpenses = parseFloat(expenseResult?.sum || '0');

    // 4. Net Profit
    const netProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
    };
  }
}
