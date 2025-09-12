import { IsString, IsUUID, IsArray, IsEnum, IsNumber, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

enum OrderType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
  DINE_IN = 'DINE_IN',
}

export class OrderItemDto {
  @IsOptional()
  @IsUUID()
  menuItemId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  name!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitPrice!: number;

  @IsNumber()
  totalPrice!: number;

  @IsOptional()
  @IsObject()
  customizations?: any;

  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

export class CreateOrderDto {
  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsEnum(OrderType)
  type!: OrderType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsNumber()
  subtotal!: number;

  @IsNumber()
  taxAmount!: number;

  @IsNumber()
  deliveryFee!: number;

  @IsNumber()
  discountAmount!: number;

  @IsNumber()
  total!: number;

  @IsOptional()
  @IsObject()
  deliveryAddress?: any;

  @IsOptional()
  @IsString()
  customerNotes?: string;

  @IsOptional()
  @IsString()
  kitchenNotes?: string;
}