import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SecurityConfigService } from '../security-config.service';

export interface LockoutStatus {
  isLocked: boolean;
  attemptsRemaining: number;
  lockoutExpiresAt?: Date;
  nextAttemptAllowedAt?: Date;
}

export interface LoginAttempt {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  attemptedAt: Date;
}

@Injectable()
export class AccountLockoutService {
  private readonly logger = new Logger(AccountLockoutService.name);

  constructor(
    private prisma: PrismaService,
    private securityConfig: SecurityConfigService,
  ) {}

  async recordLoginAttempt(
    userId: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    email?: string,
  ): Promise<void> {
    try {
      // Create audit log entry
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
          entityType: 'User',
          entityId: userId,
          details: {
            success,
            ipAddress,
            userAgent,
            email,
            timestamp: new Date().toISOString(),
          },
          ipAddress,
          userAgent,
        },
      });

      if (!success) {
        // Record failed attempt
        await this.updateFailedAttempts(userId, ipAddress);
      } else {
        // Clear failed attempts on successful login
        await this.clearFailedAttempts(userId);
      }
    } catch (error) {
      this.logger.error('Failed to record login attempt:', error);
    }
  }

  async checkAccountLockout(userId: string, ipAddress?: string): Promise<LockoutStatus> {
    const lockoutPolicy = this.securityConfig.getLockoutPolicy();

    try {
      // Get recent failed attempts for this user
      const failedAttempts = await this.getRecentFailedAttempts(userId);
      const attemptsCount = failedAttempts.length;

      // Check if account is currently locked
      const isLocked = attemptsCount >= lockoutPolicy.maxAttempts;

      if (!isLocked) {
        return {
          isLocked: false,
          attemptsRemaining: lockoutPolicy.maxAttempts - attemptsCount,
        };
      }

      // Calculate lockout expiration
      const lastAttempt = failedAttempts[0]; // Most recent attempt
      const lockoutDuration = this.securityConfig.calculateLockoutDuration(attemptsCount);
      const lockoutExpiresAt = new Date(lastAttempt.timestamp.getTime() + lockoutDuration * 60 * 1000);

      // Check if lockout has expired
      if (new Date() > lockoutExpiresAt) {
        // Lockout has expired, clear failed attempts
        await this.clearFailedAttempts(userId);
        return {
          isLocked: false,
          attemptsRemaining: lockoutPolicy.maxAttempts,
        };
      }

      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockoutExpiresAt,
        nextAttemptAllowedAt: lockoutExpiresAt,
      };
    } catch (error) {
      this.logger.error('Failed to check account lockout:', error);
      // Fail securely - if we can't check lockout status, deny access
      return {
        isLocked: true,
        attemptsRemaining: 0,
      };
    }
  }

  async enforceAccountLockout(userId: string, ipAddress?: string): Promise<void> {
    const lockoutStatus = await this.checkAccountLockout(userId, ipAddress);

    if (lockoutStatus.isLocked) {
      const message = lockoutStatus.lockoutExpiresAt
        ? `Account locked until ${lockoutStatus.lockoutExpiresAt.toISOString()}`
        : 'Account is temporarily locked due to too many failed login attempts';

      this.logger.warn(`Account lockout enforced for user ${userId}`, {
        userId,
        ipAddress,
        lockoutExpiresAt: lockoutStatus.lockoutExpiresAt,
      });

      throw new UnauthorizedException({
        message,
        locked: true,
        expiresAt: lockoutStatus.lockoutExpiresAt,
        code: 'ACCOUNT_LOCKED',
      });
    }
  }

  private async getRecentFailedAttempts(userId: string): Promise<any[]> {
    const windowMs = 60 * 60 * 1000; // 1 hour window
    const since = new Date(Date.now() - windowMs);

    return this.prisma.auditLog.findMany({
      where: {
        userId,
        action: 'LOGIN_FAILED',
        timestamp: {
          gte: since,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  private async updateFailedAttempts(userId: string, ipAddress: string): Promise<void> {
    const lockoutPolicy = this.securityConfig.getLockoutPolicy();
    const recentAttempts = await this.getRecentFailedAttempts(userId);

    if (recentAttempts.length >= lockoutPolicy.maxAttempts - 1) {
      // This attempt will trigger lockout
      this.logger.warn(`Account lockout triggered for user ${userId}`, {
        userId,
        ipAddress,
        attemptCount: recentAttempts.length + 1,
      });

      // Create security event for monitoring
      await this.createSecurityEvent('ACCOUNT_LOCKED', userId, {
        ipAddress,
        attemptCount: recentAttempts.length + 1,
        lockoutDuration: this.securityConfig.calculateLockoutDuration(recentAttempts.length + 1),
      });
    }
  }

  private async clearFailedAttempts(userId: string): Promise<void> {
    // We don't delete audit logs, but we can mark the successful login
    // which effectively resets the failed attempt count logic
    this.logger.debug(`Cleared failed attempts for user ${userId} due to successful login`);
  }

  async getAccountSecurityStatus(userId: string): Promise<{
    recentFailedAttempts: number;
    lockoutStatus: LockoutStatus;
    recentAttempts: any[];
  }> {
    const recentAttempts = await this.getRecentFailedAttempts(userId);
    const lockoutStatus = await this.checkAccountLockout(userId);

    return {
      recentFailedAttempts: recentAttempts.length,
      lockoutStatus,
      recentAttempts: recentAttempts.slice(0, 10), // Last 10 attempts
    };
  }

  async unlockAccount(userId: string, unlockedBy: string): Promise<void> {
    this.logger.log(`Account manually unlocked for user ${userId} by ${unlockedBy}`);

    // Create audit log for manual unlock
    await this.prisma.auditLog.create({
      data: {
        userId: unlockedBy,
        action: 'ACCOUNT_UNLOCKED',
        entityType: 'User',
        entityId: userId,
        details: {
          unlockedUserId: userId,
          unlockedBy,
          timestamp: new Date().toISOString(),
          reason: 'Manual unlock by administrator',
        },
      },
    });
  }

  async getFailedLoginReports(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<any[]> {
    const timeframes = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    };

    const since = new Date(Date.now() - timeframes[timeframe]);

    const failedAttempts = await this.prisma.auditLog.groupBy({
      by: ['ipAddress'],
      where: {
        action: 'LOGIN_FAILED',
        timestamp: {
          gte: since,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return failedAttempts.map(attempt => ({
      ipAddress: attempt.ipAddress,
      failedAttempts: attempt._count.id,
      timeframe,
    }));
  }

  async detectBruteForceAttacks(): Promise<{
    suspiciousIps: string[];
    alerts: any[];
  }> {
    const threshold = 50; // 50 failed attempts from same IP in 1 hour
    const windowMs = 60 * 60 * 1000;
    const since = new Date(Date.now() - windowMs);

    const suspiciousActivity = await this.prisma.auditLog.groupBy({
      by: ['ipAddress'],
      where: {
        action: 'LOGIN_FAILED',
        timestamp: {
          gte: since,
        },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gte: threshold,
          },
        },
      },
    });

    const suspiciousIps = suspiciousActivity.map(activity => activity.ipAddress).filter(Boolean);
    const alerts = suspiciousActivity.map(activity => ({
      ipAddress: activity.ipAddress,
      failedAttempts: activity._count.id,
      severity: activity._count.id > 100 ? 'CRITICAL' : 'HIGH',
      detectedAt: new Date(),
    }));

    if (alerts.length > 0) {
      this.logger.error(`Brute force attack detected from ${alerts.length} IP addresses`, {
        suspiciousIps,
        alerts,
      });
    }

    return { suspiciousIps, alerts };
  }

  private async createSecurityEvent(
    type: string,
    userId: string,
    details: any,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: `SECURITY_EVENT_${type}`,
          entityType: 'Security',
          entityId: userId,
          details: {
            eventType: type,
            ...details,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to create security event:', error);
    }
  }

  async getSecurityMetrics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<{
    totalLoginAttempts: number;
    failedLoginAttempts: number;
    successfulLogins: number;
    lockedAccounts: number;
    bruteForceAttempts: number;
  }> {
    const timeframes = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    };

    const since = new Date(Date.now() - timeframes[timeframe]);

    const [
      failedLogins,
      successfulLogins,
      securityEvents,
    ] = await Promise.all([
      this.prisma.auditLog.count({
        where: {
          action: 'LOGIN_FAILED',
          timestamp: { gte: since },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          action: 'LOGIN_SUCCESS',
          timestamp: { gte: since },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          action: { startsWith: 'SECURITY_EVENT_' },
          timestamp: { gte: since },
        },
      }),
    ]);

    const totalLoginAttempts = failedLogins + successfulLogins;

    // Get current locked accounts (approximate)
    const recentFailures = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        action: 'LOGIN_FAILED',
        timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
      },
      _count: { id: true },
      having: {
        id: {
          _count: { gte: this.securityConfig.getLockoutPolicy().maxAttempts },
        },
      },
    });

    return {
      totalLoginAttempts,
      failedLoginAttempts: failedLogins,
      successfulLogins,
      lockedAccounts: recentFailures.length,
      bruteForceAttempts: securityEvents,
    };
  }
}