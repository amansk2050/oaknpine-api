import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomBookingController } from './room-booking.controller';
import { RoomBookingService } from './room-booking.service';
import { Booking } from './entities/booking.entity';
import { BookingRoom } from './entities/booking-room.entity';
import { Payment } from './entities/payment.entity';
import { LeadModule } from '../lead/lead.module';
import { HomestayModule } from '../homestay/homestay.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BookingRoom, Payment]),
    LeadModule,
    HomestayModule,
  ],
  controllers: [RoomBookingController],
  providers: [RoomBookingService],
  exports: [RoomBookingService],
})
export class RoomBookingModule {}
