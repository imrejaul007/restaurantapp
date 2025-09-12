"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const nodemailer = __importStar(require("nodemailer"));
const client_1 = require("@prisma/client");
let EmailService = EmailService_1 = class EmailService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmailService_1.name);
        this.fromAddress = this.configService.get('EMAIL_FROM', 'RestaurantHub <noreply@restauranthub.com>');
        this.setupTransporter();
    }
    setupTransporter() {
        const smtpConfig = {
            host: this.configService.get('SMTP_HOST'),
            port: this.configService.get('SMTP_PORT', 587),
            secure: this.configService.get('SMTP_SECURE', false),
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        };
        const sendgridApiKey = this.configService.get('SENDGRID_API_KEY');
        if (sendgridApiKey) {
            this.transporter = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: 'apikey',
                    pass: sendgridApiKey,
                },
            });
            this.logger.log('Email service configured with SendGrid');
            return;
        }
        const awsSesAccessKey = this.configService.get('AWS_SES_ACCESS_KEY_ID');
        if (awsSesAccessKey) {
        }
        if (smtpConfig.host && smtpConfig.auth.user) {
            this.transporter = nodemailer.createTransport(smtpConfig);
            this.logger.log('Email service configured with SMTP');
        }
        else {
            this.logger.warn('Email service not configured - emails will be logged only');
        }
    }
    async sendEmail(options) {
        try {
            let html = options.html;
            let text = options.text;
            let subject = options.subject;
            if (options.template) {
                const processed = await this.processTemplate(options.template, options.templateData || {});
                html = processed.html;
                text = processed.text || this.stripHtml(html);
                subject = processed.subject || subject;
            }
            const mailOptions = {
                from: this.fromAddress,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject,
                html,
                text,
                attachments: options.attachments,
                priority: options.priority || 'normal',
            };
            if (options.delay && options.delay > 0) {
                setTimeout(async () => {
                    await this.sendDirectEmail(mailOptions);
                }, options.delay);
                this.logger.log(`Email scheduled for direct delivery in ${options.delay}ms to ${mailOptions.to}`);
            }
            else {
                await this.sendNow(mailOptions);
            }
        }
        catch (error) {
            this.logger.error(`Email sending failed: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Email sending failed');
        }
    }
    async sendBulkEmail(options) {
        const batchSize = options.batchSize || 50;
        const batches = this.chunkArray(options.recipients, batchSize);
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const batchEmails = batch.map(recipient => ({
                to: recipient.email,
                subject: options.subject,
                template: options.template,
                templateData: {
                    ...options.globalData,
                    ...recipient.customData,
                    recipientName: recipient.name || recipient.email,
                    recipientEmail: recipient.email,
                },
                delay: i * 1000,
            }));
            await Promise.all(batchEmails.map(emailOptions => this.sendDirectEmail(emailOptions)));
        }
        this.logger.log(`Bulk email queued: ${options.recipients.length} emails in ${batches.length} batches`);
    }
    async sendNow(mailOptions) {
        if (!this.transporter) {
            this.logger.log(`[EMAIL DEBUG] Would send email:
        To: ${mailOptions.to}
        Subject: ${mailOptions.subject}
        HTML: ${mailOptions.html?.substring(0, 100)}...
      `);
            return;
        }
        const info = await this.transporter.sendMail(mailOptions);
        this.logger.log(`Email sent successfully: ${info.messageId} to ${mailOptions.to}`);
    }
    async processTemplate(templateName, data) {
        switch (templateName) {
            case 'welcome':
                return this.getWelcomeTemplate(data);
            case 'email-verification':
                return this.getEmailVerificationTemplate(data);
            case 'password-reset':
                return this.getPasswordResetTemplate(data);
            case 'order-confirmation':
                return this.getOrderConfirmationTemplate(data);
            case 'order-status-update':
                return this.getOrderStatusUpdateTemplate(data);
            case 'payment-success':
                return this.getPaymentSuccessTemplate(data);
            case 'payment-failed':
                return this.getPaymentFailedTemplate(data);
            case 'subscription-reminder':
                return this.getSubscriptionReminderTemplate(data);
            case 'job-application-received':
                return this.getJobApplicationTemplate(data);
            case 'job-application-status':
                return this.getJobApplicationStatusTemplate(data);
            case 'restaurant-verification':
                return this.getRestaurantVerificationTemplate(data);
            case 'vendor-verification':
                return this.getVendorVerificationTemplate(data);
            case 'training-reminder':
                return this.getTrainingReminderTemplate(data);
            case 'review-request':
                return this.getReviewRequestTemplate(data);
            case 'weekly-report':
                return this.getWeeklyReportTemplate(data);
            default:
                throw new Error(`Email template '${templateName}' not found`);
        }
    }
    getWelcomeTemplate(data) {
        const { userName, userRole, loginUrl } = data;
        return {
            subject: `Welcome to RestaurantHub, ${userName}!`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to RestaurantHub</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to RestaurantHub!</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Welcome to RestaurantHub - the complete platform for restaurant success!</p>
              <p>Your ${userRole} account has been created successfully. You now have access to:</p>
              <ul>
                ${this.getRoleFeatures(userRole)}
              </ul>
              <p>Get started by logging into your account:</p>
              <p><a href="${loginUrl}" class="button">Login to Your Account</a></p>
              <p>If you have any questions, our support team is here to help.</p>
              <p>Best regards,<br>The RestaurantHub Team</p>
            </div>
            <div class="footer">
              <p>© 2024 RestaurantHub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };
    }
    getEmailVerificationTemplate(data) {
        const { userName, verificationUrl } = data;
        return {
            subject: 'Verify Your Email Address - RestaurantHub',
            html: `
        <!DOCTYPE html>
        <html>
        <body>
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1>Email Verification</h1>
            </div>
            <div style="padding: 20px;">
              <h2>Hello ${userName},</h2>
              <p>Please verify your email address by clicking the button below:</p>
              <p><a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account with us, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };
    }
    getPasswordResetTemplate(data) {
        const { userName, resetUrl } = data;
        return {
            subject: 'Reset Your Password - RestaurantHub',
            html: `
        <!DOCTYPE html>
        <html>
        <body>
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
              <h1>Password Reset</h1>
            </div>
            <div style="padding: 20px;">
              <h2>Hello ${userName},</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <p><a href="${resetUrl}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, please ignore this email or contact support if you're concerned.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };
    }
    getOrderConfirmationTemplate(data) {
        const { userName, orderId, orderTotal, items, deliveryAddress, estimatedTime } = data;
        return {
            subject: `Order Confirmation #${orderId} - RestaurantHub`,
            html: `
        <!DOCTYPE html>
        <html>
        <body>
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: #059669; color: white; padding: 20px; text-align: center;">
              <h1>Order Confirmed!</h1>
              <p>Order #${orderId}</p>
            </div>
            <div style="padding: 20px;">
              <h2>Thank you for your order, ${userName}!</h2>
              <p>Your order has been confirmed and is being prepared.</p>
              
              <h3>Order Details:</h3>
              <div style="border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0;">
                ${Array.isArray(items) ? items.map((item) => `<p>${item.name} x${item.quantity} - ₹${item.price}</p>`).join('') : '<p>No items found</p>'}
                <hr>
                <p><strong>Total: ₹${orderTotal}</strong></p>
              </div>

              <h3>Delivery Information:</h3>
              <p>${deliveryAddress}</p>
              <p>Estimated delivery time: ${estimatedTime}</p>

              <p>You can track your order status in your account.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };
    }
    getOrderStatusUpdateTemplate(data) {
        const { userName, orderId, status, statusMessage } = data;
        return {
            subject: `Order Update #${orderId} - ${status}`,
            html: `
        <!DOCTYPE html>
        <html>
        <body>
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1>Order Update</h1>
              <p>Order #${orderId}</p>
            </div>
            <div style="padding: 20px;">
              <h2>Hello ${userName},</h2>
              <p>Your order status has been updated to: <strong>${status}</strong></p>
              <p>${statusMessage}</p>
              <p>Track your order for real-time updates.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };
    }
    getPaymentSuccessTemplate(data) {
        const { userName, amount, paymentId, orderId } = data;
        return {
            subject: `Payment Successful - ₹${amount}`,
            html: `
        <!DOCTYPE html>
        <html>
        <body>
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: #059669; color: white; padding: 20px; text-align: center;">
              <h1>Payment Successful!</h1>
            </div>
            <div style="padding: 20px;">
              <h2>Hello ${userName},</h2>
              <p>Your payment of <strong>₹${amount}</strong> has been processed successfully.</p>
              <p>Payment ID: ${paymentId}</p>
              ${orderId ? `<p>Order ID: ${orderId}</p>` : ''}
              <p>Thank you for using RestaurantHub!</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };
    }
    getWeeklyReportTemplate(data) {
        const { restaurantName, weekData } = data;
        return {
            subject: `Weekly Report - ${restaurantName}`,
            html: `
        <!DOCTYPE html>
        <html>
        <body>
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1>Weekly Performance Report</h1>
              <p>${restaurantName}</p>
            </div>
            <div style="padding: 20px;">
              <h2>This Week's Performance</h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="border: 1px solid #e5e7eb; padding: 15px; text-align: center;">
                  <h3>Orders</h3>
                  <p style="font-size: 24px; font-weight: bold;">${weekData.orders}</p>
                </div>
                <div style="border: 1px solid #e5e7eb; padding: 15px; text-align: center;">
                  <h3>Revenue</h3>
                  <p style="font-size: 24px; font-weight: bold;">₹${weekData.revenue}</p>
                </div>
                <div style="border: 1px solid #e5e7eb; padding: 15px; text-align: center;">
                  <h3>Rating</h3>
                  <p style="font-size: 24px; font-weight: bold;">${weekData.rating}/5</p>
                </div>
                <div style="border: 1px solid #e5e7eb; padding: 15px; text-align: center;">
                  <h3>New Customers</h3>
                  <p style="font-size: 24px; font-weight: bold;">${weekData.newCustomers}</p>
                </div>
              </div>
              <p>Login to your dashboard for detailed analytics.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };
    }
    getJobApplicationTemplate(data) {
        return {
            subject: 'New Job Application Received',
            html: `<p>You have received a new job application for ${data.jobTitle}.</p>`,
        };
    }
    getJobApplicationStatusTemplate(data) {
        return {
            subject: `Job Application Status Update - ${data.status}`,
            html: `<p>Your job application status has been updated to: ${data.status}</p>`,
        };
    }
    getRestaurantVerificationTemplate(data) {
        return {
            subject: 'Restaurant Verification Status Update',
            html: `<p>Your restaurant verification status: ${data.status}</p>`,
        };
    }
    getVendorVerificationTemplate(data) {
        return {
            subject: 'Vendor Verification Status Update',
            html: `<p>Your vendor verification status: ${data.status}</p>`,
        };
    }
    getTrainingReminderTemplate(data) {
        return {
            subject: 'Training Reminder',
            html: `<p>Don't forget to complete your training: ${data.trainingName}</p>`,
        };
    }
    getReviewRequestTemplate(data) {
        return {
            subject: 'Please Review Your Recent Order',
            html: `<p>How was your recent order? Please leave a review.</p>`,
        };
    }
    getPaymentFailedTemplate(data) {
        return {
            subject: 'Payment Failed',
            html: `<p>Your payment of ₹${data.amount} failed. Please try again.</p>`,
        };
    }
    getSubscriptionReminderTemplate(data) {
        return {
            subject: 'Subscription Renewal Reminder',
            html: `<p>Your subscription expires on ${data.expiryDate}. Please renew to continue.</p>`,
        };
    }
    getRoleFeatures(role) {
        const features = {
            [client_1.UserRole.RESTAURANT]: `
        <li>Complete restaurant management dashboard</li>
        <li>Menu and inventory management</li>
        <li>Order processing and tracking</li>
        <li>Employee management and hiring</li>
        <li>Analytics and reporting</li>
      `,
            [client_1.UserRole.VENDOR]: `
        <li>Product catalog management</li>
        <li>Order fulfillment tracking</li>
        <li>B2B marketplace access</li>
        <li>Payment and billing management</li>
        <li>Performance analytics</li>
      `,
            [client_1.UserRole.EMPLOYEE]: `
        <li>Job search and applications</li>
        <li>Training and certification</li>
        <li>Task and schedule management</li>
        <li>Performance tracking</li>
        <li>Communication tools</li>
      `,
            [client_1.UserRole.CUSTOMER]: `
        <li>Browse and order from restaurants</li>
        <li>Order tracking and history</li>
        <li>Reviews and ratings</li>
        <li>Wallet and loyalty points</li>
        <li>Personalized recommendations</li>
      `,
        };
        return features[role] || '<li>Access to platform features</li>';
    }
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    async processEmailQueue(job) {
        const { data } = job;
        await this.sendNow(data);
    }
    async getAvailableTemplates() {
        return {
            templates: [
                'welcome',
                'email-verification',
                'password-reset',
                'order-confirmation',
                'order-status-update',
                'payment-success',
                'payment-failed',
                'subscription-reminder',
                'job-application-received',
                'job-application-status',
                'restaurant-verification',
                'vendor-verification',
                'training-reminder',
                'review-request',
                'weekly-report',
            ],
        };
    }
    async getQueueStatus() {
        this.logger.warn('Email queue status not implemented - returning stub response');
        return {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
        };
    }
    async getEmailLogs(params) {
        this.logger.warn('Email logs not implemented - returning empty result');
        const { page = 1, limit = 20 } = params;
        return {
            logs: [],
            pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            },
        };
    }
    async getEmailStats(params) {
        this.logger.warn('Email stats not implemented - returning stub response');
        return {
            totalSent: 0,
            totalDelivered: 0,
            totalFailed: 0,
            totalBounced: 0,
            totalOpened: 0,
            totalClicked: 0,
            deliveryRate: 0,
            openRate: 0,
            clickRate: 0,
        };
    }
    async sendDirectEmail(mailOptions) {
        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email sent directly to ${mailOptions.to}`);
        }
        catch (error) {
            this.logger.error(`Failed to send email directly to ${mailOptions.to}:`, error);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], EmailService);
//# sourceMappingURL=email.service.js.map