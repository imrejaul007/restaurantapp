"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = exports.PaymentMethod = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const stripe_1 = __importDefault(require("stripe"));
const razorpay_1 = __importDefault(require("razorpay"));
const uuid_1 = require("uuid");
exports.PaymentMethod = {
    CASH: 'CASH',
    CARD: 'CARD',
    UPI: 'UPI',
    WALLET: 'WALLET',
    RAZORPAY: 'RAZORPAY',
};
let PaymentService = PaymentService_1 = class PaymentService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(PaymentService_1.name);
        const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
        if (stripeKey) {
            this.stripe = new stripe_1.default(stripeKey, {
                apiVersion: '2023-08-16',
            });
        }
        const razorpayKeyId = this.configService.get('RAZORPAY_KEY_ID');
        const razorpayKeySecret = this.configService.get('RAZORPAY_KEY_SECRET');
        if (razorpayKeyId && razorpayKeySecret) {
            this.razorpay = new razorpay_1.default({
                key_id: razorpayKeyId,
                key_secret: razorpayKeySecret,
            });
        }
    }
    async processPayment(paymentRequest) {
        this.logger.log(`Processing payment: ${JSON.stringify(paymentRequest)}`);
        const payment = await this.prisma.payment.create({
            data: {
                amount: paymentRequest.amount,
                currency: paymentRequest.currency,
                method: paymentRequest.method,
                status: client_1.PaymentStatus.PENDING,
                orderId: paymentRequest.orderId || (0, uuid_1.v4)(),
                paymentGateway: 'pending',
                metadata: paymentRequest.metadata || {},
            },
        });
        try {
            let result;
            switch (paymentRequest.method) {
                case exports.PaymentMethod.CARD:
                    result = await this.processCardPayment(payment.id, paymentRequest);
                    break;
                case exports.PaymentMethod.UPI:
                    result = await this.processUPIPayment(payment.id, paymentRequest);
                    break;
                case exports.PaymentMethod.RAZORPAY:
                    result = await this.processNetBankingPayment(payment.id, paymentRequest);
                    break;
                case exports.PaymentMethod.WALLET:
                    result = await this.processWalletPayment(payment.id, paymentRequest);
                    break;
                case exports.PaymentMethod.CASH:
                    result = await this.processCashPayment(payment.id, paymentRequest);
                    break;
                default:
                    throw new common_1.BadRequestException('Unsupported payment method');
            }
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
        }
        catch (error) {
            this.logger.error(`Payment processing failed: ${error.message}`, error.stack);
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: { status: client_1.PaymentStatus.FAILED },
            });
            throw new common_1.InternalServerErrorException('Payment processing failed');
        }
    }
    async processCardPayment(paymentId, request) {
        if (!this.stripe) {
            throw new common_1.InternalServerErrorException('Stripe not configured');
        }
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(request.amount * 100),
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
                status: client_1.PaymentStatus.PENDING,
                gatewayPaymentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret || undefined,
            };
        }
        catch (error) {
            this.logger.error(`Stripe payment failed: ${error.message}`);
            throw error;
        }
    }
    async processUPIPayment(paymentId, request) {
        if (!this.razorpay) {
            throw new common_1.InternalServerErrorException('Razorpay not configured');
        }
        try {
            const order = await this.razorpay.orders.create({
                amount: Math.round(request.amount * 100),
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
                status: client_1.PaymentStatus.PENDING,
                gatewayOrderId: order.id,
                paymentUrl: `https://rzp.io/l/${order.id}`,
            };
        }
        catch (error) {
            this.logger.error(`Razorpay UPI payment failed: ${error.message}`);
            throw error;
        }
    }
    async processNetBankingPayment(paymentId, request) {
        if (!this.razorpay) {
            throw new common_1.InternalServerErrorException('Razorpay not configured');
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
                status: client_1.PaymentStatus.PENDING,
                gatewayOrderId: order.id,
                paymentUrl: `https://rzp.io/l/${order.id}`,
            };
        }
        catch (error) {
            this.logger.error(`Net banking payment failed: ${error.message}`);
            throw error;
        }
    }
    async processWalletPayment(paymentId, request) {
        const user = await this.prisma.user.findUnique({
            where: { id: request.customerId },
            include: { profile: true },
        });
        if (!user?.profile) {
            throw new common_1.BadRequestException('User profile not found');
        }
        const walletBalance = await this.getWalletBalance(request.customerId);
        if (walletBalance < request.amount) {
            throw new common_1.BadRequestException('Insufficient wallet balance');
        }
        await this.deductFromWallet(request.customerId, request.amount, paymentId);
        return {
            paymentId,
            status: client_1.PaymentStatus.PAID,
        };
    }
    async processCashPayment(paymentId, request) {
        return {
            paymentId,
            status: client_1.PaymentStatus.PENDING,
        };
    }
    async refundPayment(refundRequest) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: refundRequest.paymentId },
        });
        if (!payment) {
            throw new common_1.BadRequestException('Payment not found');
        }
        if (payment.status !== client_1.PaymentStatus.PAID) {
            throw new common_1.BadRequestException('Can only refund paid payments');
        }
        const refundAmount = refundRequest.amount || payment.amount;
        try {
            if (payment.paymentGateway === 'stripe' && payment.gatewayPaymentId) {
                await this.refundStripePayment(payment.gatewayPaymentId, refundAmount);
            }
            else if (payment.paymentGateway === 'razorpay' && payment.gatewayPaymentId) {
                await this.refundRazorpayPayment(payment.gatewayPaymentId, refundAmount);
            }
            else if (payment.method === exports.PaymentMethod.WALLET) {
                await this.refundToWallet(payment, refundAmount);
            }
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: refundAmount === payment.amount ? client_1.PaymentStatus.REFUNDED : client_1.PaymentStatus.PARTIALLY_REFUNDED,
                },
            });
            this.logger.log(`Payment ${payment.id} refunded successfully`);
        }
        catch (error) {
            this.logger.error(`Refund failed for payment ${payment.id}: ${error.message}`);
            throw new common_1.InternalServerErrorException('Refund processing failed');
        }
    }
    async handleWebhook(webhookData) {
        this.logger.log(`Processing ${webhookData.gatewayType} webhook: ${webhookData.eventType}`);
        try {
            if (webhookData.gatewayType === 'stripe') {
                this.verifyStripeWebhook(webhookData);
                await this.handleStripeWebhook(webhookData);
            }
            else if (webhookData.gatewayType === 'razorpay') {
                this.verifyRazorpayWebhook(webhookData);
                await this.handleRazorpayWebhook(webhookData);
            }
        }
        catch (error) {
            this.logger.error(`Webhook processing failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    verifyStripeWebhook(webhookData) {
        const endpointSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        if (!endpointSecret || !this.stripe) {
            throw new common_1.BadRequestException('Stripe webhook verification failed');
        }
        try {
            const event = this.stripe.webhooks.constructEvent(JSON.stringify(webhookData.data), webhookData.signature, endpointSecret);
            webhookData.eventType = event.type;
            webhookData.data = event;
        }
        catch (error) {
            this.logger.error(`Stripe webhook signature verification failed: ${error.message}`);
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
    }
    verifyRazorpayWebhook(webhookData) {
        const webhookSecret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new common_1.BadRequestException('Razorpay webhook verification failed');
        }
        try {
            const crypto = require('crypto');
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(webhookData.data))
                .digest('hex');
            if (expectedSignature !== webhookData.signature) {
                throw new common_1.BadRequestException('Invalid webhook signature');
            }
            webhookData.eventType = webhookData.data.event;
        }
        catch (error) {
            this.logger.error(`Razorpay webhook signature verification failed: ${error.message}`);
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
    }
    async handleStripeWebhook(webhookData) {
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
    async handleRazorpayWebhook(webhookData) {
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
    async handleStripePaymentSucceeded(paymentIntent) {
        const payment = await this.prisma.payment.findFirst({
            where: { gatewayPaymentId: paymentIntent.id },
        });
        if (payment) {
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: client_1.PaymentStatus.PAID,
                },
            });
            if (payment.orderId) {
                await this.updateOrderPaymentStatus(payment.orderId, client_1.PaymentStatus.PAID);
            }
        }
    }
    async handleStripePaymentFailed(paymentIntent) {
        const payment = await this.prisma.payment.findFirst({
            where: { gatewayPaymentId: paymentIntent.id },
        });
        if (payment) {
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: { status: client_1.PaymentStatus.FAILED },
            });
            if (payment.orderId) {
                await this.updateOrderPaymentStatus(payment.orderId, client_1.PaymentStatus.FAILED);
            }
        }
    }
    async handleRazorpayPaymentCaptured(payment) {
        const dbPayment = await this.prisma.payment.findFirst({
            where: { gatewayPaymentId: payment.id },
        });
        if (dbPayment) {
            await this.prisma.payment.update({
                where: { id: dbPayment.id },
                data: {
                    status: client_1.PaymentStatus.PAID,
                },
            });
            if (dbPayment.orderId) {
                await this.updateOrderPaymentStatus(dbPayment.orderId, client_1.PaymentStatus.PAID);
            }
        }
    }
    async refundStripePayment(paymentIntentId, amount) {
        await this.stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: Math.round(amount * 100),
        });
    }
    async refundRazorpayPayment(paymentId, amount) {
        await this.razorpay.payments.refund(paymentId, {
            amount: Math.round(amount * 100),
        });
    }
    async refundToWallet(payment, amount) {
        let customerId;
        if (payment.orderId) {
            const order = await this.prisma.order.findUnique({
                where: { id: payment.orderId },
                select: { customerId: true },
            });
            customerId = order?.customerId;
        }
        else if (payment.subscriptionId) {
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
    async getWalletBalance(userId) {
        const transactions = await this.prisma.transaction.findMany({
            where: {
                OR: [
                    { orderId: { contains: userId } },
                    { restaurantId: { contains: userId } },
                    { vendorId: { contains: userId } },
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
        });
        return transactions.length > 0 ? transactions[0].balance : 0;
    }
    async deductFromWallet(userId, amount, paymentId) {
        const currentBalance = await this.getWalletBalance(userId);
        const newBalance = currentBalance - amount;
        if (newBalance < 0) {
            throw new common_1.BadRequestException('Insufficient wallet balance');
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
    async addToWallet(userId, amount, paymentId) {
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
    async updateOrderPaymentStatus(orderId, status) {
        await this.prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: status },
        });
    }
    getPreferredGateway(method) {
        switch (method) {
            case exports.PaymentMethod.CARD:
                return this.stripe ? 'stripe' : 'razorpay';
            case exports.PaymentMethod.UPI:
            case exports.PaymentMethod.RAZORPAY:
                return 'razorpay';
            case exports.PaymentMethod.WALLET:
            case exports.PaymentMethod.CASH:
                return 'internal';
            default:
                return 'razorpay';
        }
    }
    async getPaymentMethods(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
        const methods = [];
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
    async handleStripeSubscriptionPayment(invoice) {
        const subscription = await this.prisma.subscription.findFirst({
            where: {},
        });
        if (subscription) {
            await this.prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    isActive: true,
                    endDate: new Date(invoice.lines.data[0].period.end * 1000),
                },
            });
        }
    }
    async handleRazorpayPaymentFailed(payment) {
        const dbPayment = await this.prisma.payment.findFirst({
            where: { gatewayPaymentId: payment.id },
        });
        if (dbPayment) {
            await this.prisma.payment.update({
                where: { id: dbPayment.id },
                data: { status: client_1.PaymentStatus.FAILED },
            });
            if (dbPayment.orderId) {
                await this.updateOrderPaymentStatus(dbPayment.orderId, client_1.PaymentStatus.FAILED);
            }
        }
    }
    async getPaymentHistory(userId, page = 1, limit = 10, status) {
        const skip = (page - 1) * limit;
        const whereClause = {
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
    async getPaymentDetails(paymentId, userId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment) {
            throw new common_1.BadRequestException('Payment not found');
        }
        const hasAccess = payment.metadata?.customerId === userId;
        if (!hasAccess) {
            throw new common_1.BadRequestException('Access denied');
        }
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
    async addMoneyToWallet(userId, amount, paymentMethod) {
        const paymentRequest = {
            amount,
            currency: 'INR',
            method: paymentMethod,
            customerId: userId,
            description: 'Add money to wallet',
            metadata: { type: 'wallet_topup' },
        };
        return this.processPayment(paymentRequest);
    }
    async getWalletTransactions(userId, page = 1, limit = 10) {
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
    async getPaymentDashboard(startDate, endDate) {
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate)
                dateFilter.createdAt.gte = startDate;
            if (endDate)
                dateFilter.createdAt.lte = endDate;
        }
        const [totalPayments, successfulPayments, failedPayments, totalAmount, averageAmount, paymentsByGateway, paymentsByMethod, recentPayments,] = await Promise.all([
            this.prisma.payment.count({ where: dateFilter }),
            this.prisma.payment.count({ where: { ...dateFilter, status: client_1.PaymentStatus.PAID } }),
            this.prisma.payment.count({ where: { ...dateFilter, status: client_1.PaymentStatus.FAILED } }),
            this.prisma.payment.aggregate({
                where: { ...dateFilter, status: client_1.PaymentStatus.PAID },
                _sum: { amount: true },
            }),
            this.prisma.payment.aggregate({
                where: { ...dateFilter, status: client_1.PaymentStatus.PAID },
                _avg: { amount: true },
            }),
            this.prisma.payment.groupBy({
                by: ['paymentGateway'],
                where: { ...dateFilter, status: client_1.PaymentStatus.PAID },
                _count: { id: true },
                _sum: { amount: true },
            }),
            this.prisma.payment.groupBy({
                by: ['method'],
                where: { ...dateFilter, status: client_1.PaymentStatus.PAID },
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
    async getAllTransactions(page = 1, limit = 20, filters = {}) {
        const skip = (page - 1) * limit;
        const whereClause = {};
        if (filters.status)
            whereClause.status = filters.status;
        if (filters.gateway)
            whereClause.paymentGateway = filters.gateway;
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
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map