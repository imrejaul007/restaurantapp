import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns InventoryBatch records for products owned by the given restaurant.
   * The join path is: InventoryBatch -> Product -> Restaurant (via restaurantId).
   */
  async getBatchesForRestaurant(restaurantId: string) {
    const batches = await this.prisma.inventoryBatch.findMany({
      where: {
        product: { restaurantId },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            unit: true,
            costPrice: true,
            price: true,
            stock: true,
            minStock: true,
            maxStock: true,
            sku: true,
            category: {
              select: { id: true, name: true },
            },
          },
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return batches;
  }

  async getStockMovementsForRestaurant(restaurantId: string, limit = 50) {
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        product: { restaurantId },
      },
      include: {
        product: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return movements;
  }
}
