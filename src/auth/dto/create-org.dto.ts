import { IsString, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Darjeeling Hills Retreat' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'darjeeling-hills-retreat' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must be lowercase letters, numbers, and hyphens only',
  })
  @MinLength(2)
  slug: string;

  @ApiProperty({ example: '+91 98765 43210', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'contact@darjeelingretreat.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;
}
