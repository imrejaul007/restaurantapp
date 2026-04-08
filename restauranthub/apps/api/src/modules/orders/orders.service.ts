import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, OrderQueryDto } from './dto/update-order.dto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Orders Service
 *
 * Handles order creation, status tracking, and integration with REZ Backend
 * for coin attribution and wallet management.
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly rezBackendUrl = process.env.REZ_BACKEND_URL || 'http://localhost:4000';
  private readonly webhookSecret = process.env.REZ_WEBHOOK_SECRET;

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new order
   *
   * Process:
   * 1. Validate products and calculate totals
   * 2. Create order in Resturistan database
   * 3. Send order to REZ Backend for attribution
   * 4. Return created order
   */
  async createOrder(createOrderDto: CreateOrderDto): Promise<any> {
    const requestId = uuidv4();

    try {
      this.logger.log(`[${requestId}] Creating order for restaurant ${createOrderDto.restaurantId}`);

      // Idempotency check - prevent duplicate orders
      if (createOrderDto.idempotencyKey) {
        const existingOrder = await this.prisma.order.findUnique({
          where: { idempotencyKey: createOrderDto.idempotencyKey },
        });

        if (existingOrder) {
          this.logger.warn(`[${requestId}] Duplicate order detected: ${existingOrder.id}`);
          return existingOrder;
        }
      }

      // Validate products and calculate totals
      const { subtotal, tax, total, items: validatedItems } = await this.validateAndCalculateTotals(
        createOrderDto.items
      );

      // Generate unique order number
      const orderNumber = await this.generateOrderNumber(createOrderDto.restaurantId);

      // Create order in database
      const order = await this.prisma.order.create({
        data: {
          id: uuidv4(),
          orderNumber,
          customerId: createOrderDto.customerId,
          restaurantId: createOrderDto.restaurantId,
          status: 'pending',
          fulfillmentType: createOrderDto.fulfillmentType,
          subtotal,
          tax,
          total,
          discountAmount: createOrderDto.discountAmount || 0,
          creditUsed: createOrderDto.creditUsed || 0,
          paymentMethod: createOrderDto.paymentMethod,
          paymentStatus: 'pending',
          specialInstructions: createOrderDto.specialInstructions,
          deliveryAddress: JSON.stringify(createOrderDto.deliveryAddress),
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
              modifications: item.modifications || [],
              notes: item.notes,
            })),
          },
          idempotencyKey: createOrderDto.idempotencyKey,
          rezOrderId: undefined, // Will be set after REZ Backend integration
        },
        include: {
          items: true,
        },
      });

      // Create initial timeline entry
      await this.prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'pending',
          message: 'Order placed',
          timestamp: new Date(),
        },
      });

      // Send order to REZ Backend for attribution and coin awards
      const rezIntegrationSuccess = await this.sendOrderToRezBackend(order, createOrderDto);

      if (rezIntegrationSuccess) {
        this.logger.log(`[${requestId}] Order ${orderNumber} created and sent to REZ Backend`);
      } else {
        this.logger.warn(`[${requestId}] Order ${orderNumber} created but REZ integration failed`);
      }

      return {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          items: order.items,
          createdAt: order.createdAt,
          estimatedDeliveryTime: this.calculateEstimatedDelivery(order.fulfillmentType),
        },
      };
    } catch (error) {
      this.logger.error(`[${requestId}] Failed to create order:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create order: ' + error.message);
    }
  }

  /**
   * Get orders for a customer or restaurant
   */
  async getOrders(restaurantId: string, query: OrderQueryDto, userId?: string): Promise<any> {
    try {
      const skip = (query.page - 1) * query.limit;

      const where: any = {
        restaurantId,
      };

      if (userId) {
        where.customerId = userId;
      }

      if (query.status) {
        where.status = query.status;
      }

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          include: {
            items: true,
            timeline: true,
          },
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

  /**
   * Get a single order by ID
   */
  async getOrderById(orderId: string): Promise<any> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          timeline: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      return {
        success: true,
        order,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to fetch order:', error);
      throw new InternalServerErrorException('Failed to fetch order');
    }
  }

  /**
   * Update order status (with state machine validation)
   */
  async updateOrderStatus(orderId: string, updateDto: UpdateOrderStatusDto): Promise<any> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Validate status transition
      if (!this.isValidStatusTransition(order.status, updateDto.status)) {
        throw new BadRequestException(
          `Cannot transition from ${order.status} to ${updateDto.status}`
        );
      }

      // Update order status
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: updateDto.status },
        include: { items: true },
      });

      // Create timeline entry
      await this.prisma.orderTimeline.create({
        data: {
          orderId,
          status: updateDto.status,
          message: updateDto.notes || `Order status changed to ${updateDto.status}`,
          timestamp: new Date(),
        },
      });

      // Notify REZ Backend of status change
      this.notifyRezBackendStatusChange(orderId, updateDto.status).catch((error) => {
        this.logger.warn(`Failed to notify REZ Backend of status change: ${error.message}`);
      });

      return {
        success: true,
        message: `Order status updated to ${updateDto.status}`,
        order: updatedOrder,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to update order status:', error);
      throw new InternalServerErrorException('Failed to update order status');
    }
  }

  /**
   * Validate products and calculate order totals
   */
  private async validateAndCalculateTotals(
    items: OrderItemDto[]
  ): Promise<{
    subtotal: number;
    tax: number;
    total: number;
    items: any[];
  }> {
    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      // In production, validate product exists and is in stock
      // For now, accept the item as provided
      if (item.quantity < 1 || item.price < 0) {
        throw new BadRequestException(`Invalid item: ${item.productName}`);
      }

      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;

      validatedItems.push({
        ...item,
        subtotal: itemSubtotal,
      });
    }

    // Calculate tax (18% GST in India)
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const total = subtotal + tax;

    return {
      subtotal,
      tax,
      total,
      items: validatedItems,
    };
  }

  /**
   * Generate unique order number for restaurant
   */
  private async generateOrderNumber(restaurantId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(5, '0');
    return `ORD-${dateStr}-${random}`;
  }

  /**
   * Send order to REZ Backend for attribution and coin awards
   */
  private async sendOrderToRezBackend(order: any, createOrderDto: CreateOrderDto): Promise<boolean> {
    try {
      const payload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: createOrderDto.customerId,
        restaurantId: createOrderDto.restaurantId,
        items: createOrderDto.items,
        total: order.total,
        paymentMethod: createOrderDto.paymentMethod,
        fulfillmentType: createOrderDto.fulfillmentType,
        timestamp: new Date().toISOString(),
      };

      // Generate HMAC signature for webhook
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const response = await axios.post(
        `${this.rezBackendUrl}/api/webhooks/restaurant/order-created`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Signature': signature,
          },
          timeout: 5000,
        }
      );

      // Store REZ order ID for future reference
      await this.prisma.order.update({
        where: { id: order.id },
        data: { rezOrderId: response.data?.orderId },
      });

      this.logger.log(`Order ${order.orderNumber} sent to REZ Backend`);
      return true;
    } catch (error) {
      this.logger.warn(`Failed to send order to REZ Backend: ${error.message}`);
      // Don't throw - REZ integration is async and can fail without blocking order creation
      return false;
    }
  }

  /**
   * Notify REZ Backend of order status change
   */
  private async notifyRezBackendStatusChange(orderId: string, status: string): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order?.rezOrderId) {
        this.logger.warn(`Order ${orderId} has no REZ order ID, skipping notification`);
        return;
      }

      const payload = {
        orderId: order.rezOrderId,
        status,
        timestamp: new Date().toISOString(),
      };

      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      await axios.post(`${this.rezBackendUrl}/api/webhooks/restaurant/order-status-changed`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
        },
        timeout: 5000,
      });

      this.logger.log(`REZ Backend notified of order ${orderId} status change to ${status}`);
    } catch (error) {
      this.logger.warn(`Failed to notify REZ Backend of status change: ${error.message}`);
      // Don't throw - this is async and non-critical
    }
  }

  /**
   * Validate order status transitions
   */
  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['dispatched', 'cancelled'],
      dispatched: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
      returned: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Calculate estimated delivery time based on fulfillment type
   */
  private calculateEstimatedDelivery(fulfillmentType: string): Date {
    const estimatedMinutes = {
      delivery: 45,
      pickup: 25,
      dine_in: 35,
    };

    const minutes = estimatedMinutes[fulfillmentType] || 30;
    const estimatedTime = new Date();
    estimatedTime.setMinutes(estimatedTime.getMinutes() + minutes);
    return estimatedTime;
  }
}
