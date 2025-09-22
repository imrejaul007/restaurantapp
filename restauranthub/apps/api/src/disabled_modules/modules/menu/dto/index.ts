import { IsString, IsNumber, IsEnum, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuCategoryDto {
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class UpdateMenuCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateMenuModifierOptionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  priceChange?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class CreateMenuModifierDto {
  @IsString()
  name: string;

  @IsString()
  type: string; // addon, variant, required

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  multiSelect?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuModifierOptionDto)
  options: CreateMenuModifierOptionDto[];
}

export class CreateMenuVariantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  priceChange?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class CreateMenuItemDto {
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsString()
  categoryId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsNumber()
  basePrice: number;

  @IsOptional()
  @IsNumber()
  preparationTime?: number;

  @IsOptional()
  @IsNumber()
  calories?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergens?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuModifierDto)
  modifiers?: CreateMenuModifierDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuVariantDto)
  variants?: CreateMenuVariantDto[];
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  preparationTime?: number;

  @IsOptional()
  @IsNumber()
  calories?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergens?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class UpdateMenuModifierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  multiSelect?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class UpdateMenuItemAvailabilityDto {
  @IsBoolean()
  isAvailable: boolean;
}

export class BulkPriceUpdateDto {
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsEnum(['percentage', 'fixed'])
  type: 'percentage' | 'fixed';

  @IsNumber()
  value: number;
}

export class ReorderItemDto {
  @IsString()
  id: string;

  @IsNumber()
  displayOrder: number;
}

export class ReorderItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}

export class ReorderCategoryDto {
  @IsString()
  id: string;

  @IsNumber()
  displayOrder: number;
}

export class ReorderCategoriesDto {
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderCategoryDto)
  categories: ReorderCategoryDto[];
}