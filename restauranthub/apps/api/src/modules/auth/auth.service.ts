import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { UserRole } from '@prisma/client';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  async signUp(signUpDto: any) {
    const { email, password, role = UserRole.CUSTOMER, firstName, lastName, phone, appSource = 'restopapa_web' } = signUpDto;

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
        appSource,
        lastLoginApp: appSource,
      },
    });

    // Create profile with firstName and lastName
    await this.prisma.profile.create({
      data: {
        userId: user.id,
        firstName: firstName || 'User',
        lastName: lastName || '',
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Save refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async signIn(signInDto: any) {
    const { email, password, appSource = 'restopapa_web' } = signInDto;
    this.logger.debug(`Signin attempt for user`);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.debug('User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);

    if (!passwordValid) {
      this.logger.debug('Password validation failed');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      this.logger.debug('User is not active');
      throw new UnauthorizedException('Account is deactivated');
    }

    this.logger.debug(`Authentication successful, generating tokens`);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Update refresh token and last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await argon2.hash(tokens.refreshToken),
        lastLoginAt: new Date(),
        lastLoginApp: appSource,
      },
    });

    this.logger.log(`User ${user.email} logged in successfully`);

    // Create session
    await this.createSession(user.id, tokens.accessToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async logout(userId: string, accessToken?: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    // Blacklist the access token so it cannot be reused before it expires
    if (accessToken) {
      await this.tokenBlacklistService.blacklistToken(accessToken, userId, 'logout');
    }

    // Invalidate current session
    const currentSession = await this.prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (currentSession) {
      await this.prisma.session.delete({
        where: { id: currentSession.id },
      });
    }

    this.logger.log(`User ${userId} logged out`);
    return { message: 'Logged out successfully' };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);

    if (!passwordValid || !user.isActive) {
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
          expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
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
          secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
      tokenType: 'Bearer',
    };
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

  private sanitizeUser(user: any) {
    const { passwordHash, refreshToken, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }
}