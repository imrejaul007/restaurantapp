import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import { SecurityAuditService } from './security-audit.service';
import * as crypto from 'crypto';
import * as archiver from 'archiver';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ConsentRecord {
  userId: string;
  purposes: string[];
  consentedAt: Date;
  withdrawnAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  consentMethod: 'explicit_form' | 'implicit' | 'cookie_banner' | 'registration';
  version: string;
  isActive: boolean;
  preferences: {
    marketing: boolean;
    analytics: boolean;
    functionalCookies: boolean;
    performanceCookies: boolean;
    thirdPartySharing: boolean;
    profiling: boolean;
    automatedDecisionMaking: boolean;
    locationTracking: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
}

export interface DataExportRequest {
  id: string;
  userId: string;
  categories: string[];
  format: 'json' | 'csv' | 'xml' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt: Date;
  metadata?: any;
}

export interface DataDeletionRequest {
  id: string;
  userId: string;
  scope: 'profile_only' | 'all_data' | 'specific_categories' | 'account_closure';
  reason: string;
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

export interface PrivacyImpactAssessment {
  dataTypes: string[];
  processingPurposes: string[];
  legalBasis: string[];
  dataSubjects: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  mitigationMeasures: string[];
  reviewDate: Date;
}

@Injectable()
export class GdprComplianceService {
  private readonly logger = new Logger(GdprComplianceService.name);
  private readonly exportDirectory: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly auditService: SecurityAuditService,
  ) {
    this.exportDirectory = this.configService.get('DATA_EXPORT_DIRECTORY', '/tmp/exports');
    this.initializeExportDirectory();
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    purposes: string[],
    preferences: ConsentRecord['preferences'],
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      consentMethod: ConsentRecord['consentMethod'];
      version?: string;
    }
  ): Promise<ConsentRecord> {
    try {
      // Withdraw any existing active consent
      await this.prisma.userConsent.updateMany({
        where: { userId, isActive: true },
        data: {
          isActive: false,
          withdrawnAt: new Date(),
        },
      });

      // Create new consent record
      const consent = await this.prisma.userConsent.create({
        data: {
          userId,
          purposes,
          preferences: preferences as any,
          consentedAt: new Date(),
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          consentMethod: metadata.consentMethod,
          isActive: true,
        },
      });

      // Update user preferences
      await this.updateUserPreferences(userId, preferences);

      // Log consent event
      await this.auditService.logSecurityEvent({
        eventType: 'CONSENT_GIVEN',
        severity: 'LOW',
        userId,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        action: 'CONSENT_MANAGEMENT',
        details: {
          purposes,
          consentMethod: metadata.consentMethod,
          version: metadata.version || '1.0',
        },
      });

      this.logger.log(`Consent recorded for user ${userId}`);

      return {
        userId: consent.userId,
        purposes: consent.purposes,
        consentedAt: consent.consentedAt,
        withdrawnAt: consent.withdrawnAt,
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
        consentMethod: consent.consentMethod as ConsentRecord['consentMethod'],
        version: '1.0', // Add version field to schema if needed
        isActive: consent.isActive,
        preferences: consent.preferences as ConsentRecord['preferences'],
      };
    } catch (error) {
      this.logger.error('Failed to record consent', error);
      throw new BadRequestException('Failed to record consent');
    }
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(
    userId: string,
    purposes?: string[],
    reason?: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      let whereClause: any = { userId, isActive: true };

      if (purposes && purposes.length > 0) {
        // Withdraw specific purposes
        const existingConsent = await this.prisma.userConsent.findFirst({
          where: whereClause,
        });

        if (existingConsent) {
          const remainingPurposes = existingConsent.purposes.filter(
            (purpose: string) => !purposes.includes(purpose)
          );

          if (remainingPurposes.length > 0) {
            // Update with remaining purposes
            await this.prisma.userConsent.update({
              where: { id: existingConsent.id },
              data: {
                purposes: remainingPurposes,
              },
            });
          } else {
            // Withdraw all consent
            await this.prisma.userConsent.update({
              where: { id: existingConsent.id },
              data: {
                isActive: false,
                withdrawnAt: new Date(),
              },
            });
          }
        }
      } else {
        // Withdraw all consent
        await this.prisma.userConsent.updateMany({
          where: whereClause,
          data: {
            isActive: false,
            withdrawnAt: new Date(),
          },
        });
      }

      // Log consent withdrawal
      await this.auditService.logSecurityEvent({
        eventType: 'CONSENT_WITHDRAWN',
        severity: 'MEDIUM',
        userId,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        action: 'CONSENT_MANAGEMENT',
        details: {
          withdrawnPurposes: purposes || 'all',
          reason,
        },
      });

      this.logger.log(`Consent withdrawn for user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to withdraw consent', error);
      throw new BadRequestException('Failed to withdraw consent');
    }
  }

  /**
   * Get current consent status
   */
  async getConsentStatus(userId: string): Promise<ConsentRecord | null> {
    try {
      const consent = await this.prisma.userConsent.findFirst({
        where: { userId, isActive: true },
        orderBy: { consentedAt: 'desc' },
      });

      if (!consent) return null;

      return {
        userId: consent.userId,
        purposes: consent.purposes,
        consentedAt: consent.consentedAt,
        withdrawnAt: consent.withdrawnAt,
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
        consentMethod: consent.consentMethod as ConsentRecord['consentMethod'],
        version: '1.0',
        isActive: consent.isActive,
        preferences: consent.preferences as ConsentRecord['preferences'],
      };
    } catch (error) {
      this.logger.error('Failed to get consent status', error);
      return null;
    }
  }

  /**
   * Request data export (Right to Portability)
   */
  async requestDataExport(
    userId: string,
    categories: string[],
    format: 'json' | 'csv' | 'xml' | 'pdf' = 'json',
    metadata?: any
  ): Promise<DataExportRequest> {
    try {
      // Check for existing pending requests
      const existingRequest = await this.prisma.dataExportRequest.findFirst({
        where: {
          userId,
          status: { in: ['pending', 'processing'] },
        },
      });

      if (existingRequest) {
        throw new BadRequestException('Data export request already in progress');
      }

      // Create new export request
      const exportRequest = await this.prisma.dataExportRequest.create({
        data: {
          userId,
          categories,
          format,
          status: 'pending',
          requestedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          metadata,
        },
      });

      // Log export request
      await this.auditService.logSecurityEvent({
        eventType: 'DATA_EXPORT_REQUESTED',
        severity: 'MEDIUM',
        userId,
        action: 'DATA_PORTABILITY',
        details: {
          categories,
          format,
          requestId: exportRequest.id,
        },
      });

      // Process export asynchronously
      this.processDataExport(exportRequest.id);

      this.logger.log(`Data export requested for user ${userId}`);

      return {
        id: exportRequest.id,
        userId: exportRequest.userId,
        categories: exportRequest.categories,
        format: exportRequest.format as DataExportRequest['format'],
        status: exportRequest.status as DataExportRequest['status'],
        requestedAt: exportRequest.requestedAt,
        completedAt: exportRequest.completedAt,
        downloadUrl: exportRequest.downloadUrl,
        expiresAt: exportRequest.expiresAt,
        metadata: exportRequest.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to request data export', error);
      throw error;
    }
  }

  /**
   * Request data deletion (Right to be Forgotten)
   */
  async requestDataDeletion(
    userId: string,
    scope: DataDeletionRequest['scope'],
    reason: string,
    categories?: string[],
    details?: string,
    scheduledFor?: Date
  ): Promise<DataDeletionRequest> {
    try {
      const confirmationToken = crypto.randomBytes(32).toString('hex');

      const deletionRequest = await this.prisma.dataDeletionRequest.create({
        data: {
          userId,
          scope,
          reason,
          categories: categories || [],
          details,
          status: 'pending',
          requestedAt: new Date(),
          scheduledFor: scheduledFor || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days grace period
          confirmationToken,
          retainForLegalReasons: false,
        },
      });

      // Log deletion request
      await this.auditService.logSecurityEvent({
        eventType: 'DATA_DELETION_REQUESTED',
        severity: 'HIGH',
        userId,
        action: 'RIGHT_TO_BE_FORGOTTEN',
        details: {
          scope,
          reason,
          categories,
          requestId: deletionRequest.id,
        },
      });

      this.logger.log(`Data deletion requested for user ${userId}`);

      return {
        id: deletionRequest.id,
        userId: deletionRequest.userId,
        scope: deletionRequest.scope as DataDeletionRequest['scope'],
        reason: deletionRequest.reason,
        categories: deletionRequest.categories,
        details: deletionRequest.details,
        status: deletionRequest.status as DataDeletionRequest['status'],
        requestedAt: deletionRequest.requestedAt,
        scheduledFor: deletionRequest.scheduledFor,
        completedAt: deletionRequest.completedAt,
        confirmationToken: deletionRequest.confirmationToken,
        retainForLegalReasons: deletionRequest.retainForLegalReasons,
        metadata: deletionRequest.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to request data deletion', error);
      throw new BadRequestException('Failed to request data deletion');
    }
  }

  /**
   * Process data export
   */
  private async processDataExport(requestId: string): Promise<void> {
    try {
      // Update status to processing
      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'processing' },
      });

      const request = await this.prisma.dataExportRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new Error('Export request not found');
      }

      // Collect user data
      const userData = await this.collectUserData(request.userId, request.categories);

      // Generate export file
      const exportFile = await this.generateExportFile(
        userData,
        request.format as 'json' | 'csv' | 'xml' | 'pdf',
        request.userId
      );

      // Update request with download URL
      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          downloadUrl: exportFile.url,
        },
      });

      // Log completion
      await this.auditService.logSecurityEvent({
        eventType: 'DATA_EXPORT_COMPLETED',
        severity: 'MEDIUM',
        userId: request.userId,
        action: 'DATA_PORTABILITY',
        details: {
          requestId,
          fileSize: exportFile.size,
          format: request.format,
        },
      });

      this.logger.log(`Data export completed for request ${requestId}`);
    } catch (error) {
      this.logger.error(`Failed to process data export ${requestId}`, error);

      // Update status to failed
      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'failed' },
      });
    }
  }

  /**
   * Collect user data for export
   */
  private async collectUserData(userId: string, categories: string[]): Promise<any> {
    const userData: any = {};

    try {
      if (categories.includes('profile') || categories.includes('all')) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            profile: true,
            userPreferences: true,
          },
        });

        userData.profile = {
          id: user?.id,
          email: user?.email,
          phone: user?.phone,
          role: user?.role,
          createdAt: user?.createdAt,
          lastLoginAt: user?.lastLoginAt,
          profile: user?.profile,
          preferences: user?.userPreferences,
        };
      }

      if (categories.includes('orders') || categories.includes('all')) {
        // Collect order data based on user role
        if (userData.profile?.role === 'RESTAURANT') {
          const restaurant = await this.prisma.restaurant.findUnique({
            where: { userId },
            include: {
              orders: {
                include: {
                  items: true,
                  payments: true,
                },
              },
            },
          });
          userData.orders = restaurant?.orders || [];
        }
      }

      if (categories.includes('messages') || categories.includes('all')) {
        const messages = await this.prisma.message.findMany({
          where: { senderId: userId },
        });
        userData.messages = messages;
      }

      if (categories.includes('audit_logs') || categories.includes('all')) {
        const auditLogs = await this.prisma.auditLog.findMany({
          where: { userId },
          orderBy: { timestamp: 'desc' },
          take: 1000, // Limit for performance
        });
        userData.auditLogs = auditLogs;
      }

      return userData;
    } catch (error) {
      this.logger.error('Failed to collect user data', error);
      throw error;
    }
  }

  /**
   * Generate export file
   */
  private async generateExportFile(
    userData: any,
    format: 'json' | 'csv' | 'xml' | 'pdf',
    userId: string
  ): Promise<{ url: string; size: number }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `user-data-export-${userId}-${timestamp}.${format}`;
    const filepath = path.join(this.exportDirectory, filename);

    try {
      let content: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(userData, null, 2);
          break;
        case 'csv':
          content = this.convertToCsv(userData);
          break;
        case 'xml':
          content = this.convertToXml(userData);
          break;
        case 'pdf':
          content = await this.convertToPdf(userData);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Write file
      await fs.writeFile(filepath, content);

      // Get file size
      const stats = await fs.stat(filepath);

      // Generate download URL (this would be a signed URL in production)
      const downloadUrl = `/api/v1/gdpr/download/${filename}`;

      return {
        url: downloadUrl,
        size: stats.size,
      };
    } catch (error) {
      this.logger.error('Failed to generate export file', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  private async updateUserPreferences(
    userId: string,
    preferences: ConsentRecord['preferences']
  ): Promise<void> {
    const existingPrefs = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (existingPrefs) {
      await this.prisma.userPreferences.update({
        where: { userId },
        data: preferences,
      });
    } else {
      await this.prisma.userPreferences.create({
        data: {
          userId,
          ...preferences,
        },
      });
    }
  }

  /**
   * Initialize export directory
   */
  private async initializeExportDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.exportDirectory, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to initialize export directory', error);
    }
  }

  // Helper methods for format conversion
  private convertToCsv(data: any): string {
    // Simple CSV conversion - in production, use a proper CSV library
    const rows: string[] = [];
    const flatData = this.flattenObject(data);

    // Headers
    rows.push(Object.keys(flatData).join(','));

    // Data
    rows.push(Object.values(flatData).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    return rows.join('\n');
  }

  private convertToXml(data: any): string {
    // Simple XML conversion - in production, use a proper XML library
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const xmlContent = this.objectToXml(data, 'userData');
    return xmlHeader + xmlContent;
  }

  private async convertToPdf(data: any): Promise<string> {
    // For PDF generation, you would use a library like puppeteer or pdfkit
    // For now, return JSON as string
    return JSON.stringify(data, null, 2);
  }

  private flattenObject(obj: any, prefix: string = ''): any {
    const flattened: any = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, this.flattenObject(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }

    return flattened;
  }

  private objectToXml(obj: any, rootName: string): string {
    let xml = `<${rootName}>`;

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          xml += this.objectToXml(obj[key], key);
        } else {
          xml += `<${key}>${String(obj[key])}</${key}>`;
        }
      }
    }

    xml += `</${rootName}>`;
    return xml;
  }

  /**
   * Clean up expired export files
   */
  async cleanupExpiredExports(): Promise<number> {
    try {
      const expiredRequests = await this.prisma.dataExportRequest.findMany({
        where: {
          expiresAt: { lt: new Date() },
          status: 'completed',
        },
      });

      let cleanedCount = 0;

      for (const request of expiredRequests) {
        try {
          if (request.downloadUrl) {
            const filename = path.basename(request.downloadUrl);
            const filepath = path.join(this.exportDirectory, filename);
            await fs.unlink(filepath);
          }

          await this.prisma.dataExportRequest.update({
            where: { id: request.id },
            data: { status: 'expired' },
          });

          cleanedCount++;
        } catch (error) {
          this.logger.warn(`Failed to cleanup export file for request ${request.id}`, error);
        }
      }

      this.logger.log(`Cleaned up ${cleanedCount} expired export files`);
      return cleanedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup expired exports', error);
      return 0;
    }
  }
}