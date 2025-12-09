import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { PaymentMethod, PaymentType } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Payment amount',
    example: 5000.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentMethod,
    example: PaymentMethod.UPI,
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Type of payment',
    enum: PaymentType,
    example: PaymentType.ADVANCE,
  })
  @IsEnum(PaymentType)
  @IsNotEmpty()
  paymentType: PaymentType;

  @ApiPropertyOptional({
    description: 'Transaction ID from payment gateway',
    example: 'TXN123456789',
  })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Payment gateway name',
    example: 'Razorpay',
  })
  @IsString()
  @IsOptional()
  paymentGateway?: string;

  @ApiPropertyOptional({
    description: 'Payment date and time',
    example: '2024-01-15T14:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional({
    description: 'Notes about the payment',
    example: 'Advance payment received via UPI',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Additional payment details',
    example: { bankName: 'HDFC Bank', accountNumber: '****1234' },
  })
  @IsOptional()
  paymentDetails?: Record<string, any>;
}
