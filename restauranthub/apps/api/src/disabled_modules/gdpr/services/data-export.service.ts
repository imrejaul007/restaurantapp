import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { RedisService } from '../../../redis/redis.service';
import { DataExportRequestDto, DataCategory, ExportFormat } from '../dto/data-export-request.dto';
import { AuditLogService } from './audit-log.service';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface ExportRequest {
  id: string;
  userId: string;
  categories: DataCategory[];
  format: ExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt: Date;
  metadata?: any;
}

@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);
  private readonly exportDir = process.env.EXPORT_DIR || '/tmp/exports';

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async requestDataExport(
    userId: string,
    exportRequestDto: DataExportRequestDto,
  ): Promise<{ requestId: string; estimatedCompletion: Date }> {
    try {
      // Check for existing pending requests
      const existingRequest = await this.prisma.dataExportRequest.findFirst({
        where: {
          userId,
          status: { in: ['pending', 'processing'] },
        },
      });

      if (existingRequest) {
        throw new BadRequestException('You already have a pending export request');
      }

      // Create export request
      const requestId = crypto.randomUUID();
      const estimatedCompletion = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const exportRequest = await this.prisma.dataExportRequest.create({
        data: {
          id: requestId,
          userId,
          categories: exportRequestDto.categories,
          format: exportRequestDto.format,
          status: 'pending',
          requestedAt: new Date(),
          expiresAt,
          metadata: {
            includeMetadata: exportRequestDto.includeMetadata,
            includeDeleted: exportRequestDto.includeDeleted,
            dateFrom: exportRequestDto.dateFrom,
            dateTo: exportRequestDto.dateTo,
            emailAddress: exportRequestDto.emailAddress,
            notes: exportRequestDto.notes,
          },
        },
      });

      // Log the export request
      await this.auditLogService.logGdprRequest(userId, 'data_export', {
        requestId,
        categories: exportRequestDto.categories,
        format: exportRequestDto.format,
      });

      // Queue the export job
      await this.queueExportJob(requestId);

      this.logger.log(`Data export requested for user ${userId}, request ID: ${requestId}`);

      return {
        requestId,
        estimatedCompletion,
      };
    } catch (error) {
      this.logger.error(`Failed to request data export for user ${userId}:`, error);
      throw error;
    }
  }

  async getExportStatus(userId: string, requestId: string): Promise<ExportRequest> {
    try {
      const exportRequest = await this.prisma.dataExportRequest.findFirst({
        where: { id: requestId, userId },
      });

      if (!exportRequest) {
        throw new NotFoundException('Export request not found');
      }

      return {
        id: exportRequest.id,
        userId: exportRequest.userId,
        categories: exportRequest.categories as DataCategory[],
        format: exportRequest.format as ExportFormat,
        status: exportRequest.status as any,
        requestedAt: exportRequest.requestedAt,
        completedAt: exportRequest.completedAt,
        downloadUrl: exportRequest.downloadUrl,
        expiresAt: exportRequest.expiresAt,
        metadata: exportRequest.metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to get export status for request ${requestId}:`, error);
      throw error;
    }
  }

  async downloadExportedData(userId: string, requestId: string): Promise<{ downloadUrl: string; expiresAt: Date }> {
    try {
      const exportRequest = await this.prisma.dataExportRequest.findFirst({
        where: { id: requestId, userId },
      });

      if (!exportRequest) {
        throw new NotFoundException('Export request not found');
      }

      if (exportRequest.status !== 'completed') {
        throw new BadRequestException('Export is not completed yet');
      }

      if (new Date() > exportRequest.expiresAt) {
        throw new BadRequestException('Export has expired');
      }

      // Log data download
      await this.auditLogService.logDataAccess(userId, 'data_export_download', requestId);

      return {
        downloadUrl: exportRequest.downloadUrl!,
        expiresAt: exportRequest.expiresAt,
      };
    } catch (error) {
      this.logger.error(`Failed to download exported data for request ${requestId}:`, error);
      throw error;
    }
  }

  private async queueExportJob(requestId: string): Promise<void> {
    try {
      // Add to Redis queue for background processing
      await this.redisService.sadd('export_queue', requestId);
      this.logger.log(`Export job queued for request ${requestId}`);
    } catch (error) {
      this.logger.error(`Failed to queue export job for request ${requestId}:`, error);
    }
  }

  async processExportRequest(requestId: string): Promise<void> {
    try {
      // Update status to processing
      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'processing' },
      });

      const exportRequest = await this.prisma.dataExportRequest.findUnique({
        where: { id: requestId },
      });

      if (!exportRequest) {
        throw new NotFoundException('Export request not found');
      }

      // Collect user data
      const userData = await this.collectUserData(
        exportRequest.userId,
        exportRequest.categories as DataCategory[],
        exportRequest.metadata,
      );

      // Generate export file
      const filePath = await this.generateExportFile(
        requestId,
        userData,
        exportRequest.format as ExportFormat,
      );

      // Generate secure download URL
      const downloadUrl = await this.generateDownloadUrl(requestId, filePath);

      // Update request with completion
      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          downloadUrl,
        },
      });

      // Send notification email if requested
      if (exportRequest.metadata?.emailAddress) {
        await this.sendExportNotification(
          exportRequest.metadata.emailAddress,
          requestId,
          downloadUrl,
        );
      }

      // Log completion
      await this.auditLogService.logDataExport(exportRequest.userId, {
        requestId,
        categories: exportRequest.categories as string[],
        format: exportRequest.format,
        status: 'completed',
      });

      this.logger.log(`Data export completed for request ${requestId}`);
    } catch (error) {
      this.logger.error(`Failed to process export request ${requestId}:`, error);

      // Update status to failed
      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'failed' },
      });
    }
  }

  private async collectUserData(
    userId: string,
    categories: DataCategory[],
    metadata: any,
  ): Promise<any> {
    const userData: any = {
      userId,
      exportedAt: new Date().toISOString(),
      categories: [],
    };

    for (const category of categories) {
      if (category === DataCategory.ALL) {
        // Export all data
        userData.categories = await this.getAllUserData(userId, metadata);
        break;
      } else {
        const categoryData = await this.getCategoryData(userId, category, metadata);
        if (categoryData) {
          userData.categories.push(categoryData);
        }
      }
    }

    return userData;
  }

  private async getAllUserData(userId: string, metadata: any): Promise<any[]> {
    const allData = [];

    // User profile
    const profile = await this.getCategoryData(userId, DataCategory.PROFILE, metadata);
    if (profile) allData.push(profile);

    // Authentication data
    const auth = await this.getCategoryData(userId, DataCategory.AUTHENTICATION, metadata);
    if (auth) allData.push(auth);

    // Restaurant data
    const restaurant = await this.getCategoryData(userId, DataCategory.RESTAURANT_DATA, metadata);
    if (restaurant) allData.push(restaurant);

    // Orders
    const orders = await this.getCategoryData(userId, DataCategory.ORDERS, metadata);
    if (orders) allData.push(orders);

    // Job applications
    const jobs = await this.getCategoryData(userId, DataCategory.JOB_APPLICATIONS, metadata);
    if (jobs) allData.push(jobs);

    // Communications
    const communications = await this.getCategoryData(userId, DataCategory.COMMUNICATIONS, metadata);
    if (communications) allData.push(communications);

    // Preferences
    const preferences = await this.getCategoryData(userId, DataCategory.PREFERENCES, metadata);
    if (preferences) allData.push(preferences);

    // Consent records
    const consent = await this.getCategoryData(userId, DataCategory.CONSENT_RECORDS, metadata);
    if (consent) allData.push(consent);

    // Activity logs
    const logs = await this.getCategoryData(userId, DataCategory.ACTIVITY_LOGS, metadata);
    if (logs) allData.push(logs);

    return allData;
  }

  private async getCategoryData(userId: string, category: DataCategory, metadata: any): Promise<any> {
    const whereClause = this.buildWhereClause(userId, metadata);

    switch (category) {
      case DataCategory.PROFILE:
        return {
          category: 'profile',
          data: await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
              profile: true,
              employeeProfile: true,
              restaurant: true,
              vendor: true,
            },
          }),
        };

      case DataCategory.AUTHENTICATION:
        return {
          category: 'authentication',
          data: {
            sessions: await this.prisma.userSession.findMany({
              where: { userId, ...whereClause.dateFilter },
            }),
            loginHistory: await this.prisma.auditLog.findMany({
              where: {
                userId,
                action: { in: ['login', 'logout', 'password_change'] },
                ...whereClause.dateFilter,
              },
            }),
          },
        };

      case DataCategory.RESTAURANT_DATA:
        return {
          category: 'restaurant_data',
          data: await this.prisma.restaurant.findMany({
            where: { userId, ...whereClause.dateFilter },
            include: {
              branches: true,
              menu: true,
              reviews: true,
            },
          }),
        };

      case DataCategory.ORDERS:
        return {
          category: 'orders',
          data: await this.prisma.order.findMany({
            where: {
              OR: [
                { customerId: userId },
                { restaurant: { userId } },
              ],
              ...whereClause.dateFilter,
            },
            include: {
              items: true,
              payments: true,
            },
          }),
        };

      case DataCategory.JOB_APPLICATIONS:
        return {
          category: 'job_applications',
          data: {
            applications: await this.prisma.jobApplication.findMany({
              where: {
                employee: { userId },
                ...whereClause.dateFilter,
              },
              include: {
                job: true,
              },
            }),
            jobsPosted: await this.prisma.job.findMany({
              where: {
                restaurant: { userId },
                ...whereClause.dateFilter,
              },
              include: {
                applications: true,
              },
            }),
          },
        };

      case DataCategory.COMMUNICATIONS:
        return {
          category: 'communications',
          data: {
            messages: await this.prisma.message.findMany({
              where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
                ...whereClause.dateFilter,
              },
            }),
            notifications: await this.prisma.notification.findMany({
              where: { userId, ...whereClause.dateFilter },
            }),
          },
        };

      case DataCategory.PREFERENCES:
        return {
          category: 'preferences',
          data: await this.prisma.userPreferences.findMany({
            where: { userId },
          }),
        };

      case DataCategory.CONSENT_RECORDS:
        return {
          category: 'consent_records',
          data: await this.prisma.userConsent.findMany({
            where: { userId, ...whereClause.dateFilter },
          }),
        };

      case DataCategory.ACTIVITY_LOGS:
        return {
          category: 'activity_logs',
          data: await this.auditLogService.getAuditLogs(userId, {
            dateFrom: metadata.dateFrom ? new Date(metadata.dateFrom) : undefined,
            dateTo: metadata.dateTo ? new Date(metadata.dateTo) : undefined,
            limit: 1000,
          }),
        };

      default:
        return null;
    }
  }

  private buildWhereClause(userId: string, metadata: any): any {
    const whereClause: any = {};

    if (metadata.dateFrom || metadata.dateTo) {
      whereClause.dateFilter = {};
      if (metadata.dateFrom) {
        whereClause.dateFilter.createdAt = { gte: new Date(metadata.dateFrom) };
      }
      if (metadata.dateTo) {
        whereClause.dateFilter.createdAt = {
          ...whereClause.dateFilter.createdAt,
          lte: new Date(metadata.dateTo),
        };
      }
    }

    return whereClause;
  }

  private async generateExportFile(
    requestId: string,
    userData: any,
    format: ExportFormat,
  ): Promise<string> {
    const filename = `export_${requestId}.${format}`;
    const filePath = path.join(this.exportDir, filename);

    // Ensure export directory exists
    await fs.mkdir(this.exportDir, { recursive: true });

    let content: string;

    switch (format) {
      case ExportFormat.JSON:
        content = JSON.stringify(userData, null, 2);
        break;

      case ExportFormat.CSV:
        content = this.convertToCSV(userData);
        break;

      case ExportFormat.XML:
        content = this.convertToXML(userData);
        break;

      case ExportFormat.PDF:
        // This would require a PDF library like puppeteer or jsPDF
        throw new BadRequestException('PDF export not yet implemented');

      default:
        throw new BadRequestException('Unsupported export format');
    }

    await fs.writeFile(filePath, content, 'utf8');
    return filePath;
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion - in production, use a proper CSV library
    const rows = [];
    rows.push('Category,Type,Data');

    if (data.categories && Array.isArray(data.categories)) {
      for (const category of data.categories) {
        if (category.data && typeof category.data === 'object') {
          rows.push(`${category.category},object,"${JSON.stringify(category.data).replace(/"/g, '""')}"`);
        }
      }
    }

    return rows.join('\n');
  }

  private convertToXML(data: any): string {
    // Simplified XML conversion - in production, use a proper XML library
    const xmlData = JSON.stringify(data)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    return `<?xml version="1.0" encoding="UTF-8"?>
<dataExport>
  <metadata>
    <exportedAt>${data.exportedAt}</exportedAt>
    <userId>${data.userId}</userId>
  </metadata>
  <data>${xmlData}</data>
</dataExport>`;
  }

  private async generateDownloadUrl(requestId: string, filePath: string): Promise<string> {
    // In production, upload to S3 or similar service and return signed URL
    // For now, return a local URL with token
    const token = crypto.randomBytes(32).toString('hex');
    await this.redisService.set(`download_token:${token}`, filePath, 604800); // 7 days

    return `${process.env.API_URL}/api/v1/gdpr/download/${token}`;
  }

  private async sendExportNotification(
    emailAddress: string,
    requestId: string,
    downloadUrl: string,
  ): Promise<void> {
    try {
      await this.emailService.sendEmail({
        to: emailAddress,
        subject: 'Your Data Export is Ready',
        template: 'data-export-ready',
        data: {
          requestId,
          downloadUrl,
          expiresIn: '7 days',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send export notification email: ${error}`);
    }
  }

  async cleanupExpiredExports(): Promise<void> {
    try {
      const expiredRequests = await this.prisma.dataExportRequest.findMany({
        where: {
          status: 'completed',
          expiresAt: { lt: new Date() },
        },
      });

      for (const request of expiredRequests) {
        if (request.downloadUrl) {
          // Delete the file
          const filename = request.downloadUrl.split('/').pop();
          if (filename) {
            const filePath = path.join(this.exportDir, filename);
            try {
              await fs.unlink(filePath);
            } catch (error) {
              this.logger.warn(`Failed to delete export file ${filePath}: ${error}`);
            }
          }
        }

        // Update request status
        await this.prisma.dataExportRequest.update({
          where: { id: request.id },
          data: { status: 'expired', downloadUrl: null },
        });
      }

      this.logger.log(`Cleaned up ${expiredRequests.length} expired export requests`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired exports:', error);
    }
  }

  async getExportStatistics(): Promise<any> {
    try {
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalRequests,
        pendingRequests,
        completedRequests,
        recentRequests,
        requestsByFormat,
        requestsByCategory,
      ] = await Promise.all([
        this.prisma.dataExportRequest.count(),
        this.prisma.dataExportRequest.count({ where: { status: 'pending' } }),
        this.prisma.dataExportRequest.count({ where: { status: 'completed' } }),
        this.prisma.dataExportRequest.count({ where: { requestedAt: { gte: last30Days } } }),
        this.prisma.dataExportRequest.groupBy({
          by: ['format'],
          _count: { format: true },
          orderBy: { _count: { format: 'desc' } },
        }),
        this.prisma.dataExportRequest.groupBy({
          by: ['categories'],
          _count: { categories: true },
          orderBy: { _count: { categories: 'desc' } },
          take: 10,
        }),
      ]);

      return {
        totalRequests,
        pendingRequests,
        completedRequests,
        recentRequests,
        completionRate: totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0,
        requestsByFormat: requestsByFormat.map(item => ({
          format: item.format,
          count: item._count.format,
        })),
        requestsByCategory: requestsByCategory.map(item => ({
          categories: item.categories,
          count: item._count.categories,
        })),
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get export statistics:', error);
      return {
        totalRequests: 0,
        pendingRequests: 0,
        completedRequests: 0,
        recentRequests: 0,
        completionRate: 0,
        requestsByFormat: [],
        requestsByCategory: [],
        lastUpdated: new Date(),
      };
    }
  }
}