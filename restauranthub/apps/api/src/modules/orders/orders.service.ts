import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WebsocketService } from '../websocket/websocket.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { generateOrderNumber } from '../../utils/order.utils';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private websocketService: WebsocketService,
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
}