import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConsentDto } from '../dto/consent.dto';
import { AuditLogService } from './audit-log.service';

export interface ConsentRecord {
  id: string;
  userId: string;
  preferences: any;
  purposes: string[];
  consentedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  consentMethod?: string;
  withdrawnAt?: Date;
  isActive: boolean;
}

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async updateConsent(userId: string, consentDto: ConsentDto): Promise<ConsentRecord> {
    try {
      // Get current consent record
      const currentConsent = await this.prisma.userConsent.findFirst({
        where: { userId, isActive: true },
      });

      // Deactivate current consent if exists
      if (currentConsent) {
        await this.prisma.userConsent.update({
          where: { id: currentConsent.id },
          data: { isActive: false, withdrawnAt: new Date() },
        });
      }

      // Create new consent record
      const newConsent = await this.prisma.userConsent.create({
        data: {
          userId,
          preferences: consentDto.preferences,
          purposes: consentDto.purposes || [],
          consentedAt: new Date(),
          ipAddress: consentDto.ipAddress,
          userAgent: consentDto.userAgent,
          consentMethod: consentDto.consentMethod || 'explicit_form',
          isActive: true,
        },
      });

      // Log the consent update
      await this.auditLogService.logConsentChange(userId, {
        action: 'consent_updated',
        previousConsent: currentConsent?.preferences,
        newConsent: consentDto.preferences,
        ipAddress: consentDto.ipAddress,
        userAgent: consentDto.userAgent,
      });

      this.logger.log(`Consent updated for user ${userId}`);

      return {
        id: newConsent.id,
        userId: newConsent.userId,
        preferences: newConsent.preferences,
        purposes: newConsent.purposes,
        consentedAt: newConsent.consentedAt,
        ipAddress: newConsent.ipAddress,
        userAgent: newConsent.userAgent,
        consentMethod: newConsent.consentMethod,
        withdrawnAt: newConsent.withdrawnAt,
        isActive: newConsent.isActive,
      };
    } catch (error) {
      this.logger.error(`Failed to update consent for user ${userId}:`, error);
      throw error;
    }
  }

  async getConsent(userId: string): Promise<ConsentRecord | null> {
    try {
      const consent = await this.prisma.userConsent.findFirst({
        where: { userId, isActive: true },
        orderBy: { consentedAt: 'desc' },
      });

      if (!consent) {
        return null;
      }

      return {
        id: consent.id,
        userId: consent.userId,
        preferences: consent.preferences,
        purposes: consent.purposes,
        consentedAt: consent.consentedAt,
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
        consentMethod: consent.consentMethod,
        withdrawnAt: consent.withdrawnAt,
        isActive: consent.isActive,
      };
    } catch (error) {
      this.logger.error(`Failed to get consent for user ${userId}:`, error);
      throw error;
    }
  }

  async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    try {
      const consentHistory = await this.prisma.userConsent.findMany({
        where: { userId },
        orderBy: { consentedAt: 'desc' },
      });

      return consentHistory.map(consent => ({
        id: consent.id,
        userId: consent.userId,
        preferences: consent.preferences,
        purposes: consent.purposes,
        consentedAt: consent.consentedAt,
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
        consentMethod: consent.consentMethod,
        withdrawnAt: consent.withdrawnAt,
        isActive: consent.isActive,
      }));
    } catch (error) {
      this.logger.error(`Failed to get consent history for user ${userId}:`, error);
      throw error;
    }
  }

  async withdrawConsent(userId: string, reason?: string): Promise<void> {
    try {
      const activeConsent = await this.prisma.userConsent.findFirst({
        where: { userId, isActive: true },
      });

      if (!activeConsent) {
        throw new NotFoundException('No active consent found');
      }

      await this.prisma.userConsent.update({
        where: { id: activeConsent.id },
        data: {
          isActive: false,
          withdrawnAt: new Date(),
        },
      });

      // Log the consent withdrawal
      await this.auditLogService.logConsentChange(userId, {
        action: 'consent_withdrawn',
        reason,
        withdrawnConsent: activeConsent.preferences,
      });

      this.logger.log(`Consent withdrawn for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to withdraw consent for user ${userId}:`, error);
      throw error;
    }
  }

  async hasConsentForPurpose(userId: string, purpose: string): Promise<boolean> {
    try {
      const consent = await this.getConsent(userId);
      if (!consent) {
        return false;
      }

      // Check if purpose is explicitly consented to
      if (consent.purposes.includes(purpose)) {
        return true;
      }

      // Check specific preference flags
      const preferences = consent.preferences;
      switch (purpose) {
        case 'marketing':
          return preferences.marketing === true;
        case 'analytics':
          return preferences.analytics === true;
        case 'functional_cookies':
          return preferences.functionalCookies === true;
        case 'performance_cookies':
          return preferences.performanceCookies === true;
        case 'third_party_sharing':
          return preferences.thirdPartySharing === true;
        case 'profiling':
          return preferences.profiling === true;
        case 'automated_decision_making':
          return preferences.automatedDecisionMaking === true;
        case 'location_tracking':
          return preferences.locationTracking === true;
        case 'push_notifications':
          return preferences.pushNotifications === true;
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Failed to check consent for purpose ${purpose} for user ${userId}:`, error);
      return false;
    }
  }

  async getConsentStatistics(): Promise<any> {
    try {
      const [
        totalUsers,
        usersWithConsent,
        marketingConsent,
        analyticsConsent,
        recentWithdrawals,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.userConsent.count({
          where: { isActive: true },
          distinct: ['userId'],
        }),
        this.prisma.userConsent.count({
          where: {
            isActive: true,
            preferences: {
              path: ['marketing'],
              equals: true,
            },
          },
        }),
        this.prisma.userConsent.count({
          where: {
            isActive: true,
            preferences: {
              path: ['analytics'],
              equals: true,
            },
          },
        }),
        this.prisma.userConsent.count({
          where: {
            withdrawnAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

      return {
        totalUsers,
        usersWithConsent,
        consentRate: totalUsers > 0 ? (usersWithConsent / totalUsers) * 100 : 0,
        marketingConsentRate: usersWithConsent > 0 ? (marketingConsent / usersWithConsent) * 100 : 0,
        analyticsConsentRate: usersWithConsent > 0 ? (analyticsConsent / usersWithConsent) * 100 : 0,
        recentWithdrawals,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get consent statistics:', error);
      throw error;
    }
  }

  async validateConsentForProcessing(userId: string, processingType: string): Promise<boolean> {
    try {
      // For essential processing, consent is not required
      const essentialProcessing = [
        'account_management',
        'order_fulfillment',
        'payment_processing',
        'security',
        'legal_compliance',
      ];

      if (essentialProcessing.includes(processingType)) {
        return true;
      }

      // For non-essential processing, check consent
      return await this.hasConsentForPurpose(userId, processingType);
    } catch (error) {
      this.logger.error(`Failed to validate consent for processing ${processingType} for user ${userId}:`, error);
      return false;
    }
  }
}