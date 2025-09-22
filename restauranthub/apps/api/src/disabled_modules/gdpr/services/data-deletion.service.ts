import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { RedisService } from '../../../redis/redis.service';
import { DataDeletionRequestDto, DeletionScope, DeletionReason } from '../dto/data-deletion-request.dto';
import { AuditLogService } from './audit-log.service';
import * as crypto from 'crypto';

export interface DeletionRequest {
  id: string;
  userId: string;
  scope: DeletionScope;
  reason: DeletionReason;
  categories?: string[];
  details?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: Date;
  scheduledFor?: Date;
  completedAt?: Date;
  confirmationToken?: string;
  retainForLegalReasons: boolean;
  metadata?: any;
}

@Injectable()
export class DataDeletionService {
  private readonly logger = new Logger(DataDeletionService.name);
  private readonly deletionGracePeriod = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async requestDataDeletion(
    userId: string,
    deletionRequestDto: DataDeletionRequestDto,
  ): Promise<{ requestId: string; scheduledFor: Date; confirmationToken: string }> {
    try {
      // Check for existing pending requests
      const existingRequest = await this.prisma.dataDeletionRequest.findFirst({
        where: {
          userId,
          status: { in: ['pending', 'processing'] },
        },
      });

      if (existingRequest) {
        throw new BadRequestException('You already have a pending deletion request');
      }

      // Validate scope and categories
      if (deletionRequestDto.scope === DeletionScope.SPECIFIC_CATEGORIES &&
          (!deletionRequestDto.categories || deletionRequestDto.categories.length === 0)) {
        throw new BadRequestException('Categories must be specified for specific category deletion');
      }

      // Create deletion request
      const requestId = crypto.randomUUID();
      const confirmationToken = crypto.randomBytes(32).toString('hex');
      const scheduledFor = new Date(Date.now() + this.deletionGracePeriod);

      const deletionRequest = await this.prisma.dataDeletionRequest.create({
        data: {
          id: requestId,
          userId,
          scope: deletionRequestDto.scope,
          reason: deletionRequestDto.reason,
          categories: deletionRequestDto.categories || [],
          details: deletionRequestDto.details,
          status: 'pending',
          requestedAt: new Date(),
          scheduledFor,
          confirmationToken,
          retainForLegalReasons: deletionRequestDto.retainForLegalReasons || false,
          metadata: {
            confirmUnderstanding: deletionRequestDto.confirmUnderstanding,
            userAgent: 'api_request',
            gracePeriodDays: 30,
          },
        },
      });

      // Store confirmation token in Redis for verification
      await this.redisService.set(
        `deletion_token:${confirmationToken}`,
        requestId,
        this.deletionGracePeriod / 1000, // Redis expects seconds
      );

      // Log the deletion request
      await this.auditLogService.logGdprRequest(userId, 'data_deletion', {
        requestId,
        scope: deletionRequestDto.scope,
        reason: deletionRequestDto.reason,
        categories: deletionRequestDto.categories,
        scheduledFor,
      });

      // Send confirmation email
      await this.sendDeletionConfirmationEmail(userId, requestId, confirmationToken, scheduledFor);

      this.logger.log(`Data deletion requested for user ${userId}, request ID: ${requestId}, scheduled for: ${scheduledFor.toISOString()}`);

      return {
        requestId,
        scheduledFor,
        confirmationToken,
      };
    } catch (error) {
      this.logger.error(`Failed to request data deletion for user ${userId}:`, error);
      throw error;
    }
  }

  async confirmDeletionRequest(confirmationToken: string): Promise<{ requestId: string; confirmed: boolean }> {
    try {
      // Verify token
      const requestId = await this.redisService.get(`deletion_token:${confirmationToken}`);
      if (!requestId) {
        throw new BadRequestException('Invalid or expired confirmation token');
      }

      // Update request status
      const deletionRequest = await this.prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: {
          status: 'processing',
          metadata: {
            confirmedAt: new Date(),
            confirmed: true,
          },
        },
      });

      // Remove token from Redis
      await this.redisService.del(`deletion_token:${confirmationToken}`);

      // Queue immediate processing
      await this.queueDeletionJob(requestId);

      // Log confirmation
      await this.auditLogService.logGdprRequest(deletionRequest.userId, 'deletion_confirmed', {
        requestId,
        confirmedAt: new Date(),
      });

      this.logger.log(`Data deletion confirmed for request ${requestId}`);

      return {
        requestId,
        confirmed: true,
      };
    } catch (error) {
      this.logger.error(`Failed to confirm deletion request with token ${confirmationToken}:`, error);
      throw error;
    }
  }

  async cancelDeletionRequest(userId: string, requestId: string): Promise<void> {
    try {
      const deletionRequest = await this.prisma.dataDeletionRequest.findFirst({
        where: { id: requestId, userId },
      });

      if (!deletionRequest) {
        throw new NotFoundException('Deletion request not found');
      }

      if (deletionRequest.status !== 'pending') {
        throw new BadRequestException('Can only cancel pending deletion requests');
      }

      // Update status to cancelled
      await this.prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: { status: 'cancelled' },
      });

      // Remove confirmation token if exists
      if (deletionRequest.confirmationToken) {
        await this.redisService.del(`deletion_token:${deletionRequest.confirmationToken}`);
      }

      // Log cancellation
      await this.auditLogService.logGdprRequest(userId, 'deletion_cancelled', {
        requestId,
        cancelledAt: new Date(),
      });

      this.logger.log(`Data deletion cancelled for request ${requestId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel deletion request ${requestId}:`, error);
      throw error;
    }
  }

  async getDeletionStatus(userId: string, requestId: string): Promise<DeletionRequest> {
    try {
      const deletionRequest = await this.prisma.dataDeletionRequest.findFirst({
        where: { id: requestId, userId },
      });

      if (!deletionRequest) {
        throw new NotFoundException('Deletion request not found');
      }

      return {
        id: deletionRequest.id,
        userId: deletionRequest.userId,
        scope: deletionRequest.scope as DeletionScope,
        reason: deletionRequest.reason as DeletionReason,
        categories: deletionRequest.categories,
        details: deletionRequest.details,
        status: deletionRequest.status as any,
        requestedAt: deletionRequest.requestedAt,
        scheduledFor: deletionRequest.scheduledFor,
        completedAt: deletionRequest.completedAt,
        confirmationToken: deletionRequest.confirmationToken,
        retainForLegalReasons: deletionRequest.retainForLegalReasons,
        metadata: deletionRequest.metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to get deletion status for request ${requestId}:`, error);
      throw error;
    }
  }

  private async queueDeletionJob(requestId: string): Promise<void> {
    try {
      // Add to Redis queue for background processing
      await this.redisService.sadd('deletion_queue', requestId);
      this.logger.log(`Deletion job queued for request ${requestId}`);
    } catch (error) {
      this.logger.error(`Failed to queue deletion job for request ${requestId}:`, error);
    }
  }

  async processDeletionRequest(requestId: string): Promise<void> {
    try {
      const deletionRequest = await this.prisma.dataDeletionRequest.findUnique({
        where: { id: requestId },
      });

      if (!deletionRequest) {
        throw new NotFoundException('Deletion request not found');
      }

      if (deletionRequest.status !== 'processing') {
        this.logger.warn(`Deletion request ${requestId} is not in processing status, skipping`);
        return;
      }

      // Backup user data before deletion
      const backupData = await this.createDataBackup(
        deletionRequest.userId,
        deletionRequest.scope as DeletionScope,
        deletionRequest.categories,
      );

      // Perform the actual deletion
      const deletionResult = await this.performDataDeletion(
        deletionRequest.userId,
        deletionRequest.scope as DeletionScope,
        deletionRequest.categories,
        deletionRequest.retainForLegalReasons,
      );

      // Update request with completion
      await this.prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          metadata: {
            ...deletionRequest.metadata,
            deletionResult,
            backupCreated: true,
            backupId: backupData.backupId,
          },
        },
      });

      // Log completion
      await this.auditLogService.logDataDeletion(
        deletionRequest.userId,
        'user_data',
        requestId,
        deletionResult,
        {
          requestId,
          scope: deletionRequest.scope,
          categories: deletionRequest.categories,
          backupId: backupData.backupId,
        },
      );

      // Send completion notification
      await this.sendDeletionCompletionEmail(deletionRequest.userId, requestId);

      this.logger.log(`Data deletion completed for request ${requestId}`);
    } catch (error) {
      this.logger.error(`Failed to process deletion request ${requestId}:`, error);

      // Update status to failed
      await this.prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: { status: 'failed' },
      });
    }
  }

  private async createDataBackup(
    userId: string,
    scope: DeletionScope,
    categories?: string[],
  ): Promise<{ backupId: string; backupPath: string }> {
    try {
      const backupId = crypto.randomUUID();

      // In production, this would backup to secure storage
      // For now, we'll create an audit record
      await this.auditLogService.logDataAccess(userId, 'backup_before_deletion', backupId, {
        scope,
        categories,
        backupId,
        createdAt: new Date(),
      });

      return {
        backupId,
        backupPath: `/backups/${backupId}`,
      };
    } catch (error) {
      this.logger.error(`Failed to create data backup for user ${userId}:`, error);
      throw error;
    }
  }

  private async performDataDeletion(
    userId: string,
    scope: DeletionScope,
    categories?: string[],
    retainForLegalReasons: boolean = false,
  ): Promise<any> {
    const deletionResult: any = {
      userId,
      scope,
      deletedAt: new Date(),
      deletedItems: {},
    };

    try {
      switch (scope) {
        case DeletionScope.PROFILE_ONLY:
          await this.deleteProfileData(userId, retainForLegalReasons);
          deletionResult.deletedItems.profile = true;
          break;

        case DeletionScope.ALL_DATA:
          await this.deleteAllUserData(userId, retainForLegalReasons);
          deletionResult.deletedItems.all = true;
          break;

        case DeletionScope.SPECIFIC_CATEGORIES:
          if (categories) {
            for (const category of categories) {
              await this.deleteCategoryData(userId, category, retainForLegalReasons);
              deletionResult.deletedItems[category] = true;
            }
          }
          break;

        case DeletionScope.ACCOUNT_CLOSURE:
          await this.performAccountClosure(userId, retainForLegalReasons);
          deletionResult.deletedItems.account = true;
          break;

        default:
          throw new BadRequestException('Invalid deletion scope');
      }

      return deletionResult;
    } catch (error) {
      this.logger.error(`Failed to perform data deletion for user ${userId}:`, error);
      throw error;
    }
  }

  private async deleteProfileData(userId: string, retainForLegal: boolean): Promise<void> {
    if (!retainForLegal) {
      await this.prisma.userProfile.deleteMany({ where: { userId } });
      await this.prisma.employeeProfile.deleteMany({ where: { userId } });
    } else {
      // Anonymize instead of delete
      await this.prisma.userProfile.updateMany({
        where: { userId },
        data: {
          firstName: 'DELETED',
          lastName: 'USER',
          phone: null,
          dateOfBirth: null,
        },
      });
    }
  }

  private async deleteCategoryData(userId: string, category: string, retainForLegal: boolean): Promise<void> {
    switch (category) {
      case 'profile':
        await this.deleteProfileData(userId, retainForLegal);
        break;
      case 'orders':
        if (!retainForLegal) {
          await this.prisma.order.deleteMany({
            where: { customerId: userId },
          });
        }
        break;
      case 'job_applications':
        await this.prisma.jobApplication.deleteMany({
          where: { employee: { userId } },
        });
        break;
      case 'communications':
        await this.prisma.message.deleteMany({
          where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        });
        await this.prisma.notification.deleteMany({ where: { userId } });
        break;
      case 'preferences':
        await this.prisma.userPreferences.deleteMany({ where: { userId } });
        break;
      case 'consent_records':
        await this.prisma.userConsent.deleteMany({ where: { userId } });
        break;
    }
  }

  private async deleteAllUserData(userId: string, retainForLegal: boolean): Promise<void> {
    if (!retainForLegal) {
      // Delete all user-related data
      await this.prisma.$transaction([
        this.prisma.notification.deleteMany({ where: { userId } }),
        this.prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }),
        this.prisma.jobApplication.deleteMany({ where: { employee: { userId } } }),
        this.prisma.order.deleteMany({ where: { customerId: userId } }),
        this.prisma.userPreferences.deleteMany({ where: { userId } }),
        this.prisma.userConsent.deleteMany({ where: { userId } }),
        this.prisma.userProfile.deleteMany({ where: { userId } }),
        this.prisma.employeeProfile.deleteMany({ where: { userId } }),
        this.prisma.restaurant.deleteMany({ where: { userId } }),
        this.prisma.vendor.deleteMany({ where: { userId } }),
      ]);
    } else {
      // Anonymize critical data but retain for legal compliance
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@deleted.local`,
          password: 'DELETED',
          isActive: false,
        },
      });
    }
  }

  private async performAccountClosure(userId: string, retainForLegal: boolean): Promise<void> {
    await this.deleteAllUserData(userId, retainForLegal);

    if (!retainForLegal) {
      // Completely remove the user account
      await this.prisma.user.delete({ where: { id: userId } });
    } else {
      // Mark account as deleted but retain record
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          email: `deleted_${userId}@deleted.local`,
          deletedAt: new Date(),
        },
      });
    }
  }

  private async sendDeletionConfirmationEmail(
    userId: string,
    requestId: string,
    confirmationToken: string,
    scheduledFor: Date,
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (user?.email) {
        const confirmationUrl = `${process.env.WEB_URL}/gdpr/confirm-deletion?token=${confirmationToken}`;

        await this.emailService.sendEmail({
          to: user.email,
          subject: 'Confirm Your Data Deletion Request',
          template: 'data-deletion-confirmation',
          data: {
            requestId,
            confirmationUrl,
            scheduledFor: scheduledFor.toISOString(),
            gracePeriodDays: 30,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send deletion confirmation email: ${error}`);
    }
  }

  private async sendDeletionCompletionEmail(userId: string, requestId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (user?.email) {
        await this.emailService.sendEmail({
          to: user.email,
          subject: 'Your Data Has Been Deleted',
          template: 'data-deletion-complete',
          data: {
            requestId,
            completedAt: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send deletion completion email: ${error}`);
    }
  }

  async processScheduledDeletions(): Promise<void> {
    try {
      // Find all requests scheduled for deletion
      const scheduledRequests = await this.prisma.dataDeletionRequest.findMany({
        where: {
          status: 'pending',
          scheduledFor: { lte: new Date() },
        },
      });

      for (const request of scheduledRequests) {
        // Auto-confirm and process if grace period has expired
        await this.prisma.dataDeletionRequest.update({
          where: { id: request.id },
          data: { status: 'processing' },
        });

        await this.queueDeletionJob(request.id);
      }

      this.logger.log(`Queued ${scheduledRequests.length} scheduled deletion requests`);
    } catch (error) {
      this.logger.error('Failed to process scheduled deletions:', error);
    }
  }

  async getDeletionStatistics(): Promise<any> {
    try {
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalRequests,
        pendingRequests,
        completedRequests,
        recentRequests,
        requestsByReason,
        requestsByScope,
      ] = await Promise.all([
        this.prisma.dataDeletionRequest.count(),
        this.prisma.dataDeletionRequest.count({ where: { status: 'pending' } }),
        this.prisma.dataDeletionRequest.count({ where: { status: 'completed' } }),
        this.prisma.dataDeletionRequest.count({ where: { requestedAt: { gte: last30Days } } }),
        this.prisma.dataDeletionRequest.groupBy({
          by: ['reason'],
          _count: { reason: true },
          orderBy: { _count: { reason: 'desc' } },
        }),
        this.prisma.dataDeletionRequest.groupBy({
          by: ['scope'],
          _count: { scope: true },
          orderBy: { _count: { scope: 'desc' } },
        }),
      ]);

      return {
        totalRequests,
        pendingRequests,
        completedRequests,
        recentRequests,
        completionRate: totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0,
        requestsByReason: requestsByReason.map(item => ({
          reason: item.reason,
          count: item._count.reason,
        })),
        requestsByScope: requestsByScope.map(item => ({
          scope: item.scope,
          count: item._count.scope,
        })),
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get deletion statistics:', error);
      throw error;
    }
  }
}