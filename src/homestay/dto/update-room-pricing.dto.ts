import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateRoomPricingDto {
  @ApiProperty({
    description: 'Updated price per person per day',
    example: 1800.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  pricePerHead: number;
}
