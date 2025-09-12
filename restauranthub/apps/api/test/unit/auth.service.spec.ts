import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { EmailService } from '../../src/modules/email/email.service';
import { UsersService } from '../../src/modules/users/users.service';
import { TestUtils } from '../setup';
import * as argon2 from 'argon2';

// Mock external dependencies
jest.mock('argon2');
const mockedArgon2 = argon2 as jest.Mocked<typeof argon2>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let redisService: jest.Mocked<RedisService>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      restaurant: {
        create: jest.fn(),
      },
      vendor: {
        create: jest.fn(),
      },
      employee: {
        create: jest.fn(),
        count: jest.fn(),
      },
      session: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const mockRedisService = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockEmailService = {
      sendEmail: jest.fn(),
    };

    const mockUsersService = {};
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    redisService = module.get(RedisService);
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);

    // Setup mocks
    mockedArgon2.hash.mockResolvedValue('hashed-password');
    mockedArgon2.verify.mockResolvedValue(true);
    jwtService.sign.mockReturnValue('mock-jwt-token');
    jwtService.verify.mockReturnValue({ sub: 'user-id', email: 'test@example.com' });
  });

  describe('signUp', () => {
    it('should create a new user successfully', async () => {
      const signUpDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
      };

      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({
        id: 'user-id',
        email: signUpDto.email,
        role: signUpDto.role,
        profile: {
          firstName: signUpDto.firstName,
          lastName: signUpDto.lastName,
        },
      });

      const result = await service.signUp(signUpDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(emailService.sendEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      const signUpDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
      };

      prismaService.user.findFirst.mockResolvedValue({
        id: 'existing-user',
        email: signUpDto.email,
      });

      await expect(service.signUp(signUpDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const signInDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id',
        email: signInDto.email,
        passwordHash: 'hashed-password',
        isActive: true,
        role: 'CUSTOMER',
        profile: { firstName: 'Test', lastName: 'User' },
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      prismaService.session.create.mockResolvedValue({});

      const result = await service.signIn(signInDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: expect.objectContaining({
          lastLoginAt: expect.any(Date),
          loginCount: { increment: 1 },
        }),
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const signInDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const signInDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id',
        email: signInDto.email,
        passwordHash: 'hashed-password',
        isActive: false,
        role: 'CUSTOMER',
        profile: { firstName: 'Test', lastName: 'User' },
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const userId = 'user-id';
      
      prismaService.user.update.mockResolvedValue({});
      prismaService.session.deleteMany.mockResolvedValue({});
      redisService.del.mockResolvedValue();

      const result = await service.logout(userId);

      expect(result.message).toBe('Logged out successfully');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken: null },
      });
      expect(redisService.del).toHaveBeenCalledWith(`user:${userId}`);
    });

    it('should logout from all devices', async () => {
      const userId = 'user-id';
      
      prismaService.user.update.mockResolvedValue({});
      prismaService.session.findMany.mockResolvedValue([
        { token: 'token1' },
        { token: 'token2' },
      ]);
      prismaService.session.deleteMany.mockResolvedValue({});
      redisService.set.mockResolvedValue();
      redisService.del.mockResolvedValue();

      await service.logout(userId, true);

      expect(prismaService.session.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(redisService.set).toHaveBeenCalledTimes(2); // Blacklist tokens
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const refreshTokenDto = { refreshToken: 'valid-refresh-token' };
      
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'CUSTOMER',
        refreshToken: 'hashed-refresh-token',
      };

      jwtService.verify.mockReturnValue({
        sub: 'user-id',
        email: 'test@example.com',
        role: 'CUSTOMER',
      });
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.refreshTokens(refreshTokenDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshTokenDto = { refreshToken: 'invalid-refresh-token' };
      
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshTokens(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const token = 'verification-token';
      
      jwtService.verify.mockReturnValue({
        email: 'test@example.com',
        type: 'email-verification',
      });

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        emailVerifiedAt: null,
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
      });

      const result = await service.verifyEmail(token);

      expect(result.message).toBe('Email verified successfully');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          emailVerifiedAt: expect.any(Date),
          status: 'ACTIVE',
        },
      });
    });
  });
});