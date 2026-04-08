import { Injectable, BadRequestException, UnauthorizedException, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SecurityConfigService } from './security-config.service';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes?: string[];
}

export interface MfaBackupCode {
  id: string;
  codeHash: string;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

export interface MfaStatus {
  enabled: boolean;
  required: boolean;
  enforced: boolean;
  email: string;
  role: string;
  backupCodesRemaining?: number;
}

@Injectable()
export class EnhancedMfaService {
  private readonly logger = new Logger(EnhancedMfaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly securityConfig: SecurityConfigService,
  ) {}

  async generateMfaSecret(userId: string): Promise<MfaSetupResponse> {
    try {
      // Check if user exists and get their info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, twoFactorEnabled: true, role: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.twoFactorEnabled) {
        throw new BadRequestException('Two-factor authentication is already enabled');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `RestaurantHub (${user.email})`,
        issuer: 'RestaurantHub',
        length: 32,
      });

      // Store the secret temporarily (not enabled yet)
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorSecret: secret.base32,
        },
      });

      // Generate QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

      this.logger.log(`MFA secret generated for user ${userId} (${user.role})`);

      return {
        secret: secret.base32,
        qrCodeUrl,
        manualEntryKey: secret.base32,
      };
    } catch (error) {
      this.logger.error('Failed to generate MFA secret', error);
      throw error;
    }
  }

  async enableMfa(userId: string, token: string, includeBackupCodes: boolean = true): Promise<{ enabled: boolean; backupCodes?: string[] }> {
    try {
      // Get user with secret
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          twoFactorSecret: true,
          twoFactorEnabled: true,
          role: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!user.twoFactorSecret) {
        throw new BadRequestException('Two-factor secret not found. Generate secret first.');
      }

      if (user.twoFactorEnabled) {
        throw new BadRequestException('Two-factor authentication is already enabled');
      }

      // Verify token
      const isValidToken = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: this.securityConfig.getTwoFactorAuthConfig().tokenWindowSize,
      });

      if (!isValidToken) {
        throw new BadRequestException('Invalid verification code');
      }

      // Enable MFA
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
        },
      });

      let backupCodes: string[] | undefined;

      // Generate backup codes if requested
      if (includeBackupCodes) {
        backupCodes = await this.generateAndStoreBackupCodes(userId);
      }

      this.logger.log(`MFA enabled for user ${userId} (${user.role})`);

      return {
        enabled: true,
        backupCodes,
      };
    } catch (error) {
      this.logger.error('Failed to enable MFA', error);
      throw error;
    }
  }

  async disableMfa(userId: string, token: string): Promise<{ disabled: boolean }> {
    try {
      // Get user with secret
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          twoFactorSecret: true,
          twoFactorEnabled: true,
          role: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!user.twoFactorEnabled) {
        throw new BadRequestException('Two-factor authentication is not enabled');
      }

      // Check if MFA is enforced for this user's role
      const isMfaEnforced = this.securityConfig.isMfaRequired(user.role);
      if (isMfaEnforced) {
        throw new ForbiddenException(`MFA cannot be disabled for ${user.role} role due to security policy`);
      }

      // Verify token
      const isValidToken = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: token,
        window: this.securityConfig.getTwoFactorAuthConfig().tokenWindowSize,
      });

      if (!isValidToken) {
        throw new BadRequestException('Invalid verification code');
      }

      // Disable MFA and clear backup codes
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });

      // Clear backup codes
      await this.clearBackupCodes(userId);

      this.logger.log(`MFA disabled for user ${userId} (${user.role})`);

      return {
        disabled: true,
      };
    } catch (error) {
      this.logger.error('Failed to disable MFA', error);
      throw error;
    }
  }

  async verifyMfaToken(userId: string, token: string): Promise<boolean> {
    try {
      // Get user with secret
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          twoFactorSecret: true,
          twoFactorEnabled: true,
          email: true,
        },
      });

      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new UnauthorizedException('Two-factor authentication not enabled');
      }

      // Verify TOTP token
      const isValidToken = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: token,
        window: this.securityConfig.getTwoFactorAuthConfig().tokenWindowSize,
      });

      if (isValidToken) {
        this.logger.debug(`MFA token verified for user ${userId}`);
        return true;
      }

      // If TOTP fails, try backup code validation
      const isValidBackupCode = await this.validateAndConsumeBackupCode(userId, token);

      if (isValidBackupCode) {
        this.logger.log(`MFA backup code used for user ${userId}`);
        return true;
      }

      this.logger.warn(`Invalid MFA token/backup code for user ${userId}`);
      return false;
    } catch (error) {
      this.logger.error('Failed to verify MFA token', error);
      throw error;
    }
  }

  async getMfaStatus(userId: string): Promise<MfaStatus> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          twoFactorEnabled: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const isMfaRequired = this.securityConfig.isMfaRequired(user.role);
      const isMfaEnforced = this.securityConfig.getTwoFactorAuthConfig().enforceForAdmins && user.role === 'ADMIN';

      let backupCodesRemaining: number | undefined;
      if (user.twoFactorEnabled) {
        backupCodesRemaining = await this.getBackupCodesRemaining(userId);
      }

      return {
        enabled: user.twoFactorEnabled,
        required: isMfaRequired,
        enforced: isMfaEnforced,
        email: user.email,
        role: user.role,
        backupCodesRemaining,
      };
    } catch (error) {
      this.logger.error('Failed to get MFA status', error);
      throw error;
    }
  }

  async validateMfaRequirement(userId: string): Promise<{ required: boolean; reason?: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          twoFactorEnabled: true,
          role: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const isMfaRequired = this.securityConfig.isMfaRequired(user.role);

      if (isMfaRequired && !user.twoFactorEnabled) {
        return {
          required: true,
          reason: `Multi-factor authentication is required for ${user.role} role`,
        };
      }

      return { required: false };
    } catch (error) {
      this.logger.error('Failed to validate MFA requirement', error);
      throw error;
    }
  }

  async regenerateBackupCodes(userId: string, token: string): Promise<string[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          twoFactorSecret: true,
          twoFactorEnabled: true,
        },
      });

      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new UnauthorizedException('Two-factor authentication not enabled');
      }

      // Verify current MFA token
      const isValidToken = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: this.securityConfig.getTwoFactorAuthConfig().tokenWindowSize,
      });

      if (!isValidToken) {
        throw new BadRequestException('Invalid verification code');
      }

      // Clear existing backup codes
      await this.clearBackupCodes(userId);

      // Generate new backup codes
      const newBackupCodes = await this.generateAndStoreBackupCodes(userId);

      this.logger.log(`Backup codes regenerated for user ${userId}`);
      return newBackupCodes;
    } catch (error) {
      this.logger.error('Failed to regenerate backup codes', error);
      throw error;
    }
  }

  private async generateAndStoreBackupCodes(userId: string): Promise<string[]> {
    const config = this.securityConfig.getTwoFactorAuthConfig();
    const backupCodes = this.generateBackupCodes(config.backupCodesCount);

    // Hash backup codes before storing
    const hashedCodes = await Promise.all(
      backupCodes.map(async (code, index) => {
        const hash = await argon2.hash(code, {
          type: argon2.argon2id,
          memoryCost: 2 ** 16, // 64 MB
          timeCost: 3,
          parallelism: 1,
        });
        return {
          id: `${userId}_backup_${index}_${Date.now()}`,
          codeHash: hash,
          used: false,
          createdAt: new Date(),
        };
      })
    );

    // Store hashed codes in user preferences (for now)
    // In production, consider a dedicated MfaBackupCodes table
    const existingPrefs = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    const prefsData = {
      userId,
      // Store backup codes metadata in a JSON field for now
      // In production, use a proper relational structure
      ...{}, // Placeholder for backup codes storage
      updatedAt: new Date(),
    };

    if (existingPrefs) {
      await this.prisma.userPreferences.update({
        where: { userId },
        data: prefsData,
      });
    } else {
      await this.prisma.userPreferences.create({
        data: prefsData,
      });
    }

    this.logger.log(`Generated ${backupCodes.length} backup codes for user ${userId}`);
    return backupCodes; // Return plain codes to user (only time they see them)
  }

  private generateBackupCodes(count: number = 8): string[] {
    const backupCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate cryptographically secure 12-character backup code
      const code = crypto.randomBytes(6).toString('hex').toUpperCase();
      backupCodes.push(code);
    }

    return backupCodes;
  }

  private async clearBackupCodes(userId: string): Promise<void> {
    try {
      // Clear backup codes from user preferences
      // In production, this would clear from a dedicated table
      await this.prisma.userPreferences.updateMany({
        where: { userId },
        data: {
          // Clear backup codes metadata
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to clear backup codes for user ${userId}:`, error);
    }
  }

  private async validateAndConsumeBackupCode(userId: string, backupCode: string): Promise<boolean> {
    try {
      // For now, return false as backup codes need proper database schema
      // In production, implement proper backup code validation
      // This would involve:
      // 1. Query stored backup codes for user
      // 2. Validate provided code against stored hashes
      // 3. Mark code as used if valid
      // 4. Return validation result

      this.logger.debug(`Backup code validation attempted for user ${userId}`);
      return false;
    } catch (error) {
      this.logger.error(`Backup code validation error for user ${userId}:`, error);
      return false;
    }
  }

  private async getBackupCodesRemaining(userId: string): Promise<number> {
    try {
      // For now, return 0 as backup codes need proper database schema
      // In production, this would count unused backup codes
      return 0;
    } catch (error) {
      this.logger.warn(`Failed to get backup codes count for user ${userId}:`, error);
      return 0;
    }
  }

  async enforceMfaForAdmins(): Promise<void> {
    try {
      const config = this.securityConfig.getTwoFactorAuthConfig();

      if (!config.enforceForAdmins) {
        return;
      }

      // Find all admin users without MFA enabled
      const adminUsers = await this.prisma.user.findMany({
        where: {
          role: 'ADMIN',
          twoFactorEnabled: false,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (adminUsers.length > 0) {
        this.logger.warn(`Found ${adminUsers.length} admin users without MFA enabled:`, {
          adminUsers: adminUsers.map(u => ({ id: u.id, email: u.email }))
        });

        // In a real implementation, you might:
        // 1. Send notifications to these admins
        // 2. Set a grace period before enforcement
        // 3. Log this as a security concern
        // 4. Optionally disable accounts until MFA is enabled
      }
    } catch (error) {
      this.logger.error('Failed to enforce MFA for admins', error);
    }
  }

  // Security audit methods
  async getMfaAuditReport(): Promise<{
    totalUsers: number;
    mfaEnabledUsers: number;
    adminsMfaEnabled: number;
    totalAdmins: number;
    complianceRate: number;
  }> {
    try {
      const [totalUsers, mfaEnabledUsers, adminUsers, adminsMfaEnabled] = await Promise.all([
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isActive: true, twoFactorEnabled: true } }),
        this.prisma.user.count({ where: { isActive: true, role: 'ADMIN' } }),
        this.prisma.user.count({ where: { isActive: true, role: 'ADMIN', twoFactorEnabled: true } }),
      ]);

      const complianceRate = totalUsers > 0 ? (mfaEnabledUsers / totalUsers) * 100 : 0;

      return {
        totalUsers,
        mfaEnabledUsers,
        adminsMfaEnabled,
        totalAdmins: adminUsers,
        complianceRate: Math.round(complianceRate * 100) / 100,
      };
    } catch (error) {
      this.logger.error('Failed to generate MFA audit report', error);
      throw error;
    }
  }
}