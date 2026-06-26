import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({
    description: 'Name of the business / organization',
    example: 'Darjeeling Hills Retreat',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number of the business',
    example: '+91 98765 43210',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Official contact email of the business',
    example: 'contact@darjeelingretreat.com',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'Business website URL',
    example: 'https://darjeelingretreat.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({
    description: 'Physical address of the business headquarters',
    example: '12 Hill Station Road, Darjeeling',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'GSTIN or Business Registration Number',
    example: '19AAAAA0000A1Z5',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gstin?: string;

  @ApiPropertyOptional({
    description: 'Brief description of the travel agency / homestay business',
    example: 'Specialized in premium mountain retreats and local sightseeing.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL of the business logo image',
    example: '/uploads/logo-123.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  logo?: string;
}
