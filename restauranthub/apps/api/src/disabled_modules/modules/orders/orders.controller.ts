import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, OrderStatus } from '@prisma/client';
import { CreateOrderDto, UpdateOrderDto, ProcessPaymentDto } from './dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : createOrderDto.restaurantId;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant ID is required');
    }

    return this.ordersService.create({
      ...createOrderDto,
      restaurantId
    });
  }

  @Get()
  @Roles(UserRole.RESTAURANT, UserRole.VENDOR, UserRole.ADMIN)
  async findAll(
    @Query('status') status?: OrderStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req?: any
  ) {
    const { role } = req.user;
    let restaurantId: string | undefined;
    let vendorId: string | undefined;

    if (role === UserRole.RESTAURANT && req.user.restaurant) {
      restaurantId = req.user.restaurant.id;
    } else if (role === UserRole.VENDOR && req.user.vendor) {
      vendorId = req.user.vendor.id;
    }

    return this.ordersService.findAll({
      userId: req.user.id,
      role,
      restaurantId,
      vendorId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
  }

  @Get('stats')
  @Roles(UserRole.RESTAURANT, UserRole.VENDOR, UserRole.ADMIN)
  async getStats(@Request() req: any) {
    const { role } = req.user;
    let restaurantId: string | undefined;
    let vendorId: string | undefined;

    if (role === UserRole.RESTAURANT && req.user.restaurant) {
      restaurantId = req.user.restaurant.id;
    } else if (role === UserRole.VENDOR && req.user.vendor) {
      vendorId = req.user.vendor.id;
    }

    return this.ordersService.getOrderStats(req.user.id, role, restaurantId, vendorId);
  }

  @Get('tracking/:orderNumber')
  async getOrderTracking(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.getOrderTracking(orderNumber);
  }

  @Get(':id')
  @Roles(UserRole.RESTAURANT, UserRole.VENDOR, UserRole.ADMIN)
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @Roles(UserRole.RESTAURANT, UserRole.VENDOR, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req: any,
  ) {
    return this.ordersService.update(id, updateOrderDto, req.user.id, req.user.role);
  }

  @Post(':id/cancel')
  @Roles(UserRole.RESTAURANT, UserRole.VENDOR, UserRole.ADMIN)
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    if (!reason) {
      throw new BadRequestException('Cancellation reason is required');
    }
    return this.ordersService.cancel(id, reason, req.user.id, req.user.role);
  }

  @Post(':id/payment')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async processPayment(
    @Param('id') orderId: string,
    @Body() processPaymentDto: ProcessPaymentDto
  ) {
    return this.ordersService.processPayment(orderId, processPaymentDto);
  }
}