import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateHomestayDto } from './create-homestay.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateHomestayDto extends PartialType(CreateHomestayDto) {
  @ApiPropertyOptional({
    description: 'Current status of the homestay',
    enum: ['active', 'inactive', 'maintenance'],
    example: 'active',
  })
  @IsEnum(['active', 'inactive', 'maintenance'])
  @IsOptional()
  status?: string;
}
