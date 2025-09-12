import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsPhoneNumber } from 'class-validator';
import { UserRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.RESTAURANT })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsPhoneNumber('IN')
  phone?: string;

  // Role-specific fields
  @ApiPropertyOptional({ example: 'The Food Court' })
  @IsOptional()
  @IsString()
  restaurantName?: string;

  @ApiPropertyOptional({ example: ['Indian', 'Chinese'] })
  @IsOptional()
  cuisineType?: string[];

  @ApiPropertyOptional({ example: 'ABC Corp' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'Food Supplies' })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @ApiPropertyOptional({ example: 'Manager' })
  @IsOptional()
  @IsString()
  designation?: string;
}