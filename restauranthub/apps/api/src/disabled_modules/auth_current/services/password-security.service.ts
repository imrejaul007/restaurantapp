import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SecurityConfigService } from '../security-config.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

export interface PasswordHistoryEntry {
  passwordHash: string;
  createdAt: Date;
}

@Injectable()
export class PasswordSecurityService {
  private readonly logger = new Logger(PasswordSecurityService.name);

  constructor(
    private prisma: PrismaService,
    private securityConfig: SecurityConfigService,
  ) {}

  async validatePasswordPolicy(password: string): Promise<void> {
    const validation = this.securityConfig.isPasswordPolicyCompliant(password);

    if (!validation.isCompliant) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: validation.errors,
      });
    }
  }

  async checkPasswordReuse(userId: string, newPassword: string): Promise<void> {
    const passwordPolicy = this.securityConfig.getPasswordPolicy();

    if (passwordPolicy.preventReuse === 0) {
      return; // Password reuse prevention disabled
    }

    // Get recent password hashes
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check current password
    const isCurrentPassword = await argon2.verify(user.passwordHash, newPassword);
    if (isCurrentPassword) {
      throw new BadRequestException('New password cannot be the same as current password');
    }

    // For now, we only check against current password
    // TODO: Implement password history table for full history tracking
    this.logger.debug(`Password reuse check completed for user ${userId}`);
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
      hashLength: 32,
    });
  }

  async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
      this.logger.error('Password verification error:', error);
      return false;
    }
  }

  generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';
    const policy = this.securityConfig.getPasswordPolicy();

    // Ensure at least one character from each required category
    if (policy.requireUppercase) {
      password += uppercase[crypto.randomInt(0, uppercase.length)];
    }
    if (policy.requireLowercase) {
      password += lowercase[crypto.randomInt(0, lowercase.length)];
    }
    if (policy.requireNumbers) {
      password += numbers[crypto.randomInt(0, numbers.length)];
    }
    if (policy.requireSpecialChars) {
      password += symbols[crypto.randomInt(0, symbols.length)];
    }

    // Fill remaining length with random characters from all allowed sets
    const allChars = uppercase + lowercase + numbers + symbols;
    const remainingLength = length - password.length;

    for (let i = 0; i < remainingLength; i++) {
      password += allChars[crypto.randomInt(0, allChars.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => crypto.randomInt(0, 3) - 1).join('');
  }

  async checkPasswordAge(userId: string): Promise<{ expired: boolean; daysUntilExpiry: number; }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { updatedAt: true }, // Assuming password changes update the user record
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const passwordPolicy = this.securityConfig.getPasswordPolicy();
    const passwordAge = Math.floor(
      (Date.now() - user.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const expired = passwordAge >= passwordPolicy.maxAge;
    const daysUntilExpiry = Math.max(0, passwordPolicy.maxAge - passwordAge);

    return { expired, daysUntilExpiry };
  }

  async validatePasswordStrength(password: string): Promise<{
    score: number;
    feedback: string[];
    isStrong: boolean;
  }> {
    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 12 characters long');

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Add numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 2;
    else feedback.push('Add special characters');

    // Pattern checks
    if (!/(.)\1{2,}/.test(password)) score += 1;
    else feedback.push('Avoid repeated characters');

    if (!/123|abc|qwe|password/i.test(password)) score += 1;
    else feedback.push('Avoid common sequences and words');

    // Additional complexity checks
    if (password.length >= 16) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1; // Multiple special chars

    const maxScore = 11;
    const normalizedScore = Math.min(100, Math.round((score / maxScore) * 100));
    const isStrong = normalizedScore >= 80;

    if (isStrong) {
      feedback.push('Strong password!');
    } else if (normalizedScore >= 60) {
      feedback.push('Good password, but could be stronger');
    } else {
      feedback.push('Weak password - please improve');
    }

    return {
      score: normalizedScore,
      feedback,
      isStrong,
    };
  }

  async rotateJwtSecrets(): Promise<void> {
    // This would typically involve generating new JWT secrets and
    // gracefully transitioning from old to new secrets
    this.logger.warn('JWT secret rotation requested - implement in production environment');

    // TODO: Implement JWT secret rotation strategy
    // 1. Generate new secrets
    // 2. Store both old and new secrets temporarily
    // 3. Issue new tokens with new secret
    // 4. Accept both old and new tokens during transition period
    // 5. Remove old secrets after transition period
  }

  async detectSuspiciousPasswordActivity(userId: string, action: string): Promise<void> {
    // Track password-related activities for security monitoring
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: `PASSWORD_${action.toUpperCase()}`,
          entityType: 'User',
          entityId: userId,
          details: {
            timestamp: new Date().toISOString(),
            action,
            ip: 'unknown', // Would be passed from request context
            userAgent: 'unknown', // Would be passed from request context
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to log password activity:', error);
    }
  }

  async generatePasswordResetToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate cryptographically secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store hashed token
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiresAt,
      },
    });

    return resetToken;
  }

  async validatePasswordResetToken(token: string): Promise<string | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: {
          gt: new Date(),
        },
      },
      select: { id: true },
    });

    return user?.id || null;
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });
  }
}