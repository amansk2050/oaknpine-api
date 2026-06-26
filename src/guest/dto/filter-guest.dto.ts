import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { GuestSource, ConfirmationEmailStatus } from '../entities/guest.entity';

export class FilterGuestDto {
  @ApiPropertyOptional({
    description: 'Filter by guest source (e.g. walk_in, lead, b2b)',
    enum: GuestSource,
  })
  @IsOptional()
  @IsEnum(GuestSource)
  source?: GuestSource;

  @ApiPropertyOptional({ description: 'Search by name or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by confirmation email status',
    enum: ConfirmationEmailStatus,
  })
  @IsOptional()
  @IsEnum(ConfirmationEmailStatus)
  confirmationEmailStatus?: ConfirmationEmailStatus;
}
