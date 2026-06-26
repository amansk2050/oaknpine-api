import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackageBookingController } from './package-booking.controller';
import { PackageBookingService } from './package-booking.service';
import { PackageBooking } from './entities/package-booking.entity';
import { PackageBookingRoom } from './entities/package-booking-room.entity';
import { LeadModule } from '../lead/lead.module';
import { PackagesModule } from '../packages/packages.module';
import { RoomBookingModule } from '../room-booking/room-booking.module';
import { HomestayModule } from '../homestay/homestay.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PackageBooking, PackageBookingRoom]),
    LeadModule,
    PackagesModule,
    RoomBookingModule,
    HomestayModule,
  ],
  controllers: [PackageBookingController],
  providers: [PackageBookingService],
  exports: [PackageBookingService],
})
export class PackageBookingModule {}
