import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockMovementType } from '@prisma/client';

export interface StockMovement {
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  referenceId?: string;
  cost?: number;
  supplierId?: string;
  expiryDate?: Date;
}

export interface InventoryAlert {
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'overstock';
  productId: string;
  productName: string;
  currentStock: number;
  threshold?: number;
  expiryDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
}

export interface StockPrediction {
  productId: string;
  productName: string;
  currentStock: number;
  predictedDemand: number;
  recommendedReorder: number;
  reorderDate: Date;
  confidence: number;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  async recordStockMovement(movement: StockMovement, userId: string) {
    this.logger.log(`Recording stock movement for product ${movement.productId}: ${movement.type} ${movement.quantity}`);

    const product = await this.prisma.product.findUnique({
      where: { id: movement.productId },
      select: { id: true, name: true, stock: true, reservedStock: true, minStock: true }
    });

    if (!product) {
      throw new NotFoundException(`Product ${movement.productId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      let newStock = product.stock;

      switch (movement.type) {
        case StockMovementType.IN:
          newStock += movement.quantity;
          break;
        case StockMovementType.OUT:
        case StockMovementType.EXPIRED:
        case StockMovementType.DAMAGED:
          if (product.stock < movement.quantity) {
            throw new BadRequestException(`Insufficient stock for ${movement.type} movement`);
          }
          newStock -= movement.quantity;
          break;
        case StockMovementType.ADJUSTMENT:
          newStock = movement.quantity;
          break;
      }

      const updatedProduct = await tx.product.update({
        where: { id: movement.productId },
        data: { stock: newStock }
      });

      const stockMovementRecord = await tx.stockMovement.create({
        data: {
          productId: movement.productId,
          type: movement.type,
          quantity: movement.quantity,
          previousStock: product.stock,
          newStock,
          reason: movement.reason,
          referenceId: movement.referenceId,
          cost: movement.cost,
          supplierId: movement.supplierId,
          expiryDate: movement.expiryDate,
          createdBy: userId,
        }
      });

      return {
        movement: stockMovementRecord,
        product: updatedProduct,
        alerts: await this.getProductAlerts(movement.productId)
      };
    });
  }

  async bulkUpdateStock(updates: Array<{ productId: string; quantity: number; type: StockMovementType; reason: string }>, userId: string) {
    this.logger.log(`Processing bulk stock update for ${updates.length} products`);

    const results = [];

    for (const update of updates) {
      try {
        const result = await this.recordStockMovement({
          productId: update.productId,
          type: update.type,
          quantity: update.quantity,
          reason: update.reason
        }, userId);
        results.push({ productId: update.productId, success: true, result });
      } catch (error) {
        this.logger.error(`Failed to update stock for product ${update.productId}:`, error);
        results.push({
          productId: update.productId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    this.logger.log(`Bulk update completed: ${successCount}/${updates.length} successful`);

    return {
      total: updates.length,
      successful: successCount,
      failed: updates.length - successCount,
      results
    };
  }

  async getInventoryAlerts(restaurantId?: string): Promise<InventoryAlert[]> {
    const whereCondition = restaurantId ? { restaurantId } : {};

    const [lowStockProducts, outOfStockProducts, expiringProducts] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          ...whereCondition,
          AND: [
            { stock: { gt: 0 } },
            { stock: { lte: this.prisma.product.fields.minStock } }
          ]
        },
        select: { id: true, name: true, stock: true, minStock: true }
      }),
      this.prisma.product.findMany({
        where: { ...whereCondition, stock: { lte: 0 } },
        select: { id: true, name: true, stock: true }
      }),
      this.getExpiringProducts(restaurantId)
    ]);

    const alerts: InventoryAlert[] = [];

    lowStockProducts.forEach(product => {
      alerts.push({
        type: 'low_stock',
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        threshold: product.minStock,
        priority: 'medium',
        message: `Stock is running low (${product.stock} remaining, minimum: ${product.minStock})`
      });
    });

    outOfStockProducts.forEach(product => {
      alerts.push({
        type: 'out_of_stock',
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        priority: 'urgent',
        message: 'Product is out of stock'
      });
    });

    expiringProducts.forEach(product => {
      alerts.push({
        type: 'expiring_soon',
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        expiryDate: product.expiryDate,
        priority: 'high',
        message: `Product expires on ${product.expiryDate?.toLocaleDateString()}`
      });
    });

    return alerts.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async generateAutomaticReorders(restaurantId?: string): Promise<Array<{ productId: string; quantity: number; supplierId?: string }>> {
    const whereCondition = restaurantId ? { restaurantId } : {};

    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        ...whereCondition,
        AND: [
          { stock: { lte: this.prisma.product.fields.minStock } },
          { autoReorder: true }
        ]
      },
      include: {
        vendor: { select: { id: true, companyName: true } }
      }
    });

    const reorders = [];

    for (const product of lowStockProducts) {
      const averageDemand = await this.getAverageDemand(product.id, 30);
      const recommendedQuantity = Math.max(
        product.reorderPoint || product.minStock * 2,
        Math.ceil(averageDemand * 1.5)
      );

      reorders.push({
        productId: product.id,
        quantity: recommendedQuantity,
        supplierId: product.vendor?.id
      });

      await this.prisma.reorderRequest.create({
        data: {
          productId: product.id,
          quantity: recommendedQuantity,
          supplierId: product.vendor?.id,
          status: 'pending',
          type: 'automatic',
          reason: `Automatic reorder triggered - current stock: ${product.stock}, minimum: ${product.minStock}`
        }
      });
    }

    this.logger.log(`Generated ${reorders.length} automatic reorder requests`);
    return reorders;
  }

  async getInventoryReport(filters: {
    startDate?: Date;
    endDate?: Date;
    supplierId?: string;
    movementType?: StockMovementType;
    restaurantId?: string;
  }) {
    const { startDate, endDate, supplierId, movementType, restaurantId } = filters;

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (movementType) where.type = movementType;
    if (supplierId) where.supplierId = supplierId;

    if (restaurantId) {
      where.product = { restaurantId };
    }

    const [
      stockMovements,
      totalMovements,
      movementsByType,
      topMovedProducts,
      totalValue
    ] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
        _sum: { quantity: true }
      }),
      this.prisma.stockMovement.groupBy({
        by: ['productId'],
        where,
        _count: { productId: true },
        _sum: { quantity: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 10
      }),
      this.prisma.stockMovement.aggregate({
        where: { ...where, cost: { not: null } },
        _sum: { cost: true }
      })
    ]);

    return {
      summary: {
        totalMovements,
        totalValue: totalValue._sum.cost || 0,
        period: { startDate, endDate }
      },
      movements: stockMovements,
      analytics: {
        movementsByType,
        topMovedProducts
      }
    };
  }

  async addInventoryBatch(batchData: {
    productId: string;
    batchNumber: string;
    quantity: number;
    costPrice: number;
    expiryDate?: Date;
    supplierId?: string;
  }) {
    const batch = await this.prisma.inventoryBatch.create({
      data: {
        ...batchData,
        originalQuantity: batchData.quantity
      }
    });

    // Update product stock
    await this.prisma.product.update({
      where: { id: batchData.productId },
      data: {
        stock: { increment: batchData.quantity }
      }
    });

    return batch;
  }

  async getExpiringBatches(days: number = 30, restaurantId?: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const whereCondition: any = {
      expiryDate: {
        lte: expiryDate,
        gt: new Date()
      },
      quantity: { gt: 0 }
    };

    if (restaurantId) {
      whereCondition.product = { restaurantId };
    }

    return this.prisma.inventoryBatch.findMany({
      where: whereCondition,
      include: {
        product: { select: { name: true, sku: true } }
      },
      orderBy: { expiryDate: 'asc' }
    });
  }

  private async getProductAlerts(productId: string): Promise<InventoryAlert[]> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, stock: true, minStock: true }
    });

    if (!product) return [];

    const alerts: InventoryAlert[] = [];

    if (product.stock <= 0) {
      alerts.push({
        type: 'out_of_stock',
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        priority: 'urgent',
        message: 'Product is out of stock'
      });
    } else if (product.stock <= product.minStock) {
      alerts.push({
        type: 'low_stock',
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        threshold: product.minStock,
        priority: 'medium',
        message: `Stock is running low (${product.stock} remaining)`
      });
    }

    return alerts;
  }

  private async getExpiringProducts(restaurantId?: string) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const whereCondition: any = {
      expiryDate: {
        lte: thirtyDaysFromNow,
        gt: new Date()
      },
      quantity: { gt: 0 }
    };

    if (restaurantId) {
      whereCondition.product = { restaurantId };
    }

    const batches = await this.prisma.inventoryBatch.findMany({
      where: whereCondition,
      include: {
        product: { select: { id: true, name: true, stock: true } }
      },
      orderBy: { expiryDate: 'asc' }
    });

    return batches.map(batch => ({
      id: batch.product.id,
      name: batch.product.name,
      stock: batch.product.stock,
      expiryDate: batch.expiryDate
    }));
  }

  private async getAverageDemand(productId: string, days: number): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const demandData = await this.prisma.orderItem.aggregate({
      where: {
        productId,
        order: {
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' }
        }
      },
      _sum: { quantity: true }
    });

    const totalDemand = demandData._sum.quantity || 0;
    return totalDemand / days;
  }
}