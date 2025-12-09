import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GuestModule } from './guest/guest.module';
import { HomestayModule } from './homestay/homestay.module';
import { DatabaseModule } from './database/database.module';
import { LeadModule } from './lead/lead.module';
import { RoomBookingModule } from './room-booking/room-booking.module';
import { PackagesModule } from './packages/packages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GuestModule,
    HomestayModule,
    DatabaseModule,
    LeadModule,
    RoomBookingModule,
    PackagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
