import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  Headers,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaymentService, PaymentRequest, RefundRequest, WebhookData } from './payment.service';
import { UserRole } from '@prisma/client';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('process')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async processPayment(@Body() paymentRequest: PaymentRequest, @Request() req: any) {
    try {
      // Add customer ID from authenticated user
      const requestWithCustomer = {
        ...paymentRequest,
        customerId: req.user.id,
      };

      const result = await this.paymentService.processPayment(requestWithCustomer);
      return {
        success: true,
        data: result,
        message: 'Payment processing initiated successfully',
      };
    } catch (error) {
      this.logger.error(`Payment processing failed: ${(error as Error).message}`);
      throw error;
    }
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT)
  @HttpCode(HttpStatus.OK)
  async refundPayment(@Body() refundRequest: RefundRequest, @Request() req: any) {
    try {
      await this.paymentService.refundPayment(refundRequest);
      return {
        success: true,
        message: 'Refund processed successfully',
      };
    } catch (error) {
      this.logger.error(`Refund processing failed: ${(error as Error).message}`);
      throw error;
    }
  }

  @Get('methods')
  @UseGuards(JwtAuthGuard)
  async getPaymentMethods(@Request() req: any) {
    try {
      const methods = await this.paymentService.getPaymentMethods(req.user.id);
      return {
        success: true,
        data: methods,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch payment methods: ${(error as Error).message}`);
      throw error;
    }
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getPaymentHistory(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    try {
      const history = await this.paymentService.getPaymentHistory(
        req.user.id,
        parseInt(page),
        parseInt(limit),
        status,
      );
      return {
        success: true,
        data: history,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch payment history: ${(error as Error).message}`);
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPaymentDetails(@Param('id') paymentId: string, @Request() req: any) {
    try {
      const payment = await this.paymentService.getPaymentDetails(paymentId, req.user.id);
      return {
        success: true,
        data: payment,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch payment details: ${(error as Error).message}`);
      throw error;
    }
  }

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      if (!signature) {
        throw new BadRequestException('Missing Stripe signature');
      }

      const webhookData: WebhookData = {
        gatewayType: 'stripe',
        eventType: '',
        data: body,
        signature,
      };

      await this.paymentService.handleWebhook(webhookData);
      return { received: true };
    } catch (error) {
      this.logger.error(`Stripe webhook processing failed: ${(error as Error).message}`);
      throw new BadRequestException('Webhook processing failed');
    }
  }

  @Post('webhooks/razorpay')
  @HttpCode(HttpStatus.OK)
  async handleRazorpayWebhook(
    @Body() body: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    try {
      if (!signature) {
        throw new BadRequestException('Missing Razorpay signature');
      }

      const webhookData: WebhookData = {
        gatewayType: 'razorpay',
        eventType: '',
        data: body,
        signature,
      };

      await this.paymentService.handleWebhook(webhookData);
      return { received: true };
    } catch (error) {
      this.logger.error(`Razorpay webhook processing failed: ${(error as Error).message}`);
      throw new BadRequestException('Webhook processing failed');
    }
  }

  // Wallet endpoints
  @Get('wallet/balance')
  @UseGuards(JwtAuthGuard)
  async getWalletBalance(@Request() req: any) {
    try {
      const balance = await this.paymentService.getWalletBalance(req.user.id);
      return {
        success: true,
        data: { balance },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch wallet balance: ${(error as Error).message}`);
      throw error;
    }
  }

  @Post('wallet/add-money')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async addMoneyToWallet(
    @Body() body: { amount: number; paymentMethod: string },
    @Request() req: any,
  ) {
    try {
      const result = await this.paymentService.addMoneyToWallet(
        req.user.id,
        body.amount,
        body.paymentMethod,
      );
      return {
        success: true,
        data: result,
        message: 'Money added to wallet successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to add money to wallet: ${(error as Error).message}`);
      throw error;
    }
  }

  @Get('wallet/transactions')
  @UseGuards(JwtAuthGuard)
  async getWalletTransactions(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      const transactions = await this.paymentService.getWalletTransactions(
        req.user.id,
        parseInt(page),
        parseInt(limit),
      );
      return {
        success: true,
        data: transactions,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch wallet transactions: ${(error as Error).message}`);
      throw error;
    }
  }

  // Admin endpoints
  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPaymentDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const dashboard = await this.paymentService.getPaymentDashboard(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );
      return {
        success: true,
        data: dashboard,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch payment dashboard: ${(error as Error).message}`);
      throw error;
    }
  }

  @Get('admin/transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT)
  async getAllTransactions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('gateway') gateway?: string,
  ) {
    try {
      const transactions = await this.paymentService.getAllTransactions(
        parseInt(page),
        parseInt(limit),
        { status, gateway },
      );
      return {
        success: true,
        data: transactions,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch all transactions: ${(error as Error).message}`);
      throw error;
    }
  }
}