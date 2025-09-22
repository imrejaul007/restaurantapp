import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CircuitBreakerService } from '../../common/circuit-breaker.service';
import { DatabaseCircuitBreaker, ExternalApiCircuitBreaker } from '../../decorators/circuit-breaker.decorator';
import { ResilientDatabaseService } from '../../services/resilient-database.service';
import { ResilientHttpService } from '../../services/resilient-http.service';

export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  restaurantId?: string;
  vendorId?: string;
  userId?: string;
  category?: string;
  region?: string;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  averageOrderValue: number;
  orderCount: number;
  revenueGrowth: number;
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
  revenueByCategory: Array<{ category: string; revenue: number; percentage: number }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  averageCustomerLifetimeValue: number;
  customerSegmentation: Array<{ segment: string; count: number; revenue: number }>;
  customerBehavior: {
    averageOrdersPerCustomer: number;
    averageTimeBetweenOrders: number;
    peakOrderingHours: Array<{ hour: number; orderCount: number }>;
    peakOrderingDays: Array<{ day: string; orderCount: number }>;
  };
}

export interface PerformanceAnalytics {
  orderFulfillmentRate: number;
  averageDeliveryTime: number;
  customerSatisfactionScore: number;
  vendorPerformance: Array<{
    vendorId: string;
    vendorName: string;
    orderCount: number;
    revenue: number;
    rating: number;
    fulfillmentRate: number;
  }>;
  restaurantPerformance: Array<{
    restaurantId: string;
    restaurantName: string;
    orderCount: number;
    revenue: number;
    rating: number;
    averageDeliveryTime: number;
  }>;
}

@Injectable()
export class BusinessAnalyticsService {
  private readonly logger = new Logger(BusinessAnalyticsService.name);

  constructor(
    private prisma: PrismaService,
    private circuitBreaker: CircuitBreakerService,
    private resilientDb: ResilientDatabaseService,
    private resilientHttp: ResilientHttpService,
  ) {}

  @DatabaseCircuitBreaker()
  async getRevenueAnalytics(filters: AnalyticsFilter): Promise<RevenueAnalytics> {
    this.logger.log('Generating revenue analytics');

    const where = this.buildWhereClause(filters);
    const previousPeriodWhere = this.buildPreviousPeriodWhereClause(filters);

    const [
      currentPeriodData,
      previousPeriodData,
      dailyRevenue,
      monthlyRevenue,
      revenueByCategory
    ] = await Promise.all([
      this.resilientDb.executeReadOperation(
        () => this.prisma.order.aggregate({
          where: { ...where, status: { not: 'CANCELLED' } },
          _sum: { totalAmount: true },
          _avg: { totalAmount: true },
          _count: { id: true }
        }),
        { cacheKey: `revenue:current:${JSON.stringify(filters)}`, cacheTtl: 300000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.order.aggregate({
          where: { ...previousPeriodWhere, status: { not: 'CANCELLED' } },
          _sum: { totalAmount: true }
        }),
        { cacheKey: `revenue:previous:${JSON.stringify(filters)}`, cacheTtl: 300000 }
      ),
      this.getDailyRevenue(where),
      this.getMonthlyRevenue(where),
      this.getRevenueByCategory(where)
    ]);

    const totalRevenue = currentPeriodData._sum.totalAmount || 0;
    const previousRevenue = previousPeriodData._sum.totalAmount || 0;
    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    return {
      totalRevenue,
      averageOrderValue: currentPeriodData._avg.totalAmount || 0,
      orderCount: currentPeriodData._count.id || 0,
      revenueGrowth,
      dailyRevenue,
      monthlyRevenue,
      revenueByCategory
    };
  }

  @DatabaseCircuitBreaker()
  async getCustomerAnalytics(filters: AnalyticsFilter): Promise<CustomerAnalytics> {
    this.logger.log('Generating customer analytics');

    const where = this.buildWhereClause(filters);

    const [
      customerCounts,
      customerSegmentation,
      customerBehavior,
      retentionData
    ] = await Promise.all([
      this.getCustomerCounts(where),
      this.getCustomerSegmentation(where),
      this.getCustomerBehavior(where),
      this.getCustomerRetention(filters)
    ]);

    return {
      ...customerCounts,
      customerSegmentation,
      customerBehavior,
      ...retentionData
    };
  }

  @DatabaseCircuitBreaker()
  async getPerformanceAnalytics(filters: AnalyticsFilter): Promise<PerformanceAnalytics> {
    this.logger.log('Generating performance analytics');

    const where = this.buildWhereClause(filters);

    const [
      fulfillmentRate,
      deliveryMetrics,
      satisfactionScore,
      vendorPerformance,
      restaurantPerformance
    ] = await Promise.all([
      this.getOrderFulfillmentRate(where),
      this.getDeliveryMetrics(where),
      this.getCustomerSatisfactionScore(where),
      this.getVendorPerformance(where),
      this.getRestaurantPerformance(where)
    ]);

    return {
      orderFulfillmentRate: fulfillmentRate,
      averageDeliveryTime: deliveryMetrics.averageDeliveryTime,
      customerSatisfactionScore: satisfactionScore,
      vendorPerformance,
      restaurantPerformance
    };
  }

  @DatabaseCircuitBreaker()
  async getComprehensiveDashboard(filters: AnalyticsFilter) {
    this.logger.log('Generating comprehensive analytics dashboard');

    const [
      revenueAnalytics,
      customerAnalytics,
      performanceAnalytics,
      topProducts,
      recentActivity,
      alerts
    ] = await Promise.all([
      this.getRevenueAnalytics(filters),
      this.getCustomerAnalytics(filters),
      this.getPerformanceAnalytics(filters),
      this.getTopProducts(filters),
      this.getRecentActivity(filters),
      this.getBusinessAlerts(filters)
    ]);

    return {
      revenue: revenueAnalytics,
      customers: customerAnalytics,
      performance: performanceAnalytics,
      topProducts,
      recentActivity,
      alerts,
      generatedAt: new Date(),
      filters
    };
  }

  @DatabaseCircuitBreaker()
  async getTopProducts(filters: AnalyticsFilter) {
    const where = this.buildWhereClause(filters);

    return this.resilientDb.executeReadOperation(
      () => this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: where },
        _sum: {
          quantity: true,
          totalAmount: true
        },
        _count: { productId: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10
      }),
      { cacheKey: `top-products:${JSON.stringify(filters)}`, cacheTtl: 300000 }
    );
  }

  @DatabaseCircuitBreaker()
  async getBusinessAlerts(filters: AnalyticsFilter) {
    const alerts = [];

    const [
      lowStockProducts,
      pendingOrders,
      failedDeliveries,
      lowRatedOrders
    ] = await Promise.all([
      this.checkLowStockProducts(),
      this.checkPendingOrders(),
      this.checkFailedDeliveries(),
      this.checkLowRatedOrders()
    ]);

    if (lowStockProducts.length > 0) {
      alerts.push({
        type: 'warning',
        category: 'inventory',
        message: `${lowStockProducts.length} products are running low on stock`,
        data: lowStockProducts,
        priority: 'medium'
      });
    }

    if (pendingOrders > 10) {
      alerts.push({
        type: 'urgent',
        category: 'orders',
        message: `${pendingOrders} orders are pending processing`,
        data: { count: pendingOrders },
        priority: 'high'
      });
    }

    if (failedDeliveries.length > 0) {
      alerts.push({
        type: 'error',
        category: 'delivery',
        message: `${failedDeliveries.length} deliveries have failed`,
        data: failedDeliveries,
        priority: 'urgent'
      });
    }

    if (lowRatedOrders.length > 0) {
      alerts.push({
        type: 'warning',
        category: 'quality',
        message: `${lowRatedOrders.length} orders received low ratings`,
        data: lowRatedOrders,
        priority: 'medium'
      });
    }

    return alerts;
  }

  @ExternalApiCircuitBreaker('ml-service')
  async getPredictiveAnalytics(filters: AnalyticsFilter) {
    try {
      const historicalData = await this.getHistoricalDataForML(filters);

      const predictions = await this.resilientHttp.post('/ml/predict', {
        data: historicalData,
        type: 'revenue_forecast',
        period: '30_days'
      }, {
        circuitBreakerName: 'ml-service',
        retryAttempts: 2,
        timeoutMs: 15000,
        fallbackResponse: {
          revenueForecast: [],
          demandForecast: [],
          trends: [],
          confidence: 0
        }
      });

      this.logger.log('Predictive analytics generated successfully');
      return predictions;
    } catch (error) {
      this.logger.error('Failed to generate predictive analytics:', error);
      return {
        revenueForecast: [],
        demandForecast: [],
        trends: [],
        confidence: 0,
        error: 'Predictive analytics temporarily unavailable'
      };
    }
  }

  @DatabaseCircuitBreaker()
  async exportAnalyticsReport(filters: AnalyticsFilter, format: 'pdf' | 'excel' | 'csv') {
    this.logger.log(`Exporting analytics report in ${format} format`);

    const dashboardData = await this.getComprehensiveDashboard(filters);

    try {
      const exportRequest = await this.resilientHttp.post('/reports/export', {
        data: dashboardData,
        format,
        template: 'business_analytics',
        title: `Business Analytics Report - ${new Date().toLocaleDateString()}`
      }, {
        circuitBreakerName: 'report-service',
        retryAttempts: 2,
        timeoutMs: 30000
      });

      this.logger.log(`Analytics report exported successfully: ${exportRequest.reportId}`);
      return {
        success: true,
        reportId: exportRequest.reportId,
        downloadUrl: exportRequest.downloadUrl,
        expiresAt: exportRequest.expiresAt
      };
    } catch (error) {
      this.logger.error('Failed to export analytics report:', error);
      return {
        success: false,
        error: 'Report export temporarily unavailable'
      };
    }
  }

  private buildWhereClause(filters: AnalyticsFilter) {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.restaurantId) where.restaurantId = filters.restaurantId;
    if (filters.vendorId) where.vendorId = filters.vendorId;

    return where;
  }

  private buildPreviousPeriodWhereClause(filters: AnalyticsFilter) {
    if (!filters.startDate || !filters.endDate) {
      return {};
    }

    const periodLength = filters.endDate.getTime() - filters.startDate.getTime();
    const previousStart = new Date(filters.startDate.getTime() - periodLength);
    const previousEnd = new Date(filters.endDate.getTime() - periodLength);

    return {
      ...this.buildWhereClause({ ...filters, startDate: previousStart, endDate: previousEnd })
    };
  }

  private async getDailyRevenue(where: any) {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.$queryRaw`
        SELECT
          DATE("createdAt") as date,
          SUM("totalAmount")::float as revenue,
          COUNT(*)::int as orders
        FROM "Order"
        WHERE "status" != 'CANCELLED'
          ${where.createdAt?.gte ? Prisma.sql`AND "createdAt" >= ${where.createdAt.gte}` : Prisma.empty}
          ${where.createdAt?.lte ? Prisma.sql`AND "createdAt" <= ${where.createdAt.lte}` : Prisma.empty}
          ${where.restaurantId ? Prisma.sql`AND "restaurantId" = ${where.restaurantId}` : Prisma.empty}
          ${where.vendorId ? Prisma.sql`AND "vendorId" = ${where.vendorId}` : Prisma.empty}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
        LIMIT 30
      `,
      { cacheKey: `daily-revenue:${JSON.stringify(where)}`, cacheTtl: 3600000 }
    );
  }

  private async getMonthlyRevenue(where: any) {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          SUM("totalAmount")::float as revenue,
          COUNT(*)::int as orders
        FROM "Order"
        WHERE "status" != 'CANCELLED'
          ${where.createdAt?.gte ? Prisma.sql`AND "createdAt" >= ${where.createdAt.gte}` : Prisma.empty}
          ${where.createdAt?.lte ? Prisma.sql`AND "createdAt" <= ${where.createdAt.lte}` : Prisma.empty}
          ${where.restaurantId ? Prisma.sql`AND "restaurantId" = ${where.restaurantId}` : Prisma.empty}
          ${where.vendorId ? Prisma.sql`AND "vendorId" = ${where.vendorId}` : Prisma.empty}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
        LIMIT 12
      `,
      { cacheKey: `monthly-revenue:${JSON.stringify(where)}`, cacheTtl: 3600000 }
    );
  }

  private async getRevenueByCategory(where: any) {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.$queryRaw`
        SELECT
          p.category,
          SUM(oi."totalAmount")::float as revenue,
          (SUM(oi."totalAmount") * 100.0 / (
            SELECT SUM("totalAmount") FROM "OrderItem" oi2
            JOIN "Order" o2 ON oi2."orderId" = o2.id
            WHERE o2."status" != 'CANCELLED'
          ))::float as percentage
        FROM "OrderItem" oi
        JOIN "Product" p ON oi."productId" = p.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."status" != 'CANCELLED'
          ${where.createdAt?.gte ? Prisma.sql`AND o."createdAt" >= ${where.createdAt.gte}` : Prisma.empty}
          ${where.createdAt?.lte ? Prisma.sql`AND o."createdAt" <= ${where.createdAt.lte}` : Prisma.empty}
          ${where.restaurantId ? Prisma.sql`AND o."restaurantId" = ${where.restaurantId}` : Prisma.empty}
          ${where.vendorId ? Prisma.sql`AND o."vendorId" = ${where.vendorId}` : Prisma.empty}
        GROUP BY p.category
        ORDER BY revenue DESC
      `,
      { cacheKey: `revenue-by-category:${JSON.stringify(where)}`, cacheTtl: 3600000 }
    );
  }

  private async getCustomerCounts(where: any) {
    const [totalCustomers, newCustomers, returningCustomers] = await Promise.all([
      this.resilientDb.executeReadOperation(
        () => this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
        { cacheKey: 'total-customers', cacheTtl: 300000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.user.count({
          where: {
            role: 'CUSTOMER',
            createdAt: where.createdAt || {}
          }
        }),
        { cacheKey: `new-customers:${JSON.stringify(where)}`, cacheTtl: 300000 }
      ),
      this.getReturningCustomerCount(where)
    ]);

    return { totalCustomers, newCustomers, returningCustomers };
  }

  private async getReturningCustomerCount(where: any) {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.$queryRaw`
        SELECT COUNT(DISTINCT "userId")::int as count
        FROM "Order"
        WHERE "userId" IN (
          SELECT "userId"
          FROM "Order"
          GROUP BY "userId"
          HAVING COUNT(*) > 1
        )
        ${where.createdAt?.gte ? Prisma.sql`AND "createdAt" >= ${where.createdAt.gte}` : Prisma.empty}
        ${where.createdAt?.lte ? Prisma.sql`AND "createdAt" <= ${where.createdAt.lte}` : Prisma.empty}
      `,
      { cacheKey: `returning-customers:${JSON.stringify(where)}`, cacheTtl: 300000 }
    );
  }

  private async getCustomerBehavior(where: any) {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.$queryRaw`
        SELECT
          AVG(order_count)::float as "averageOrdersPerCustomer",
          EXTRACT(HOUR FROM "createdAt")::int as hour,
          COUNT(*)::int as "orderCount"
        FROM (
          SELECT
            "userId",
            COUNT(*) as order_count,
            "createdAt"
          FROM "Order"
          WHERE "status" != 'CANCELLED'
          GROUP BY "userId", "createdAt"
        ) user_orders
        GROUP BY EXTRACT(HOUR FROM "createdAt")
        ORDER BY "orderCount" DESC
      `,
      { cacheKey: `customer-behavior:${JSON.stringify(where)}`, cacheTtl: 3600000 }
    );
  }

  private async getCustomerRetention(filters: AnalyticsFilter) {
    const retentionRate = await this.resilientDb.executeReadOperation(
      () => this.prisma.$queryRaw`
        SELECT
          (COUNT(DISTINCT repeat_customers.user_id) * 100.0 / COUNT(DISTINCT all_customers.user_id))::float as retention_rate,
          AVG(clv.lifetime_value)::float as avg_lifetime_value
        FROM (
          SELECT DISTINCT "userId" as user_id FROM "Order"
        ) all_customers
        LEFT JOIN (
          SELECT "userId" as user_id
          FROM "Order"
          GROUP BY "userId"
          HAVING COUNT(*) > 1
        ) repeat_customers ON all_customers.user_id = repeat_customers.user_id
        LEFT JOIN (
          SELECT "userId", SUM("totalAmount") as lifetime_value
          FROM "Order"
          WHERE "status" != 'CANCELLED'
          GROUP BY "userId"
        ) clv ON all_customers.user_id = clv."userId"
      `,
      { cacheKey: `customer-retention:${JSON.stringify(filters)}`, cacheTtl: 3600000 }
    );

    return {
      customerRetentionRate: retentionRate[0]?.retention_rate || 0,
      averageCustomerLifetimeValue: retentionRate[0]?.avg_lifetime_value || 0
    };
  }

  private async getOrderFulfillmentRate(where: any) {
    const fulfillmentData = await this.resilientDb.executeReadOperation(
      () => this.prisma.order.aggregate({
        where,
        _count: {
          id: true,
        },
      }),
      { cacheKey: `fulfillment:${JSON.stringify(where)}`, cacheTtl: 300000 }
    );

    const deliveredOrders = await this.resilientDb.executeReadOperation(
      () => this.prisma.order.count({
        where: { ...where, status: 'DELIVERED' }
      }),
      { cacheKey: `delivered:${JSON.stringify(where)}`, cacheTtl: 300000 }
    );

    return fulfillmentData._count.id > 0
      ? (deliveredOrders / fulfillmentData._count.id) * 100
      : 0;
  }

  private async getDeliveryMetrics(where: any) {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.delivery.aggregate({
        where: {
          order: where,
          status: 'delivered'
        },
        _avg: { deliveryDuration: true }
      }),
      { cacheKey: `delivery-metrics:${JSON.stringify(where)}`, cacheTtl: 300000 }
    );
  }

  private async getCustomerSatisfactionScore(where: any) {
    const satisfactionData = await this.resilientDb.executeReadOperation(
      () => this.prisma.orderRating.aggregate({
        where: { order: where },
        _avg: { rating: true },
        _count: { rating: true }
      }),
      { cacheKey: `satisfaction:${JSON.stringify(where)}`, cacheTtl: 300000 }
    );

    return satisfactionData._avg.rating || 0;
  }

  private async getVendorPerformance(where: any) {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.$queryRaw`
        SELECT
          v.id as "vendorId",
          v."companyName" as "vendorName",
          COUNT(o.id)::int as "orderCount",
          SUM(o."totalAmount")::float as revenue,
          AVG(v.rating)::float as rating,
          (COUNT(CASE WHEN o.status = 'DELIVERED' THEN 1 END) * 100.0 / COUNT(o.id))::float as "fulfillmentRate"
        FROM "Vendor" v
        LEFT JOIN "Order" o ON v.id = o."vendorId"
        WHERE o."status" != 'CANCELLED'
        GROUP BY v.id, v."companyName", v.rating
        ORDER BY revenue DESC
        LIMIT 10
      `,
      { cacheKey: `vendor-performance:${JSON.stringify(where)}`, cacheTtl: 300000 }
    );
  }

  private async getRestaurantPerformance(where: any) {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.$queryRaw`
        SELECT
          r.id as "restaurantId",
          r.name as "restaurantName",
          COUNT(o.id)::int as "orderCount",
          SUM(o."totalAmount")::float as revenue,
          AVG(r.rating)::float as rating,
          AVG(d."deliveryDuration")::float as "averageDeliveryTime"
        FROM "Restaurant" r
        LEFT JOIN "Order" o ON r.id = o."restaurantId"
        LEFT JOIN "Delivery" d ON o.id = d."orderId"
        WHERE o."status" != 'CANCELLED'
        GROUP BY r.id, r.name, r.rating
        ORDER BY revenue DESC
        LIMIT 10
      `,
      { cacheKey: `restaurant-performance:${JSON.stringify(where)}`, cacheTtl: 300000 }
    );
  }

  private async checkLowStockProducts() {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.product.findMany({
        where: { stock: { lte: 10 } },
        select: { id: true, name: true, stock: true },
        take: 10
      }),
      { cacheKey: 'low-stock-products', cacheTtl: 300000 }
    );
  }

  private async checkPendingOrders() {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.order.count({
        where: { status: 'PENDING' }
      }),
      { cacheKey: 'pending-orders-count', cacheTtl: 60000 }
    );
  }

  private async checkFailedDeliveries() {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.delivery.findMany({
        where: { status: 'failed' },
        include: { order: { select: { orderNumber: true } } },
        take: 5
      }),
      { cacheKey: 'failed-deliveries', cacheTtl: 300000 }
    );
  }

  private async checkLowRatedOrders() {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.orderRating.findMany({
        where: { rating: { lte: 2 } },
        include: { order: { select: { orderNumber: true } } },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      { cacheKey: 'low-rated-orders', cacheTtl: 300000 }
    );
  }

  private async getRecentActivity(filters: AnalyticsFilter) {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.$queryRaw`
        SELECT
          'order' as type,
          o."orderNumber" as reference,
          o."createdAt" as timestamp,
          o."totalAmount" as amount,
          o.status
        FROM "Order" o
        WHERE o."createdAt" >= NOW() - INTERVAL '24 hours'
        UNION ALL
        SELECT
          'delivery' as type,
          d."trackingId" as reference,
          d."assignedAt" as timestamp,
          0 as amount,
          d.status
        FROM "Delivery" d
        WHERE d."assignedAt" >= NOW() - INTERVAL '24 hours'
        ORDER BY timestamp DESC
        LIMIT 20
      `,
      { cacheKey: `recent-activity:${JSON.stringify(filters)}`, cacheTtl: 300000 }
    );
  }

  private async getHistoricalDataForML(filters: AnalyticsFilter) {
    return this.resilientDb.executeReadOperation(
      () => this.prisma.$queryRaw`
        SELECT
          DATE("createdAt") as date,
          SUM("totalAmount")::float as revenue,
          COUNT(*)::int as orders,
          AVG("totalAmount")::float as avg_order_value
        FROM "Order"
        WHERE "status" != 'CANCELLED'
          AND "createdAt" >= NOW() - INTERVAL '1 year'
        GROUP BY DATE("createdAt")
        ORDER BY date
      `,
      { cacheKey: `ml-historical-data:${JSON.stringify(filters)}`, cacheTtl: 3600000 }
    );
  }
}