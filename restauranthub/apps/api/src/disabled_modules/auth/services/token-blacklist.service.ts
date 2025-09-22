import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async blacklistToken(token: string, userId?: string, reason?: string) {
    try {
      // For mock database mode, skip actual blacklisting but log it
      if (process.env.MOCK_DATABASE === 'true') {
        this.logger.debug(`MOCK: Token would be blacklisted for user ${userId}: ${reason}`);
        return;
      }

      // Decode token to get expiration time
      const decoded = this.jwtService.decode(token) as any;
      const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Type assertion for mock database compatibility
      const prismaWithBlacklist = this.prisma as any;
      if (prismaWithBlacklist.blacklistedToken) {
        await prismaWithBlacklist.blacklistedToken.create({
          data: {
            token,
            expiresAt,
            userId,
            reason,
          },
        }).catch(() => {
          // Token might already be blacklisted, ignore duplicate error
        });
      }

      this.logger.debug(`Token blacklisted for user ${userId}: ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to blacklist token: ${error.message}`);
    }
  }

  async blacklistAllUserTokens(userId: string, reason?: string) {
    try {
      // For mock database mode, skip actual blacklisting but log it
      if (process.env.MOCK_DATABASE === 'true') {
        this.logger.debug(`MOCK: All tokens would be blacklisted for user ${userId}: ${reason}`);
        return;
      }

      // Create a generic blacklist entry for all tokens for this user
      // This is more efficient than blacklisting each individual token
      const prismaWithBlacklist = this.prisma as any;
      if (prismaWithBlacklist.blacklistedToken) {
        await prismaWithBlacklist.blacklistedToken.create({
          data: {
            token: `USER_ALL_TOKENS_${userId}_${Date.now()}`, // Unique identifier
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            userId,
            reason: reason || 'All tokens invalidated',
          },
        });
      }

      this.logger.debug(`All tokens blacklisted for user ${userId}: ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to blacklist all tokens for user ${userId}: ${error.message}`);
    }
  }

  async isTokenBlacklisted(token: string, userId?: string): Promise<boolean> {
    try {
      // For mock database mode, return false (no blacklisting)
      if (process.env.MOCK_DATABASE === 'true') {
        return false;
      }

      // Check if specific token is blacklisted
      const prismaWithBlacklist = this.prisma as any;
      if (!prismaWithBlacklist.blacklistedToken) {
        return false;
      }

      const blacklistedToken = await prismaWithBlacklist.blacklistedToken.findFirst({
        where: {
          OR: [
            { token },
            userId ? {
              AND: [
                { userId },
                { token: { startsWith: `USER_ALL_TOKENS_${userId}_` } }
              ]
            } : undefined,
          ].filter(Boolean),
        },
      });

      return !!blacklistedToken;
    } catch (error) {
      this.logger.error(`Failed to check token blacklist: ${error.message}`);
      return false; // Fail open for availability
    }
  }

  // Cleanup expired blacklisted tokens (should be run periodically)
  async cleanupExpiredBlacklistedTokens() {
    try {
      // For mock database mode, skip cleanup
      if (process.env.MOCK_DATABASE === 'true') {
        this.logger.debug(`MOCK: Would cleanup expired blacklisted tokens`);
        return 0;
      }

      const prismaWithBlacklist = this.prisma as any;
      if (!prismaWithBlacklist.blacklistedToken) {
        return 0;
      }

      const result = await prismaWithBlacklist.blacklistedToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      this.logger.debug(`Cleaned up ${result.count} expired blacklisted tokens`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to cleanup expired blacklisted tokens: ${error.message}`);
      return 0;
    }
  }
}