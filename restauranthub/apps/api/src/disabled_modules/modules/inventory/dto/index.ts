import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { StockMovementType } from '@prisma/client';

export class CreateStockMovementDto {
  @IsString()
  productId: string;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsNumber()
  quantity: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class BulkStockUpdateItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsString()
  reason: string;
}

export class BulkStockUpdateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkStockUpdateItemDto)
  updates: BulkStockUpdateItemDto[];
}

export class CreateInventoryBatchDto {
  @IsString()
  productId: string;

  @IsString()
  batchNumber: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  costPrice: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;
}