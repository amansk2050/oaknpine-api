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
import { PackageBookingModule } from './package-booking/package-booking.module';
import { AuthModule } from './auth/auth.module';
import { B2bModule } from './b2b/b2b.module';
import { EmailModule } from './email/email.module';
import { EventsModule } from './events/events.module';
import { UploadModule } from './upload/upload.module';
import { ExpenseModule } from './expense/expense.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    GuestModule,
    HomestayModule,
    DatabaseModule,
    LeadModule,
    RoomBookingModule,
    PackagesModule,
    PackageBookingModule,
    B2bModule,
    EmailModule,
    EventsModule,
    UploadModule,
    ExpenseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
