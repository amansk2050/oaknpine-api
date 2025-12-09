import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { RoomStatus } from '../entities/room.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @ApiPropertyOptional({
    description: 'Current status of the room',
    enum: RoomStatus,
    example: RoomStatus.AVAILABLE,
  })
  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus;
}
