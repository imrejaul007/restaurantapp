import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, CancelOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.RESTAURANT)
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Request() req,
    @Body(ValidationPipe) createOrderDto: CreateOrderDto
  ) {
    const restaurantId = req.user.restaurant?.id;
    if (!restaurantId) {
      throw new Error('Restaurant profile required');
    }
    return this.ordersService.createOrder(restaurantId, createOrderDto);
  }

  @Get()
  @Roles(UserRole.RESTAURANT, UserRole.VENDOR, UserRole.ADMIN)
  async getOrders(
    @Request() req,
    @Query(ValidationPipe) query: OrderQueryDto
  ) {
    const restaurantId = req.user.restaurant?.id;
    const userRole = req.user.role;

    return this.ordersService.getOrders(restaurantId, query, userRole);
  }

  @Get('analytics')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async getOrderAnalytics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const restaurantId = req.user.restaurant?.id;
    if (!restaurantId) {
      throw new Error('Restaurant profile required');
    }

    return this.ordersService.getOrderAnalytics(
      restaurantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get(':id')
  @Roles(UserRole.RESTAURANT, UserRole.VENDOR, UserRole.ADMIN)
  async getOrderById(
    @Request() req,
    @Param('id', ParseUUIDPipe) orderId: string
  ) {
    const restaurantId = req.user.restaurant?.id;
    const userRole = req.user.role;

    return this.ordersService.getOrderById(orderId, restaurantId, userRole);
  }

  @Put(':id/status')
  @Roles(UserRole.RESTAURANT, UserRole.VENDOR, UserRole.ADMIN)
  async updateOrderStatus(
    @Request() req,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body(ValidationPipe) updateStatusDto: UpdateOrderStatusDto
  ) {
    const restaurantId = req.user.restaurant?.id;
    const userRole = req.user.role;

    return this.ordersService.updateOrderStatus(orderId, restaurantId, updateStatusDto, userRole);
  }

  @Put(':id/cancel')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async cancelOrder(
    @Request() req,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body(ValidationPipe) cancelOrderDto: CancelOrderDto
  ) {
    const restaurantId = req.user.restaurant?.id;
    const userRole = req.user.role;

    return this.ordersService.cancelOrder(orderId, restaurantId, cancelOrderDto, userRole);
  }

  // Vendor-specific endpoints
  @Get('vendor/:vendorId')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async getVendorOrders(
    @Request() req,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Query(ValidationPipe) query: OrderQueryDto
  ) {
    const userRole = req.user.role;

    // Ensure vendor can only access their own orders
    if (userRole === UserRole.VENDOR && req.user.vendor?.id !== vendorId) {
      throw new Error('Access denied');
    }

    const modifiedQuery = { ...query, vendorId };
    return this.ordersService.getOrders(null, modifiedQuery, userRole);
  }

  @Put('vendor/:vendorId/:orderId/status')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async updateVendorOrderStatus(
    @Request() req,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body(ValidationPipe) updateStatusDto: UpdateOrderStatusDto
  ) {
    const userRole = req.user.role;

    // Ensure vendor can only update their own orders
    if (userRole === UserRole.VENDOR && req.user.vendor?.id !== vendorId) {
      throw new Error('Access denied');
    }

    return this.ordersService.updateOrderStatus(orderId, null, updateStatusDto, userRole);
  }

  // Restaurant dashboard specific endpoints
  @Get('restaurant/summary')
  @Roles(UserRole.RESTAURANT)
  async getOrderSummary(@Request() req) {
    const restaurantId = req.user.restaurant?.id;
    if (!restaurantId) {
      throw new Error('Restaurant profile required');
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return this.ordersService.getOrderAnalytics(restaurantId, startOfDay, endOfDay);
  }

  @Get('restaurant/recent')
  @Roles(UserRole.RESTAURANT)
  async getRecentOrders(@Request() req) {
    const restaurantId = req.user.restaurant?.id;
    if (!restaurantId) {
      throw new Error('Restaurant profile required');
    }

    const query: OrderQueryDto = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    return this.ordersService.getOrders(restaurantId, query, UserRole.RESTAURANT);
  }
}