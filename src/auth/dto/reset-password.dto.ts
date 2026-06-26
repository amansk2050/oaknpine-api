import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'aman@agency.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'http://localhost:3001/reset-password',
    required: false,
  })
  @IsString()
  @IsOptional()
  redirectTo?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123resettoken' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewStrongPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
