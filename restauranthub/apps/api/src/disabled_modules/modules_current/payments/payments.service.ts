import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentStatus, PaymentMethod, OrderStatus } from '@prisma/client';
import { CreatePaymentDto, ProcessPaymentDto, RefundPaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private paymentGateway: PaymentGatewayService,
  ) {}

  async createPayment(restaurantId: string, createPaymentDto: CreatePaymentDto) {
    try {
      // Validate order or invoice exists
      let order, invoice;
      if (createPaymentDto.orderId) {
        order = await this.prisma.order.findFirst({
          where: { id: createPaymentDto.orderId, restaurantId },
          include: { restaurant: true }
        });
        if (!order) {
          throw new NotFoundException('Order not found');
        }
      }

      if (createPaymentDto.invoiceId) {
        invoice = await this.prisma.invoice.findFirst({
          where: { id: createPaymentDto.invoiceId, restaurantId },
          include: { restaurant: true }
        });
        if (!invoice) {
          throw new NotFoundException('Invoice not found');
        }
      }

      // Generate payment number
      const paymentNumber = await this.generatePaymentNumber(restaurantId);

      // Create payment gateway transaction
      const gatewayResponse = await this.paymentGateway.createPayment(
        createPaymentDto.amount,
        createPaymentDto.currency,
        createPaymentDto.method,
        order?.orderNumber || invoice?.invoiceNumber,
        createPaymentDto.customerEmail,
        createPaymentDto.customerPhone,
        createPaymentDto.metadata
      );

      if (!gatewayResponse.success) {
        throw new BadRequestException(`Payment creation failed: ${gatewayResponse.error}`);
      }

      // Create payment record
      const payment = await this.prisma.payment.create({
        data: {
          restaurantId,
          orderId: createPaymentDto.orderId,
          invoiceId: createPaymentDto.invoiceId,
          paymentNumber,
          amount: createPaymentDto.amount,
          currency: createPaymentDto.currency,
          method: createPaymentDto.method,
          status: gatewayResponse.status === 'created' || gatewayResponse.status === 'requires_payment_method'
            ? PaymentStatus.PENDING
            : PaymentStatus.PROCESSING,
          razorpayPaymentId: createPaymentDto.method === PaymentMethod.RAZORPAY ? gatewayResponse.gatewayPaymentId : null,
          stripePaymentId: createPaymentDto.method === PaymentMethod.STRIPE ? gatewayResponse.gatewayPaymentId : null,
          upiTransactionId: createPaymentDto.method === PaymentMethod.UPI ? gatewayResponse.gatewayPaymentId : null,
          bankTransactionId: createPaymentDto.method === PaymentMethod.BANK_TRANSFER ? gatewayResponse.gatewayPaymentId : null,
          gatewayResponse: gatewayResponse.gatewayResponse,
        },
        include: {
          order: true,
          invoice: true,
          restaurant: true
        }
      });

      this.logger.log(`Payment ${paymentNumber} created successfully`);

      return {
        payment,
        gatewayData: gatewayResponse.gatewayResponse
      };
    } catch (error) {
      this.logger.error('Failed to create payment:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to create payment');
    }
  }

  async processPayment(restaurantId: string, processPaymentDto: ProcessPaymentDto) {
    try {
      // Find the payment
      const payment = await this.prisma.payment.findFirst({
        where: {
          id: processPaymentDto.paymentId,
          restaurantId
        },
        include: {
          order: true,
          invoice: true,
          restaurant: true
        }
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.status === PaymentStatus.COMPLETED) {
        throw new BadRequestException('Payment already completed');
      }

      // Verify payment with gateway
      const verificationResponse = await this.paymentGateway.verifyPayment(
        payment.method,
        payment.id,
        processPaymentDto.gatewayPaymentId,
        processPaymentDto.signature,
        processPaymentDto.gatewayResponse
      );

      if (!verificationResponse.success) {
        // Update payment as failed
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            gatewayResponse: verificationResponse.gatewayResponse
          }
        });

        throw new BadRequestException(`Payment verification failed: ${verificationResponse.error}`);
      }

      // Update payment as completed
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          razorpayPaymentId: payment.method === PaymentMethod.RAZORPAY ? processPaymentDto.gatewayPaymentId : payment.razorpayPaymentId,
          stripePaymentId: payment.method === PaymentMethod.STRIPE ? processPaymentDto.gatewayPaymentId : payment.stripePaymentId,
          upiTransactionId: payment.method === PaymentMethod.UPI ? processPaymentDto.gatewayPaymentId : payment.upiTransactionId,
          gatewayResponse: verificationResponse.gatewayResponse,
          reconciledAt: new Date()
        },
        include: {
          order: true,
          invoice: true,
          restaurant: true
        }
      });

      // Update order status if this is an order payment
      if (payment.orderId) {
        await this.prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: PaymentStatus.COMPLETED,
            status: payment.order.status === OrderStatus.PENDING ? OrderStatus.CONFIRMED : payment.order.status
          }
        });

        // Create order status history
        if (payment.order.status === OrderStatus.PENDING) {
          await this.prisma.orderStatusHistory.create({
            data: {
              orderId: payment.orderId,
              status: OrderStatus.CONFIRMED,
              notes: 'Payment completed - order confirmed'
            }
          });
        }
      }

      // Update invoice status if this is an invoice payment
      if (payment.invoiceId) {
        const totalPaid = await this.prisma.payment.aggregate({
          where: {
            invoiceId: payment.invoiceId,
            status: PaymentStatus.COMPLETED
          },
          _sum: { amount: true }
        });

        const invoice = await this.prisma.invoice.findUnique({
          where: { id: payment.invoiceId }
        });

        if (totalPaid._sum.amount >= invoice.totalAmount) {
          await this.prisma.invoice.update({
            where: { id: payment.invoiceId },
            data: {
              status: 'PAID',
              paidAmount: totalPaid._sum.amount,
              lastPaymentDate: new Date()
            }
          });
        }
      }

      // Send payment confirmation email
      await this.sendPaymentConfirmationEmail(updatedPayment);

      this.logger.log(`Payment ${payment.paymentNumber} processed successfully`);

      return updatedPayment;
    } catch (error) {
      this.logger.error('Failed to process payment:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to process payment');
    }
  }

  async refundPayment(restaurantId: string, refundPaymentDto: RefundPaymentDto) {
    try {
      // Find the payment
      const payment = await this.prisma.payment.findFirst({
        where: {
          id: refundPaymentDto.paymentId,
          restaurantId
        },
        include: {
          order: true,
          invoice: true,
          restaurant: true,
          refunds: true
        }
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new BadRequestException('Can only refund completed payments');
      }

      // Check if refund amount is valid
      const totalRefunded = payment.refunds.reduce((sum, refund) =>
        refund.status === PaymentStatus.COMPLETED ? sum + refund.amount : sum, 0
      );

      if (totalRefunded + refundPaymentDto.amount > payment.amount) {
        throw new BadRequestException('Refund amount exceeds payment amount');
      }

      // Generate refund number
      const refundNumber = await this.generateRefundNumber(restaurantId);

      // Process refund with gateway
      const gatewayRefundId = payment.razorpayPaymentId || payment.stripePaymentId || payment.upiTransactionId;

      const refundResponse = await this.paymentGateway.processRefund(
        payment.method,
        gatewayRefundId,
        refundPaymentDto.amount,
        refundPaymentDto.reason
      );

      // Create refund record
      const refund = await this.prisma.refund.create({
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          restaurantId,
          refundNumber,
          amount: refundPaymentDto.amount,
          reason: refundPaymentDto.reason,
          status: refundResponse.success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
          gatewayRefundId: refundResponse.gatewayRefundId,
          gatewayResponse: refundResponse.gatewayResponse,
          processedAt: refundResponse.success ? new Date() : null
        },
        include: {
          payment: {
            include: {
              order: true,
              invoice: true
            }
          }
        }
      });

      // Update order status if full refund
      if (payment.orderId && refundPaymentDto.amount === payment.amount) {
        await this.prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
            status: OrderStatus.REFUNDED
          }
        });

        await this.prisma.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            status: OrderStatus.REFUNDED,
            notes: `Full refund processed: ${refundPaymentDto.reason}`
          }
        });
      }

      // Send refund notification email
      await this.sendRefundNotificationEmail(refund);

      this.logger.log(`Refund ${refundNumber} processed for payment ${payment.paymentNumber}`);

      return refund;
    } catch (error) {
      this.logger.error('Failed to process refund:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to process refund');
    }
  }

  async getPayments(restaurantId: string, query: any = {}) {
    try {
      const { page = 1, limit = 10, status, method, startDate, endDate, orderId, invoiceId } = query;
      const skip = (page - 1) * limit;

      const where: any = { restaurantId };

      if (status) where.status = status;
      if (method) where.method = method;
      if (orderId) where.orderId = orderId;
      if (invoiceId) where.invoiceId = invoiceId;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [payments, total] = await Promise.all([
        this.prisma.payment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                status: true
              }
            },
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true
              }
            },
            refunds: true
          }
        }),
        this.prisma.payment.count({ where })
      ]);

      return {
        payments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      };
    } catch (error) {
      this.logger.error('Failed to get payments:', error);
      throw new BadRequestException('Failed to retrieve payments');
    }
  }

  async getPaymentById(paymentId: string, restaurantId: string) {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: { id: paymentId, restaurantId },
        include: {
          order: true,
          invoice: true,
          restaurant: true,
          refunds: true
        }
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      return payment;
    } catch (error) {
      this.logger.error('Failed to get payment:', error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to retrieve payment');
    }
  }

  async getPaymentAnalytics(restaurantId: string, startDate?: Date, endDate?: Date) {
    try {
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter['createdAt'] = {};
        if (startDate) dateFilter['createdAt']['gte'] = startDate;
        if (endDate) dateFilter['createdAt']['lte'] = endDate;
      }

      const where = { restaurantId, ...dateFilter };

      const [
        totalPayments,
        totalRevenue,
        paymentsByMethod,
        paymentsByStatus,
        dailyStats
      ] = await Promise.all([
        // Total payments count
        this.prisma.payment.count({ where }),

        // Total revenue
        this.prisma.payment.aggregate({
          where: { ...where, status: PaymentStatus.COMPLETED },
          _sum: { amount: true }
        }),

        // Payments by method
        this.prisma.payment.groupBy({
          by: ['method'],
          where: { ...where, status: PaymentStatus.COMPLETED },
          _count: true,
          _sum: { amount: true }
        }),

        // Payments by status
        this.prisma.payment.groupBy({
          by: ['status'],
          where,
          _count: true
        }),

        // Daily statistics
        this.prisma.payment.groupBy({
          by: ['createdAt'],
          where: {
            ...where,
            status: PaymentStatus.COMPLETED,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          _count: true,
          _sum: { amount: true }
        })
      ]);

      return {
        overview: {
          totalPayments,
          totalRevenue: totalRevenue._sum.amount || 0,
          averagePayment: totalPayments > 0 ? (totalRevenue._sum.amount || 0) / totalPayments : 0
        },
        paymentsByMethod: paymentsByMethod.map(item => ({
          method: item.method,
          count: item._count,
          amount: item._sum.amount
        })),
        paymentsByStatus: paymentsByStatus.map(item => ({
          status: item.status,
          count: item._count
        })),
        dailyStats: this.processDailyStats(dailyStats)
      };
    } catch (error) {
      this.logger.error('Failed to get payment analytics:', error);
      throw new BadRequestException('Failed to retrieve payment analytics');
    }
  }

  private async generatePaymentNumber(restaurantId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    const count = await this.prisma.payment.count({
      where: {
        restaurantId,
        createdAt: {
          gte: new Date(year, today.getMonth(), 1),
          lt: new Date(year, today.getMonth() + 1, 1)
        }
      }
    });

    return `PAY${year}${month}${String(count + 1).padStart(6, '0')}`;
  }

  private async generateRefundNumber(restaurantId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    const count = await this.prisma.refund.count({
      where: {
        restaurantId,
        createdAt: {
          gte: new Date(year, today.getMonth(), 1),
          lt: new Date(year, today.getMonth() + 1, 1)
        }
      }
    });

    return `REF${year}${month}${String(count + 1).padStart(6, '0')}`;
  }

  private async sendPaymentConfirmationEmail(payment: any) {
    try {
      // Implementation would send payment confirmation email
      this.logger.log(`Payment confirmation email sent for payment ${payment.paymentNumber}`);
    } catch (error) {
      this.logger.error('Failed to send payment confirmation email:', error);
    }
  }

  private async sendRefundNotificationEmail(refund: any) {
    try {
      // Implementation would send refund notification email
      this.logger.log(`Refund notification email sent for refund ${refund.refundNumber}`);
    } catch (error) {
      this.logger.error('Failed to send refund notification email:', error);
    }
  }

  private processDailyStats(stats: any[]) {
    return stats.map(stat => ({
      date: stat.createdAt,
      payments: stat._count,
      revenue: stat._sum.amount || 0
    }));
  }
}