import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  CreateMenuModifierDto,
  UpdateMenuModifierDto,
  UpdateMenuItemAvailabilityDto,
  BulkPriceUpdateDto,
  ReorderItemsDto,
  ReorderCategoriesDto
} from './dto';

@Controller('menu')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // Menu Categories
  @Post('categories')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async createMenuCategory(
    @Body() createMenuCategoryDto: CreateMenuCategoryDto,
    @Request() req: any
  ) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : createMenuCategoryDto.restaurantId;

    return this.menuService.createMenuCategory({
      ...createMenuCategoryDto,
      restaurantId
    });
  }

  @Get('categories')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN, UserRole.EMPLOYEE)
  async getMenuCategories(@Request() req: any) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : req.user.employee?.restaurantId;

    return this.menuService.getMenuCategories(restaurantId);
  }

  @Patch('categories/:id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async updateMenuCategory(
    @Param('id') id: string,
    @Body() updateMenuCategoryDto: UpdateMenuCategoryDto
  ) {
    return this.menuService.updateMenuCategory(id, updateMenuCategoryDto);
  }

  @Delete('categories/:id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async deleteMenuCategory(@Param('id') id: string) {
    return this.menuService.deleteMenuCategory(id);
  }

  @Post('categories/reorder')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async reorderMenuCategories(
    @Body() reorderCategoriesDto: ReorderCategoriesDto,
    @Request() req: any
  ) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : reorderCategoriesDto.restaurantId;

    return this.menuService.reorderMenuCategories(restaurantId, reorderCategoriesDto.categories);
  }

  // Menu Items
  @Post('items')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async createMenuItem(
    @Body() createMenuItemDto: CreateMenuItemDto,
    @Request() req: any
  ) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : createMenuItemDto.restaurantId;

    return this.menuService.createMenuItem({
      ...createMenuItemDto,
      restaurantId
    });
  }

  @Get('items')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN, UserRole.EMPLOYEE)
  async getMenuItems(
    @Query('categoryId') categoryId?: string,
    @Request() req?: any
  ) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : req.user.employee?.restaurantId;

    return this.menuService.getMenuItems(restaurantId, categoryId);
  }

  @Get('items/:id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN, UserRole.EMPLOYEE)
  async getMenuItemById(@Param('id') id: string) {
    return this.menuService.getMenuItemById(id);
  }

  @Patch('items/:id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async updateMenuItem(
    @Param('id') id: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto
  ) {
    return this.menuService.updateMenuItem(id, updateMenuItemDto);
  }

  @Patch('items/:id/availability')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN, UserRole.EMPLOYEE)
  async updateMenuItemAvailability(
    @Param('id') id: string,
    @Body() updateAvailabilityDto: UpdateMenuItemAvailabilityDto
  ) {
    return this.menuService.updateMenuItemAvailability(id, updateAvailabilityDto.isAvailable);
  }

  @Delete('items/:id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async deleteMenuItem(@Param('id') id: string) {
    return this.menuService.deleteMenuItem(id);
  }

  @Post('items/:id/reorder')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async reorderMenuItems(
    @Param('id') categoryId: string,
    @Body() reorderItemsDto: ReorderItemsDto
  ) {
    return this.menuService.reorderMenuItems(categoryId, reorderItemsDto.items);
  }

  // Menu Modifiers
  @Post('items/:id/modifiers')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async addMenuModifier(
    @Param('id') menuItemId: string,
    @Body() createMenuModifierDto: CreateMenuModifierDto
  ) {
    return this.menuService.addMenuModifier(menuItemId, createMenuModifierDto);
  }

  @Patch('modifiers/:id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async updateMenuModifier(
    @Param('id') id: string,
    @Body() updateMenuModifierDto: UpdateMenuModifierDto
  ) {
    return this.menuService.updateMenuModifier(id, updateMenuModifierDto);
  }

  @Delete('modifiers/:id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async deleteMenuModifier(@Param('id') id: string) {
    return this.menuService.deleteMenuModifier(id);
  }

  // Full Menu
  @Get('full')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN, UserRole.EMPLOYEE)
  async getFullMenu(@Request() req: any) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : req.user.employee?.restaurantId;

    return this.menuService.getFullMenu(restaurantId);
  }

  // Bulk Operations
  @Post('pricing/bulk-update')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async updateMenuPricing(
    @Body() bulkPriceUpdateDto: BulkPriceUpdateDto,
    @Request() req: any
  ) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : bulkPriceUpdateDto.restaurantId;

    return this.menuService.updateMenuPricing(restaurantId, {
      type: bulkPriceUpdateDto.type,
      value: bulkPriceUpdateDto.value
    });
  }
}