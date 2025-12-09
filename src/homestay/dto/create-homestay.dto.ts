import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  MaxLength,
} from 'class-validator';

export class CreateHomestayDto {
  @ApiProperty({
    description: 'Name of the homestay',
    example: 'Mountain View Homestay',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Detailed description of the homestay',
    example:
      'A cozy homestay with beautiful mountain views and modern amenities',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Full address of the homestay',
    example: '123 Hill Station Road, Near Central Park',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @ApiProperty({
    description: 'City where the homestay is located',
    example: 'Shimla',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({
    description: 'State where the homestay is located',
    example: 'Himachal Pradesh',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @ApiProperty({
    description: 'Postal code',
    example: '171001',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  pincode: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate',
    example: 31.1048,
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: 77.1734,
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+91-9876543210',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  contactNumber: string;

  @ApiPropertyOptional({
    description: 'Contact email address',
    example: 'contact@mountainview.com',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs',
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({
    description: 'List of amenities available',
    example: ['WiFi', 'Parking', 'Restaurant', 'Room Service'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Owner/User ID who owns this homestay',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsOptional()
  ownerId?: string;
}
