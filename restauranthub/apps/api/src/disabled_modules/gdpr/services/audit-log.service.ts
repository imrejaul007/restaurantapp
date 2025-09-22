import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logDataAccess(
    userId: string,
    dataType: string,
    entityId?: string,
    metadata?: any,
  ): Promise<void> {
    try {
      await this.createAuditLog({
        userId,
        action: 'data_access',
        entityType: dataType,
        entityId,
        metadata: {
          ...metadata,
          timestamp: new Date(),
          accessType: 'read',
        },
      });
    } catch (error) {
      this.logger.error('Failed to log data access:', error);
    }
  }

  async logDataModification(
    userId: string,
    entityType: string,
    entityId: string,
    oldValues: any,
    newValues: any,
    metadata?: any,
  ): Promise<void> {
    try {
      await this.createAuditLog({
        userId,
        action: 'data_modification',
        entityType,
        entityId,
        oldValues,
        newValues,
        metadata: {
          ...metadata,
          timestamp: new Date(),
          modificationType: 'update',
        },
      });
    } catch (error) {
      this.logger.error('Failed to log data modification:', error);
    }
  }

  async logDataDeletion(
    userId: string,
    entityType: string,
    entityId: string,
    deletedData: any,
    metadata?: any,
  ): Promise<void> {
    try {
      await this.createAuditLog({
        userId,
        action: 'data_deletion',
        entityType,
        entityId,
        oldValues: deletedData,
        metadata: {
          ...metadata,
          timestamp: new Date(),
          deletionType: 'soft_delete',
        },
      });
    } catch (error) {
      this.logger.error('Failed to log data deletion:', error);
    }
  }

  async logConsentChange(
    userId: string,
    consentData: {
      action: string;
      previousConsent?: any;
      newConsent?: any;
      withdrawnConsent?: any;
      reason?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<void> {
    try {
      await this.createAuditLog({
        userId,
        action: consentData.action,
        entityType: 'user_consent',
        oldValues: consentData.previousConsent || consentData.withdrawnConsent,
        newValues: consentData.newConsent,
        metadata: {
          reason: consentData.reason,
          timestamp: new Date(),
        },
        ipAddress: consentData.ipAddress,
        userAgent: consentData.userAgent,
      });
    } catch (error) {
      this.logger.error('Failed to log consent change:', error);
    }
  }

  async logGdprRequest(
    userId: string,
    requestType: string,
    requestData: any,
    metadata?: any,
  ): Promise<void> {
    try {
      await this.createAuditLog({
        userId,
        action: `gdpr_request_${requestType}`,
        entityType: 'gdpr_request',
        newValues: requestData,
        metadata: {
          ...metadata,
          timestamp: new Date(),
          requestType,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log GDPR request:', error);
    }
  }

  async logDataExport(
    userId: string,
    exportData: {
      requestId: string;
      categories: string[];
      format: string;
      status: string;
    },
    metadata?: any,
  ): Promise<void> {
    try {
      await this.createAuditLog({
        userId,
        action: 'data_export',
        entityType: 'data_export',
        entityId: exportData.requestId,
        newValues: exportData,
        metadata: {
          ...metadata,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to log data export:', error);
    }
  }

  async logSecurityEvent(
    userId: string,
    eventType: string,
    eventData: any,
    metadata?: any,
  ): Promise<void> {
    try {
      await this.createAuditLog({
        userId,
        action: `security_${eventType}`,
        entityType: 'security_event',
        newValues: eventData,
        metadata: {
          ...metadata,
          timestamp: new Date(),
          severity: eventData.severity || 'medium',
        },
      });
    } catch (error) {
      this.logger.error('Failed to log security event:', error);
    }
  }

  async getAuditLogs(
    userId: string,
    filters?: {
      action?: string;
      entityType?: string;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
    },
  ): Promise<AuditLogEntry[]> {
    try {
      const where: any = { userId };

      if (filters) {
        if (filters.action) {
          where.action = filters.action;
        }
        if (filters.entityType) {
          where.entityType = filters.entityType;
        }
        if (filters.dateFrom || filters.dateTo) {
          where.timestamp = {};
          if (filters.dateFrom) {
            where.timestamp.gte = filters.dateFrom;
          }
          if (filters.dateTo) {
            where.timestamp.lte = filters.dateTo;
          }
        }
      }

      const auditLogs = await this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters?.limit || 100,
      });

      return auditLogs.map(log => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        oldValues: log.oldValues,
        newValues: log.newValues,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        timestamp: log.timestamp,
      }));
    } catch (error) {
      this.logger.error(`Failed to get audit logs for user ${userId}:`, error);
      throw error;
    }
  }

  async getSystemAuditLogs(filters?: {
    action?: string;
    entityType?: string;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLogEntry[]; total: number }> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.action) {
          where.action = filters.action;
        }
        if (filters.entityType) {
          where.entityType = filters.entityType;
        }
        if (filters.userId) {
          where.userId = filters.userId;
        }
        if (filters.dateFrom || filters.dateTo) {
          where.timestamp = {};
          if (filters.dateFrom) {
            where.timestamp.gte = filters.dateFrom;
          }
          if (filters.dateTo) {
            where.timestamp.lte = filters.dateTo;
          }
        }
      }

      const [auditLogs, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: filters?.limit || 50,
          skip: filters?.offset || 0,
        }),
        this.prisma.auditLog.count({ where }),
      ]);

      return {
        logs: auditLogs.map(log => ({
          id: log.id,
          userId: log.userId,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          oldValues: log.oldValues,
          newValues: log.newValues,
          metadata: log.metadata,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          timestamp: log.timestamp,
        })),
        total,
      };
    } catch (error) {
      this.logger.error('Failed to get system audit logs:', error);
      throw error;
    }
  }

  async deleteAuditLogs(userId: string, olderThan: Date): Promise<number> {
    try {
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          userId,
          timestamp: { lt: olderThan },
        },
      });

      this.logger.log(`Deleted ${result.count} audit log entries for user ${userId}`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to delete audit logs for user ${userId}:`, error);
      throw error;
    }
  }

  private async createAuditLog(data: {
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          oldValues: data.oldValues,
          newValues: data.newValues,
          metadata: data.metadata,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log entry:', error);
      // Don't throw error to avoid disrupting main operations
    }
  }

  async getAuditStatistics(): Promise<any> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalLogs,
        logs24h,
        logs7d,
        logs30d,
        topActions,
        topEntityTypes,
      ] = await Promise.all([
        this.prisma.auditLog.count(),
        this.prisma.auditLog.count({ where: { timestamp: { gte: last24Hours } } }),
        this.prisma.auditLog.count({ where: { timestamp: { gte: last7Days } } }),
        this.prisma.auditLog.count({ where: { timestamp: { gte: last30Days } } }),
        this.prisma.auditLog.groupBy({
          by: ['action'],
          _count: { action: true },
          orderBy: { _count: { action: 'desc' } },
          take: 10,
        }),
        this.prisma.auditLog.groupBy({
          by: ['entityType'],
          _count: { entityType: true },
          orderBy: { _count: { entityType: 'desc' } },
          take: 10,
        }),
      ]);

      return {
        totalLogs,
        logs24h,
        logs7d,
        logs30d,
        topActions: topActions.map(item => ({
          action: item.action,
          count: item._count.action,
        })),
        topEntityTypes: topEntityTypes.map(item => ({
          entityType: item.entityType,
          count: item._count.entityType,
        })),
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get audit statistics:', error);
      throw error;
    }
  }
}