import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CircuitBreakerService } from '../../common/circuit-breaker.service';
import { DatabaseCircuitBreaker, ExternalApiCircuitBreaker } from '../../decorators/circuit-breaker.decorator';
import { ResilientDatabaseService } from '../../services/resilient-database.service';
import { ResilientHttpService } from '../../services/resilient-http.service';
import { WebsocketService } from '../websocket/websocket.service';

export interface StockMovement {
  productId: string;
  type: 'in' | 'out' | 'adjustment' | 'expired' | 'damaged';
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
export class InventoryManagementService {
  private readonly logger = new Logger(InventoryManagementService.name);

  constructor(
    private prisma: PrismaService,
    private circuitBreaker: CircuitBreakerService,
    private resilientDb: ResilientDatabaseService,
    private resilientHttp: ResilientHttpService,
    private websocketService: WebsocketService,
  ) {}

  @DatabaseCircuitBreaker()
  async recordStockMovement(movement: StockMovement) {
    this.logger.log(`Recording stock movement for product ${movement.productId}: ${movement.type} ${movement.quantity}`);

    const product = await this.resilientDb.executeReadOperation(
      () => this.prisma.product.findUnique({
        where: { id: movement.productId },
        select: { id: true, name: true, stock: true, reservedStock: true, minStock: true }
      }),
      { cacheKey: `product:${movement.productId}`, cacheTtl: 60000 }
    );

    if (!product) {
      throw new NotFoundException(`Product ${movement.productId} not found`);
    }

    return this.resilientDb.executeTransaction(async (tx) => {
      let newStock = product.stock;

      switch (movement.type) {
        case 'in':
          newStock += movement.quantity;
          break;
        case 'out':
        case 'expired':
        case 'damaged':
          if (product.stock < movement.quantity) {
            throw new BadRequestException(`Insufficient stock for ${movement.type} movement`);
          }
          newStock -= movement.quantity;
          break;
        case 'adjustment':
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
        }
      });

      await this.checkStockAlerts(movement.productId, newStock, product.minStock);

      await this.websocketService.sendStockUpdate(movement.productId, {
        productName: product.name,
        previousStock: product.stock,
        newStock,
        movement: movement.type,
        quantity: movement.quantity,
        timestamp: new Date()
      });

      return {
        movement: stockMovementRecord,
        product: updatedProduct,
        alerts: await this.getProductAlerts(movement.productId)
      };
    });
  }

  @DatabaseCircuitBreaker()
  async bulkUpdateStock(updates: Array<{ productId: string; quantity: number; type: 'in' | 'out' | 'adjustment'; reason: string }>) {
    this.logger.log(`Processing bulk stock update for ${updates.length} products`);

    const results = [];

    for (const update of updates) {
      try {
        const result = await this.recordStockMovement({
          productId: update.productId,
          type: update.type,
          quantity: update.quantity,
          reason: update.reason
        });
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

  @DatabaseCircuitBreaker()
  async getInventoryAlerts(): Promise<InventoryAlert[]> {
    const [lowStockProducts, outOfStockProducts, expiringProducts] = await Promise.all([
      this.resilientDb.executeReadOperation(
        () => this.prisma.product.findMany({
          where: {
            AND: [
              { stock: { gt: 0 } },
              { stock: { lte: this.prisma.product.fields.minStock } }
            ]
          },
          select: { id: true, name: true, stock: true, minStock: true }
        }),
        { cacheKey: 'low-stock-products', cacheTtl: 300000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.product.findMany({
          where: { stock: { lte: 0 } },
          select: { id: true, name: true, stock: true }
        }),
        { cacheKey: 'out-of-stock-products', cacheTtl: 300000 }
      ),
      this.getExpiringProducts()
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

  @ExternalApiCircuitBreaker('ml-service')
  async getStockPredictions(days: number = 30): Promise<StockPrediction[]> {
    try {
      const historicalData = await this.getHistoricalDemandData(days * 2);

      const predictions = await this.resilientHttp.post('/ml/stock-prediction', {
        historicalData,
        forecastDays: days,
        includeSeasonality: true
      }, {
        circuitBreakerName: 'ml-service',
        retryAttempts: 2,
        timeoutMs: 15000,
        fallbackResponse: []
      });

      this.logger.log(`Stock predictions generated for ${predictions.length} products`);
      return predictions;
    } catch (error) {
      this.logger.error('Failed to get stock predictions:', error);
      return this.getFallbackPredictions();
    }
  }

  @DatabaseCircuitBreaker()
  async generateAutomaticReorders(): Promise<Array<{ productId: string; quantity: number; supplierId?: string }>> {
    const lowStockProducts = await this.resilientDb.executeReadOperation(
      () => this.prisma.product.findMany({
        where: {
          AND: [
            { stock: { lte: this.prisma.product.fields.minStock } },
            { autoReorder: true }
          ]
        },
        include: {
          supplier: { select: { id: true, name: true, email: true } }
        }
      }),
      { cacheKey: 'auto-reorder-products', cacheTtl: 300000 }
    );

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
        supplierId: product.supplier?.id
      });

      await this.resilientDb.executeWriteOperation(
        () => this.prisma.reorderRequest.create({
          data: {
            productId: product.id,
            quantity: recommendedQuantity,
            supplierId: product.supplier?.id,
            status: 'pending',
            type: 'automatic',
            reason: `Automatic reorder triggered - current stock: ${product.stock}, minimum: ${product.minStock}`
          }
        }),
        { circuitBreakerName: 'reorder-creation' }
      );
    }

    if (reorders.length > 0) {
      await this.notifyReorderRequests(reorders);
    }

    this.logger.log(`Generated ${reorders.length} automatic reorder requests`);
    return reorders;
  }

  @DatabaseCircuitBreaker()
  async getInventoryReport(filters: {
    startDate?: Date;
    endDate?: Date;
    supplierId?: string;
    category?: string;
    movementType?: string;
  }) {
    const { startDate, endDate, supplierId, category, movementType } = filters;

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (movementType) where.type = movementType;

    const [
      stockMovements,
      totalMovements,
      movementsByType,
      topMovedProducts,
      totalValue
    ] = await Promise.all([
      this.resilientDb.executeReadOperation(
        () => this.prisma.stockMovement.findMany({
          where,
          include: {
            product: { select: { name: true, category: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 100
        }),
        { cacheKey: `inventory-report:movements:${JSON.stringify(filters)}`, cacheTtl: 300000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.stockMovement.count({ where }),
        { cacheKey: `inventory-report:count:${JSON.stringify(filters)}`, cacheTtl: 300000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.stockMovement.groupBy({
          by: ['type'],
          where,
          _count: { type: true },
          _sum: { quantity: true }
        }),
        { cacheKey: `inventory-report:by-type:${JSON.stringify(filters)}`, cacheTtl: 300000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.stockMovement.groupBy({
          by: ['productId'],
          where,
          _count: { productId: true },
          _sum: { quantity: true },
          orderBy: { _count: { productId: 'desc' } },
          take: 10
        }),
        { cacheKey: `inventory-report:top-products:${JSON.stringify(filters)}`, cacheTtl: 300000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.stockMovement.aggregate({
          where: { ...where, cost: { not: null } },
          _sum: { cost: true }
        }),
        { cacheKey: `inventory-report:value:${JSON.stringify(filters)}`, cacheTtl: 300000 }
      )
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

  @DatabaseCircuitBreaker()
  async optimizeInventoryLevels() {
    this.logger.log('Running inventory optimization');

    const products = await this.resilientDb.executeReadOperation(
      () => this.prisma.product.findMany({
        select: {
          id: true,
          name: true,
          stock: true,
          minStock: true,
          maxStock: true,
          reorderPoint: true
        }
      }),
      { cacheKey: 'all-products-inventory', cacheTtl: 300000 }
    );

    const optimizations = [];

    for (const product of products) {
      const demandData = await this.getDetailedDemandAnalysis(product.id);
      const optimization = await this.calculateOptimalLevels(product, demandData);

      if (optimization.shouldUpdate) {
        await this.resilientDb.executeWriteOperation(
          () => this.prisma.product.update({
            where: { id: product.id },
            data: {
              minStock: optimization.recommendedMin,
              maxStock: optimization.recommendedMax,
              reorderPoint: optimization.recommendedReorder
            }
          }),
          { circuitBreakerName: 'inventory-optimization' }
        );

        optimizations.push({
          productId: product.id,
          productName: product.name,
          changes: optimization
        });
      }
    }

    this.logger.log(`Inventory optimization completed for ${optimizations.length} products`);
    return optimizations;
  }

  @ExternalApiCircuitBreaker('notification-service')
  async sendLowStockAlerts() {
    const alerts = await this.getInventoryAlerts();
    const urgentAlerts = alerts.filter(alert => alert.priority === 'urgent' || alert.priority === 'high');

    if (urgentAlerts.length === 0) {
      return { sent: false, message: 'No urgent alerts to send' };
    }

    try {
      await this.resilientHttp.post('/notifications/bulk', {
        type: 'inventory_alert',
        recipients: await this.getInventoryManagers(),
        data: {
          alertCount: urgentAlerts.length,
          alerts: urgentAlerts,
          timestamp: new Date()
        }
      }, {
        circuitBreakerName: 'notification-service',
        retryAttempts: 2,
        timeoutMs: 10000
      });

      this.logger.log(`Sent inventory alerts for ${urgentAlerts.length} urgent issues`);
      return { sent: true, alertCount: urgentAlerts.length };
    } catch (error) {
      this.logger.error('Failed to send inventory alerts:', error);
      return { sent: false, error: error.message };
    }
  }

  private async checkStockAlerts(productId: string, currentStock: number, minStock: number) {
    if (currentStock <= 0) {
      await this.websocketService.sendInventoryAlert({
        type: 'out_of_stock',
        productId,
        currentStock,
        priority: 'urgent'
      });
    } else if (currentStock <= minStock) {
      await this.websocketService.sendInventoryAlert({
        type: 'low_stock',
        productId,
        currentStock,
        threshold: minStock,
        priority: 'medium'
      });
    }
  }

  private async getProductAlerts(productId: string): Promise<InventoryAlert[]> {
    const product = await this.resilientDb.executeReadOperation(
      () => this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, stock: true, minStock: true }
      }),
      { cacheKey: `product-alerts:${productId}`, cacheTtl: 60000 }
    );

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

  private async getExpiringProducts() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return this.resilientDb.executeReadOperation(
      () => this.prisma.$queryRaw`
        SELECT p.id, p.name, p.stock, i.expiry_date as "expiryDate"
        FROM "Product" p
        JOIN "InventoryBatch" i ON p.id = i.product_id
        WHERE i.expiry_date <= ${thirtyDaysFromNow}
        AND i.expiry_date > NOW()
        AND i.quantity > 0
        ORDER BY i.expiry_date ASC
      `,
      { cacheKey: 'expiring-products', cacheTtl: 3600000 }
    );
  }

  private async getHistoricalDemandData(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.resilientDb.executeReadOperation(
      () => this.prisma.$queryRaw`
        SELECT
          oi."productId",
          p.name as "productName",
          DATE(o."createdAt") as date,
          SUM(oi.quantity)::int as demand
        FROM "OrderItem" oi
        JOIN "Order" o ON oi."orderId" = o.id
        JOIN "Product" p ON oi."productId" = p.id
        WHERE o."createdAt" >= ${startDate}
        AND o.status != 'CANCELLED'
        GROUP BY oi."productId", p.name, DATE(o."createdAt")
        ORDER BY oi."productId", date
      `,
      { cacheKey: `demand-data:${days}`, cacheTtl: 3600000 }
    );
  }

  private async getFallbackPredictions(): Promise<StockPrediction[]> {
    const products = await this.resilientDb.executeReadOperation(
      () => this.prisma.product.findMany({
        where: { stock: { lte: 50 } },
        select: { id: true, name: true, stock: true, minStock: true }
      }),
      { cacheKey: 'low-stock-fallback', cacheTtl: 300000 }
    );

    return products.map(product => ({
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      predictedDemand: Math.max(product.minStock * 2, 10),
      recommendedReorder: Math.max(product.minStock * 3, 20),
      reorderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      confidence: 0.6
    }));
  }

  private async getAverageDemand(productId: string, days: number): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const demandData = await this.resilientDb.executeReadOperation(
      () => this.prisma.orderItem.aggregate({
        where: {
          productId,
          order: {
            createdAt: { gte: startDate },
            status: { not: 'CANCELLED' }
          }
        },
        _sum: { quantity: true },
        _count: { productId: true }
      }),
      { cacheKey: `avg-demand:${productId}:${days}`, cacheTtl: 3600000 }
    );

    const totalDemand = demandData._sum.quantity || 0;
    return totalDemand / days;
  }

  private async getDetailedDemandAnalysis(productId: string) {
    const [
      last30Days,
      last90Days,
      seasonalPattern,
      volatility
    ] = await Promise.all([
      this.getAverageDemand(productId, 30),
      this.getAverageDemand(productId, 90),
      this.getSeasonalPattern(productId),
      this.getDemandVolatility(productId)
    ]);

    return {
      shortTerm: last30Days,
      longTerm: last90Days,
      seasonal: seasonalPattern,
      volatility
    };
  }

  private async calculateOptimalLevels(product: any, demandData: any) {
    const averageDemand = demandData.shortTerm;
    const volatility = demandData.volatility;

    const safetyStock = Math.ceil(averageDemand * volatility * 1.5);
    const recommendedMin = Math.max(safetyStock, 5);
    const recommendedMax = Math.ceil(averageDemand * 30 + safetyStock);
    const recommendedReorder = Math.ceil(averageDemand * 7 + safetyStock);

    const shouldUpdate = Math.abs(product.minStock - recommendedMin) > 2 ||
                        Math.abs(product.reorderPoint - recommendedReorder) > 5;

    return {
      shouldUpdate,
      recommendedMin,
      recommendedMax,
      recommendedReorder,
      currentMin: product.minStock,
      currentReorder: product.reorderPoint
    };
  }

  private async getSeasonalPattern(productId: string) {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.$queryRaw`
        SELECT
          EXTRACT(MONTH FROM o."createdAt")::int as month,
          AVG(oi.quantity)::float as avg_demand
        FROM "OrderItem" oi
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE oi."productId" = ${productId}
        AND o."createdAt" >= NOW() - INTERVAL '1 year'
        AND o.status != 'CANCELLED'
        GROUP BY EXTRACT(MONTH FROM o."createdAt")
        ORDER BY month
      `,
      { cacheKey: `seasonal:${productId}`, cacheTtl: 3600000 }
    );
  }

  private async getDemandVolatility(productId: string): Promise<number> {
    const demandData = await this.resilientDb.executeReadOperation(
      () => this.prisma.$queryRaw`
        SELECT
          STDDEV(daily_demand)::float as volatility
        FROM (
          SELECT
            DATE(o."createdAt") as date,
            SUM(oi.quantity) as daily_demand
          FROM "OrderItem" oi
          JOIN "Order" o ON oi."orderId" = o.id
          WHERE oi."productId" = ${productId}
          AND o."createdAt" >= NOW() - INTERVAL '90 days'
          AND o.status != 'CANCELLED'
          GROUP BY DATE(o."createdAt")
        ) daily_stats
      `,
      { cacheKey: `volatility:${productId}`, cacheTtl: 3600000 }
    );

    return demandData[0]?.volatility || 0.5;
  }

  private async notifyReorderRequests(reorders: any[]) {
    try {
      await this.resilientHttp.post('/notifications/reorder-alert', {
        reorderCount: reorders.length,
        reorders: reorders.slice(0, 10),
        timestamp: new Date()
      }, {
        circuitBreakerName: 'notification-service',
        retryAttempts: 1,
        timeoutMs: 5000
      });
    } catch (error) {
      this.logger.error('Failed to send reorder notifications:', error);
    }
  }

  private async getInventoryManagers() {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'INVENTORY_MANAGER'] }
        },
        select: { id: true, email: true, firstName: true, lastName: true }
      }),
      { cacheKey: 'inventory-managers', cacheTtl: 3600000 }
    );
  }
}