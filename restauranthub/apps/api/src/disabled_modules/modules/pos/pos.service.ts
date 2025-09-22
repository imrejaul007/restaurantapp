import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreatePosOrderData {
  restaurantId: string;
  tableId?: string;
  customerId?: string;
  staffId: string;
  orderType: string; // dine_in, takeaway, delivery
  items: CreateOrderItemData[];
  notes?: string;
}

export interface CreateOrderItemData {
  menuItemId: string;
  quantity: number;
  modifiers?: any;
  notes?: string;
}

export interface PaymentData {
  amount: number;
  method: string; // cash, card, upi, digital_wallet
  transactionId?: string;
  paymentGateway?: string;
}

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

  constructor(private prisma: PrismaService) {}

  async createOrder(orderData: CreatePosOrderData) {
    this.logger.log(`Creating POS order for restaurant: ${orderData.restaurantId}`);

    return this.prisma.$transaction(async (tx) => {
      // Calculate totals
      let subtotal = 0;
      const orderItems = [];

      for (const item of orderData.items) {
        const menuItem = await tx.menuItem.findUnique({
          where: { id: item.menuItemId },
          include: {
            modifiers: { include: { options: true } },
            variants: true
          }
        });

        if (!menuItem) {
          throw new NotFoundException(`Menu item ${item.menuItemId} not found`);
        }

        if (!menuItem.isAvailable) {
          throw new BadRequestException(`Menu item ${menuItem.name} is not available`);
        }

        let unitPrice = menuItem.basePrice;

        // Calculate modifier costs
        if (item.modifiers) {
          for (const modifier of item.modifiers) {
            if (modifier.selectedOptions) {
              for (const optionId of modifier.selectedOptions) {
                const option = await tx.menuModifierOption.findUnique({
                  where: { id: optionId }
                });
                if (option) {
                  unitPrice += option.priceChange;
                }
              }
            }
          }
        }

        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        orderItems.push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          modifiers: item.modifiers,
          notes: item.notes
        });
      }

      const taxAmount = subtotal * 0.18; // 18% GST
      const totalAmount = subtotal + taxAmount;

      // Generate order number
      const orderCount = await tx.posOrder.count({
        where: { restaurantId: orderData.restaurantId }
      });
      const orderNumber = `POS-${orderData.restaurantId.slice(-4)}-${(orderCount + 1).toString().padStart(4, '0')}`;

      // Create order
      const order = await tx.posOrder.create({
        data: {
          orderNumber,
          restaurantId: orderData.restaurantId,
          tableId: orderData.tableId,
          customerId: orderData.customerId,
          staffId: orderData.staffId,
          orderType: orderData.orderType,
          subtotal,
          taxAmount,
          totalAmount,
          notes: orderData.notes
        }
      });

      // Create order items
      await tx.menuOrderItem.createMany({
        data: orderItems.map(item => ({
          posOrderId: order.id,
          ...item
        }))
      });

      // Update table status if dine-in
      if (orderData.tableId && orderData.orderType === 'dine_in') {
        await tx.table.update({
          where: { id: orderData.tableId },
          data: { status: 'occupied' }
        });
      }

      return tx.posOrder.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              menuItem: { select: { name: true, basePrice: true } }
            }
          },
          table: { select: { tableNumber: true } },
          customer: { select: { firstName: true, lastName: true } },
          staff: { select: { userId: true } }
        }
      });
    });
  }

  async getOrders(restaurantId: string, filters: {
    status?: string;
    tableId?: string;
    orderType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const { status, tableId, orderType, startDate, endDate, limit = 50, offset = 0 } = filters;

    const where: any = { restaurantId };

    if (status) where.status = status;
    if (tableId) where.tableId = tableId;
    if (orderType) where.orderType = orderType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [orders, total] = await Promise.all([
      this.prisma.posOrder.findMany({
        where,
        include: {
          items: {
            include: {
              menuItem: { select: { name: true } }
            }
          },
          table: { select: { tableNumber: true } },
          customer: { select: { firstName: true, lastName: true } },
          payments: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      this.prisma.posOrder.count({ where })
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

  async getOrderById(id: string) {
    const order = await this.prisma.posOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: {
              select: { name: true, basePrice: true, preparationTime: true }
            }
          }
        },
        table: true,
        customer: true,
        staff: { select: { userId: true } },
        payments: true
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(id: string, status: string, userId: string) {
    const order = await this.prisma.posOrder.findUnique({
      where: { id }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.posOrder.update({
      where: { id },
      data: { status }
    });

    // If order is completed and has a table, free the table
    if (status === 'served' && order.tableId) {
      await this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'available' }
      });
    }

    this.logger.log(`Order ${order.orderNumber} status updated to ${status} by user ${userId}`);
    return updatedOrder;
  }

  async updateOrderItemStatus(itemId: string, status: string) {
    const item = await this.prisma.menuOrderItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    return this.prisma.menuOrderItem.update({
      where: { id: itemId },
      data: { status }
    });
  }

  async processPayment(orderId: string, paymentData: PaymentData) {
    const order = await this.prisma.posOrder.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const totalPaid = order.payments.reduce((sum, payment) =>
      payment.status === 'completed' ? sum + payment.amount : sum, 0
    );

    const remainingAmount = order.totalAmount - totalPaid;

    if (paymentData.amount > remainingAmount) {
      throw new BadRequestException('Payment amount exceeds remaining balance');
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.posPayment.create({
        data: {
          posOrderId: orderId,
          amount: paymentData.amount,
          method: paymentData.method,
          transactionId: paymentData.transactionId,
          paymentGateway: paymentData.paymentGateway,
          status: 'completed',
          completedAt: new Date()
        }
      });

      const newTotalPaid = totalPaid + paymentData.amount;
      const paymentStatus = newTotalPaid >= order.totalAmount ? 'completed' : 'partial';

      await tx.posOrder.update({
        where: { id: orderId },
        data: { paymentStatus }
      });

      return payment;
    });
  }

  async cancelOrder(id: string, reason: string, userId: string) {
    const order = await this.prisma.posOrder.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === 'cancelled') {
      throw new BadRequestException('Order is already cancelled');
    }

    const completedPayments = order.payments.filter(p => p.status === 'completed');
    if (completedPayments.length > 0) {
      throw new BadRequestException('Cannot cancel order with completed payments');
    }

    const updatedOrder = await this.prisma.posOrder.update({
      where: { id },
      data: {
        status: 'cancelled',
        notes: order.notes ? `${order.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`
      }
    });

    // Free table if occupied
    if (order.tableId) {
      await this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'available' }
      });
    }

    this.logger.log(`Order ${order.orderNumber} cancelled by user ${userId}: ${reason}`);
    return updatedOrder;
  }

  async getKitchenDisplay(restaurantId: string) {
    return this.prisma.menuOrderItem.findMany({
      where: {
        posOrder: { restaurantId },
        status: { in: ['pending', 'preparing'] }
      },
      include: {
        posOrder: {
          select: {
            orderNumber: true,
            orderType: true,
            createdAt: true,
            table: { select: { tableNumber: true } }
          }
        },
        menuItem: {
          select: { name: true, preparationTime: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getDashboardStats(restaurantId: string, date?: Date) {
    const startOfDay = date ? new Date(date) : new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      todayOrders,
      todayRevenue,
      pendingOrders,
      averageOrderValue,
      topMenuItems
    ] = await Promise.all([
      this.prisma.posOrder.count({
        where: {
          restaurantId,
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: { not: 'cancelled' }
        }
      }),
      this.prisma.posOrder.aggregate({
        where: {
          restaurantId,
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: { not: 'cancelled' }
        },
        _sum: { totalAmount: true }
      }),
      this.prisma.posOrder.count({
        where: {
          restaurantId,
          status: { in: ['pending', 'confirmed', 'preparing'] }
        }
      }),
      this.prisma.posOrder.aggregate({
        where: {
          restaurantId,
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: { not: 'cancelled' }
        },
        _avg: { totalAmount: true }
      }),
      this.prisma.menuOrderItem.groupBy({
        by: ['menuItemId'],
        where: {
          posOrder: {
            restaurantId,
            createdAt: { gte: startOfDay, lte: endOfDay },
            status: { not: 'cancelled' }
          }
        },
        _sum: { quantity: true },
        _count: true,
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      })
    ]);

    return {
      todayOrders,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      pendingOrders,
      averageOrderValue: averageOrderValue._avg.totalAmount || 0,
      topMenuItems
    };
  }
}