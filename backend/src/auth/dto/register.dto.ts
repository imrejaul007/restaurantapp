import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, RestaurantCategory } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+91-9876543210' })
  @IsOptional()
  @IsPhoneNumber('IN')
  phone?: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRole, example: 'restaurant' })
  @IsEnum(UserRole)
  role: UserRole;

  // Restaurant-specific fields
  @ApiProperty({ example: 'Tasty Bites Restaurant', required: false })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiProperty({ enum: RestaurantCategory, required: false })
  @IsOptional()
  @IsEnum(RestaurantCategory)
  category?: RestaurantCategory;

  // Employee-specific fields
  @ApiProperty({ example: 'Jane Smith', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  // Vendor-specific fields
  @ApiProperty({ example: 'raw_materials', required: false })
  @IsOptional()
  @IsString()
  vendorCategory?: string;
}