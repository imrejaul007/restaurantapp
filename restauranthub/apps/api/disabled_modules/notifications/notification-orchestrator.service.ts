import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CircuitBreakerService } from '../../common/circuit-breaker.service';
import { DatabaseCircuitBreaker, ExternalApiCircuitBreaker } from '../../decorators/circuit-breaker.decorator';
import { ResilientDatabaseService } from '../../services/resilient-database.service';
import { ResilientHttpService } from '../../services/resilient-http.service';
import { WebsocketService } from '../websocket/websocket.service';

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  category: 'order' | 'delivery' | 'payment' | 'marketing' | 'system';
  variables: string[];
}

export interface NotificationRequest {
  templateId: string;
  recipient: {
    email?: string;
    phone?: string;
    userId?: string;
  };
  variables: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduleAt?: Date;
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
}

@Injectable()
export class NotificationOrchestratorService {
  private readonly logger = new Logger(NotificationOrchestratorService.name);

  constructor(
    private prisma: PrismaService,
    private circuitBreaker: CircuitBreakerService,
    private resilientDb: ResilientDatabaseService,
    private resilientHttp: ResilientHttpService,
    private websocketService: WebsocketService,
  ) {}

  @DatabaseCircuitBreaker()
  async sendNotification(request: NotificationRequest) {
    this.logger.log(`Sending notification using template ${request.templateId}`);

    const template = await this.resilientDb.executeReadOperation(
      () => this.prisma.notificationTemplate.findUnique({
        where: { id: request.templateId }
      }),
      { cacheKey: `template:${request.templateId}`, cacheTtl: 300000 }
    );

    if (!template) {
      throw new Error(`Notification template ${request.templateId} not found`);
    }

    const notification = await this.resilientDb.executeWriteOperation(
      () => this.prisma.notification.create({
        data: {
          templateId: request.templateId,
          recipientEmail: request.recipient.email,
          recipientPhone: request.recipient.phone,
          userId: request.recipient.userId,
          variables: request.variables,
          priority: request.priority,
          status: request.scheduleAt ? 'scheduled' : 'pending',
          scheduledAt: request.scheduleAt,
          channels: request.channels,
        }
      }),
      { circuitBreakerName: 'notification-creation' }
    );

    if (request.scheduleAt && request.scheduleAt > new Date()) {
      await this.scheduleNotification(notification.id, request.scheduleAt);
      return { notificationId: notification.id, status: 'scheduled' };
    }

    const results = await this.processNotificationChannels(notification.id, template, request);

    await this.resilientDb.executeWriteOperation(
      () => this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: results.success ? 'sent' : 'failed',
          sentAt: results.success ? new Date() : undefined,
          failureReason: results.success ? undefined : results.error,
          deliveryResults: results.channelResults,
        }
      }),
      { circuitBreakerName: 'notification-update' }
    );

    return {
      notificationId: notification.id,
      status: results.success ? 'sent' : 'failed',
      channelResults: results.channelResults
    };
  }

  @ExternalApiCircuitBreaker('email-service')
  async sendEmail(templateData: any, recipient: string, variables: Record<string, any>) {
    const processedContent = this.processTemplate(templateData.content, variables);
    const processedSubject = this.processTemplate(templateData.subject, variables);

    try {
      const result = await this.resilientHttp.post('/email/send', {
        to: recipient,
        subject: processedSubject,
        html: processedContent,
        template: templateData.name,
        variables
      }, {
        circuitBreakerName: 'email-service',
        retryAttempts: 3,
        timeoutMs: 10000
      });

      this.logger.log(`Email sent successfully to ${recipient}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${recipient}:`, error);
      return { success: false, error: error.message };
    }
  }

  @ExternalApiCircuitBreaker('sms-service')
  async sendSMS(templateData: any, recipient: string, variables: Record<string, any>) {
    const processedContent = this.processTemplate(templateData.content, variables);

    try {
      const result = await this.resilientHttp.post('/sms/send', {
        to: recipient,
        message: processedContent,
        template: templateData.name
      }, {
        circuitBreakerName: 'sms-service',
        retryAttempts: 2,
        timeoutMs: 5000
      });

      this.logger.log(`SMS sent successfully to ${recipient}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${recipient}:`, error);
      return { success: false, error: error.message };
    }
  }

  @ExternalApiCircuitBreaker('push-service')
  async sendPushNotification(templateData: any, userId: string, variables: Record<string, any>) {
    const processedContent = this.processTemplate(templateData.content, variables);
    const processedSubject = this.processTemplate(templateData.subject, variables);

    try {
      const userDevices = await this.resilientDb.executeReadOperation(
        () => this.prisma.userDevice.findMany({
          where: { userId, isActive: true },
          select: { deviceToken: true, platform: true }
        }),
        { cacheKey: `user:${userId}:devices`, cacheTtl: 300000 }
      );

      if (userDevices.length === 0) {
        return { success: false, error: 'No active devices found for user' };
      }

      const pushPromises = userDevices.map(device =>
        this.resilientHttp.post('/push/send', {
          token: device.deviceToken,
          title: processedSubject,
          body: processedContent,
          platform: device.platform,
          data: variables
        }, {
          circuitBreakerName: 'push-service',
          retryAttempts: 2,
          timeoutMs: 5000
        })
      );

      const results = await Promise.allSettled(pushPromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;

      this.logger.log(`Push notifications sent to ${successCount}/${userDevices.length} devices for user ${userId}`);
      return {
        success: successCount > 0,
        devicesTargeted: userDevices.length,
        devicesReached: successCount
      };
    } catch (error) {
      this.logger.error(`Failed to send push notification to user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async sendInAppNotification(templateData: any, userId: string, variables: Record<string, any>) {
    const processedContent = this.processTemplate(templateData.content, variables);
    const processedSubject = this.processTemplate(templateData.subject, variables);

    try {
      const inAppNotification = await this.resilientDb.executeWriteOperation(
        () => this.prisma.inAppNotification.create({
          data: {
            userId,
            title: processedSubject,
            content: processedContent,
            type: templateData.category,
            data: variables,
            isRead: false,
          }
        }),
        { circuitBreakerName: 'in-app-notification' }
      );

      await this.websocketService.sendInAppNotification(userId, {
        id: inAppNotification.id,
        title: processedSubject,
        content: processedContent,
        type: templateData.category,
        createdAt: inAppNotification.createdAt,
        data: variables
      });

      this.logger.log(`In-app notification sent to user ${userId}`);
      return { success: true, notificationId: inAppNotification.id };
    } catch (error) {
      this.logger.error(`Failed to send in-app notification to user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  @DatabaseCircuitBreaker()
  async getNotificationHistory(userId: string, filters: {
    type?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { type, status, startDate, endDate, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (type) where.template = { category: type };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [notifications, total] = await Promise.all([
      this.resilientDb.executeReadOperation(
        () => this.prisma.notification.findMany({
          where,
          include: {
            template: { select: { name: true, category: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        { cacheKey: `user:${userId}:notifications:${JSON.stringify(filters)}`, cacheTtl: 60000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.notification.count({ where }),
        { cacheKey: `user:${userId}:notifications:count:${JSON.stringify(where)}`, cacheTtl: 60000 }
      )
    ]);

    return {
      data: notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  @DatabaseCircuitBreaker()
  async getNotificationAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
    templateId?: string;
    category?: string;
  }) {
    const { startDate, endDate, templateId, category } = filters;

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (templateId) where.templateId = templateId;
    if (category) where.template = { category };

    const [
      totalNotifications,
      sentNotifications,
      failedNotifications,
      channelPerformance,
      templatePerformance
    ] = await Promise.all([
      this.resilientDb.executeReadOperation(
        () => this.prisma.notification.count({ where }),
        { cacheKey: `analytics:notifications:total:${JSON.stringify(where)}`, cacheTtl: 300000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.notification.count({ where: { ...where, status: 'sent' } }),
        { cacheKey: `analytics:notifications:sent:${JSON.stringify(where)}`, cacheTtl: 300000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.notification.count({ where: { ...where, status: 'failed' } }),
        { cacheKey: `analytics:notifications:failed:${JSON.stringify(where)}`, cacheTtl: 300000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.notification.groupBy({
          by: ['channels'],
          where,
          _count: { id: true }
        }),
        { cacheKey: `analytics:notifications:channels:${JSON.stringify(where)}`, cacheTtl: 300000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.notification.groupBy({
          by: ['templateId'],
          where,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        }),
        { cacheKey: `analytics:notifications:templates:${JSON.stringify(where)}`, cacheTtl: 300000 }
      )
    ]);

    return {
      totalNotifications,
      sentNotifications,
      failedNotifications,
      deliveryRate: totalNotifications > 0 ? (sentNotifications / totalNotifications) * 100 : 0,
      channelPerformance,
      templatePerformance
    };
  }

  @ExternalApiCircuitBreaker('scheduler-service')
  async scheduleNotification(notificationId: string, scheduleAt: Date) {
    try {
      await this.resilientHttp.post('/scheduler/schedule', {
        notificationId,
        scheduleAt,
        action: 'send_notification'
      }, {
        circuitBreakerName: 'scheduler-service',
        retryAttempts: 2,
        timeoutMs: 5000
      });

      this.logger.log(`Notification ${notificationId} scheduled for ${scheduleAt}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to schedule notification ${notificationId}:`, error);
      return { success: false, error: error.message };
    }
  }

  @DatabaseCircuitBreaker()
  async bulkSendNotifications(requests: NotificationRequest[]) {
    this.logger.log(`Processing bulk notification batch of ${requests.length} notifications`);

    const results = [];

    for (const request of requests) {
      try {
        const result = await this.sendNotification(request);
        results.push({ request, result });
      } catch (error) {
        this.logger.error(`Failed to send notification in bulk:`, error);
        results.push({
          request,
          result: { success: false, error: error.message }
        });
      }
    }

    const successCount = results.filter(r => r.result.status === 'sent').length;
    this.logger.log(`Bulk notification completed: ${successCount}/${requests.length} sent successfully`);

    return {
      total: requests.length,
      successful: successCount,
      failed: requests.length - successCount,
      results
    };
  }

  private async processNotificationChannels(notificationId: string, template: any, request: NotificationRequest) {
    const channelResults: Record<string, any> = {};
    let hasSuccess = false;

    for (const channel of request.channels) {
      try {
        let result;

        switch (channel) {
          case 'email':
            if (request.recipient.email) {
              result = await this.sendEmail(template, request.recipient.email, request.variables);
            } else {
              result = { success: false, error: 'No email address provided' };
            }
            break;

          case 'sms':
            if (request.recipient.phone) {
              result = await this.sendSMS(template, request.recipient.phone, request.variables);
            } else {
              result = { success: false, error: 'No phone number provided' };
            }
            break;

          case 'push':
            if (request.recipient.userId) {
              result = await this.sendPushNotification(template, request.recipient.userId, request.variables);
            } else {
              result = { success: false, error: 'No user ID provided' };
            }
            break;

          case 'in_app':
            if (request.recipient.userId) {
              result = await this.sendInAppNotification(template, request.recipient.userId, request.variables);
            } else {
              result = { success: false, error: 'No user ID provided' };
            }
            break;

          default:
            result = { success: false, error: `Unsupported channel: ${channel}` };
        }

        channelResults[channel] = result;
        if (result.success) hasSuccess = true;

      } catch (error) {
        this.logger.error(`Channel ${channel} failed for notification ${notificationId}:`, error);
        channelResults[channel] = { success: false, error: error.message };
      }
    }

    return {
      success: hasSuccess,
      channelResults,
      error: hasSuccess ? undefined : 'All channels failed'
    };
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(placeholder, String(value));
    }

    const unprocessedPlaceholders = processed.match(/{{[^}]+}}/g);
    if (unprocessedPlaceholders) {
      this.logger.warn(`Unprocessed template variables found: ${unprocessedPlaceholders.join(', ')}`);
    }

    return processed;
  }
}