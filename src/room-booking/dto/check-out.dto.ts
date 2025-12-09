import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CheckOutDto {
  @ApiPropertyOptional({
    description: 'Actual check-out time',
    example: '2024-02-18T11:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  actualCheckOutTime?: string;

  @ApiPropertyOptional({
    description: 'Check-out notes',
    example: 'No damages, all keys returned',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
