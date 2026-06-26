import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({
    description: 'Expense category (food, vehicle, stay, guide, tickets, other)',
    example: 'vehicle',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Expense title/short name',
    example: 'Darjeeling Cab Fuel & Driver',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the expense',
    example: 'Cab charge for Darjeeling local sightseeing for 3 days',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Amount spent',
    example: 3500.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Date when expense was incurred',
    example: '2024-02-16',
  })
  @IsDateString()
  @IsNotEmpty()
  expenseDate: string;

  @ApiPropertyOptional({
    description: 'Standard booking UUID this expense is associated with',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Package booking UUID this expense is associated with',
    example: '123e4567-e89b-12d3-a456-426614174006',
  })
  @IsOptional()
  @IsString()
  packageBookingId?: string;
}
