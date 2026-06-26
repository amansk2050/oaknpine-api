import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Homestay } from './entities/homestay.entity';
import { Room, RoomStatus, RoomType } from './entities/room.entity';
import { CreateHomestayDto } from './dto/create-homestay.dto';
import { UpdateHomestayDto } from './dto/update-homestay.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { BlockRoomDto } from './dto/block-room.dto';
import { UpdateRoomPricingDto } from './dto/update-room-pricing.dto';

@Injectable()
export class HomestayService {
  constructor(
    @InjectRepository(Homestay)
    private homestayRepository: Repository<Homestay>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  // Homestay CRUD Operations
  async createHomestay(
    createHomestayDto: CreateHomestayDto,
  ): Promise<Homestay> {
    let publicSlug = createHomestayDto.publicSlug;
    if (!publicSlug) {
      const cleanSlug = createHomestayDto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      publicSlug = `${cleanSlug}-${randomSuffix}`;
    }
    const homestay = this.homestayRepository.create({
      ...createHomestayDto,
      publicSlug,
    });
    return await this.homestayRepository.save(homestay);
  }

  async findAllHomestays(): Promise<Homestay[]> {
    return await this.homestayRepository.find({
      relations: ['rooms'],
      order: { createdAt: 'DESC' },
    });
  }

  async findHomestayById(id: string): Promise<Homestay> {
    const homestay = await this.homestayRepository.findOne({
      where: { id },
      relations: ['rooms'],
    });

    if (!homestay) {
      throw new NotFoundException(`Homestay with ID ${id} not found`);
    }

    return homestay;
  }

  async findHomestayBySlug(publicSlug: string): Promise<Homestay> {
    const homestay = await this.homestayRepository.findOne({
      where: { publicSlug },
      relations: ['rooms'],
    });
    if (!homestay) {
      throw new NotFoundException(`Homestay with slug ${publicSlug} not found`);
    }
    return homestay;
  }

  async getPublicProfile(publicSlug: string): Promise<any> {
    const homestay = await this.findHomestayBySlug(publicSlug);
    return {
      id: homestay.id,
      name: homestay.name,
      description: homestay.description,
      address: homestay.address,
      city: homestay.city,
      state: homestay.state,
      pincode: homestay.pincode,
      latitude: homestay.latitude,
      longitude: homestay.longitude,
      contactNumber: homestay.contactNumber,
      email: homestay.email,
      images: homestay.images,
      amenities: homestay.amenities,
      totalRooms: homestay.totalRooms,
      rooms: homestay.rooms.map((room) => ({
        id: room.id,
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        pricePerHead: room.pricePerHead,
        amenities: room.amenities,
        roomType: room.roomType,
        status: room.status,
      })),
    };
  }

  async getPublicAvailability(
    publicSlug: string,
    checkInDateStr: string,
    checkOutDateStr: string,
  ): Promise<any> {
    const homestay = await this.findHomestayBySlug(publicSlug);

    const checkIn = new Date(checkInDateStr);
    const checkOut = new Date(checkOutDateStr);

    if (checkOut <= checkIn) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }

    const rooms = homestay.rooms;
    const roomIds = rooms.map((r) => r.id);

    if (roomIds.length === 0) {
      return {
        id: homestay.id,
        name: homestay.name,
        rooms: [],
      };
    }

    // Dynamic query builder mapping BookingRoom overlapping records
    const overlappingBookingRooms = await this.roomRepository.manager
      .createQueryBuilder('booking_rooms', 'br')
      .innerJoin('br.booking', 'b')
      .where('br.roomId IN (:...roomIds)', { roomIds })
      .andWhere('b.status NOT IN (:...statuses)', {
        statuses: ['cancelled', 'checked_out'],
      })
      .andWhere('(b.checkInDate < :checkOut AND b.checkOutDate > :checkIn)', {
        checkIn,
        checkOut,
      })
      .select(['br.roomId'])
      .getRawMany();

    const bookedRoomIds = overlappingBookingRooms.map((br) => br.br_roomId);

    return {
      id: homestay.id,
      name: homestay.name,
      rooms: rooms.map((room) => {
        const isBooked = bookedRoomIds.includes(room.id);
        const isAvailable = !isBooked && room.status === 'available';
        return {
          id: room.id,
          roomNumber: room.roomNumber,
          capacity: room.capacity,
          pricePerHead: room.pricePerHead,
          roomType: room.roomType,
          isAvailable,
          status: isAvailable ? 'available' : 'booked',
        };
      }),
    };
  }

  async updateHomestay(
    id: string,
    updateHomestayDto: UpdateHomestayDto,
  ): Promise<Homestay> {
    const homestay = await this.findHomestayById(id);
    Object.assign(homestay, updateHomestayDto);
    return await this.homestayRepository.save(homestay);
  }

  async deleteHomestay(id: string): Promise<void> {
    const result = await this.homestayRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Homestay with ID ${id} not found`);
    }
  }

  // Room CRUD Operations
  async addRoom(
    homestayId: string,
    createRoomDto: CreateRoomDto,
  ): Promise<Room> {
    const homestay = await this.findHomestayById(homestayId);

    // Check for duplicate room number
    const existingRoom = await this.roomRepository.findOne({
      where: { homestayId, roomNumber: createRoomDto.roomNumber },
    });

    if (existingRoom) {
      throw new BadRequestException(
        `Room number ${createRoomDto.roomNumber} already exists in this homestay`,
      );
    }

    const room = this.roomRepository.create({
      ...createRoomDto,
      homestayId,
    });

    const savedRoom = await this.roomRepository.save(room);

    // Update total rooms count
    await this.updateHomestayRoomCount(homestayId);

    return savedRoom;
  }

  async findAllRoomsByHomestay(homestayId: string): Promise<Room[]> {
    await this.findHomestayById(homestayId);
    return await this.roomRepository.find({
      where: { homestayId },
      order: { roomNumber: 'ASC' },
    });
  }

  async findRoomById(roomId: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['homestay'],
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    return room;
  }

  async updateRoom(
    roomId: string,
    updateRoomDto: UpdateRoomDto,
  ): Promise<Room> {
    const room = await this.findRoomById(roomId);
    Object.assign(room, updateRoomDto);
    return await this.roomRepository.save(room);
  }

  async deleteRoom(roomId: string): Promise<void> {
    const room = await this.findRoomById(roomId);
    const homestayId = room.homestayId;

    await this.roomRepository.delete(roomId);
    await this.updateHomestayRoomCount(homestayId);
  }

  // Room Blocking
  async blockRoom(roomId: string, blockRoomDto: BlockRoomDto): Promise<Room> {
    const room = await this.findRoomById(roomId);

    room.status = RoomStatus.BLOCKED;
    room.blockReason = blockRoomDto.reason;
    room.blockedFrom = blockRoomDto.blockedFrom
      ? new Date(blockRoomDto.blockedFrom)
      : new Date();
    room.blockedUntil = blockRoomDto.blockedUntil
      ? new Date(blockRoomDto.blockedUntil)
      : null;

    return await this.roomRepository.save(room);
  }

  async unblockRoom(roomId: string): Promise<Room> {
    const room = await this.findRoomById(roomId);

    room.status = RoomStatus.AVAILABLE;
    room.blockReason = null;
    room.blockedFrom = null;
    room.blockedUntil = null;

    return await this.roomRepository.save(room);
  }

  // Update Room Pricing
  async updateRoomPricing(
    roomId: string,
    updatePricingDto: UpdateRoomPricingDto,
  ): Promise<Room> {
    const room = await this.findRoomById(roomId);
    room.pricePerHead = updatePricingDto.pricePerHead;
    return await this.roomRepository.save(room);
  }

  // Statistics and Helper Methods
  async getHomestayStatistics(homestayId: string) {
    const homestay = await this.findHomestayById(homestayId);
    const rooms = await this.findAllRoomsByHomestay(homestayId);

    const viewRooms = rooms.filter((r) => r.roomType === RoomType.VIEW);
    const nonViewRooms = rooms.filter((r) => r.roomType === RoomType.NON_VIEW);
    const availableRooms = rooms.filter(
      (r) => r.status === RoomStatus.AVAILABLE,
    );
    const blockedRooms = rooms.filter((r) => r.status === RoomStatus.BLOCKED);

    return {
      homestay: {
        id: homestay.id,
        name: homestay.name,
      },
      totalRooms: rooms.length,
      viewRooms: viewRooms.length,
      nonViewRooms: nonViewRooms.length,
      availableRooms: availableRooms.length,
      blockedRooms: blockedRooms.length,
      totalCapacity: rooms.reduce((sum, room) => sum + room.capacity, 0),
    };
  }

  async findAvailableRooms(homestayId: string): Promise<Room[]> {
    return await this.roomRepository.find({
      where: {
        homestayId,
        status: RoomStatus.AVAILABLE,
      },
      order: { roomNumber: 'ASC' },
    });
  }

  async addImages(homestayId: string, images: string[]): Promise<Homestay> {
    const homestay = await this.findHomestayById(homestayId);
    const currentImages = homestay.images || [];
    homestay.images = [...currentImages, ...images];
    return await this.homestayRepository.save(homestay);
  }

  async addRoomImages(roomId: string, images: string[]): Promise<Room> {
    const room = await this.findRoomById(roomId);
    const currentImages = room.images || [];
    room.images = [...currentImages, ...images];
    return await this.roomRepository.save(room);
  }

  private async updateHomestayRoomCount(homestayId: string): Promise<void> {
    const count = await this.roomRepository.count({ where: { homestayId } });
    await this.homestayRepository.update(homestayId, { totalRooms: count });
  }
}
