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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const email_service_1 = require("./email.service");
const client_1 = require("@prisma/client");
let EmailController = class EmailController {
    constructor(emailService) {
        this.emailService = emailService;
    }
    async sendEmail(userId, emailData) {
        if (!emailData.template && !emailData.html && !emailData.text) {
            throw new common_1.BadRequestException('Either template, html, or text content is required');
        }
        return this.emailService.sendEmail({
            to: emailData.to,
            subject: emailData.subject,
            template: emailData.template,
            templateData: emailData.templateData,
            html: emailData.html,
            text: emailData.text,
            attachments: emailData.attachments,
        });
    }
    async sendBulkEmail(userId, bulkEmailData) {
        return this.emailService.sendBulkEmail({
            recipients: bulkEmailData.recipients,
            subject: bulkEmailData.subject,
            template: bulkEmailData.template,
            batchSize: bulkEmailData.batchSize,
        });
    }
    async getAvailableTemplates() {
        return this.emailService.getAvailableTemplates();
    }
    async getQueueStatus() {
        return this.emailService.getQueueStatus();
    }
    async getEmailLogs(user, page, limit, status, recipient) {
        const filters = {};
        if (user.role !== client_1.UserRole.ADMIN) {
            filters.fromUserId = user.id;
        }
        if (status)
            filters.status = status;
        if (recipient)
            filters.recipient = recipient;
        return this.emailService.getEmailLogs({
            ...filters,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }
    async sendTestEmail(adminEmail, testData) {
        const recipient = testData.recipient || adminEmail;
        const template = testData.template || 'test';
        return this.emailService.sendEmail({
            to: recipient,
            subject: 'Email Service Test',
            template,
            templateData: {
                adminEmail,
                timestamp: new Date().toISOString(),
                systemInfo: {
                    environment: process.env.NODE_ENV,
                    service: 'RestaurantHub API',
                },
            },
        });
    }
    async getEmailStats(user, from, to) {
        const filters = {};
        if (user.role !== client_1.UserRole.ADMIN) {
            filters.fromUserId = user.id;
        }
        if (from)
            filters.from = new Date(from);
        if (to)
            filters.to = new Date(to);
        return this.emailService.getEmailStats(filters);
    }
};
exports.EmailController = EmailController;
__decorate([
    (0, common_1.Post)('send'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Send email (Admin/Restaurant only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Email queued successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Post)('send/bulk'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Send bulk email (Admin/Restaurant only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Bulk email queued successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendBulkEmail", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Get available email templates' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Available templates listed' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "getAvailableTemplates", null);
__decorate([
    (0, common_1.Get)('queue/status'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get email queue status (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Queue status retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "getQueueStatus", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Get email sending logs' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email logs retrieved' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('recipient')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "getEmailLogs", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Send test email (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Test email sent' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('email')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendTestEmail", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Get email sending statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email statistics retrieved' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "getEmailStats", null);
exports.EmailController = EmailController = __decorate([
    (0, swagger_1.ApiTags)('email'),
    (0, common_1.Controller)('email'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailController);
//# sourceMappingURL=email.controller.js.map