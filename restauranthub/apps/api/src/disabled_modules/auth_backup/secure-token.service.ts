import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as argon2 from 'argon2';

/**
 * Secure Token Service
 *
 * Handles secure storage and validation of password reset tokens
 * with database fallback when Redis is unavailable.
 *
 * Security Features:
 * - Tokens stored as Argon2 hashes, not plain text
 * - Automatic expiry handling
 * - Comprehensive logging for audit trails
 * - Secure cleanup of expired tokens
 */
@Injectable()
export class SecureTokenService {
  private readonly logger = new Logger(SecureTokenService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Securely store password reset token with database fallback
   * Uses Redis when available, falls back to database storage
   */
  async storePasswordResetToken(userId: string, token: string): Promise<void> {
    try {
      // Try Redis first if available
      // if (this.redisService) {
      //   await this.redisService.set(
      //     `password-reset:${userId}`,
      //     token,
      //     3600, // 1 hour
      //   );
      //   this.logger.debug(`Password reset token stored in Redis for user ${userId}`);
      //   return;
      // }
    } catch (error) {
      this.logger.warn(`Redis unavailable, using database fallback for password reset token: ${error.message}`);
    }

    // Database fallback - store in a secure way
    // Note: In production, consider using a dedicated table for password reset tokens
    // For now, we'll store it as a secure hash in the user record with expiry
    const tokenHash = await argon2.hash(token, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        // Store the token hash and expiry in user record
        // In production, use a dedicated PasswordResetToken table
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiresAt,
      },
    });

    // Log security event
    this.logger.log(`Password reset token stored securely for user ${userId}`);
  }

  /**
   * Validate password reset token against stored value
   * Checks Redis first, falls back to database
   */
  async validatePasswordResetToken(userId: string, token: string): Promise<boolean> {
    try {
      // Try Redis first if available
      // if (this.redisService) {
      //   const storedToken = await this.redisService.get(`password-reset:${userId}`);
      //   if (storedToken !== null) {
      //     const isValid = storedToken === token;
      //     this.logger.debug(`Password reset token validated via Redis for user ${userId}: ${isValid}`);
      //     return isValid;
      //   }
      // }
    } catch (error) {
      this.logger.warn(`Redis unavailable, using database fallback for token validation: ${error.message}`);
    }

    // Database fallback - validate against stored hash
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          resetTokenHash: true,
          resetTokenExpiresAt: true,
        },
      });

      if (!user?.resetTokenHash || !user?.resetTokenExpiresAt) {
        this.logger.debug(`No password reset token found in database for user ${userId}`);
        return false;
      }

      // Check if token has expired
      if (new Date() > user.resetTokenExpiresAt) {
        this.logger.warn(`Password reset token expired for user ${userId}`);
        // Clean up expired token
        await this.deletePasswordResetToken(userId);
        return false;
      }

      // Verify token against stored hash
      const isValid = await argon2.verify(user.resetTokenHash, token);

      // Log validation attempt
      if (isValid) {
        this.logger.log(`Password reset token validated successfully for user ${userId}`);
      } else {
        this.logger.warn(`Invalid password reset token attempt for user ${userId}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Failed to validate password reset token for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Delete password reset token from storage
   * Removes from both Redis and database
   */
  async deletePasswordResetToken(userId: string): Promise<void> {
    try {
      // Try Redis first if available
      // if (this.redisService) {
      //   await this.redisService.del(`password-reset:${userId}`);
      //   this.logger.debug(`Password reset token deleted from Redis for user ${userId}`);
      // }
    } catch (error) {
      this.logger.warn(`Failed to delete password reset token from Redis: ${error.message}`);
    }

    // Always clean up database record
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          resetTokenHash: null,
          resetTokenExpiresAt: null,
        },
      });
      this.logger.log(`Password reset token deleted securely for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete password reset token from database for user ${userId}:`, error);
    }
  }

  /**
   * Clean up expired password reset tokens
   * Should be called periodically to maintain database hygiene
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await this.prisma.user.updateMany({
        where: {
          resetTokenExpiresAt: {
            lt: new Date(), // Less than current time
          },
        },
        data: {
          resetTokenHash: null,
          resetTokenExpiresAt: null,
        },
      });

      if (result.count > 0) {
        this.logger.log(`Cleaned up ${result.count} expired password reset tokens`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired password reset tokens:', error);
    }
  }
}