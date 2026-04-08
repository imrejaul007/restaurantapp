import {
  Controller,
  Get,
  Post,
  Put,
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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, ProcessPaymentDto, RefundPaymentDto } from './dto/create-payment.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Request() req,
    @Body(ValidationPipe) createPaymentDto: CreatePaymentDto
  ) {
    const restaurantId = req.user.restaurant?.id;
    if (!restaurantId) {
      throw new Error('Restaurant profile required');
    }
    return this.paymentsService.createPayment(restaurantId, createPaymentDto);
  }

  @Post('process')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async processPayment(
    @Request() req,
    @Body(ValidationPipe) processPaymentDto: ProcessPaymentDto
  ) {
    const restaurantId = req.user.restaurant?.id;
    if (!restaurantId) {
      throw new Error('Restaurant profile required');
    }
    return this.paymentsService.processPayment(restaurantId, processPaymentDto);
  }

  @Post('refund')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async refundPayment(
    @Request() req,
    @Body(ValidationPipe) refundPaymentDto: RefundPaymentDto
  ) {
    const restaurantId = req.user.restaurant?.id;
    if (!restaurantId) {
      throw new Error('Restaurant profile required');
    }
    return this.paymentsService.refundPayment(restaurantId, refundPaymentDto);
  }

  @Get()
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async getPayments(
    @Request() req,
    @Query() query: any
  ) {
    const restaurantId = req.user.restaurant?.id;
    if (!restaurantId) {
      throw new Error('Restaurant profile required');
    }
    return this.paymentsService.getPayments(restaurantId, query);
  }

  @Get('analytics')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async getPaymentAnalytics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const restaurantId = req.user.restaurant?.id;
    if (!restaurantId) {
      throw new Error('Restaurant profile required');
    }

    return this.paymentsService.getPaymentAnalytics(
      restaurantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get(':id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async getPaymentById(
    @Request() req,
    @Param('id', ParseUUIDPipe) paymentId: string
  ) {
    const restaurantId = req.user.restaurant?.id;
    if (!restaurantId) {
      throw new Error('Restaurant profile required');
    }
    return this.paymentsService.getPaymentById(paymentId, restaurantId);
  }

  // Webhook endpoints for payment gateways
  @Post('webhooks/razorpay')
  @HttpCode(HttpStatus.OK)
  async handleRazorpayWebhook(
    @Body() webhookData: any,
    @Query('restaurant_id') restaurantId?: string
  ) {
    // Handle Razorpay webhook
    // This would verify the webhook signature and process the event
    console.log('Razorpay webhook received:', webhookData);
    return { success: true };
  }

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Body() webhookData: any,
    @Query('restaurant_id') restaurantId?: string
  ) {
    // Handle Stripe webhook
    // This would verify the webhook signature and process the event
    console.log('Stripe webhook received:', webhookData);
    return { success: true };
  }

  @Post('webhooks/upi')
  @HttpCode(HttpStatus.OK)
  async handleUPIWebhook(
    @Body() webhookData: any,
    @Query('restaurant_id') restaurantId?: string
  ) {
    // Handle UPI webhook
    console.log('UPI webhook received:', webhookData);
    return { success: true };
  }
}