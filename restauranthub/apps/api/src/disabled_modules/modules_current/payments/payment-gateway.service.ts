import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '@prisma/client';
import * as crypto from 'crypto';

export interface GatewayPaymentResponse {
  success: boolean;
  paymentId?: string;
  gatewayPaymentId?: string;
  status: string;
  amount: number;
  currency: string;
  gatewayResponse?: any;
  error?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  gatewayRefundId?: string;
  amount: number;
  status: string;
  gatewayResponse?: any;
  error?: string;
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  constructor(private configService: ConfigService) {}

  async createPayment(
    amount: number,
    currency: string = 'INR',
    method: PaymentMethod,
    orderId?: string,
    customerEmail?: string,
    customerPhone?: string,
    metadata?: any
  ): Promise<GatewayPaymentResponse> {
    try {
      switch (method) {
        case PaymentMethod.RAZORPAY:
          return this.createRazorpayPayment(amount, currency, orderId, customerEmail, customerPhone, metadata);
        case PaymentMethod.STRIPE:
          return this.createStripePayment(amount, currency, orderId, customerEmail, metadata);
        case PaymentMethod.UPI:
          return this.createUPIPayment(amount, currency, orderId, metadata);
        case PaymentMethod.CASH:
          return this.createCashPayment(amount, currency, orderId);
        case PaymentMethod.CARD:
          return this.createCardPayment(amount, currency, orderId, metadata);
        default:
          throw new BadRequestException(`Payment method ${method} not supported`);
      }
    } catch (error) {
      this.logger.error('Payment creation failed:', error);
      return {
        success: false,
        status: 'failed',
        amount,
        currency,
        error: error.message
      };
    }
  }

  async verifyPayment(
    method: PaymentMethod,
    paymentId: string,
    gatewayPaymentId: string,
    signature?: string,
    gatewayResponse?: any
  ): Promise<GatewayPaymentResponse> {
    try {
      switch (method) {
        case PaymentMethod.RAZORPAY:
          return this.verifyRazorpayPayment(paymentId, gatewayPaymentId, signature);
        case PaymentMethod.STRIPE:
          return this.verifyStripePayment(gatewayPaymentId, gatewayResponse);
        case PaymentMethod.UPI:
          return this.verifyUPIPayment(gatewayPaymentId, gatewayResponse);
        case PaymentMethod.CASH:
          return this.verifyCashPayment(paymentId, gatewayResponse);
        case PaymentMethod.CARD:
          return this.verifyCardPayment(gatewayPaymentId, gatewayResponse);
        default:
          throw new BadRequestException(`Payment verification for ${method} not supported`);
      }
    } catch (error) {
      this.logger.error('Payment verification failed:', error);
      return {
        success: false,
        status: 'failed',
        amount: 0,
        currency: 'INR',
        error: error.message
      };
    }
  }

  async processRefund(
    method: PaymentMethod,
    gatewayPaymentId: string,
    amount: number,
    reason: string
  ): Promise<RefundResponse> {
    try {
      switch (method) {
        case PaymentMethod.RAZORPAY:
          return this.processRazorpayRefund(gatewayPaymentId, amount, reason);
        case PaymentMethod.STRIPE:
          return this.processStripeRefund(gatewayPaymentId, amount, reason);
        case PaymentMethod.UPI:
          return this.processUPIRefund(gatewayPaymentId, amount, reason);
        case PaymentMethod.CASH:
          return this.processCashRefund(gatewayPaymentId, amount, reason);
        default:
          throw new BadRequestException(`Refund for ${method} not supported`);
      }
    } catch (error) {
      this.logger.error('Refund processing failed:', error);
      return {
        success: false,
        amount,
        status: 'failed',
        error: error.message
      };
    }
  }

  // Razorpay Implementation
  private async createRazorpayPayment(
    amount: number,
    currency: string,
    orderId?: string,
    customerEmail?: string,
    customerPhone?: string,
    metadata?: any
  ): Promise<GatewayPaymentResponse> {
    try {
      const razorpayKeyId = this.configService.get('RAZORPAY_KEY_ID');
      const razorpayKeySecret = this.configService.get('RAZORPAY_KEY_SECRET');

      if (!razorpayKeyId || !razorpayKeySecret) {
        throw new Error('Razorpay credentials not configured');
      }

      // Mock Razorpay order creation
      const razorpayOrder = {
        id: `order_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt: orderId || `receipt_${Date.now()}`,
        status: 'created'
      };

      this.logger.log(`Razorpay order created: ${razorpayOrder.id}`);

      return {
        success: true,
        paymentId: razorpayOrder.id,
        gatewayPaymentId: razorpayOrder.id,
        status: 'created',
        amount,
        currency,
        gatewayResponse: razorpayOrder
      };
    } catch (error) {
      throw new BadRequestException(`Razorpay payment creation failed: ${error.message}`);
    }
  }

  private async verifyRazorpayPayment(
    paymentId: string,
    gatewayPaymentId: string,
    signature: string
  ): Promise<GatewayPaymentResponse> {
    try {
      const razorpayKeySecret = this.configService.get('RAZORPAY_KEY_SECRET');

      // Verify signature
      const body = paymentId + '|' + gatewayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body)
        .digest('hex');

      const isSignatureValid = expectedSignature === signature;

      if (!isSignatureValid) {
        throw new Error('Invalid payment signature');
      }

      // Mock payment verification
      const paymentDetails = {
        id: gatewayPaymentId,
        status: 'captured',
        amount: 100000, // This would come from actual Razorpay API
        currency: 'INR'
      };

      return {
        success: true,
        paymentId,
        gatewayPaymentId,
        status: 'completed',
        amount: paymentDetails.amount / 100,
        currency: paymentDetails.currency,
        gatewayResponse: paymentDetails
      };
    } catch (error) {
      throw new BadRequestException(`Razorpay payment verification failed: ${error.message}`);
    }
  }

  private async processRazorpayRefund(
    gatewayPaymentId: string,
    amount: number,
    reason: string
  ): Promise<RefundResponse> {
    try {
      // Mock Razorpay refund
      const refund = {
        id: `rfnd_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        payment_id: gatewayPaymentId,
        amount: amount * 100,
        currency: 'INR',
        status: 'processed',
        receipt: `refund_${Date.now()}`
      };

      this.logger.log(`Razorpay refund processed: ${refund.id}`);

      return {
        success: true,
        refundId: refund.id,
        gatewayRefundId: refund.id,
        amount,
        status: 'processed',
        gatewayResponse: refund
      };
    } catch (error) {
      throw new BadRequestException(`Razorpay refund failed: ${error.message}`);
    }
  }

  // Stripe Implementation
  private async createStripePayment(
    amount: number,
    currency: string,
    orderId?: string,
    customerEmail?: string,
    metadata?: any
  ): Promise<GatewayPaymentResponse> {
    try {
      // Mock Stripe payment intent creation
      const paymentIntent = {
        id: `pi_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        amount: amount * 100, // Stripe expects amount in cents
        currency: currency.toLowerCase(),
        status: 'requires_payment_method',
        client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
      };

      this.logger.log(`Stripe payment intent created: ${paymentIntent.id}`);

      return {
        success: true,
        paymentId: paymentIntent.id,
        gatewayPaymentId: paymentIntent.id,
        status: 'requires_payment_method',
        amount,
        currency,
        gatewayResponse: paymentIntent
      };
    } catch (error) {
      throw new BadRequestException(`Stripe payment creation failed: ${error.message}`);
    }
  }

  private async verifyStripePayment(
    gatewayPaymentId: string,
    gatewayResponse: any
  ): Promise<GatewayPaymentResponse> {
    try {
      // Mock Stripe payment verification
      const paymentIntent = {
        id: gatewayPaymentId,
        status: 'succeeded',
        amount: gatewayResponse?.amount || 100000,
        currency: gatewayResponse?.currency || 'inr'
      };

      return {
        success: true,
        gatewayPaymentId,
        status: 'completed',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        gatewayResponse: paymentIntent
      };
    } catch (error) {
      throw new BadRequestException(`Stripe payment verification failed: ${error.message}`);
    }
  }

  private async processStripeRefund(
    gatewayPaymentId: string,
    amount: number,
    reason: string
  ): Promise<RefundResponse> {
    try {
      // Mock Stripe refund
      const refund = {
        id: `re_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        payment_intent: gatewayPaymentId,
        amount: amount * 100,
        currency: 'inr',
        status: 'succeeded',
        reason: 'requested_by_customer'
      };

      this.logger.log(`Stripe refund processed: ${refund.id}`);

      return {
        success: true,
        refundId: refund.id,
        gatewayRefundId: refund.id,
        amount,
        status: 'processed',
        gatewayResponse: refund
      };
    } catch (error) {
      throw new BadRequestException(`Stripe refund failed: ${error.message}`);
    }
  }

  // UPI Implementation
  private async createUPIPayment(
    amount: number,
    currency: string,
    orderId?: string,
    metadata?: any
  ): Promise<GatewayPaymentResponse> {
    try {
      // Mock UPI payment creation
      const upiPayment = {
        id: `upi_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        amount,
        currency,
        vpa: 'merchant@upi',
        qr_code: `upi://pay?pa=merchant@upi&pn=Restaurant&am=${amount}&cu=${currency}&tn=${orderId}`,
        status: 'created'
      };

      this.logger.log(`UPI payment created: ${upiPayment.id}`);

      return {
        success: true,
        paymentId: upiPayment.id,
        gatewayPaymentId: upiPayment.id,
        status: 'created',
        amount,
        currency,
        gatewayResponse: upiPayment
      };
    } catch (error) {
      throw new BadRequestException(`UPI payment creation failed: ${error.message}`);
    }
  }

  private async verifyUPIPayment(
    gatewayPaymentId: string,
    gatewayResponse: any
  ): Promise<GatewayPaymentResponse> {
    try {
      // Mock UPI payment verification
      return {
        success: true,
        gatewayPaymentId,
        status: 'completed',
        amount: gatewayResponse?.amount || 0,
        currency: gatewayResponse?.currency || 'INR',
        gatewayResponse
      };
    } catch (error) {
      throw new BadRequestException(`UPI payment verification failed: ${error.message}`);
    }
  }

  private async processUPIRefund(
    gatewayPaymentId: string,
    amount: number,
    reason: string
  ): Promise<RefundResponse> {
    try {
      // Mock UPI refund
      const refund = {
        id: `upi_rfnd_${Date.now()}`,
        payment_id: gatewayPaymentId,
        amount,
        status: 'processed'
      };

      return {
        success: true,
        refundId: refund.id,
        gatewayRefundId: refund.id,
        amount,
        status: 'processed',
        gatewayResponse: refund
      };
    } catch (error) {
      throw new BadRequestException(`UPI refund failed: ${error.message}`);
    }
  }

  // Cash Payment Implementation
  private async createCashPayment(
    amount: number,
    currency: string,
    orderId?: string
  ): Promise<GatewayPaymentResponse> {
    const cashPayment = {
      id: `cash_${Date.now()}`,
      amount,
      currency,
      order_id: orderId,
      status: 'pending'
    };

    return {
      success: true,
      paymentId: cashPayment.id,
      gatewayPaymentId: cashPayment.id,
      status: 'pending',
      amount,
      currency,
      gatewayResponse: cashPayment
    };
  }

  private async verifyCashPayment(
    paymentId: string,
    gatewayResponse: any
  ): Promise<GatewayPaymentResponse> {
    return {
      success: true,
      paymentId,
      gatewayPaymentId: paymentId,
      status: 'completed',
      amount: gatewayResponse?.amount || 0,
      currency: gatewayResponse?.currency || 'INR',
      gatewayResponse
    };
  }

  private async processCashRefund(
    gatewayPaymentId: string,
    amount: number,
    reason: string
  ): Promise<RefundResponse> {
    const refund = {
      id: `cash_rfnd_${Date.now()}`,
      payment_id: gatewayPaymentId,
      amount,
      status: 'manual_refund_required'
    };

    return {
      success: true,
      refundId: refund.id,
      gatewayRefundId: refund.id,
      amount,
      status: 'manual_refund_required',
      gatewayResponse: refund
    };
  }

  // Card Payment Implementation
  private async createCardPayment(
    amount: number,
    currency: string,
    orderId?: string,
    metadata?: any
  ): Promise<GatewayPaymentResponse> {
    try {
      // Mock card payment creation (similar to Stripe)
      const cardPayment = {
        id: `card_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        amount: amount * 100,
        currency: currency.toLowerCase(),
        status: 'requires_payment_method'
      };

      return {
        success: true,
        paymentId: cardPayment.id,
        gatewayPaymentId: cardPayment.id,
        status: 'requires_payment_method',
        amount,
        currency,
        gatewayResponse: cardPayment
      };
    } catch (error) {
      throw new BadRequestException(`Card payment creation failed: ${error.message}`);
    }
  }

  private async verifyCardPayment(
    gatewayPaymentId: string,
    gatewayResponse: any
  ): Promise<GatewayPaymentResponse> {
    try {
      return {
        success: true,
        gatewayPaymentId,
        status: 'completed',
        amount: gatewayResponse?.amount / 100 || 0,
        currency: gatewayResponse?.currency?.toUpperCase() || 'INR',
        gatewayResponse
      };
    } catch (error) {
      throw new BadRequestException(`Card payment verification failed: ${error.message}`);
    }
  }
}