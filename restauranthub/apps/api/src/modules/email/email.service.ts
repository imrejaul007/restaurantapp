import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { UserRole } from '@prisma/client';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
    cid?: string;
  }>;
  priority?: 'high' | 'normal' | 'low';
  delay?: number; // in milliseconds
}

export interface BulkEmailOptions {
  recipients: Array<{
    email: string;
    name?: string;
    customData?: Record<string, any>;
  }>;
  subject: string;
  template: string;
  globalData?: Record<string, any>;
  batchSize?: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter;
  private fromAddress: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    // @InjectQueue('email') private emailQueue: Queue, // Temporarily disabled
  ) {
    this.fromAddress = this.configService.get('EMAIL_FROM', 'RestaurantHub <noreply@restauranthub.com>');
    this.setupTransporter();
  }

  private setupTransporter(): void {
    const smtpConfig = {
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: this.configService.get('SMTP_SECURE', false),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    };

    // Use SendGrid if available
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

    // Use AWS SES if available
    const awsSesAccessKey = this.configService.get('AWS_SES_ACCESS_KEY_ID');
    if (awsSesAccessKey) {
      // TODO: SES configuration needs proper implementation
      // this.transporter = nodemailer.createTransport({
      //   SES: {
      //     aws: {
      //       accessKeyId: awsSesAccessKey,
      //       secretAccessKey: this.configService.get('AWS_SES_SECRET_ACCESS_KEY'),
      //       region: this.configService.get('AWS_SES_REGION', 'us-east-1'),
      //     },
      //   },
      // });
      // this.logger.log('Email service configured with AWS SES');
      // return;
    }

    // Fallback to SMTP
    if (smtpConfig.host && smtpConfig.auth.user) {
      this.transporter = nodemailer.createTransport(smtpConfig);
      this.logger.log('Email service configured with SMTP');
    } else {
      this.logger.warn('Email service not configured - emails will be logged only');
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      let html = options.html;
      let text = options.text;
      let subject = options.subject;

      // Process template if specified
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
        // Temporarily send directly instead of queuing
        setTimeout(async () => {
          await this.sendDirectEmail(mailOptions);
        }, options.delay);
        this.logger.log(`Email scheduled for direct delivery in ${options.delay}ms to ${mailOptions.to}`);
      } else {
        // Send immediately
        await this.sendNow(mailOptions);
      }

    } catch (error) {
      this.logger.error(`Email sending failed: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException('Email sending failed');
    }
  }

  async sendBulkEmail(options: BulkEmailOptions): Promise<void> {
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
        delay: i * 1000, // Stagger batches by 1 second
      }));

      // Send batch directly instead of queuing
      await Promise.all(
        batchEmails.map(emailOptions => 
          this.sendDirectEmail(emailOptions)
        )
      );
    }

    this.logger.log(`Bulk email queued: ${options.recipients.length} emails in ${batches.length} batches`);
  }

  private async sendNow(mailOptions: any): Promise<void> {
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

  private async processTemplate(templateName: string, data: Record<string, any>): Promise<EmailTemplate> {
    // Lazy template processing - only execute the requested template
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

  private getWelcomeTemplate(data: any): EmailTemplate {
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

  private getEmailVerificationTemplate(data: any): EmailTemplate {
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

  private getPasswordResetTemplate(data: any): EmailTemplate {
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

  private getOrderConfirmationTemplate(data: any): EmailTemplate {
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
                ${Array.isArray(items) ? items.map((item: any) => `<p>${item.name} x${item.quantity} - ₹${item.price}</p>`).join('') : '<p>No items found</p>'}
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

  private getOrderStatusUpdateTemplate(data: any): EmailTemplate {
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

  private getPaymentSuccessTemplate(data: any): EmailTemplate {
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

  private getWeeklyReportTemplate(data: any): EmailTemplate {
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

  // Additional template methods...
  private getJobApplicationTemplate(data: any): EmailTemplate {
    return {
      subject: 'New Job Application Received',
      html: `<p>You have received a new job application for ${data.jobTitle}.</p>`,
    };
  }

  private getJobApplicationStatusTemplate(data: any): EmailTemplate {
    return {
      subject: `Job Application Status Update - ${data.status}`,
      html: `<p>Your job application status has been updated to: ${data.status}</p>`,
    };
  }

  private getRestaurantVerificationTemplate(data: any): EmailTemplate {
    return {
      subject: 'Restaurant Verification Status Update',
      html: `<p>Your restaurant verification status: ${data.status}</p>`,
    };
  }

  private getVendorVerificationTemplate(data: any): EmailTemplate {
    return {
      subject: 'Vendor Verification Status Update',
      html: `<p>Your vendor verification status: ${data.status}</p>`,
    };
  }

  private getTrainingReminderTemplate(data: any): EmailTemplate {
    return {
      subject: 'Training Reminder',
      html: `<p>Don't forget to complete your training: ${data.trainingName}</p>`,
    };
  }

  private getReviewRequestTemplate(data: any): EmailTemplate {
    return {
      subject: 'Please Review Your Recent Order',
      html: `<p>How was your recent order? Please leave a review.</p>`,
    };
  }

  private getPaymentFailedTemplate(data: any): EmailTemplate {
    return {
      subject: 'Payment Failed',
      html: `<p>Your payment of ₹${data.amount} failed. Please try again.</p>`,
    };
  }

  private getSubscriptionReminderTemplate(data: any): EmailTemplate {
    return {
      subject: 'Subscription Renewal Reminder',
      html: `<p>Your subscription expires on ${data.expiryDate}. Please renew to continue.</p>`,
    };
  }

  private getRoleFeatures(role: string): string {
    const features = {
      [UserRole.RESTAURANT]: `
        <li>Complete restaurant management dashboard</li>
        <li>Menu and inventory management</li>
        <li>Order processing and tracking</li>
        <li>Employee management and hiring</li>
        <li>Analytics and reporting</li>
      `,
      [UserRole.VENDOR]: `
        <li>Product catalog management</li>
        <li>Order fulfillment tracking</li>
        <li>B2B marketplace access</li>
        <li>Payment and billing management</li>
        <li>Performance analytics</li>
      `,
      [UserRole.EMPLOYEE]: `
        <li>Job search and applications</li>
        <li>Training and certification</li>
        <li>Task and schedule management</li>
        <li>Performance tracking</li>
        <li>Communication tools</li>
      `,
      [UserRole.CUSTOMER]: `
        <li>Browse and order from restaurants</li>
        <li>Order tracking and history</li>
        <li>Reviews and ratings</li>
        <li>Wallet and loyalty points</li>
        <li>Personalized recommendations</li>
      `,
    };

    return (features as any)[role] || '<li>Access to platform features</li>';
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Queue processor methods would be handled by a separate queue processor
  async processEmailQueue(job: any): Promise<void> {
    const { data } = job;
    await this.sendNow(data);
  }

  // Admin methods for email management
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
    // TODO: Implement actual queue status when Bull queue is properly configured
    this.logger.warn('Email queue status not implemented - returning stub response');
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    };
  }

  async getEmailLogs(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    // TODO: Implement actual email logs when logging is properly configured
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

  async getEmailStats(params: {
    startDate?: string;
    endDate?: string;
  }) {
    // TODO: Implement actual email stats when analytics is properly configured
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

  private async sendDirectEmail(mailOptions: any): Promise<void> {
    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent directly to ${mailOptions.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email directly to ${mailOptions.to}:`, error);
    }
  }
}