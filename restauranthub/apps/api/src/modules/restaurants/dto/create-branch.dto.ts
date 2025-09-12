import { IsString, IsEmail, IsOptional, IsNumber, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({ example: 'Main Branch' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '123 Main Street, Downtown' })
  @IsString()
  address!: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  city!: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  state!: string;

  @ApiProperty({ example: '400001' })
  @IsString()
  pincode!: string;

  @ApiProperty({ example: '+919876543210' })
  @IsPhoneNumber('IN')
  phone!: string;

  @ApiPropertyOptional({ example: 'branch@restaurant.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiPropertyOptional({ example: 19.0760 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 72.8777 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}