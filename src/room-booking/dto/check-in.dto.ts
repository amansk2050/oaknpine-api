import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CheckInDto {
  @ApiPropertyOptional({
    description: 'Actual check-in time',
    example: '2024-02-15T14:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  actualCheckInTime?: string;

  @ApiPropertyOptional({
    description: 'Check-in notes',
    example: 'All documents verified, room keys handed over',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
