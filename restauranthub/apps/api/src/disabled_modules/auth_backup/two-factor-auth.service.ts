import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorAuthService {
  private readonly logger = new Logger(TwoFactorAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async generateTwoFactorSecret(userId: string) {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, twoFactorEnabled: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.twoFactorEnabled) {
        throw new BadRequestException('Two-factor authentication is already enabled');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `RestoPapa (${user.email})`,
        issuer: 'RestoPapa',
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

      this.logger.log(`2FA secret generated for user ${userId}`);

      return {
        secret: secret.base32,
        qrCodeUrl,
        manualEntryKey: secret.base32,
      };
    } catch (error) {
      this.logger.error('Failed to generate 2FA secret', error);
      throw error;
    }
  }

  async enableTwoFactorAuth(userId: string, token: string) {
    try {
      // Get user with secret
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          twoFactorSecret: true, 
          twoFactorEnabled: true 
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
        window: 2, // Allow 2 time steps before/after current time
      });

      if (!isValidToken) {
        throw new BadRequestException('Invalid verification code');
      }

      // Enable 2FA
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
        },
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      this.logger.log(`2FA enabled for user ${userId}`);

      return {
        enabled: true,
        backupCodes,
      };
    } catch (error) {
      this.logger.error('Failed to enable 2FA', error);
      throw error;
    }
  }

  async disableTwoFactorAuth(userId: string, token: string) {
    try {
      // Get user with secret
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          twoFactorSecret: true, 
          twoFactorEnabled: true 
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!user.twoFactorEnabled) {
        throw new BadRequestException('Two-factor authentication is not enabled');
      }

      // Verify token
      const isValidToken = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: token,
        window: 2,
      });

      if (!isValidToken) {
        throw new BadRequestException('Invalid verification code');
      }

      // Disable 2FA
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });

      this.logger.log(`2FA disabled for user ${userId}`);

      return {
        disabled: true,
      };
    } catch (error) {
      this.logger.error('Failed to disable 2FA', error);
      throw error;
    }
  }

  async verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    try {
      // Get user with secret
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          twoFactorSecret: true, 
          twoFactorEnabled: true 
        },
      });

      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new UnauthorizedException('Two-factor authentication not enabled');
      }

      // Verify token
      const isValidToken = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: token,
        window: 2,
      });

      if (isValidToken) {
        this.logger.debug(`2FA token verified for user ${userId}`);
      } else {
        this.logger.warn(`Invalid 2FA token for user ${userId}`);
      }

      return isValidToken;
    } catch (error) {
      this.logger.error('Failed to verify 2FA token', error);
      throw error;
    }
  }

  async getTwoFactorStatus(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          twoFactorEnabled: true,
          email: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      return {
        enabled: user.twoFactorEnabled,
        email: user.email,
      };
    } catch (error) {
      this.logger.error('Failed to get 2FA status', error);
      throw error;
    }
  }

  private generateBackupCodes(count: number = 8): string[] {
    const backupCodes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-digit backup code
      const code = Math.random().toString(10).substring(2, 10);
      backupCodes.push(code);
    }

    return backupCodes;
  }

  async validateBackupCode(userId: string, backupCode: string): Promise<boolean> {
    // This would require storing backup codes in database
    // For now, return false as backup codes aren't implemented in schema
    this.logger.warn(`Backup code validation not implemented for user ${userId}`);
    return false;
  }
}