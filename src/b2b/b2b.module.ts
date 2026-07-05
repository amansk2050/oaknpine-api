import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { B2bController } from './b2b.controller';
import { B2bService } from './b2b.service';
import { B2bPartner } from './entities/b2b-partner.entity';
import { B2bBookingRequest } from './entities/b2b-booking-request.entity';
import { B2bInvitation } from './entities/b2b-invitation.entity';
import { B2bPartnerAccount } from './entities/b2b-partner-account.entity';
import { B2bPartnerMembership } from './entities/b2b-partner-membership.entity';
import { GuestModule } from '../guest/guest.module';
import { RoomBookingModule } from '../room-booking/room-booking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      B2bPartner,
      B2bBookingRequest,
      B2bInvitation,
      B2bPartnerAccount,
      B2bPartnerMembership,
    ]),
    GuestModule,
    RoomBookingModule,
  ],
  controllers: [B2bController],
  providers: [B2bService],
  exports: [B2bService],
})
export class B2bModule {}
