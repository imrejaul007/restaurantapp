import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '@prisma/client';
// import { RedisService } from '../../redis/redis.service';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    // private redisService: RedisService, // Temporarily disabled
    private emailService: EmailService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const { email, password, role, firstName, lastName, phone } = signUpDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: phone || undefined },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Hash password
    const passwordHash = await argon2.hash(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        role: role as UserRole,
      },
    });

    // Create profile with firstName and lastName
    await this.prisma.profile.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Save refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // Create role-specific profile - disabled for now
    // await this.createRoleProfile(user.id, role, signUpDto);

    // Send verification email
    await this.sendVerificationEmail(user.email, firstName || 'User');

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Update refresh token and last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await argon2.hash(tokens.refreshToken),
        lastLoginAt: new Date(),
      },
    });

    // Log security event
    this.logger.log(`User ${user.email} logged in successfully`);

    // Create session
    await this.createSession(user.id, tokens.accessToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        this.logger.debug('User not found or no refresh token stored');
        throw new UnauthorizedException('Invalid refresh token');
      }

      this.logger.debug('Verifying refresh token hash...');
      this.logger.debug(`Stored hash: ${user.refreshToken?.substring(0, 20)}...`);
      this.logger.debug(`Provided token: ${refreshToken.substring(0, 20)}...`);
      
      const refreshTokenMatches = await argon2.verify(
        user.refreshToken,
        refreshToken,
      );

      if (!refreshTokenMatches) {
        this.logger.debug('Refresh token hash does not match');
        throw new UnauthorizedException('Invalid refresh token');
      }
      
      this.logger.debug('Refresh token validated successfully');

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Update refresh token
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, logoutAll = false) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    if (logoutAll) {
      // Invalidate all sessions
      await this.prisma.session.deleteMany({
        where: { userId },
      });

      // Add to blacklist in Redis
      const sessions = await this.prisma.session.findMany({
        where: { userId },
        select: { token: true },
      });

      for (const session of sessions) {
        // await this.redisService.set(
        //   `blacklist:${session.token}`,
        //   'true',
        //   24 * 60 * 60, // 24 hours
        // );
      }
    } else {
      // Invalidate current session only
      const currentSession = await this.prisma.session.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (currentSession) {
        await this.prisma.session.delete({
          where: { id: currentSession.id },
        });

        // await this.redisService.set(
        //   `blacklist:${currentSession.token}`,
        //   'true',
        //   24 * 60 * 60, // 24 hours
        // );
      }
    }

    // Clear cache
    // await this.redisService.del(`user:${userId}`);

    this.logger.log(`User ${userId} logged out${logoutAll ? ' from all devices' : ''}`);
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'password-reset' },
      { 
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '1h',
      },
    );

    // Store token in Redis with expiry
    // await this.redisService.set(
    //   `password-reset:${user.id}`,
    //   resetToken,
    //   3600, // 1 hour
    // );

    // Send reset email
    await this.sendPasswordResetEmail(user.email, resetToken, user.firstName || 'User');

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Invalid reset token');
      }

      // Check if token exists in Redis
      // const storedToken = await this.redisService.get(`password-reset:${payload.sub}`);
      const storedToken = null; // Temporarily disabled Redis
      if (storedToken !== token) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Hash new password
      const passwordHash = await argon2.hash(newPassword);

      // Update password
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { passwordHash },
      });

      // Delete reset token
      // await this.redisService.del(`password-reset:${payload.sub}`);

      // Invalidate all sessions
      await this.prisma.session.deleteMany({
        where: { userId: payload.sub },
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const passwordValid = await argon2.verify(user.passwordHash, oldPassword);
    if (!passwordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all other sessions
    await this.prisma.session.deleteMany({
      where: { 
        userId,
        token: { not: '' }, // Keep current session
      },
    });

    return { message: 'Password changed successfully' };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      return null;
    }

    if (!user.isActive || user.status !== 'ACTIVE') {
      return null;
    }

    return this.sanitizeUser(user);
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const jti = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.sign(
        { 
          sub: userId, 
          email, 
          role,
          jti,
          iat: now,
          type: 'access'
        },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_EXPIRES_IN'),
        },
      ),
      this.jwtService.sign(
        { 
          sub: userId, 
          email, 
          role,
          jti: crypto.randomUUID(),
          iat: now,
          type: 'refresh'
        },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirationTime(this.configService.get('JWT_EXPIRES_IN') || '15m'),
      tokenType: 'Bearer',
    };
  }

  private parseExpirationTime(timeString: string): number {
    const match = timeString.match(/(\d+)(\w+)/);
    if (!match) return 900; // Default 15 minutes

    const [, value, unit] = match;
    const multipliers: { [key: string]: number } = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400,
    };

    return parseInt(value) * (multipliers[unit as keyof typeof multipliers] || 60);
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  private async createSession(userId: string, token: string) {
    await this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });
  }

  private async createRoleProfile(userId: string, role: string, data: any) {
    // Role profile creation temporarily disabled due to missing database models
    switch (role) {
      case UserRole.RESTAURANT:
        // Restaurant profile available in schema
        await this.prisma.restaurant.create({
          data: {
            userId,
            name: data.restaurantName || data.firstName + "'s Restaurant",
            businessName: data.restaurantName || data.firstName + "'s Restaurant",
            description: data.description || '',
          },
        });
        break;

      case UserRole.VENDOR:
        // Vendor profile available in schema
        await this.prisma.vendor.create({
          data: {
            userId,
            companyName: data.companyName || data.firstName + "'s Company",
            businessName: data.companyName || data.firstName + "'s Company",
            businessType: data.businessType || 'General',
            description: data.description || '',
          },
        });
        break;

      case UserRole.EMPLOYEE:
        // Employee profile available in schema
        if (data.restaurantId) {
          await this.prisma.employee.create({
            data: {
              userId,
              restaurantId: data.restaurantId,
              employeeCode: await this.generateEmployeeCode(),
              designation: data.designation || 'Staff',
              joiningDate: new Date(),
            },
          });
        }
        break;
    }
  }

  private async generateEmployeeCode(): Promise<string> {
    const count = await this.prisma.employee.count();
    return `EMP${String(count + 1).padStart(6, '0')}`;
  }

  private sanitizeUser(user: any) {
    const { passwordHash, refreshToken, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }

  private async sendVerificationEmail(email: string, firstName: string) {
    const verificationToken = this.jwtService.sign(
      { email, type: 'email-verification' },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '24h',
      },
    );

    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`;

    try {
      await this.emailService.sendEmail({
        to: email,
        subject: 'Verify Your Email Address',
        template: 'welcome',
        templateData: {
          firstName,
          verificationUrl,
          supportEmail: 'support@restauranthub.com',
        },
      });
      
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
    }
  }

  private async sendPasswordResetEmail(email: string, token: string, firstName: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
    
    try {
      await this.emailService.sendEmail({
        to: email,
        subject: 'Reset Your Password',
        template: 'passwordReset',
        templateData: {
          firstName,
          resetUrl,
          expiryTime: '1 hour',
          supportEmail: 'support@restauranthub.com',
        },
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
    }
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      if (payload.type !== 'email-verification') {
        throw new BadRequestException('Invalid verification token');
      }

      const user = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.emailVerifiedAt) {
        return { message: 'Email already verified' };
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerifiedAt: new Date(),
          status: 'ACTIVE',
          isActive: true,
        },
      });

      this.logger.log(`Email verified for user ${user.email}`);
      return { message: 'Email verified successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerifiedAt) {
      throw new BadRequestException('Email already verified');
    }

    // Rate limit: Check if verification email was sent recently
    // const lastSent = await this.redisService.get(`verification-sent:${user.id}`);
    const lastSent = null; // Temporarily disabled Redis
    if (lastSent) {
      throw new BadRequestException('Verification email was sent recently. Please wait before requesting again.');
    }

    await this.sendVerificationEmail(user.email, user.firstName || 'User');

    // Set rate limit
    // await this.redisService.set(`verification-sent:${user.id}`, 'true', 300); // 5 minutes

    return { message: 'Verification email sent' };
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      // Try Redis first
      // const blacklisted = await this.redisService.get(`blacklist:${token}`);
      // if (blacklisted !== null) return !!blacklisted;
      
      // Fallback to database
      const revokedToken = await this.prisma.revokedToken.findUnique({
        where: { token },
      });
      return !!revokedToken;
    } catch (error) {
      this.logger.error('Token blacklist check failed:', error);
      // Fail securely - treat as blacklisted if we can't verify
      return true;
    }
  }

  async getUserSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { 
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true,
      },
    });

    return sessions;
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    await this.prisma.session.delete({
      where: { id: sessionId },
    });

    // Add to blacklist
    // await this.redisService.set(
    //   `blacklist:${session.token}`,
    //   'true',
    //   24 * 60 * 60, // 24 hours
    // );

    this.logger.log(`Session ${sessionId} revoked for user ${userId}`);
    return { message: 'Session revoked successfully' };
  }
}