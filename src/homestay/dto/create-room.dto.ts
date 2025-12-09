import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomType } from '../entities/room.entity';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Room number/identifier',
    example: '101',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @ApiProperty({
    description: 'Name/title of the room',
    example: 'Deluxe Mountain View',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  roomName: string;

  @ApiProperty({
    description: 'Type of room based on view',
    enum: RoomType,
    example: RoomType.VIEW,
  })
  @IsEnum(RoomType)
  roomType: RoomType;

  @ApiProperty({
    description: 'Maximum number of people the room can accommodate',
    example: 3,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiProperty({
    description: 'Price per person per day',
    example: 1500.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  pricePerHead: number;

  @ApiPropertyOptional({
    description: 'Base price for the room',
    example: 3000.0,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({
    description: 'Detailed description of the room',
    example: 'Spacious room with king-size bed and mountain view balcony',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'List of amenities in the room',
    example: ['AC', 'TV', 'WiFi', 'Geyser'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Array of room image URLs',
    example: ['https://example.com/room1.jpg', 'https://example.com/room2.jpg'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({
    description: 'Floor number where room is located',
    example: 2,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  floorNumber?: number;
}
