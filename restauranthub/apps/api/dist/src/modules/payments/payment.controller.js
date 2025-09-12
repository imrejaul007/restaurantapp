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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const payment_service_1 = require("./payment.service");
const client_1 = require("@prisma/client");
let PaymentController = PaymentController_1 = class PaymentController {
    constructor(paymentService) {
        this.paymentService = paymentService;
        this.logger = new common_1.Logger(PaymentController_1.name);
    }
    async processPayment(paymentRequest, req) {
        try {
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
        }
        catch (error) {
            this.logger.error(`Payment processing failed: ${error.message}`);
            throw error;
        }
    }
    async refundPayment(refundRequest, req) {
        try {
            await this.paymentService.refundPayment(refundRequest);
            return {
                success: true,
                message: 'Refund processed successfully',
            };
        }
        catch (error) {
            this.logger.error(`Refund processing failed: ${error.message}`);
            throw error;
        }
    }
    async getPaymentMethods(req) {
        try {
            const methods = await this.paymentService.getPaymentMethods(req.user.id);
            return {
                success: true,
                data: methods,
            };
        }
        catch (error) {
            this.logger.error(`Failed to fetch payment methods: ${error.message}`);
            throw error;
        }
    }
    async getPaymentHistory(req, page = '1', limit = '10', status) {
        try {
            const history = await this.paymentService.getPaymentHistory(req.user.id, parseInt(page), parseInt(limit), status);
            return {
                success: true,
                data: history,
            };
        }
        catch (error) {
            this.logger.error(`Failed to fetch payment history: ${error.message}`);
            throw error;
        }
    }
    async getPaymentDetails(paymentId, req) {
        try {
            const payment = await this.paymentService.getPaymentDetails(paymentId, req.user.id);
            return {
                success: true,
                data: payment,
            };
        }
        catch (error) {
            this.logger.error(`Failed to fetch payment details: ${error.message}`);
            throw error;
        }
    }
    async handleStripeWebhook(body, signature) {
        try {
            if (!signature) {
                throw new common_1.BadRequestException('Missing Stripe signature');
            }
            const webhookData = {
                gatewayType: 'stripe',
                eventType: '',
                data: body,
                signature,
            };
            await this.paymentService.handleWebhook(webhookData);
            return { received: true };
        }
        catch (error) {
            this.logger.error(`Stripe webhook processing failed: ${error.message}`);
            throw new common_1.BadRequestException('Webhook processing failed');
        }
    }
    async handleRazorpayWebhook(body, signature) {
        try {
            if (!signature) {
                throw new common_1.BadRequestException('Missing Razorpay signature');
            }
            const webhookData = {
                gatewayType: 'razorpay',
                eventType: '',
                data: body,
                signature,
            };
            await this.paymentService.handleWebhook(webhookData);
            return { received: true };
        }
        catch (error) {
            this.logger.error(`Razorpay webhook processing failed: ${error.message}`);
            throw new common_1.BadRequestException('Webhook processing failed');
        }
    }
    async getWalletBalance(req) {
        try {
            const balance = await this.paymentService.getWalletBalance(req.user.id);
            return {
                success: true,
                data: { balance },
            };
        }
        catch (error) {
            this.logger.error(`Failed to fetch wallet balance: ${error.message}`);
            throw error;
        }
    }
    async addMoneyToWallet(body, req) {
        try {
            const result = await this.paymentService.addMoneyToWallet(req.user.id, body.amount, body.paymentMethod);
            return {
                success: true,
                data: result,
                message: 'Money added to wallet successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to add money to wallet: ${error.message}`);
            throw error;
        }
    }
    async getWalletTransactions(req, page = '1', limit = '10') {
        try {
            const transactions = await this.paymentService.getWalletTransactions(req.user.id, parseInt(page), parseInt(limit));
            return {
                success: true,
                data: transactions,
            };
        }
        catch (error) {
            this.logger.error(`Failed to fetch wallet transactions: ${error.message}`);
            throw error;
        }
    }
    async getPaymentDashboard(startDate, endDate) {
        try {
            const dashboard = await this.paymentService.getPaymentDashboard(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            return {
                success: true,
                data: dashboard,
            };
        }
        catch (error) {
            this.logger.error(`Failed to fetch payment dashboard: ${error.message}`);
            throw error;
        }
    }
    async getAllTransactions(page = '1', limit = '20', status, gateway) {
        try {
            const transactions = await this.paymentService.getAllTransactions(parseInt(page), parseInt(limit), { status, gateway });
            return {
                success: true,
                data: transactions,
            };
        }
        catch (error) {
            this.logger.error(`Failed to fetch all transactions: ${error.message}`);
            throw error;
        }
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('process'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "processPayment", null);
__decorate([
    (0, common_1.Post)('refund'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "refundPayment", null);
__decorate([
    (0, common_1.Get)('methods'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentMethods", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentHistory", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentDetails", null);
__decorate([
    (0, common_1.Post)('webhooks/stripe'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "handleStripeWebhook", null);
__decorate([
    (0, common_1.Post)('webhooks/razorpay'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-razorpay-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "handleRazorpayWebhook", null);
__decorate([
    (0, common_1.Get)('wallet/balance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getWalletBalance", null);
__decorate([
    (0, common_1.Post)('wallet/add-money'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "addMoneyToWallet", null);
__decorate([
    (0, common_1.Get)('wallet/transactions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getWalletTransactions", null);
__decorate([
    (0, common_1.Get)('admin/dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentDashboard", null);
__decorate([
    (0, common_1.Get)('admin/transactions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('gateway')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getAllTransactions", null);
exports.PaymentController = PaymentController = PaymentController_1 = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map