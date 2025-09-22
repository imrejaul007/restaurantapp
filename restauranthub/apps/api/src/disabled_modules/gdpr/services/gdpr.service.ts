import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DataExportService } from './data-export.service';
import { DataDeletionService } from './data-deletion.service';
import { ConsentService } from './consent.service';
import { AuditLogService } from './audit-log.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface GdprCompliance {
  dataPortability: boolean;
  rightToErasure: boolean;
  consentManagement: boolean;
  auditLogging: boolean;
  dataMinimization: boolean;
  privacyByDesign: boolean;
  breachNotification: boolean;
  dataProtectionOfficer: boolean;
  legalBasis: string[];
  retentionPolicies: boolean;
}

export interface DataSubjectRights {
  access: boolean;
  rectification: boolean;
  erasure: boolean;
  portability: boolean;
  restriction: boolean;
  objection: boolean;
  automatedDecisionMaking: boolean;
}

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dataExportService: DataExportService,
    private readonly dataDeletionService: DataDeletionService,
    private readonly consentService: ConsentService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getDataSubjectRights(userId: string): Promise<DataSubjectRights> {
    try {
      // Check user's current status and available rights
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          restaurant: true,
          vendor: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // All data subjects have these fundamental rights under GDPR
      return {
        access: true, // Article 15 - Right of access
        rectification: true, // Article 16 - Right to rectification
        erasure: true, // Article 17 - Right to erasure
        portability: true, // Article 20 - Right to data portability
        restriction: true, // Article 18 - Right to restriction of processing
        objection: true, // Article 21 - Right to object
        automatedDecisionMaking: false, // Article 22 - Currently not implemented
      };
    } catch (error) {
      this.logger.error(`Failed to get data subject rights for user ${userId}:`, error);
      throw error;
    }
  }

  async getGdprCompliance(): Promise<GdprCompliance> {
    try {
      return {
        dataPortability: true, // Implemented via data export service
        rightToErasure: true, // Implemented via data deletion service
        consentManagement: true, // Implemented via consent service
        auditLogging: true, // Implemented via audit log service
        dataMinimization: true, // Enforced in data collection
        privacyByDesign: true, // Built into system architecture
        breachNotification: false, // TODO: Implement breach notification system
        dataProtectionOfficer: false, // TODO: Designate DPO contact
        legalBasis: [
          'consent', // Article 6(1)(a)
          'contract', // Article 6(1)(b) - order fulfillment
          'legal_obligation', // Article 6(1)(c) - tax records
          'legitimate_interests', // Article 6(1)(f) - fraud prevention
        ],
        retentionPolicies: true, // Implemented with automated cleanup
      };
    } catch (error) {
      this.logger.error('Failed to get GDPR compliance status:', error);
      throw error;
    }
  }

  async getPersonalDataCategories(userId: string): Promise<any> {
    try {
      const categories = {
        identificationData: {
          description: 'Personal identifiers and contact information',
          dataTypes: ['name', 'email', 'phone', 'address'],
          legalBasis: 'contract',
          retentionPeriod: '7 years after account closure',
          canExport: true,
          canDelete: true,
        },
        authenticationData: {
          description: 'Login credentials and security information',
          dataTypes: ['password_hash', 'login_history', 'security_tokens'],
          legalBasis: 'contract',
          retentionPeriod: '1 year after last login',
          canExport: false, // Security sensitive
          canDelete: true,
        },
        transactionalData: {
          description: 'Orders, payments, and business transactions',
          dataTypes: ['orders', 'payments', 'invoices'],
          legalBasis: 'contract',
          retentionPeriod: '7 years (legal requirement)',
          canExport: true,
          canDelete: false, // Legal retention requirement
        },
        behavioralData: {
          description: 'Usage patterns and preferences',
          dataTypes: ['page_views', 'search_history', 'preferences'],
          legalBasis: 'legitimate_interests',
          retentionPeriod: '2 years',
          canExport: true,
          canDelete: true,
        },
        communicationData: {
          description: 'Messages, notifications, and support interactions',
          dataTypes: ['messages', 'notifications', 'support_tickets'],
          legalBasis: 'contract',
          retentionPeriod: '3 years',
          canExport: true,
          canDelete: true,
        },
        employmentData: {
          description: 'Job applications and employment-related information',
          dataTypes: ['job_applications', 'resume', 'employment_history'],
          legalBasis: 'contract',
          retentionPeriod: '1 year after application',
          canExport: true,
          canDelete: true,
        },
      };

      // Check which categories apply to this user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          employeeProfile: true,
          restaurant: true,
          vendor: true,
        },
      });

      const applicableCategories: any = {};

      // All users have identification and authentication data
      applicableCategories.identificationData = categories.identificationData;
      applicableCategories.authenticationData = categories.authenticationData;

      // Check for transactional data
      const hasOrders = await this.prisma.order.count({
        where: { customerId: userId },
      });
      if (hasOrders > 0) {
        applicableCategories.transactionalData = categories.transactionalData;
      }

      // Check for communication data
      const hasMessages = await this.prisma.message.count({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      });
      if (hasMessages > 0) {
        applicableCategories.communicationData = categories.communicationData;
      }

      // Check for employment data
      if (user?.employeeProfile) {
        applicableCategories.employmentData = categories.employmentData;
      }

      // Behavioral data exists for all active users
      applicableCategories.behavioralData = categories.behavioralData;

      return {
        userId,
        categories: applicableCategories,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get personal data categories for user ${userId}:`, error);
      throw error;
    }
  }

  async getDataRetentionStatus(userId: string): Promise<any> {
    try {
      const now = new Date();
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          createdAt: true,
          lastLoginAt: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const dataAge = {
        account: Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        lastActivity: user.lastLoginAt
          ? Math.floor((now.getTime() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      };

      const retentionPolicies = [
        {
          category: 'Profile Data',
          retentionPeriod: '7 years after account closure',
          status: user.isActive ? 'active' : 'under_review',
          canDelete: true,
        },
        {
          category: 'Transaction Data',
          retentionPeriod: '7 years (legal requirement)',
          status: 'protected',
          canDelete: false,
        },
        {
          category: 'Communication Data',
          retentionPeriod: '3 years',
          status: dataAge.account > 1095 ? 'eligible_for_deletion' : 'active',
          canDelete: dataAge.account > 1095,
        },
        {
          category: 'Authentication Data',
          retentionPeriod: '1 year after last login',
          status: dataAge.lastActivity && dataAge.lastActivity > 365 ? 'eligible_for_deletion' : 'active',
          canDelete: dataAge.lastActivity && dataAge.lastActivity > 365,
        },
      ];

      return {
        userId,
        dataAge,
        retentionPolicies,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get data retention status for user ${userId}:`, error);
      throw error;
    }
  }

  async getGdprDashboard(): Promise<any> {
    try {
      const [
        complianceStatus,
        exportStats,
        deletionStats,
        consentStats,
        auditStats,
      ] = await Promise.all([
        this.getGdprCompliance(),
        this.dataExportService.getExportStatistics(),
        this.dataDeletionService.getDeletionStatistics(),
        this.consentService.getConsentStatistics(),
        this.auditLogService.getAuditStatistics(),
      ]);

      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate compliance score
      const complianceMetrics = Object.values(complianceStatus);
      const implementedFeatures = complianceMetrics.filter(Boolean).length;
      const totalFeatures = complianceMetrics.length;
      const complianceScore = (implementedFeatures / totalFeatures) * 100;

      return {
        overview: {
          complianceScore: Math.round(complianceScore),
          implementedFeatures,
          totalFeatures,
          lastUpdated: new Date(),
        },
        complianceStatus,
        statistics: {
          exports: exportStats,
          deletions: deletionStats,
          consent: consentStats,
          audit: auditStats,
        },
        recentActivity: await this.getRecentGdprActivity(),
        alerts: await this.getGdprAlerts(),
      };
    } catch (error) {
      this.logger.error('Failed to get GDPR dashboard:', error);
      throw error;
    }
  }

  private async getRecentGdprActivity(): Promise<any[]> {
    try {
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const activities = await this.auditLogService.getSystemAuditLogs({
        entityType: 'gdpr_request',
        dateFrom: last7Days,
        limit: 20,
      });

      return activities.logs.map(log => ({
        id: log.id,
        type: log.action,
        userId: log.userId,
        timestamp: log.timestamp,
        details: log.newValues,
      }));
    } catch (error) {
      this.logger.error('Failed to get recent GDPR activity:', error);
      return [];
    }
  }

  private async getGdprAlerts(): Promise<any[]> {
    try {
      const alerts = [];
      const now = new Date();

      // Check for pending deletion requests nearing grace period end
      const pendingDeletions = await this.prisma.dataDeletionRequest.count({
        where: {
          status: 'pending',
          scheduledFor: {
            lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // Next 3 days
          },
        },
      });

      if (pendingDeletions > 0) {
        alerts.push({
          type: 'warning',
          message: `${pendingDeletions} deletion request(s) will be processed in the next 3 days`,
          action: 'review_pending_deletions',
        });
      }

      // Check for low consent rates
      const consentStats = await this.consentService.getConsentStatistics();
      if (consentStats.consentRate < 50) {
        alerts.push({
          type: 'warning',
          message: `Low consent rate: ${consentStats.consentRate.toFixed(1)}%`,
          action: 'review_consent_flow',
        });
      }

      // Check for high withdrawal rate
      if (consentStats.recentWithdrawals > 10) {
        alerts.push({
          type: 'warning',
          message: `High consent withdrawal rate: ${consentStats.recentWithdrawals} in last 7 days`,
          action: 'investigate_withdrawals',
        });
      }

      return alerts;
    } catch (error) {
      this.logger.error('Failed to get GDPR alerts:', error);
      return [];
    }
  }

  // Automated cleanup jobs
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async dailyGdprMaintenance(): Promise<void> {
    try {
      this.logger.log('Starting daily GDPR maintenance...');

      // Process scheduled deletions
      await this.dataDeletionService.processScheduledDeletions();

      // Cleanup expired exports
      await this.dataExportService.cleanupExpiredExports();

      // Archive old audit logs (keep for compliance period)
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
      const archivedCount = await this.auditLogService.deleteAuditLogs('system', sixMonthsAgo);

      this.logger.log(`Daily GDPR maintenance completed. Archived ${archivedCount} old audit logs.`);
    } catch (error) {
      this.logger.error('Daily GDPR maintenance failed:', error);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async weeklyComplianceReport(): Promise<void> {
    try {
      this.logger.log('Generating weekly GDPR compliance report...');

      const dashboard = await this.getGdprDashboard();

      // Log compliance metrics for monitoring
      this.logger.log(`Weekly GDPR Compliance Report:
        - Compliance Score: ${dashboard.overview.complianceScore}%
        - Export Requests: ${dashboard.statistics.exports.totalRequests || 0}
        - Deletion Requests: ${dashboard.statistics.deletions.totalRequests}
        - Consent Rate: ${dashboard.statistics.consent.consentRate.toFixed(1)}%
        - Active Alerts: ${dashboard.alerts.length}
      `);

      // In production, this would send reports to stakeholders
    } catch (error) {
      this.logger.error('Weekly compliance report failed:', error);
    }
  }

  async validateDataProcessingLegality(
    userId: string,
    processingType: string,
    personalDataTypes: string[],
  ): Promise<{ legal: boolean; legalBasis: string; consent?: boolean }> {
    try {
      // Define processing types that require consent
      const consentRequiredProcessing = [
        'marketing',
        'analytics',
        'profiling',
        'third_party_sharing',
        'automated_decision_making',
      ];

      // Define processing types with legitimate interests
      const legitimateInterestsProcessing = [
        'fraud_prevention',
        'security_monitoring',
        'service_improvement',
        'customer_support',
      ];

      // Define processing types required for contract fulfillment
      const contractualProcessing = [
        'order_fulfillment',
        'payment_processing',
        'account_management',
        'delivery_coordination',
      ];

      // Define processing types required by law
      const legalObligationProcessing = [
        'tax_reporting',
        'regulatory_compliance',
        'audit_requirements',
        'dispute_resolution',
      ];

      // Determine legal basis
      let legalBasis: string;
      let consentRequired = false;

      if (legalObligationProcessing.includes(processingType)) {
        legalBasis = 'legal_obligation';
      } else if (contractualProcessing.includes(processingType)) {
        legalBasis = 'contract';
      } else if (legitimateInterestsProcessing.includes(processingType)) {
        legalBasis = 'legitimate_interests';
      } else if (consentRequiredProcessing.includes(processingType)) {
        legalBasis = 'consent';
        consentRequired = true;
      } else {
        // Default to consent requirement for unknown processing types
        legalBasis = 'consent';
        consentRequired = true;
      }

      // Check consent if required
      let hasConsent = true;
      if (consentRequired) {
        hasConsent = await this.consentService.validateConsentForProcessing(userId, processingType);
      }

      const isLegal = !consentRequired || hasConsent;

      // Log the validation
      await this.auditLogService.logDataAccess(userId, 'processing_validation', undefined, {
        processingType,
        personalDataTypes,
        legalBasis,
        consentRequired,
        hasConsent,
        isLegal,
      });

      return {
        legal: isLegal,
        legalBasis,
        consent: consentRequired ? hasConsent : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to validate data processing legality for user ${userId}:`, error);
      return {
        legal: false,
        legalBasis: 'error',
      };
    }
  }
}