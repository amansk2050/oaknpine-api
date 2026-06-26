import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
} from 'class-validator';

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  UPI = 'upi',
  BANK_TRANSFER = 'bank_transfer',
  ONLINE = 'online',
  CHEQUE = 'cheque',
  OTHER = 'other',
}

export enum PaymentType {
  ADVANCE = 'advance',
  PARTIAL = 'partial',
  FULL = 'full',
  REFUND = 'refund',
}

export class AddPaymentDto {
  @ApiProperty({ description: 'Payment amount', example: 5000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.UPI,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Payment type',
    enum: PaymentType,
    example: PaymentType.PARTIAL,
  })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiPropertyOptional({
    description: 'Transaction ID from payment gateway',
    example: 'TXN123456789',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Payment date (defaults to now)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsString()
  paymentDate?: string;

  @ApiPropertyOptional({
    description: 'Notes about the payment',
    example: 'Advance payment received',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'User who recorded the payment',
    example: 'admin-user-id',
  })
  @IsOptional()
  @IsString()
  recordedBy?: string;

  @ApiPropertyOptional({
    description: 'Whether to also settle payment for associated room bookings',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  settleRoomBookings?: boolean;
}
