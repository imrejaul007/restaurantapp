import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';

export interface CreateOrderData {
  restaurantId: string;
  vendorId?: string;
  items: OrderItemData[];
  shippingAddress?: any;
  billingAddress?: any;
  notes?: string;
  paymentMethod?: string;
}

export interface OrderItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
  trackingNumber?: string;
  cancelReason?: string;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  async create(orderData: CreateOrderData) {
    this.logger.log(`Creating order for restaurant: ${orderData.restaurantId}`);

    return this.prisma.$transaction(async (tx) => {
      // Calculate order totals
      let subtotal = 0;
      let gstAmount = 0;

      const orderItems = [];
      for (const item of orderData.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        if (product.status !== 'ACTIVE') {
          throw new BadRequestException(`Product ${product.name} is not available`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${product.name}`);
        }

        const itemTotal = item.unitPrice * item.quantity;
        const itemGst = itemTotal * (product.gstRate / 100);

        subtotal += itemTotal;
        gstAmount += itemGst;

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: item.unitPrice,
          gstAmount: itemGst,
          totalAmount: itemTotal + itemGst
        });

        // Reserve stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            reservedStock: { increment: item.quantity }
          }
        });
      }

      const totalAmount = subtotal + gstAmount + (orderData.shippingAddress ? 50 : 0); // Add shipping if applicable

      // Generate order number
      const orderCount = await tx.order.count({
        where: { restaurantId: orderData.restaurantId }
      });
      const orderNumber = `ORD-${orderData.restaurantId.slice(-4)}-${(orderCount + 1).toString().padStart(6, '0')}`;

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          restaurantId: orderData.restaurantId,
          vendorId: orderData.vendorId,
          subtotal,
          gstAmount,
          shippingAmount: orderData.shippingAddress ? 50 : 0,
          totalAmount,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          shippingAddress: orderData.shippingAddress,
          billingAddress: orderData.billingAddress,
          notes: orderData.notes,
          paymentMethod: orderData.paymentMethod
        }
      });

      // Create order items
      await tx.orderItem.createMany({
        data: orderItems.map(item => ({
          orderId: order.id,
          ...item
        }))
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: OrderStatus.PENDING,
          notes: 'Order created'
        }
      });

      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true } }
            }
          },
          statusHistory: true
        }
      });
    });
  }

  async findAll(filters: {
    userId?: string;
    role?: UserRole;
    restaurantId?: string;
    vendorId?: string;
    status?: OrderStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const { userId, role, restaurantId, vendorId, status, startDate, endDate, limit = 50, offset = 0 } = filters;

    const where: any = {};

    if (restaurantId) where.restaurantId = restaurantId;
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true } }
            }
          },
          restaurant: { select: { name: true } },
          vendor: { select: { companyName: true } },
          payment: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      this.prisma.order.count({ where })
    ]);

    return {
      orders,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { name: true, sku: true, images: true } }
          }
        },
        restaurant: { select: { name: true, address: true } },
        vendor: { select: { companyName: true } },
        payment: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        },
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access permissions
    if (role === UserRole.RESTAURANT && order.restaurantId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (role === UserRole.VENDOR && order.vendorId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async update(id: string, updateData: UpdateOrderData, userId: string, role: UserRole) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check permissions
    if (role === UserRole.RESTAURANT && order.restaurantId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (role === UserRole.VENDOR && order.vendorId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData
      });

      // Add status history if status changed
      if (updateData.status && updateData.status !== order.status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status: updateData.status,
            notes: updateData.notes || `Status updated to ${updateData.status}`
          }
        });

        // Handle stock reservation changes
        if (updateData.status === OrderStatus.CONFIRMED) {
          // Convert reserved stock to actual stock reduction
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
                reservedStock: { decrement: item.quantity }
              }
            });
          }
        } else if (updateData.status === OrderStatus.CANCELLED) {
          // Release reserved stock
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                reservedStock: { decrement: item.quantity }
              }
            });
          }
        }
      }

      this.logger.log(`Order ${order.orderNumber} updated by ${userId}: ${JSON.stringify(updateData)}`);
      return updatedOrder;
    });
  }

  async cancel(id: string, reason: string, userId: string, role: UserRole) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel delivered order');
    }

    // Check permissions
    if (role === UserRole.RESTAURANT && order.restaurantId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: reason
        }
      });

      // Add status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: OrderStatus.CANCELLED,
          notes: `Order cancelled: ${reason}`
        }
      });

      // Release reserved stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            reservedStock: { decrement: item.quantity }
          }
        });
      }

      // Handle refund if payment was completed
      if (order.payment && order.payment.status === 'COMPLETED') {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: 'REFUNDED',
            refundAmount: order.payment.amount,
            refundedAt: new Date()
          }
        });
      }

      this.logger.log(`Order ${order.orderNumber} cancelled by ${userId}: ${reason}`);
      return updatedOrder;
    });
  }

  async getOrderStats(userId: string, role: UserRole, restaurantId?: string, vendorId?: string) {
    const where: any = {};

    if (role === UserRole.RESTAURANT && restaurantId) {
      where.restaurantId = restaurantId;
    } else if (role === UserRole.VENDOR && vendorId) {
      where.vendorId = vendorId;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      todayOrders,
      thisMonthRevenue,
      recentOrders
    ] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({
        where: {
          ...where,
          status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING] }
        }
      }),
      this.prisma.order.count({
        where: {
          ...where,
          createdAt: { gte: today }
        }
      }),
      this.prisma.order.aggregate({
        where: {
          ...where,
          status: { not: OrderStatus.CANCELLED },
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1)
          }
        },
        _sum: { totalAmount: true }
      }),
      this.prisma.order.findMany({
        where,
        include: {
          items: { take: 3, include: { product: { select: { name: true } } } },
          restaurant: { select: { name: true } },
          vendor: { select: { companyName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    return {
      totalOrders,
      pendingOrders,
      todayOrders,
      thisMonthRevenue: thisMonthRevenue._sum.totalAmount || 0,
      recentOrders
    };
  }

  async processPayment(orderId: string, paymentData: {
    paymentGateway: string;
    gatewayPaymentId: string;
    gatewayOrderId?: string;
    amount: number;
    method: string;
    metadata?: any;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Order is already paid');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          orderId,
          paymentGateway: paymentData.paymentGateway,
          gatewayPaymentId: paymentData.gatewayPaymentId,
          gatewayOrderId: paymentData.gatewayOrderId,
          amount: paymentData.amount,
          method: paymentData.method,
          status: PaymentStatus.COMPLETED,
          metadata: paymentData.metadata
        }
      });

      // Update order payment status
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
          status: order.status === OrderStatus.PENDING ? OrderStatus.CONFIRMED : order.status
        }
      });

      // Add status history if status changed
      if (order.status === OrderStatus.PENDING) {
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: OrderStatus.CONFIRMED,
            notes: 'Payment completed, order confirmed'
          }
        });
      }

      this.logger.log(`Payment processed for order ${order.orderNumber}: ${paymentData.amount}`);
      return payment;
    });
  }

  async getOrderTracking(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'asc' }
        },
        items: {
          include: {
            product: { select: { name: true, images: true } }
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      trackingNumber: order.trackingNumber,
      deliveredAt: order.deliveredAt,
      items: order.items,
      timeline: order.statusHistory
    };
  }
}