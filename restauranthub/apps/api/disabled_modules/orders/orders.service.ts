import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WebsocketService } from '../websocket/websocket.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { generateOrderNumber } from '../../utils/order.utils';
// Disabled imports:
// import { CircuitBreakerService } from '../../common/circuit-breaker.service';
// import { DatabaseCircuitBreaker, ExternalApiCircuitBreaker } from '../../decorators/circuit-breaker.decorator';
// import { ResilientDatabaseService } from '../../services/resilient-database.service';
// import { ResilientHttpService } from '../../services/resilient-http.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private websocketService: WebsocketService,
    // Disabled dependencies:
    // private circuitBreaker: CircuitBreakerService,
    // private resilientDb: ResilientDatabaseService,
    // private resilientHttp: ResilientHttpService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const orderNumber = await generateOrderNumber();

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        ...createOrderDto,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        items: {
          create: createOrderDto.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.unitPrice,
            gstAmount: item.totalPrice * 0.18, // Assuming 18% GST
            totalAmount: item.totalPrice,
          })),
        },
        statusHistory: {
          create: {
            status: OrderStatus.PENDING,
            notes: 'Order created',
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    // Send real-time notification for new order
    await this.websocketService.sendNewOrderNotification(order);

    return order;
  }

  async findAll(query: OrderQueryDto, userId?: string, userRole?: string, filterRestaurantId?: string, filterVendorId?: string) {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      restaurantId: queryRestaurantId,
      vendorId: queryVendorId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    // Role-based filtering
    if (userRole === 'RESTAURANT' && filterRestaurantId) {
      where.restaurantId = filterRestaurantId;
    } else if (userRole === 'VENDOR' && filterVendorId) {
      where.vendorId = filterVendorId;
    }

    // Additional filters
    if (status) where.status = status;
    if (queryRestaurantId) where.restaurantId = queryRestaurantId;
    if (queryVendorId) where.vendorId = queryVendorId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy = {
      [sortBy]: sortOrder as 'asc' | 'desc'
    } as Prisma.OrderOrderByWithRelationInput;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
            },
          },
          vendor: {
            select: {
              id: true,
              companyName: true,
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId?: string, userRole?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            rating: true,
          },
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
            rating: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access permissions - removed customer check as Order model doesn't have customerId

    if (userRole === 'RESTAURANT' && !order.restaurantId) {
      throw new ForbiddenException('This order is not for your restaurant');
    }

    if (userRole === 'VENDOR' && !order.vendorId) {
      throw new ForbiddenException('This order is not for your vendor account');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, userId?: string, userRole?: string) {
    const order = await this.findOne(id, userId, userRole);

    // Status update validation
    if (updateOrderDto.status && !this.canUpdateStatus(order.status, updateOrderDto.status, userRole)) {
      throw new BadRequestException('Invalid status transition');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        ...updateOrderDto,
        deliveredAt: updateOrderDto.status === OrderStatus.DELIVERED ? new Date() : order.deliveredAt,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    // Create status history entry if status changed
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      await this.prisma.orderStatusHistory.create({
        data: {
          orderId: id,
          status: updateOrderDto.status,
          notes: `Status updated to ${updateOrderDto.status}`,
        },
      });

      // Send real-time notification for status update
      await this.websocketService.sendOrderUpdate(id, {
        status: updateOrderDto.status,
        notes: `Status updated to ${updateOrderDto.status}`,
        updatedBy: 'System', // This could be enhanced with actual user info
        updatedAt: new Date(),
      });
    }

    return updatedOrder;
  }

  async cancel(id: string, reason: string, userId?: string, userRole?: string) {
    const order = await this.findOne(id, userId, userRole);

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order cannot be cancelled');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        updatedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    // Create status history entry
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: OrderStatus.CANCELLED,
        notes: `Order cancelled. Reason: ${reason}`,
      },
    });

    // Send real-time notification for cancellation
    await this.websocketService.sendOrderUpdate(id, {
      status: OrderStatus.CANCELLED,
      notes: `Order cancelled. Reason: ${reason}`,
      updatedBy: userRole || 'System',
      updatedAt: new Date(),
    });

    return updatedOrder;
  }

  async getOrderStats(userId?: string, userRole?: string, restaurantId?: string, vendorId?: string) {
    const where: Prisma.OrderWhereInput = {};

    // Role-based filtering
    if (userRole === 'RESTAURANT' && restaurantId) {
      where.restaurantId = restaurantId;
    } else if (userRole === 'VENDOR' && vendorId) {
      where.vendorId = vendorId;
    }

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      preparingOrders,
      readyOrders,
      dispatchedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.CONFIRMED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PREPARING } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.READY } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.DISPATCHED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
      this.prisma.order.aggregate({
        where: { ...where, status: { not: OrderStatus.CANCELLED } },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      preparingOrders,
      readyOrders,
      dispatchedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum?.totalAmount || 0,
      processingOrders: confirmedOrders + preparingOrders + readyOrders,
    };
  }

  private canUpdateStatus(currentStatus: OrderStatus, newStatus: OrderStatus, userRole?: string): boolean {
    const statusFlow = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.DISPATCHED, OrderStatus.CANCELLED],
      [OrderStatus.DISPATCHED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    const allowedStatuses: OrderStatus[] = statusFlow[currentStatus] || [];
    
    // Only vendors/restaurants can update order status (except customers can cancel)
    if (userRole === 'CUSTOMER' && newStatus !== OrderStatus.CANCELLED) {
      return false;
    }

    return allowedStatuses.includes(newStatus as OrderStatus);
  }

  // @DatabaseCircuitBreaker({ fallback: 'handleRatingFailure' })
  async rateOrder(orderId: string, rating: number, comment?: string, userId?: string) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { restaurant: true, vendor: true }
      });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Can only rate delivered orders');
    }

    return this.prisma.$transaction(async (tx) => {
      const orderRating = await tx.orderRating.create({
        data: {
          orderId,
          rating,
          comment,
          userId,
        }
      });

      if (order.restaurantId) {
        await this.updateRestaurantRating(order.restaurantId, tx);
      }

      if (order.vendorId) {
        await this.updateVendorRating(order.vendorId, tx);
      }

      await tx.order.update({
        where: { id: orderId },
        data: { rating }
      });

      return orderRating;
    });
  }

  // @DatabaseCircuitBreaker()
  async getOrderAnalytics(filterOptions: {
    startDate?: Date;
    endDate?: Date;
    restaurantId?: string;
    vendorId?: string;
  }) {
    const { startDate, endDate, restaurantId, vendorId } = filterOptions;

    const where: Prisma.OrderWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (restaurantId) where.restaurantId = restaurantId;
    if (vendorId) where.vendorId = vendorId;

    const [
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      topProducts,
      monthlyTrends
    ] = await Promise.all([
      this.prisma.order.findMany(
        () => this.prisma.order.count({ where }),
        { cacheKey: `analytics:total:${JSON.stringify(where)}`, cacheTtl: 300000 }
      ),
      this.prisma.order.findMany(
        () => this.prisma.order.aggregate({
          where: { ...where, status: { not: OrderStatus.CANCELLED } },
          _sum: { totalAmount: true }
        }),
        { cacheKey: `analytics:revenue:${JSON.stringify(where)}`, cacheTtl: 300000 }
      ),
      this.prisma.order.findMany(
        () => this.prisma.order.aggregate({
          where: { ...where, status: { not: OrderStatus.CANCELLED } },
          _avg: { totalAmount: true }
        }),
        { cacheKey: `analytics:avg:${JSON.stringify(where)}`, cacheTtl: 300000 }
      ),
      this.prisma.order.findMany(
        () => this.prisma.order.groupBy({
          by: ['status'],
          where,
          _count: { status: true }
        }),
        { cacheKey: `analytics:status:${JSON.stringify(where)}`, cacheTtl: 300000 }
      ),
      this.prisma.order.findMany(
        () => this.prisma.orderItem.groupBy({
          by: ['productId'],
          where: { order: where },
          _sum: { quantity: true },
          _count: { productId: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 10
        }),
        { cacheKey: `analytics:products:${JSON.stringify(where)}`, cacheTtl: 300000 }
      ),
      this.getMonthlyOrderTrends(where)
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum?.totalAmount || 0,
      averageOrderValue: averageOrderValue._avg?.totalAmount || 0,
      ordersByStatus,
      topProducts,
      monthlyTrends
    };
  }

  // @ExternalApiCircuitBreaker('delivery-service')
  async trackDelivery(orderId: string) {
    const order = await this.prisma.order.findUnique(
      () => this.prisma.order.findUnique({
        where: { id: orderId },
        include: { deliveryInfo: true }
      }),
      { cacheKey: `order:${orderId}:delivery`, cacheTtl: 30000 }
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.deliveryInfo?.trackingId) {
      throw new BadRequestException('No tracking information available');
    }

    try {
      // const trackingData = await this.resilientHttp.get(
        `/delivery/track/${order.deliveryInfo.trackingId}`,
        {
          circuitBreakerName: 'delivery-tracking',
          cacheKey: `tracking:${order.deliveryInfo.trackingId}`,
          cacheTtl: 60000,
          retryAttempts: 2,
          timeoutMs: 5000,
          fallbackResponse: {
            status: 'unknown',
            location: 'Location not available',
            estimatedDelivery: null
          }
        }
      );

      return {
        orderId,
        trackingId: order.deliveryInfo.trackingId,
        ...trackingData
      };
    } catch (error) {
      this.logger.error(`Failed to track delivery for order ${orderId}:`, error);
      throw new BadRequestException('Tracking service temporarily unavailable');
    }
  }

  // @DatabaseCircuitBreaker()
  async manageInventory(orderId: string, action: 'reserve' | 'release') {
    const order = await this.prisma.order.findUnique(
      () => this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } }
      }),
      { cacheKey: `order:${orderId}:items`, cacheTtl: 60000 }
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const currentStock = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, reservedStock: true }
        });

        if (!currentStock) continue;

        if (action === 'reserve') {
          if (currentStock.stock < item.quantity) {
            throw new BadRequestException(`Insufficient stock for product ${item.product.name}`);
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              reservedStock: { increment: item.quantity }
            }
          });
        } else if (action === 'release') {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              reservedStock: { decrement: item.quantity }
            }
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: order.status,
          notes: `Inventory ${action}d for order items`
        }
      });

      return { success: true, action, itemCount: order.items.length };
    });
  }

  // @ExternalApiCircuitBreaker('notification-service')
  async sendOrderNotifications(orderId: string, type: 'confirmation' | 'status_update' | 'delivery') {
    const order = await this.prisma.order.findUnique(
      () => this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          restaurant: { select: { name: true, email: true, phone: true } },
          vendor: { select: { companyName: true, email: true, phone: true } }
        }
      }),
      { cacheKey: `order:${orderId}:notifications`, cacheTtl: 60000 }
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const notificationData = {
      orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      type
    };

    try {
      const promises = [];

      if (order.restaurant?.email) {
        promises.push(
          // this.resilientHttp.post('/notifications/email', {
            to: order.restaurant.email,
            template: `order_${type}_restaurant`,
            data: notificationData
          }, {
            circuitBreakerName: 'email-service',
            retryAttempts: 2,
            timeoutMs: 5000
          })
        );
      }

      if (order.vendor?.email) {
        promises.push(
          // this.resilientHttp.post('/notifications/email', {
            to: order.vendor.email,
            template: `order_${type}_vendor`,
            data: notificationData
          }, {
            circuitBreakerName: 'email-service',
            retryAttempts: 2,
            timeoutMs: 5000
          })
        );
      }

      if (order.restaurant?.phone) {
        promises.push(
          // this.resilientHttp.post('/notifications/sms', {
            to: order.restaurant.phone,
            message: `Order ${order.orderNumber} status: ${order.status}`,
            data: notificationData
          }, {
            circuitBreakerName: 'sms-service',
            retryAttempts: 1,
            timeoutMs: 3000
          })
        );
      }

      await Promise.allSettled(promises);

      this.logger.log(`Notifications sent for order ${orderId}, type: ${type}`);
      return { success: true, notificationsSent: promises.length };
    } catch (error) {
      this.logger.error(`Failed to send notifications for order ${orderId}:`, error);
      return { success: false, error: error.message };
    }
  }

  private async updateRestaurantRating(restaurantId: string, tx: any) {
    const ratings = await tx.orderRating.findMany({
      where: { order: { restaurantId } },
      select: { rating: true }
    });

    if (ratings.length > 0) {
      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

      await tx.restaurant.update({
        where: { id: restaurantId },
        data: {
          rating: Math.round(averageRating * 10) / 10,
          totalRatings: ratings.length
        }
      });
    }
  }

  private async updateVendorRating(vendorId: string, tx: any) {
    const ratings = await tx.orderRating.findMany({
      where: { order: { vendorId } },
      select: { rating: true }
    });

    if (ratings.length > 0) {
      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

      await tx.vendor.update({
        where: { id: vendorId },
        data: {
          rating: Math.round(averageRating * 10) / 10,
          totalRatings: ratings.length
        }
      });
    }
  }

  private async getMonthlyOrderTrends(where: Prisma.OrderWhereInput) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return this.prisma.order.findMany(
      () => this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*)::int as orders,
          SUM("totalAmount")::float as revenue
        FROM "Order"
        WHERE "createdAt" >= ${sixMonthsAgo}
          AND "status" != 'CANCELLED'
          ${where.restaurantId ? Prisma.sql`AND "restaurantId" = ${where.restaurantId}` : Prisma.empty}
          ${where.vendorId ? Prisma.sql`AND "vendorId" = ${where.vendorId}` : Prisma.empty}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
        LIMIT 6
      `,
      {
        cacheKey: `trends:monthly:${JSON.stringify(where)}`,
        cacheTtl: 3600000
      }
    );
  }

  private async handleRatingFailure(orderId: string, rating: number, comment?: string, userId?: string) {
    this.logger.warn(`Rating submission failed for order ${orderId}, queuing for retry`);

    // await this.resilientHttp.post('/queue/rating-retry', {
      orderId,
      rating,
      comment,
      userId,
      retryAt: new Date(Date.now() + 5 * 60 * 1000)
    }, {
      circuitBreakerName: 'queue-service',
      retryAttempts: 1,
      timeoutMs: 3000,
      fallbackResponse: { queued: false }
    });

    return {
      success: false,
      message: 'Rating submission temporarily unavailable, will retry shortly',
      willRetry: true
    };
  }
}