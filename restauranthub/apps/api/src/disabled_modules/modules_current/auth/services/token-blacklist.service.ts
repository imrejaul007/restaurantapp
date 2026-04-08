import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Add a token to the blacklist
   */
  async blacklistToken(
    token: string,
    userId: string,
    expiresAt: Date,
    reason?: string
  ): Promise<void> {
    try {
      await this.prisma.blacklistedToken.create({
        data: {
          token,
          userId,
          expiresAt,
          reason: reason || 'User logout'
        }
      });

      this.logger.debug(`Token blacklisted for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to blacklist token for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenBlacklisted(token: string, userId?: string): Promise<boolean> {
    try {
      // First check if the token exists in blacklist
      const blacklistedToken = await this.prisma.blacklistedToken.findUnique({
        where: { token }
      });

      if (!blacklistedToken) {
        return false;
      }

      // Check if token has expired (expired tokens are automatically invalid)
      const now = new Date();
      if (blacklistedToken.expiresAt < now) {
        // Clean up expired token from blacklist
        await this.cleanupExpiredToken(blacklistedToken.id);
        return false;
      }

      // Token is blacklisted and still valid
      this.logger.debug(`Token is blacklisted for user ${userId || blacklistedToken.userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error checking token blacklist status:`, error);
      // In case of database errors, err on the side of caution
      // Don't block access due to infrastructure issues
      return false;
    }
  }

  /**
   * Blacklist all tokens for a specific user
   * Useful for logout from all devices
   */
  async blacklistAllUserTokens(userId: string, reason?: string): Promise<number> {
    try {
      // Get all active sessions for the user
      const sessions = await this.prisma.session.findMany({
        where: {
          userId,
          expiresAt: { gt: new Date() }
        }
      });

      let blacklistedCount = 0;

      // Blacklist each active session token
      for (const session of sessions) {
        try {
          await this.blacklistToken(
            session.token,
            userId,
            session.expiresAt,
            reason || 'Logout from all devices'
          );
          blacklistedCount++;
        } catch (error) {
          this.logger.warn(`Failed to blacklist token ${session.id} for user ${userId}:`, error);
        }
      }

      // Also invalidate all sessions in the session table
      await this.prisma.session.deleteMany({
        where: { userId }
      });

      this.logger.log(`Blacklisted ${blacklistedCount} tokens for user ${userId}`);
      return blacklistedCount;
    } catch (error) {
      this.logger.error(`Failed to blacklist all tokens for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a specific token from blacklist
   * Useful for token refresh scenarios
   */
  async removeFromBlacklist(token: string): Promise<boolean> {
    try {
      const result = await this.prisma.blacklistedToken.deleteMany({
        where: { token }
      });

      if (result.count > 0) {
        this.logger.debug(`Token removed from blacklist`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to remove token from blacklist:`, error);
      return false;
    }
  }

  /**
   * Clean up expired tokens from the blacklist
   * Should be run periodically to prevent database bloat
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await this.prisma.blacklistedToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });

      if (result.count > 0) {
        this.logger.log(`Cleaned up ${result.count} expired blacklisted tokens`);
      }

      return result.count;
    } catch (error) {
      this.logger.error(`Failed to cleanup expired blacklisted tokens:`, error);
      return 0;
    }
  }

  /**
   * Clean up a specific expired token
   */
  private async cleanupExpiredToken(tokenId: string): Promise<void> {
    try {
      await this.prisma.blacklistedToken.delete({
        where: { id: tokenId }
      });
    } catch (error) {
      // Ignore errors in cleanup - might have been deleted by concurrent cleanup
      this.logger.debug(`Token ${tokenId} might have already been cleaned up`);
    }
  }

  /**
   * Get blacklist statistics
   */
  async getBlacklistStats(): Promise<{
    total: number;
    expired: number;
    active: number;
  }> {
    try {
      const now = new Date();

      const [total, expired] = await Promise.all([
        this.prisma.blacklistedToken.count(),
        this.prisma.blacklistedToken.count({
          where: { expiresAt: { lt: now } }
        })
      ]);

      return {
        total,
        expired,
        active: total - expired
      };
    } catch (error) {
      this.logger.error(`Failed to get blacklist stats:`, error);
      return { total: 0, expired: 0, active: 0 };
    }
  }

  /**
   * Initialize cleanup job
   * This should be called periodically (e.g., via cron job)
   */
  async performPeriodicCleanup(): Promise<void> {
    this.logger.log('Starting periodic blacklist cleanup...');

    try {
      const cleanedCount = await this.cleanupExpiredTokens();
      const stats = await this.getBlacklistStats();

      this.logger.log(
        `Periodic cleanup completed. Removed: ${cleanedCount}, ` +
        `Active: ${stats.active}, Total: ${stats.total}`
      );
    } catch (error) {
      this.logger.error('Periodic cleanup failed:', error);
    }
  }
}