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
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CUSTOMER, UserRole.RESTAURANT, UserRole.ADMIN)
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll(@Query() query: OrderQueryDto, @Request() req: any) {
    const { role } = req.user;
    let restaurantId: string | undefined;
    let vendorId: string | undefined;

    // Get the user's restaurant or vendor profile ID
    if (role === UserRole.RESTAURANT && req.user.restaurant) {
      restaurantId = req.user.restaurant.id;
    } else if (role === UserRole.VENDOR && req.user.vendor) {
      vendorId = req.user.vendor.id;
    }

    return this.ordersService.findAll(query, req.user.id, role, restaurantId, vendorId);
  }

  @Get('stats')
  getStats(@Request() req: any) {
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

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @Roles(UserRole.RESTAURANT, UserRole.VENDOR, UserRole.ADMIN, UserRole.CUSTOMER)
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req: any,
  ) {
    return this.ordersService.update(id, updateOrderDto, req.user.id, req.user.role);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    if (!reason) {
      throw new BadRequestException('Cancellation reason is required');
    }
    return this.ordersService.cancel(id, reason, req.user.id, req.user.role);
  }
}