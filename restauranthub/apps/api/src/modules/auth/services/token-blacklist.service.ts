import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async blacklistToken(token: string, userId: string, reason: string = 'logout'): Promise<void> {
    try {
      // Extract JTI (JWT ID) from token
      const payload = this.extractPayloadFromToken(token);
      const jti = payload?.jti;

      if (!jti) {
        this.logger.warn('Cannot blacklist token without JTI');
        return;
      }

      // Hash the JTI for secure storage
      const hashedJti = crypto.createHash('sha256').update(jti).digest('hex');

      await this.prisma.blacklistedToken.create({
        data: {
          jti: hashedJti,
          userId,
          reason,
          expiresAt: new Date(Date.now() + this.getTokenExpiration()),
        },
      });

      this.logger.log(`Token blacklisted for user ${userId}, reason: ${reason}`);
    } catch (error) {
      this.logger.error('Failed to blacklist token:', error);
      throw error;
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const payload = this.extractPayloadFromToken(token);
      const jti = payload?.jti;

      if (!jti) {
        return false;
      }

      const hashedJti = crypto.createHash('sha256').update(jti).digest('hex');

      const blacklistedToken = await this.prisma.blacklistedToken.findFirst({
        where: {
          jti: hashedJti,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      return !!blacklistedToken;
    } catch (error) {
      this.logger.error('Error checking token blacklist:', error);
      return false;
    }
  }

  async blacklistAllUserTokens(userId: string, reason: string = 'security'): Promise<void> {
    try {
      // Get all active sessions for the user
      const sessions = await this.prisma.session.findMany({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      // Blacklist each session token
      for (const session of sessions) {
        await this.blacklistToken(session.token, userId, reason);
      }

      // Delete all sessions
      await this.prisma.session.deleteMany({
        where: { userId },
      });

      // Clear refresh token
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });

      this.logger.log(`All tokens blacklisted for user ${userId}, reason: ${reason}`);
    } catch (error) {
      this.logger.error('Failed to blacklist all user tokens:', error);
      throw error;
    }
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await this.prisma.blacklistedToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} expired blacklisted tokens`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens:', error);
    }
  }

  private extractPayloadFromToken(token: string): any {
    try {
      // Extract payload without verification (we just need the JTI)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf8')
      );

      return payload;
    } catch {
      return null;
    }
  }

  private getTokenExpiration(): number {
    // Default to 24 hours if no configuration found
    const expiresIn = this.configService.get('JWT_EXPIRES_IN', '15m');

    // Convert to milliseconds
    if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn) * 60 * 1000;
    } else if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn) * 60 * 60 * 1000;
    } else if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn) * 24 * 60 * 60 * 1000;
    }

    return 24 * 60 * 60 * 1000; // 24 hours default
  }
}