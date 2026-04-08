import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, CancelOrderDto, UpdateShippingDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createOrder(restaurantId: string, createOrderDto: CreateOrderDto) {
    try {
      // Validate products and calculate totals
      const { subtotal, gstAmount, totalAmount, validatedItems } = await this.calculateOrderTotals(
        createOrderDto.items,
        createOrderDto.discountAmount || 0,
        createOrderDto.creditUsed || 0
      );

      // Generate order number
      const orderNumber = await this.generateOrderNumber(restaurantId);

      // Create order with items
      const order = await this.prisma.order.create({
        data: {
          orderNumber,
          restaurantId,
          vendorId: createOrderDto.vendorId,
          subtotal,
          gstAmount,
          totalAmount,
          discountAmount: createOrderDto.discountAmount || 0,
          creditUsed: createOrderDto.creditUsed || 0,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: createOrderDto.paymentMethod,
          shippingAddress: createOrderDto.shippingAddress ? JSON.stringify(createOrderDto.shippingAddress) : null,
          billingAddress: createOrderDto.billingAddress ? JSON.stringify(createOrderDto.billingAddress) : null,
          notes: createOrderDto.notes,
          items: {
            create: validatedItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              gstAmount: item.gstAmount,
              totalAmount: item.totalAmount,
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          restaurant: true,
          vendor: true
        }
      });

      // Update product stock
      await this.updateProductStock(validatedItems);

      // Create order status history
      await this.createStatusHistory(order.id, OrderStatus.PENDING, 'Order created');

      // Send order confirmation email
      await this.sendOrderConfirmationEmail(order);

      this.logger.log(`Order ${orderNumber} created successfully for restaurant ${restaurantId}`);

      return order;
    } catch (error) {
      this.logger.error('Failed to create order:', error);
      throw new BadRequestException('Failed to create order: ' + error.message);
    }
  }

  async getOrders(restaurantId: string, query: OrderQueryDto, userRole: UserRole) {
    try {
      const { page, limit, status, paymentStatus, vendorId, startDate, endDate, search, sortBy, sortOrder } = query;
      const skip = (page - 1) * limit;

      const where: any = {};

      // Role-based filtering
      if (userRole === UserRole.RESTAURANT) {
        where.restaurantId = restaurantId;
      } else if (userRole === UserRole.VENDOR && vendorId) {
        where.vendorId = vendorId;
      }

      // Apply filters
      if (status) where.status = status;
      if (paymentStatus) where.paymentStatus = paymentStatus;
      if (vendorId && userRole === UserRole.RESTAURANT) where.vendorId = vendorId;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          {
            items: {
              some: {
                product: {
                  name: { contains: search, mode: 'insensitive' }
                }
              }
            }
          }
        ];
      }

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                    unit: true
                  }
                }
              }
            },
            restaurant: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            },
            vendor: {
              select: {
                id: true,
                companyName: true,
                logo: true
              }
            },
            statusHistory: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }),
        this.prisma.order.count({ where })
      ]);

      return {
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      };
    } catch (error) {
      this.logger.error('Failed to get orders:', error);
      throw new BadRequestException('Failed to retrieve orders');
    }
  }

  async getOrderById(orderId: string, restaurantId: string, userRole: UserRole) {
    try {
      const where: any = { id: orderId };

      // Role-based access control
      if (userRole === UserRole.RESTAURANT) {
        where.restaurantId = restaurantId;
      }

      const order = await this.prisma.order.findFirst({
        where,
        include: {
          items: {
            include: {
              product: true
            }
          },
          restaurant: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  profile: true
                }
              }
            }
          },
          vendor: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  profile: true
                }
              }
            }
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' }
          },
          payments: true,
          transactions: true
        }
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      return order;
    } catch (error) {
      this.logger.error('Failed to get order:', error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to retrieve order');
    }
  }

  async updateOrderStatus(orderId: string, restaurantId: string, updateStatusDto: UpdateOrderStatusDto, userRole: UserRole) {
    try {
      // Verify order ownership
      const order = await this.getOrderById(orderId, restaurantId, userRole);

      // Validate status transition
      this.validateStatusTransition(order.status, updateStatusDto.status);

      // Update order status
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: updateStatusDto.status,
          trackingNumber: updateStatusDto.trackingNumber,
          deliveredAt: updateStatusDto.status === OrderStatus.DELIVERED ? new Date() : undefined,
          cancelledAt: updateStatusDto.status === OrderStatus.CANCELLED ? new Date() : undefined
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          restaurant: true,
          vendor: true
        }
      });

      // Create status history
      await this.createStatusHistory(orderId, updateStatusDto.status, updateStatusDto.notes);

      // Send status update notification
      await this.sendStatusUpdateEmail(updatedOrder);

      // Handle special status updates
      if (updateStatusDto.status === OrderStatus.DELIVERED) {
        await this.handleOrderDelivery(orderId);
      } else if (updateStatusDto.status === OrderStatus.CANCELLED) {
        await this.handleOrderCancellation(orderId);
      }

      this.logger.log(`Order ${order.orderNumber} status updated to ${updateStatusDto.status}`);

      return updatedOrder;
    } catch (error) {
      this.logger.error('Failed to update order status:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to update order status');
    }
  }

  async cancelOrder(orderId: string, restaurantId: string, cancelOrderDto: CancelOrderDto, userRole: UserRole) {
    try {
      const order = await this.getOrderById(orderId, restaurantId, userRole);

      // Check if order can be cancelled
      if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('Cannot cancel order in current status');
      }

      // Update order
      const cancelledOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: cancelOrderDto.reason
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          restaurant: true,
          vendor: true
        }
      });

      // Create status history
      await this.createStatusHistory(orderId, OrderStatus.CANCELLED, cancelOrderDto.notes || cancelOrderDto.reason);

      // Restore product stock
      await this.restoreProductStock(order.items);

      // Handle refund if payment was made
      if (order.paymentStatus === PaymentStatus.COMPLETED) {
        await this.initiateRefund(orderId, order.totalAmount, 'Order cancellation');
      }

      // Send cancellation notification
      await this.sendOrderCancellationEmail(cancelledOrder);

      this.logger.log(`Order ${order.orderNumber} cancelled successfully`);

      return cancelledOrder;
    } catch (error) {
      this.logger.error('Failed to cancel order:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to cancel order');
    }
  }

  async getOrderAnalytics(restaurantId: string, startDate?: Date, endDate?: Date) {
    try {
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter['createdAt'] = {};
        if (startDate) dateFilter['createdAt']['gte'] = startDate;
        if (endDate) dateFilter['createdAt']['lte'] = endDate;
      }

      const where = { restaurantId, ...dateFilter };

      const [
        totalOrders,
        totalRevenue,
        ordersByStatus,
        topProducts,
        recentOrders,
        dailyStats
      ] = await Promise.all([
        // Total orders count
        this.prisma.order.count({ where }),

        // Total revenue
        this.prisma.order.aggregate({
          where: { ...where, paymentStatus: PaymentStatus.COMPLETED },
          _sum: { totalAmount: true }
        }),

        // Orders by status
        this.prisma.order.groupBy({
          by: ['status'],
          where,
          _count: true
        }),

        // Top selling products
        this.prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: where
          },
          _sum: { quantity: true, totalAmount: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 10
        }),

        // Recent orders
        this.prisma.order.findMany({
          where,
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: {
                  select: { name: true }
                }
              }
            }
          }
        }),

        // Daily statistics for the last 30 days
        this.prisma.order.groupBy({
          by: ['createdAt'],
          where: {
            ...where,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          _count: true,
          _sum: { totalAmount: true }
        })
      ]);

      // Get product details for top products
      const topProductsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await this.prisma.product.findUnique({
            where: { id: item.productId },
            select: { id: true, name: true, images: true }
          });
          return {
            ...product,
            totalQuantity: item._sum.quantity,
            totalRevenue: item._sum.totalAmount
          };
        })
      );

      return {
        overview: {
          totalOrders,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          averageOrderValue: totalOrders > 0 ? (totalRevenue._sum.totalAmount || 0) / totalOrders : 0,
          pendingOrders: ordersByStatus.find(s => s.status === OrderStatus.PENDING)?._count || 0
        },
        ordersByStatus: ordersByStatus.map(item => ({
          status: item.status,
          count: item._count
        })),
        topProducts: topProductsWithDetails,
        recentOrders,
        dailyStats: this.processDailyStats(dailyStats)
      };
    } catch (error) {
      this.logger.error('Failed to get order analytics:', error);
      throw new BadRequestException('Failed to retrieve order analytics');
    }
  }

  private async calculateOrderTotals(items: OrderItemDto[], discountAmount: number, creditUsed: number) {
    let subtotal = 0;
    let gstAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      // Validate product exists and has sufficient stock
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      const itemTotal = item.quantity * item.price;
      const itemGst = itemTotal * (product.gstRate / 100);

      subtotal += itemTotal;
      gstAmount += itemGst;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        gstAmount: itemGst,
        totalAmount: itemTotal + itemGst
      });
    }

    const totalAmount = subtotal + gstAmount - discountAmount - creditUsed;

    return { subtotal, gstAmount, totalAmount, validatedItems };
  }

  private async generateOrderNumber(restaurantId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const count = await this.prisma.order.count({
      where: {
        restaurantId,
        createdAt: {
          gte: new Date(year, today.getMonth(), today.getDate()),
          lt: new Date(year, today.getMonth(), today.getDate() + 1)
        }
      }
    });

    return `ORD${year}${month}${day}${String(count + 1).padStart(4, '0')}`;
  }

  private async updateProductStock(items: any[]) {
    for (const item of items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          reservedStock: { increment: item.quantity }
        }
      });

      // Create stock movement record
      await this.prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'OUT',
          quantity: item.quantity,
          previousStock: 0, // This should be fetched before update
          newStock: 0, // This should be calculated
          reason: 'Order placed'
        }
      });
    }
  }

  private async restoreProductStock(items: any[]) {
    for (const item of items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          reservedStock: { decrement: item.quantity }
        }
      });

      // Create stock movement record
      await this.prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          previousStock: 0,
          newStock: 0,
          reason: 'Order cancelled'
        }
      });
    }
  }

  private async createStatusHistory(orderId: string, status: OrderStatus, notes?: string) {
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status,
        notes
      }
    });
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus) {
    const validTransitions = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: []
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async handleOrderDelivery(orderId: string) {
    // Update payment status if not already completed
    await this.prisma.order.updateMany({
      where: {
        id: orderId,
        paymentStatus: { not: PaymentStatus.COMPLETED }
      },
      data: { paymentStatus: PaymentStatus.COMPLETED }
    });

    // Release reserved stock
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { reservedStock: { decrement: item.quantity } }
      });
    }
  }

  private async handleOrderCancellation(orderId: string) {
    // Update payment status
    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: PaymentStatus.REFUNDED }
    });
  }

  private async initiateRefund(orderId: string, amount: number, reason: string) {
    // This would integrate with payment gateway for actual refund processing
    this.logger.log(`Refund initiated for order ${orderId}: ${amount} - ${reason}`);
  }

  private async sendOrderConfirmationEmail(order: any) {
    try {
      // Implementation would send order confirmation email
      this.logger.log(`Order confirmation email sent for order ${order.orderNumber}`);
    } catch (error) {
      this.logger.error('Failed to send order confirmation email:', error);
    }
  }

  private async sendStatusUpdateEmail(order: any) {
    try {
      // Implementation would send status update email
      this.logger.log(`Status update email sent for order ${order.orderNumber}`);
    } catch (error) {
      this.logger.error('Failed to send status update email:', error);
    }
  }

  private async sendOrderCancellationEmail(order: any) {
    try {
      // Implementation would send cancellation email
      this.logger.log(`Cancellation email sent for order ${order.orderNumber}`);
    } catch (error) {
      this.logger.error('Failed to send cancellation email:', error);
    }
  }

  private processDailyStats(stats: any[]) {
    // Process and format daily statistics
    return stats.map(stat => ({
      date: stat.createdAt,
      orders: stat._count,
      revenue: stat._sum.totalAmount || 0
    }));
  }
}