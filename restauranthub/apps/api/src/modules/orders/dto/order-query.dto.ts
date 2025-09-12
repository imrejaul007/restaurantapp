import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

enum OrderType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
  DINE_IN = 'DINE_IN',
}

export class OrderQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;


  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;



  @IsOptional()
  @IsEnum(['asc', 'desc'])
  declare sortOrder?: 'asc' | 'desc';
}