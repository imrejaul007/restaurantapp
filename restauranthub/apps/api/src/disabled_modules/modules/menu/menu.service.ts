import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateMenuCategoryData {
  restaurantId: string;
  name: string;
  description?: string;
  image?: string;
  displayOrder?: number;
}

export interface CreateMenuItemData {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  image?: string;
  basePrice: number;
  preparationTime?: number;
  calories?: number;
  allergens?: string[];
  tags?: string[];
  displayOrder?: number;
  modifiers?: CreateMenuModifierData[];
  variants?: CreateMenuVariantData[];
}

export interface CreateMenuModifierData {
  name: string;
  type: string; // addon, variant, required
  isRequired?: boolean;
  multiSelect?: boolean;
  displayOrder?: number;
  options: CreateMenuModifierOptionData[];
}

export interface CreateMenuModifierOptionData {
  name: string;
  priceChange?: number;
  isAvailable?: boolean;
  displayOrder?: number;
}

export interface CreateMenuVariantData {
  name: string;
  priceChange?: number;
  isAvailable?: boolean;
}

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(private prisma: PrismaService) {}

  async createMenuCategory(data: CreateMenuCategoryData) {
    this.logger.log(`Creating menu category: ${data.name} for restaurant: ${data.restaurantId}`);

    return this.prisma.menuCategory.create({
      data: {
        restaurantId: data.restaurantId,
        name: data.name,
        description: data.description,
        image: data.image,
        displayOrder: data.displayOrder || 0
      }
    });
  }

  async getMenuCategories(restaurantId: string) {
    return this.prisma.menuCategory.findMany({
      where: {
        restaurantId,
        isActive: true
      },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: { displayOrder: 'asc' },
          take: 5 // Preview only
        }
      },
      orderBy: { displayOrder: 'asc' }
    });
  }

  async updateMenuCategory(id: string, data: Partial<CreateMenuCategoryData>) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id }
    });

    if (!category) {
      throw new NotFoundException('Menu category not found');
    }

    return this.prisma.menuCategory.update({
      where: { id },
      data
    });
  }

  async deleteMenuCategory(id: string) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id },
      include: { menuItems: true }
    });

    if (!category) {
      throw new NotFoundException('Menu category not found');
    }

    if (category.menuItems.length > 0) {
      throw new BadRequestException('Cannot delete category with menu items. Move or delete items first.');
    }

    return this.prisma.menuCategory.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async createMenuItem(data: CreateMenuItemData) {
    this.logger.log(`Creating menu item: ${data.name} for restaurant: ${data.restaurantId}`);

    return this.prisma.$transaction(async (tx) => {
      const menuItem = await tx.menuItem.create({
        data: {
          restaurantId: data.restaurantId,
          categoryId: data.categoryId,
          name: data.name,
          description: data.description,
          image: data.image,
          basePrice: data.basePrice,
          preparationTime: data.preparationTime,
          calories: data.calories,
          allergens: data.allergens || [],
          tags: data.tags || [],
          displayOrder: data.displayOrder || 0
        }
      });

      // Create modifiers if provided
      if (data.modifiers && data.modifiers.length > 0) {
        for (const modifierData of data.modifiers) {
          const modifier = await tx.menuModifier.create({
            data: {
              menuItemId: menuItem.id,
              name: modifierData.name,
              type: modifierData.type,
              isRequired: modifierData.isRequired || false,
              multiSelect: modifierData.multiSelect || false,
              displayOrder: modifierData.displayOrder || 0
            }
          });

          // Create modifier options
          if (modifierData.options && modifierData.options.length > 0) {
            await tx.menuModifierOption.createMany({
              data: modifierData.options.map(option => ({
                modifierId: modifier.id,
                name: option.name,
                priceChange: option.priceChange || 0,
                isAvailable: option.isAvailable !== false,
                displayOrder: option.displayOrder || 0
              }))
            });
          }
        }
      }

      // Create variants if provided
      if (data.variants && data.variants.length > 0) {
        await tx.menuVariant.createMany({
          data: data.variants.map(variant => ({
            menuItemId: menuItem.id,
            name: variant.name,
            priceChange: variant.priceChange || 0,
            isAvailable: variant.isAvailable !== false
          }))
        });
      }

      return tx.menuItem.findUnique({
        where: { id: menuItem.id },
        include: {
          modifiers: {
            include: { options: true },
            orderBy: { displayOrder: 'asc' }
          },
          variants: true
        }
      });
    });
  }

  async getMenuItems(restaurantId: string, categoryId?: string) {
    const where: any = {
      restaurantId,
      isAvailable: true
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    return this.prisma.menuItem.findMany({
      where,
      include: {
        category: { select: { name: true } },
        modifiers: {
          include: { options: true },
          orderBy: { displayOrder: 'asc' }
        },
        variants: true
      },
      orderBy: { displayOrder: 'asc' }
    });
  }

  async getMenuItemById(id: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        modifiers: {
          include: { options: true },
          orderBy: { displayOrder: 'asc' }
        },
        variants: true
      }
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return menuItem;
  }

  async updateMenuItem(id: string, data: Partial<CreateMenuItemData>) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id }
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        basePrice: data.basePrice,
        preparationTime: data.preparationTime,
        calories: data.calories,
        allergens: data.allergens,
        tags: data.tags,
        displayOrder: data.displayOrder
      }
    });
  }

  async updateMenuItemAvailability(id: string, isAvailable: boolean) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id }
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable }
    });
  }

  async deleteMenuItem(id: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id }
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: false }
    });
  }

  async addMenuModifier(menuItemId: string, modifierData: CreateMenuModifierData) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId }
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const modifier = await tx.menuModifier.create({
        data: {
          menuItemId,
          name: modifierData.name,
          type: modifierData.type,
          isRequired: modifierData.isRequired || false,
          multiSelect: modifierData.multiSelect || false,
          displayOrder: modifierData.displayOrder || 0
        }
      });

      if (modifierData.options && modifierData.options.length > 0) {
        await tx.menuModifierOption.createMany({
          data: modifierData.options.map(option => ({
            modifierId: modifier.id,
            name: option.name,
            priceChange: option.priceChange || 0,
            isAvailable: option.isAvailable !== false,
            displayOrder: option.displayOrder || 0
          }))
        });
      }

      return tx.menuModifier.findUnique({
        where: { id: modifier.id },
        include: { options: true }
      });
    });
  }

  async updateMenuModifier(id: string, data: Partial<CreateMenuModifierData>) {
    const modifier = await this.prisma.menuModifier.findUnique({
      where: { id }
    });

    if (!modifier) {
      throw new NotFoundException('Menu modifier not found');
    }

    return this.prisma.menuModifier.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        isRequired: data.isRequired,
        multiSelect: data.multiSelect,
        displayOrder: data.displayOrder
      }
    });
  }

  async deleteMenuModifier(id: string) {
    const modifier = await this.prisma.menuModifier.findUnique({
      where: { id }
    });

    if (!modifier) {
      throw new NotFoundException('Menu modifier not found');
    }

    return this.prisma.menuModifier.delete({
      where: { id }
    });
  }

  async getFullMenu(restaurantId: string) {
    return this.prisma.menuCategory.findMany({
      where: {
        restaurantId,
        isActive: true
      },
      include: {
        menuItems: {
          where: { isAvailable: true },
          include: {
            modifiers: {
              include: { options: true },
              orderBy: { displayOrder: 'asc' }
            },
            variants: true
          },
          orderBy: { displayOrder: 'asc' }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });
  }

  async updateMenuPricing(restaurantId: string, priceAdjustment: { type: 'percentage' | 'fixed'; value: number }) {
    this.logger.log(`Updating menu pricing for restaurant: ${restaurantId}`);

    const menuItems = await this.prisma.menuItem.findMany({
      where: { restaurantId }
    });

    const updates = menuItems.map(item => {
      let newPrice = item.basePrice;

      if (priceAdjustment.type === 'percentage') {
        newPrice = item.basePrice * (1 + priceAdjustment.value / 100);
      } else {
        newPrice = item.basePrice + priceAdjustment.value;
      }

      return this.prisma.menuItem.update({
        where: { id: item.id },
        data: { basePrice: Math.round(newPrice * 100) / 100 } // Round to 2 decimal places
      });
    });

    await Promise.all(updates);

    this.logger.log(`Updated pricing for ${menuItems.length} menu items`);
    return { updated: menuItems.length, type: priceAdjustment.type, value: priceAdjustment.value };
  }

  async reorderMenuItems(categoryId: string, itemOrders: { id: string; displayOrder: number }[]) {
    const updates = itemOrders.map(item =>
      this.prisma.menuItem.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder }
      })
    );

    await Promise.all(updates);
    return { updated: itemOrders.length };
  }

  async reorderMenuCategories(restaurantId: string, categoryOrders: { id: string; displayOrder: number }[]) {
    const updates = categoryOrders.map(category =>
      this.prisma.menuCategory.update({
        where: { id: category.id },
        data: { displayOrder: category.displayOrder }
      })
    );

    await Promise.all(updates);
    return { updated: categoryOrders.length };
  }
}