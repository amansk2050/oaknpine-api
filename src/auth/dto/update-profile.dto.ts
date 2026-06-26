import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'Sheikh Aman',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Role type of the user',
    example: 'Lease Owner',
    enum: ['Lease Owner', 'Owner', 'super_admin'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['Lease Owner', 'Owner', 'super_admin'])
  roleType?: string;
}
