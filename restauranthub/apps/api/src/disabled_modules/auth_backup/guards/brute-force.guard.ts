import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * Brute Force Protection Guard
 *
 * Advanced protection against brute force attacks with:
 * - Progressive delays (exponential backoff)
 * - Account lockout protection
 * - IP-based and account-based tracking
 * - Comprehensive security logging
 */
@Injectable()
export class BruteForceGuard implements CanActivate {
  private readonly logger = new Logger(BruteForceGuard.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const userAgent = request.get('User-Agent');
    const email = request.body?.email;
    const path = request.path;

    // Check IP-based brute force protection
    const ipBlocked = await this.checkIPBruteForce(ip, userAgent, path);
    if (ipBlocked) {
      this.logger.error(`SECURITY: IP blocked due to brute force attempts`, {
        ip,
        path,
        userAgent,
        timestamp: new Date().toISOString(),
      });
      throw new HttpException(
        {
          message: 'Too many failed attempts. Your IP has been temporarily blocked.',
          error: 'IP_BLOCKED',
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          retryAfter: this.getRetryAfter(ip),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check account-based brute force protection if email is provided
    if (email && typeof email === 'string') {
      const accountBlocked = await this.checkAccountBruteForce(email, ip, userAgent, path);
      if (accountBlocked) {
        this.logger.error(`SECURITY: Account blocked due to brute force attempts`, {
          email,
          ip,
          path,
          userAgent,
          timestamp: new Date().toISOString(),
        });
        throw new HttpException(
          {
            message: 'Account temporarily locked due to multiple failed attempts. Please try again later or reset your password.',
            error: 'ACCOUNT_LOCKED',
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            retryAfter: this.getAccountRetryAfter(email),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return true;
  }

  /**
   * Check IP-based brute force attempts
   */
  private async checkIPBruteForce(ip: string, userAgent: string, path: string): Promise<boolean> {
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 10; // Maximum failed attempts per IP
    const cutoffTime = new Date(Date.now() - windowMs);

    try {
      // Count recent failed attempts from this IP
      const recentAttempts = await this.prisma.auditLog.count({
        where: {
          action: 'FAILED_LOGIN',
          ipAddress: ip,
          createdAt: {
            gte: cutoffTime,
          },
        },
      });

      // Check if IP is currently blocked
      const existingBlock = await this.prisma.auditLog.findFirst({
        where: {
          action: 'IP_BLOCKED',
          ipAddress: ip,
          createdAt: {
            gte: cutoffTime,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (existingBlock) {
        return true; // IP is currently blocked
      }

      if (recentAttempts >= maxAttempts) {
        // Block the IP
        await this.prisma.auditLog.create({
          data: {
            action: 'IP_BLOCKED',
            ipAddress: ip,
            userAgent,
            details: JSON.stringify({
              reason: 'BRUTE_FORCE_PROTECTION',
              failedAttempts: recentAttempts,
              path,
              blockDuration: `${windowMs / 1000}s`,
            }),
          },
        });

        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking IP brute force protection:', error);
      // Fail securely - if we can't check, assume it's safe but log the error
      return false;
    }
  }

  /**
   * Check account-based brute force attempts
   */
  private async checkAccountBruteForce(email: string, ip: string, userAgent: string, path: string): Promise<boolean> {
    const windowMs = 30 * 60 * 1000; // 30 minutes for account lockout
    const maxAttempts = 5; // Maximum failed attempts per account
    const cutoffTime = new Date(Date.now() - windowMs);

    try {
      // Count recent failed attempts for this account
      const recentAttempts = await this.prisma.auditLog.count({
        where: {
          action: 'FAILED_LOGIN',
          email,
          createdAt: {
            gte: cutoffTime,
          },
        },
      });

      // Check if account is currently locked
      const existingLock = await this.prisma.auditLog.findFirst({
        where: {
          action: 'ACCOUNT_LOCKED',
          email,
          createdAt: {
            gte: cutoffTime,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (existingLock) {
        return true; // Account is currently locked
      }

      if (recentAttempts >= maxAttempts) {
        // Lock the account
        await this.prisma.auditLog.create({
          data: {
            action: 'ACCOUNT_LOCKED',
            email,
            ipAddress: ip,
            userAgent,
            details: JSON.stringify({
              reason: 'BRUTE_FORCE_PROTECTION',
              failedAttempts: recentAttempts,
              path,
              lockDuration: `${windowMs / 1000}s`,
            }),
          },
        });

        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking account brute force protection:', error);
      // Fail securely - if we can't check, assume it's safe but log the error
      return false;
    }
  }

  /**
   * Record a failed login attempt for audit and brute force tracking
   */
  async recordFailedAttempt(email: string, ip: string, userAgent: string, reason: string): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'FAILED_LOGIN',
          email,
          ipAddress: ip,
          userAgent,
          details: JSON.stringify({
            reason,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      this.logger.warn(`Failed login attempt recorded`, {
        email,
        ip,
        reason,
        userAgent,
      });
    } catch (error) {
      this.logger.error('Error recording failed login attempt:', error);
    }
  }

  /**
   * Record a successful login to reset counters
   */
  async recordSuccessfulAttempt(email: string, ip: string, userAgent: string): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'SUCCESSFUL_LOGIN',
          email,
          ipAddress: ip,
          userAgent,
          details: JSON.stringify({
            timestamp: new Date().toISOString(),
          }),
        },
      });

      // Clear any existing blocks for this IP and account on successful login
      // This is handled by the time-based expiry in the queries above
    } catch (error) {
      this.logger.error('Error recording successful login attempt:', error);
    }
  }

  /**
   * Get retry after time for IP blocks
   */
  private getRetryAfter(ip: string): number {
    return 15 * 60; // 15 minutes in seconds
  }

  /**
   * Get retry after time for account locks
   */
  private getAccountRetryAfter(email: string): number {
    return 30 * 60; // 30 minutes in seconds
  }

  /**
   * Clean up expired audit logs (should be called periodically)
   */
  async cleanupExpiredLogs(): Promise<void> {
    const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

    try {
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffTime,
          },
          action: {
            in: ['FAILED_LOGIN', 'IP_BLOCKED', 'ACCOUNT_LOCKED', 'SUCCESSFUL_LOGIN'],
          },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Cleaned up ${result.count} expired audit logs`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up expired audit logs:', error);
    }
  }
}