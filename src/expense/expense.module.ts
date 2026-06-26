import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { BookingExpense } from './entities/expense.entity';
import { Booking } from '../room-booking/entities/booking.entity';
import { PackageBooking } from '../package-booking/entities/package-booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookingExpense,
      Booking,
      PackageBooking,
    ]),
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService],
})
export class ExpenseModule {}
