import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlockRoomDto {
  @ApiProperty({
    description: 'Reason for blocking the room',
    example: 'Under renovation',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'Date from which room should be blocked',
    example: '2024-01-25',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  blockedFrom?: string;

  @ApiPropertyOptional({
    description: 'Date until which room should be blocked',
    example: '2024-01-30',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  blockedUntil?: string;
}
