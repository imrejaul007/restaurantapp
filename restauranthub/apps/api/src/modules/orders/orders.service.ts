import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, OrderQueryDto } from './dto/update-order.dto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { createHmac } from 'crypto';

/** Map controller status strings (lowercase) to Prisma OrderStatus enum (UPPERCASE) */
const STATUS_MAP: Record<string, string> = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  preparing: 'PREPARING',
  processing: 'PROCESSING',
  shipped: 'SHIPPED',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED',
  refunded: 'REFUNDED',
  // aliases from DTO
  ready: 'PROCESSING',
  dispatched: 'SHIPPED',
  returned: 'REFUNDED',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly rezBackendUrl = process.env.REZ_BACKEND_URL || 'http://localhost:4000';
  private readonly webhookSecret = process.env.REZ_WEBHOOK_SECRET;

  constructor(private prisma: PrismaService) {
    if (!this.webhookSecret) {
      this.logger.warn('⚠️  REZ_WEBHOOK_SECRET is not configured. Webhook signatures will be skipped.');
    }
  }

  async createOrder(createOrderDto: CreateOrderDto): Promise<any> {
    const requestId = uuidv4();
    try {
      this.logger.log(`[${requestId}] Creating order for restaurant ${createOrderDto.restaurantId}`);

      const { subtotal, gstAmount, totalAmount, items: validatedItems } =
        await this.validateAndCalculateTotals(createOrderDto.items);

      const orderNumber = this.generateOrderNumber();

      const order = await this.prisma.order.create({
        data: {
          orderNumber,
          restaurantId: createOrderDto.restaurantId,
          status: 'PENDING',
          subtotal,
          gstAmount,
          totalAmount,
          discountAmount: createOrderDto.discountAmount || 0,
          creditUsed: createOrderDto.creditUsed || 0,
          paymentMethod: createOrderDto.paymentMethod,
          paymentStatus: 'PENDING',
          notes: createOrderDto.specialInstructions,
          shippingAddress: (createOrderDto.deliveryAddress as any) ?? undefined,
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              gstAmount: Math.round(item.price * item.quantity * 0.18 * 100) / 100,
              totalAmount: Math.round(item.price * item.quantity * 1.18 * 100) / 100,
            })),
          },
        },
        include: { items: true },
      });

      await this.prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
          notes: 'Order placed',
        },
      });

      this.sendToRezBackend(order, createOrderDto).catch((err) =>
        this.logger.warn(`[${requestId}] REZ integration failed: ${err?.message}`),
      );

      return {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.totalAmount,
          items: (order as any).items,
          createdAt: order.createdAt,
        },
      };
    } catch (error) {
      this.logger.error(`[${requestId}] Failed to create order:`, error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to create order: ' + (error as any).message);
    }
  }

  async getOrders(restaurantId: string, query: OrderQueryDto): Promise<any> {
    try {
      const skip = (query.page - 1) * query.limit;
      const where: any = { restaurantId };
      if (query.status) {
        where.status = STATUS_MAP[query.status] ?? query.status.toUpperCase();
      }

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          include: { items: true, statusHistory: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: query.limit,
        }),
        this.prisma.order.count({ where }),
      ]);

      return {
        success: true,
        data: orders,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages: Math.ceil(total / query.limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch orders:', error);
      throw new InternalServerErrorException('Failed to fetch orders');
    }
  }

  async getOrderById(orderId: string, restaurantId: string): Promise<any> {
    try {
      const order = await this.prisma.order.findFirst({
        where: { id: orderId, restaurantId },
        include: { items: true, statusHistory: true },
      });
      if (!order) throw new NotFoundException('Order not found');
      return { success: true, order };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to fetch order:', error);
      throw new InternalServerErrorException('Failed to fetch order');
    }
  }

  async updateOrderStatus(orderId: string, updateDto: UpdateOrderStatusDto, restaurantId: string): Promise<any> {
    try {
      const order = await this.prisma.order.findFirst({
        where: { id: orderId, restaurantId },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Order not found');

      const newStatus = STATUS_MAP[updateDto.status] ?? updateDto.status.toUpperCase();
      if (!VALID_TRANSITIONS[order.status]?.includes(newStatus)) {
        throw new BadRequestException(
          `Cannot transition from ${order.status} to ${newStatus}`,
        );
      }

      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus as any },
        include: { items: true },
      });

      await this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus as any,
          notes: updateDto.notes || `Status changed to ${newStatus}`,
        },
      });

      this.notifyRezStatusChange(orderId, newStatus).catch((err) =>
        this.logger.warn(`REZ status notification failed: ${err?.message}`),
      );

      return {
        success: true,
        message: `Order status updated to ${newStatus}`,
        order: updatedOrder,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error('Failed to update order status:', error);
      throw new InternalServerErrorException('Failed to update order status');
    }
  }

  private async validateAndCalculateTotals(items: OrderItemDto[]) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }
    let subtotal = 0;
    const validatedItems: OrderItemDto[] = [];
    for (const item of items) {
      if (item.quantity < 1 || item.price <= 0) {
        throw new BadRequestException(`Invalid item: ${item.productName} (price must be > 0)`);
      }
      subtotal += item.price * item.quantity;
      validatedItems.push(item);
    }
    const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const totalAmount = subtotal + gstAmount;
    return { subtotal, gstAmount, totalAmount, items: validatedItems };
  }

  private generateOrderNumber(): string {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const suffix = uuidv4().split('-')[0].toUpperCase();
    return `ORD-${dateStr}-${suffix}`;
  }

  private async sendToRezBackend(order: any, dto: CreateOrderDto): Promise<void> {
    if (!this.webhookSecret) return;
    const payload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      restaurantId: dto.restaurantId,
      total: order.totalAmount,
      timestamp: new Date().toISOString(),
    };
    const signature = createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    await axios.post(`${this.rezBackendUrl}/api/webhooks/restaurant/order-created`, payload, {
      headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
      timeout: 5000,
    });
  }

  private async notifyRezStatusChange(orderId: string, status: string): Promise<void> {
    if (!this.webhookSecret) return;
    const payload = { orderId, status, timestamp: new Date().toISOString() };
    const signature = createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    await axios.post(`${this.rezBackendUrl}/api/webhooks/restaurant/order-status-changed`, payload, {
      headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
      timeout: 5000,
    });
  }
}
