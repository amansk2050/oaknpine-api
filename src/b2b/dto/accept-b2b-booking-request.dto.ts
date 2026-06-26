import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingRoomDto } from '../../room-booking/dto/create-booking.dto';

export class AcceptB2bBookingRequestDto {
  @ApiProperty({
    description: 'Rooms to be booked with guest count',
    type: [BookingRoomDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingRoomDto)
  rooms: BookingRoomDto[];

  @ApiPropertyOptional({
    description: 'Discount amount',
    example: 500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Tax percentage',
    example: 12,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercentage?: number;
}
export class RejectB2bBookingRequestDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'No availability for requested dates',
  })
  @IsNotEmpty()
  rejectionReason: string;
}
