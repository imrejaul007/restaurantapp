import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  customerNotes?: string;

  @IsOptional()
  @IsString()
  kitchenNotes?: string;

  @IsOptional()
  @IsNumber()
  preparationTime?: number;

  @IsOptional()
  @IsNumber()
  deliveryDuration?: number;
}