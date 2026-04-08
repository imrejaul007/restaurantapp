import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, OrderQueryDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';

/**
 * Orders Controller
 *
 * REST API endpoints for order management:
 * - POST /orders - Create new order
 * - GET /orders - List orders
 * - GET /orders/:id - Get single order
 * - PUT /orders/:id/status - Update order status
 */
@Controller('api/orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private ordersService: OrdersService) {}

  /**
   * Create a new order
   *
   * POST /api/orders
   *
   * Request body:
   * {
   *   "customerId": "user_123",
   *   "restaurantId": "rest_456",
   *   "items": [
   *     {
   *       "productId": "prod_789",
   *       "productName": "Butter Chicken",
   *       "quantity": 2,
   *       "price": 350
   *     }
   *   ],
   *   "fulfillmentType": "delivery",
   *   "deliveryAddress": { ... },
   *   "paymentMethod": "card",
   *   "idempotencyKey": "optional-uuid-for-deduplication"
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "order": {
   *     "id": "order_123",
   *     "orderNumber": "ORD-20260408-12345",
   *     "status": "pending",
   *     "total": 828,
   *     "estimatedDeliveryTime": "2026-04-08T15:00:00Z"
   *   }
   * }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    this.logger.log(`Creating order for restaurant ${createOrderDto.restaurantId}`);

    try {
      const result = await this.ordersService.createOrder(createOrderDto);
      return result;
    } catch (error) {
      this.logger.error('Order creation failed:', error);
      throw error;
    }
  }

  /**
   * Get orders (list with filters)
   *
   * GET /api/orders?page=1&limit=20&status=pending
   *
   * Query parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20)
   * - status: Filter by status (pending, confirmed, preparing, ready, dispatched, delivered)
   * - search: Search in order number or customer name
   *
   * Response:
   * {
   *   "success": true,
   *   "data": [ ... ],
   *   "pagination": {
   *     "page": 1,
   *     "limit": 20,
   *     "total": 100,
   *     "pages": 5
   *   }
   * }
   */
  @Get()
  async getOrders(
    @Query() query: OrderQueryDto,
    @Query('restaurantId') restaurantId?: string,
    @Query('customerId') customerId?: string,
    @Request() req?: any
  ) {
    // In production, get restaurantId from JWT claim
    const effectiveRestaurantId = restaurantId || req?.user?.restaurantId;

    if (!effectiveRestaurantId) {
      throw new BadRequestException('restaurantId is required');
    }

    this.logger.log(`Fetching orders for restaurant ${effectiveRestaurantId}`);
    return this.ordersService.getOrders(effectiveRestaurantId, query, customerId);
  }

  /**
   * Get a single order by ID
   *
   * GET /api/orders/:id
   *
   * Response:
   * {
   *   "success": true,
   *   "order": {
   *     "id": "order_123",
   *     "orderNumber": "ORD-20260408-12345",
   *     "status": "confirmed",
   *     "items": [ ... ],
   *     "timeline": [ ... ],
   *     "createdAt": "2026-04-08T14:00:00Z"
   *   }
   * }
   */
  @Get(':id')
  async getOrderById(@Param('id') orderId: string) {
    this.logger.log(`Fetching order ${orderId}`);
    return this.ordersService.getOrderById(orderId);
  }

  /**
   * Update order status
   *
   * PUT /api/orders/:id/status
   *
   * Request body:
   * {
   *   "status": "confirmed",
   *   "notes": "Order confirmed and sent to kitchen"
   * }
   *
   * Valid status transitions:
   * - pending → confirmed, cancelled
   * - confirmed → preparing, cancelled
   * - preparing → ready, cancelled
   * - ready → dispatched, cancelled
   * - dispatched → delivered, cancelled
   *
   * Response:
   * {
   *   "success": true,
   *   "message": "Order status updated to confirmed",
   *   "order": { ... }
   * }
   */
  @Put(':id/status')
  async updateOrderStatus(@Param('id') orderId: string, @Body() updateDto: UpdateOrderStatusDto) {
    this.logger.log(`Updating order ${orderId} status to ${updateDto.status}`);
    return this.ordersService.updateOrderStatus(orderId, updateDto);
  }
}
