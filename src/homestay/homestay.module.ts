import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomestayController } from './homestay.controller';
import { HomestayService } from './homestay.service';
import { Homestay } from './entities/homestay.entity';
import { Room } from './entities/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Homestay, Room])],
  controllers: [HomestayController],
  providers: [HomestayService],
  exports: [HomestayService],
})
export class HomestayModule {}
