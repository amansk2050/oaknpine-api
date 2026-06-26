import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PackageBooking } from './package-booking.entity';
import { Booking } from '../../room-booking/entities/booking.entity';
import { Room } from '../../homestay/entities/room.entity';

@Entity('package_booking_rooms')
export class PackageBookingRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PackageBooking, (pb) => pb.packageBookingRooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'package_booking_id' })
  packageBooking: PackageBooking;

  @Column({ name: 'package_booking_id' })
  packageBookingId: string;

  @ManyToOne(() => Booking, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'booking_id', nullable: true })
  bookingId: string;

  @ManyToOne(() => Room, { nullable: false })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ name: 'check_in_date', type: 'date' })
  checkInDate: Date;

  @Column({ name: 'check_out_date', type: 'date' })
  checkOutDate: Date;

  @Column({
    name: 'night_number',
    type: 'int',
    comment: 'Which night of the package (1, 2, etc.)',
  })
  nightNumber: number;

  @Column({ name: 'price_per_night', type: 'decimal', precision: 10, scale: 2 })
  pricePerNight: number;

  @Column({ name: 'is_confirmed', type: 'boolean', default: false })
  isConfirmed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
