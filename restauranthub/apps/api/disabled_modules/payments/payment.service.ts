import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { v4 as uuidv4 } from 'uuid';

// Payment method constants (since Payment model uses String type)
export const PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD', 
  UPI: 'UPI',
  WALLET: 'WALLET',
  RAZORPAY: 'RAZORPAY',
} as const;

export type PaymentMethodType = typeof PaymentMethod[keyof typeof PaymentMethod];

export interface PaymentRequest {
  amount: number;
  currency: string;
  method: PaymentMethodType;
  customerId: string;
  orderId?: string;
  subscriptionId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  paymentId: string;
  status: PaymentStatus;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  clientSecret?: string;
  paymentUrl?: string;
  qrCode?: string;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface WebhookData {
  gatewayType: 'stripe' | 'razorpay';
  eventType: string;
  data: any;
  signature: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe!: Stripe;
  private razorpay: any;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Initialize Stripe
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2023-08-16',
      });
    }

    // Initialize Razorpay
    const razorpayKeyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const razorpayKeySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (razorpayKeyId && razorpayKeySecret) {
      this.razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });
    }
  }

  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResult> {
    this.logger.log(`Processing payment: ${JSON.stringify(paymentRequest)}`);

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        method: paymentRequest.method,
        status: PaymentStatus.PENDING,
        orderId: paymentRequest.orderId || uuidv4(), // Generate if not provided
        paymentGateway: 'pending', // Will be updated later
        metadata: paymentRequest.metadata || {},
      },
    });

    try {
      let result: PaymentResult;

      // Process payment based on method
      switch (paymentRequest.method) {
        case PaymentMethod.CARD:
          result = await this.processCardPayment(payment.id, paymentRequest);
          break;
        case PaymentMethod.UPI:
          result = await this.processUPIPayment(payment.id, paymentRequest);
          break;
        case PaymentMethod.RAZORPAY:
          result = await this.processNetBankingPayment(payment.id, paymentRequest);
          break;
        case PaymentMethod.WALLET:
          result = await this.processWalletPayment(payment.id, paymentRequest);
          break;
        case PaymentMethod.CASH:
          result = await this.processCashPayment(payment.id, paymentRequest);
          break;
        default:
          throw new BadRequestException('Unsupported payment method');
      }

      // Update payment record
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: result.status,
          gatewayPaymentId: result.gatewayPaymentId,
          gatewayOrderId: result.gatewayOrderId,
          paymentGateway: this.getPreferredGateway(paymentRequest.method),
        },
      });

      return { ...result, paymentId: payment.id };

    } catch (error) {
      this.logger.error(`Payment processing failed: ${(error as Error).message}`, (error as Error).stack);
      
      // Update payment status to failed
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });

      throw new InternalServerErrorException('Payment processing failed');
    }
  }

  private async processCardPayment(paymentId: string, request: PaymentRequest): Promise<PaymentResult> {
    if (!this.stripe) {
      throw new InternalServerErrorException('Stripe not configured');
    }

    try {
      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Convert to smallest currency unit
        currency: request.currency.toLowerCase(),
        payment_method_types: ['card'],
        metadata: {
          paymentId,
          customerId: request.customerId,
          orderId: request.orderId || '',
          subscriptionId: request.subscriptionId || '',
        },
        description: request.description,
      });

      return {
        paymentId,
        status: PaymentStatus.PENDING,
        gatewayPaymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
      };

    } catch (error) {
      this.logger.error(`Stripe payment failed: ${(error as Error).message}`);
      throw error;
    }
  }

  private async processUPIPayment(paymentId: string, request: PaymentRequest): Promise<PaymentResult> {
    if (!this.razorpay) {
      throw new InternalServerErrorException('Razorpay not configured');
    }

    try {
      // Create Razorpay order
      const order = await this.razorpay.orders.create({
        amount: Math.round(request.amount * 100), // Convert to paise
        currency: request.currency,
        payment_capture: 1,
        notes: {
          paymentId,
          customerId: request.customerId,
          orderId: request.orderId || '',
          subscriptionId: request.subscriptionId || '',
        },
      });

      return {
        paymentId,
        status: PaymentStatus.PENDING,
        gatewayOrderId: order.id,
        paymentUrl: `https://rzp.io/l/${order.id}`,
      };

    } catch (error) {
      this.logger.error(`Razorpay UPI payment failed: ${(error as Error).message}`);
      throw error;
    }
  }

  private async processNetBankingPayment(paymentId: string, request: PaymentRequest): Promise<PaymentResult> {
    if (!this.razorpay) {
      throw new InternalServerErrorException('Razorpay not configured');
    }

    try {
      const order = await this.razorpay.orders.create({
        amount: Math.round(request.amount * 100),
        currency: request.currency,
        method: 'netbanking',
        notes: {
          paymentId,
          customerId: request.customerId,
          orderId: request.orderId || '',
        },
      });

      return {
        paymentId,
        status: PaymentStatus.PENDING,
        gatewayOrderId: order.id,
        paymentUrl: `https://rzp.io/l/${order.id}`,
      };

    } catch (error) {
      this.logger.error(`Net banking payment failed: ${(error as Error).message}`);
      throw error;
    }
  }

  private async processWalletPayment(paymentId: string, request: PaymentRequest): Promise<PaymentResult> {
    // Check wallet balance
    const user = await this.prisma.user.findUnique({
      where: { id: request.customerId },
      include: { profile: true },
    });

    if (!user?.profile) {
      throw new BadRequestException('User profile not found');
    }

    const walletBalance = await this.getWalletBalance(request.customerId);
    
    if (walletBalance < request.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Deduct from wallet
    await this.deductFromWallet(request.customerId, request.amount, paymentId);

    return {
      paymentId,
      status: PaymentStatus.PAID,
    };
  }

  private async processCashPayment(paymentId: string, request: PaymentRequest): Promise<PaymentResult> {
    // For cash payments, mark as pending until confirmed by restaurant
    return {
      paymentId,
      status: PaymentStatus.PENDING,
    };
  }

  async refundPayment(refundRequest: RefundRequest): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: refundRequest.paymentId },
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Can only refund paid payments');
    }

    const refundAmount = refundRequest.amount || payment.amount;

    try {
      if (payment.paymentGateway === 'stripe' && payment.gatewayPaymentId) {
        await this.refundStripePayment(payment.gatewayPaymentId, refundAmount);
      } else if (payment.paymentGateway === 'razorpay' && payment.gatewayPaymentId) {
        await this.refundRazorpayPayment(payment.gatewayPaymentId, refundAmount);
      } else if (payment.method === PaymentMethod.WALLET) {
        await this.refundToWallet(payment, refundAmount);
      }

      // Update payment status
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: refundAmount === payment.amount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        },
      });

      this.logger.log(`Payment ${payment.id} refunded successfully`);

    } catch (error) {
      this.logger.error(`Refund failed for payment ${payment.id}: ${(error as Error).message}`);
      throw new InternalServerErrorException('Refund processing failed');
    }
  }

  async handleWebhook(webhookData: WebhookData): Promise<void> {
    this.logger.log(`Processing ${webhookData.gatewayType} webhook: ${webhookData.eventType}`);

    try {
      // Verify webhook signature
      if (webhookData.gatewayType === 'stripe') {
        this.verifyStripeWebhook(webhookData);
        await this.handleStripeWebhook(webhookData);
      } else if (webhookData.gatewayType === 'razorpay') {
        this.verifyRazorpayWebhook(webhookData);
        await this.handleRazorpayWebhook(webhookData);
      }
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  private verifyStripeWebhook(webhookData: WebhookData): void {
    const endpointSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!endpointSecret || !this.stripe) {
      throw new BadRequestException('Stripe webhook verification failed');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        JSON.stringify(webhookData.data),
        webhookData.signature,
        endpointSecret,
      );
      webhookData.eventType = event.type;
      webhookData.data = event;
    } catch (error) {
      this.logger.error(`Stripe webhook signature verification failed: ${(error as Error).message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  private verifyRazorpayWebhook(webhookData: WebhookData): void {
    const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Razorpay webhook verification failed');
    }

    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(webhookData.data))
        .digest('hex');

      if (expectedSignature !== webhookData.signature) {
        throw new BadRequestException('Invalid webhook signature');
      }

      webhookData.eventType = webhookData.data.event;
    } catch (error) {
      this.logger.error(`Razorpay webhook signature verification failed: ${(error as Error).message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  private async handleStripeWebhook(webhookData: WebhookData): Promise<void> {
    const { eventType, data } = webhookData;

    switch (eventType) {
      case 'payment_intent.succeeded':
        await this.handleStripePaymentSucceeded(data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handleStripePaymentFailed(data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handleStripeSubscriptionPayment(data.object);
        break;
      default:
        this.logger.log(`Unhandled Stripe webhook event: ${eventType}`);
    }
  }

  private async handleRazorpayWebhook(webhookData: WebhookData): Promise<void> {
    const { eventType, data } = webhookData;

    switch (eventType) {
      case 'payment.captured':
        await this.handleRazorpayPaymentCaptured(data.payment.entity);
        break;
      case 'payment.failed':
        await this.handleRazorpayPaymentFailed(data.payment.entity);
        break;
      default:
        this.logger.log(`Unhandled Razorpay webhook event: ${eventType}`);
    }
  }

  private async handleStripePaymentSucceeded(paymentIntent: any): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayPaymentId: paymentIntent.id },
    });

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
        },
      });

      // Update order status if applicable
      if (payment.orderId) {
        await this.updateOrderPaymentStatus(payment.orderId, PaymentStatus.PAID);
      }
    }
  }

  private async handleStripePaymentFailed(paymentIntent: any): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayPaymentId: paymentIntent.id },
    });

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });

      if (payment.orderId) {
        await this.updateOrderPaymentStatus(payment.orderId, PaymentStatus.FAILED);
      }
    }
  }

  private async handleRazorpayPaymentCaptured(payment: any): Promise<void> {
    const dbPayment = await this.prisma.payment.findFirst({
      where: { gatewayPaymentId: payment.id },
    });

    if (dbPayment) {
      await this.prisma.payment.update({
        where: { id: dbPayment.id },
        data: {
          status: PaymentStatus.PAID,
        },
      });

      if (dbPayment.orderId) {
        await this.updateOrderPaymentStatus(dbPayment.orderId, PaymentStatus.PAID);
      }
    }
  }

  private async refundStripePayment(paymentIntentId: string, amount: number): Promise<void> {
    await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100),
    });
  }

  private async refundRazorpayPayment(paymentId: string, amount: number): Promise<void> {
    await this.razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100),
    });
  }

  private async refundToWallet(payment: any, amount: number): Promise<void> {
    // Find the customer from order or subscription
    let customerId: string | undefined;
    
    if (payment.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: payment.orderId },
        select: { customerId: true },
      });
      customerId = order?.customerId;
    } else if (payment.subscriptionId) {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: payment.subscriptionId },
        include: { restaurant: { select: { userId: true } } },
      });
      customerId = subscription?.restaurant.userId;
    }

    if (customerId) {
      await this.addToWallet(customerId, amount, payment.id);
    }
  }

  async getWalletBalance(userId: string): Promise<number> {
    const transactions = await this.prisma.transaction.findMany({
      where: { 
        OR: [
          { orderId: { contains: userId } }, // For customer transactions
          { restaurantId: { contains: userId } }, // For restaurant transactions
          { vendorId: { contains: userId } }, // For vendor transactions
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    return transactions.length > 0 ? transactions[0].balance : 0;
  }

  private async deductFromWallet(userId: string, amount: number, paymentId: string): Promise<void> {
    const currentBalance = await this.getWalletBalance(userId);
    const newBalance = currentBalance - amount;

    if (newBalance < 0) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    await this.prisma.transaction.create({
      data: {
        orderId: paymentId,
        type: 'debit',
        amount: amount,
        balance: newBalance,
        description: `Payment deduction for order ${paymentId}`,
        referenceNumber: `WALLET_DEBIT_${Date.now()}`,
      },
    });

    this.logger.log(`Wallet deduction completed: User ${userId}, Amount: ${amount}, New Balance: ${newBalance}`);
  }

  private async addToWallet(userId: string, amount: number, paymentId: string): Promise<void> {
    const currentBalance = await this.getWalletBalance(userId);
    const newBalance = currentBalance + amount;

    await this.prisma.transaction.create({
      data: {
        orderId: paymentId,
        type: 'credit',
        amount: amount,
        balance: newBalance,
        description: `Refund credit for payment ${paymentId}`,
        referenceNumber: `WALLET_CREDIT_${Date.now()}`,
      },
    });

    this.logger.log(`Wallet credit completed: User ${userId}, Amount: ${amount}, New Balance: ${newBalance}`);
  }

  private async updateOrderPaymentStatus(orderId: string, status: PaymentStatus): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: status },
    });
  }

  private getPreferredGateway(method: PaymentMethodType): string {
    switch (method) {
      case PaymentMethod.CARD:
        return this.stripe ? 'stripe' : 'razorpay';
      case PaymentMethod.UPI:
      case PaymentMethod.RAZORPAY:
        return 'razorpay';
      case PaymentMethod.WALLET:
      case PaymentMethod.CASH:
        return 'internal';
      default:
        return 'razorpay';
    }
  }

  async getPaymentMethods(userId: string): Promise<any[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const methods = [];

    // Card payments
    if (this.stripe || this.razorpay) {
      methods.push({
        id: 'card',
        type: 'card',
        name: 'Credit/Debit Card',
        description: 'Visa, Mastercard, RuPay, American Express',
        enabled: true,
        processingTime: 'Instant',
        fees: { percentage: 1.8, description: '1.8% + GST' },
      });
    }

    // UPI
    if (this.razorpay) {
      methods.push({
        id: 'upi',
        type: 'upi',
        name: 'UPI',
        description: 'PhonePe, Google Pay, Paytm, BHIM UPI',
        enabled: true,
        processingTime: 'Instant',
        fees: { percentage: 0, description: 'No additional charges' },
      });
    }

    // Net Banking
    if (this.razorpay) {
      methods.push({
        id: 'netbanking',
        type: 'netbanking',
        name: 'Net Banking',
        description: 'All major banks supported',
        enabled: true,
        processingTime: 'Instant',
        fees: { percentage: 0.9, description: '0.9% + GST' },
      });
    }

    // Wallet
    if (user?.profile) {
      const walletBalance = await this.getWalletBalance(userId);
      methods.push({
        id: 'wallet',
        type: 'wallet',
        name: 'RestaurantHub Wallet',
        description: `Available balance: ₹${walletBalance}`,
        enabled: walletBalance > 0,
        processingTime: 'Instant',
        fees: { percentage: 0, description: 'No charges' },
        balance: walletBalance,
      });
    }

    // Cash (for dine-in orders)
    methods.push({
      id: 'cash',
      type: 'cash',
      name: 'Cash',
      description: 'Pay with cash at the restaurant',
      enabled: true,
      processingTime: 'At restaurant',
      fees: { percentage: 0, description: 'No charges' },
    });

    return methods;
  }

  private async handleStripeSubscriptionPayment(invoice: any): Promise<void> {
    // Handle subscription payment success
    const subscription = await this.prisma.subscription.findFirst({
      where: { 
        // Add appropriate filtering based on Stripe subscription ID
      },
    });

    if (subscription) {
      // Update subscription status and next billing date
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          isActive: true,
          endDate: new Date(invoice.lines.data[0].period.end * 1000),
        },
      });
    }
  }

  private async handleRazorpayPaymentFailed(payment: any): Promise<void> {
    const dbPayment = await this.prisma.payment.findFirst({
      where: { gatewayPaymentId: payment.id },
    });

    if (dbPayment) {
      await this.prisma.payment.update({
        where: { id: dbPayment.id },
        data: { status: PaymentStatus.FAILED },
      });

      if (dbPayment.orderId) {
        await this.updateOrderPaymentStatus(dbPayment.orderId, PaymentStatus.FAILED);
      }
    }
  }

  async getPaymentHistory(userId: string, page: number = 1, limit: number = 10, status?: string): Promise<any> {
    const skip = (page - 1) * limit;
    
    const whereClause: any = {
      OR: [
        { orderId: { contains: userId } },
        { metadata: { path: ['customerId'], equals: userId } },
      ],
    };

    if (status) {
      whereClause.status = status;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where: whereClause }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPaymentDetails(paymentId: string, userId: string): Promise<any> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    // Check if user has access to this payment
    const hasAccess = (payment.metadata as any)?.customerId === userId;

    if (!hasAccess) {
      throw new BadRequestException('Access denied');
    }

    // Get order details separately if needed
    let orderDetails = null;
    if (payment.orderId) {
      orderDetails = await this.prisma.order.findUnique({
        where: { id: payment.orderId },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
        },
      });
    }

    return {
      ...payment,
      order: orderDetails,
    };
  }

  async addMoneyToWallet(userId: string, amount: number, paymentMethod: string): Promise<PaymentResult> {
    const paymentRequest: PaymentRequest = {
      amount,
      currency: 'INR',
      method: paymentMethod as PaymentMethodType,
      customerId: userId,
      description: 'Add money to wallet',
      metadata: { type: 'wallet_topup' },
    };

    return this.processPayment(paymentRequest);
  }

  async getWalletTransactions(userId: string, page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          OR: [
            { orderId: { contains: userId } },
            { restaurantId: { contains: userId } },
            { vendorId: { contains: userId } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({
        where: {
          OR: [
            { orderId: { contains: userId } },
            { restaurantId: { contains: userId } },
            { vendorId: { contains: userId } },
          ],
        },
      }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPaymentDashboard(startDate?: Date, endDate?: Date): Promise<any> {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    const [
      totalPayments,
      successfulPayments,
      failedPayments,
      totalAmount,
      averageAmount,
      paymentsByGateway,
      paymentsByMethod,
      recentPayments,
    ] = await Promise.all([
      this.prisma.payment.count({ where: dateFilter }),
      this.prisma.payment.count({ where: { ...dateFilter, status: PaymentStatus.PAID } }),
      this.prisma.payment.count({ where: { ...dateFilter, status: PaymentStatus.FAILED } }),
      this.prisma.payment.aggregate({
        where: { ...dateFilter, status: PaymentStatus.PAID },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { ...dateFilter, status: PaymentStatus.PAID },
        _avg: { amount: true },
      }),
      this.prisma.payment.groupBy({
        by: ['paymentGateway'],
        where: { ...dateFilter, status: PaymentStatus.PAID },
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where: { ...dateFilter, status: PaymentStatus.PAID },
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.payment.findMany({
        where: dateFilter,
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      overview: {
        totalPayments,
        successfulPayments,
        failedPayments,
        successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
        totalAmount: totalAmount._sum.amount || 0,
        averageAmount: averageAmount._avg.amount || 0,
      },
      breakdown: {
        byGateway: paymentsByGateway,
        byMethod: paymentsByMethod,
      },
      recentPayments,
    };
  }

  async getAllTransactions(page: number = 1, limit: number = 20, filters: { status?: string; gateway?: string } = {}): Promise<any> {
    const skip = (page - 1) * limit;
    
    const whereClause: any = {};
    if (filters.status) whereClause.status = filters.status;
    if (filters.gateway) whereClause.paymentGateway = filters.gateway;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where: whereClause }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}