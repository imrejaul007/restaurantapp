import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AadhaarService, AadhaarVerificationRequest, AadhaarVerificationResponse } from '../../../src/modules/verification/aadhaar.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AadhaarService', () => {
  let service: AadhaarService;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockPrismaService = {
      userProfile: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
      verificationAttempt: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AadhaarService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AadhaarService>(AadhaarService);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);

    // Setup default config mocks
    configService.get
      .mockReturnValueOnce('https://api.uidai.gov.in/v1') // UIDAI_API_URL
      .mockReturnValueOnce('test-api-key') // UIDAI_API_KEY
      .mockReturnValueOnce('test'); // NODE_ENV
  });

  describe('verifyAadhaar', () => {
    const validRequest: AadhaarVerificationRequest = {
      aadhaarNumber: '123456789012',
      name: 'John Doe',
      dateOfBirth: '1990-01-01',
      address: '123 Main St, City',
      phoneNumber: '9876543210',
    };

    const mockUser = { id: 'user-123' };

    beforeEach(() => {
      prismaService.userProfile.findUnique.mockResolvedValue(null);
      prismaService.userProfile.findFirst.mockResolvedValue(null);
      prismaService.verificationAttempt.count.mockResolvedValue(0);
      prismaService.verificationAttempt.create.mockResolvedValue({} as any);
    });

    it('should successfully verify Aadhaar in development mode', async () => {
      configService.get.mockReturnValueOnce('development'); // NODE_ENV for mockMode

      const result = await service.verifyAadhaar('user-123', validRequest);

      expect(result.success).toBe(true);
      expect(result.matchScore).toBe(0.95);
      expect(result.details?.nameMatch).toBe(true);
      expect(result.verificationId).toMatch(/mock_verify_/);
      expect(prismaService.verificationAttempt.create).toHaveBeenCalled();
    });

    it('should successfully verify Aadhaar with real API in production', async () => {
      configService.get
        .mockReturnValueOnce('production') // NODE_ENV
        .mockReturnValueOnce('real-api-key'); // UIDAI_API_KEY

      const mockApiResponse = {
        data: {
          status: 'SUCCESS',
          data: {
            aadhaar_number: '123456789012',
            full_name: 'John Doe',
            date_of_birth: '1990-01-01',
            address: {
              house: '123',
              street: 'Main St',
              city: 'City',
              pincode: '123456',
            },
            phone: '9876543210',
          },
          verification_id: 'real-verification-id',
          match_score: 0.92,
        },
      };

      mockedAxios.post.mockResolvedValue(mockApiResponse);
      prismaService.userProfile.upsert.mockResolvedValue({} as any);

      const result = await service.verifyAadhaar('user-123', validRequest);

      expect(result.success).toBe(true);
      expect(result.matchScore).toBe(0.92);
      expect(result.verificationId).toBe('real-verification-id');
      expect(result.data?.name).toBe('John Doe');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.uidai.gov.in/v1/verify',
        expect.objectContaining({
          aadhaar_number: '123456789012',
          full_name: 'John Doe',
          consent: true,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer real-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should throw error for invalid Aadhaar format', async () => {
      const invalidRequest = { ...validRequest, aadhaarNumber: '12345' };

      await expect(service.verifyAadhaar('user-123', invalidRequest))
        .rejects
        .toThrow(new HttpException('Invalid Aadhaar format. Aadhaar should be 12 digits', HttpStatus.BAD_REQUEST));
    });

    it('should throw error if user already verified', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue({
        aadhaarVerified: true,
      } as any);

      await expect(service.verifyAadhaar('user-123', validRequest))
        .rejects
        .toThrow(new HttpException('Aadhaar already verified for this account', HttpStatus.CONFLICT));
    });

    it('should throw error if max attempts exceeded', async () => {
      prismaService.verificationAttempt.count.mockResolvedValue(3);

      await expect(service.verifyAadhaar('user-123', validRequest))
        .rejects
        .toThrow(new HttpException('Maximum verification attempts exceeded', HttpStatus.TOO_MANY_REQUESTS));
    });

    it('should throw error if Aadhaar already used by another user', async () => {
      prismaService.userProfile.findFirst.mockResolvedValue({
        userId: 'other-user-123',
        aadhaarVerified: true,
      } as any);

      await expect(service.verifyAadhaar('user-123', validRequest))
        .rejects
        .toThrow(new HttpException('This Aadhaar number is already verified with another account', HttpStatus.CONFLICT));
    });

    it('should handle API rate limiting error', async () => {
      configService.get
        .mockReturnValueOnce('production') // NODE_ENV
        .mockReturnValueOnce('real-api-key'); // UIDAI_API_KEY

      const rateLimitError = {
        response: {
          status: 429,
          data: { message: 'Rate limit exceeded' },
        },
      };

      mockedAxios.post.mockRejectedValue(rateLimitError);

      await expect(service.verifyAadhaar('user-123', validRequest))
        .rejects
        .toThrow(new HttpException('Too many requests to verification service. Please try again later.', HttpStatus.TOO_MANY_REQUESTS));
    });

    it('should handle API service unavailable error', async () => {
      configService.get
        .mockReturnValueOnce('production') // NODE_ENV
        .mockReturnValueOnce('real-api-key'); // UIDAI_API_KEY

      const serviceError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      mockedAxios.post.mockRejectedValue(serviceError);

      await expect(service.verifyAadhaar('user-123', validRequest))
        .rejects
        .toThrow(new HttpException('External verification service unavailable', HttpStatus.SERVICE_UNAVAILABLE));
    });

    it('should update user profile on successful verification with high match score', async () => {
      configService.get.mockReturnValueOnce('development');

      prismaService.userProfile.upsert.mockResolvedValue({} as any);

      const result = await service.verifyAadhaar('user-123', validRequest);

      expect(result.success).toBe(true);
      expect(result.matchScore).toBeGreaterThanOrEqual(0.8);
      expect(prismaService.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: expect.objectContaining({
          aadhaarVerified: true,
          aadhaarVerificationId: expect.any(String),
          verificationScore: expect.any(Number),
        }),
        create: expect.objectContaining({
          userId: 'user-123',
          aadhaarVerified: true,
          aadhaarVerificationId: expect.any(String),
          verificationScore: expect.any(Number),
        }),
      });
    });

    it('should not update user profile for low match score', async () => {
      configService.get.mockReturnValueOnce('development');

      // Mock response with low score (ending with 1 triggers low score scenario)
      const lowScoreRequest = { ...validRequest, aadhaarNumber: '123456789011' };

      const result = await service.verifyAadhaar('user-123', lowScoreRequest);

      expect(result.success).toBe(true);
      expect(result.matchScore).toBe(0.65);
      expect(prismaService.userProfile.upsert).not.toHaveBeenCalled();
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verified status for verified user', async () => {
      const mockUserProfile = {
        aadhaarVerified: true,
        aadhaarVerificationId: 'test-verification-id',
        verificationScore: 0.95,
        createdAt: new Date('2023-01-01'),
      };

      prismaService.userProfile.findUnique.mockResolvedValue(mockUserProfile as any);
      prismaService.verificationAttempt.findMany.mockResolvedValue([]);
      prismaService.verificationAttempt.count.mockResolvedValue(1);

      const result = await service.getVerificationStatus('user-123');

      expect(result.status).toBe('VERIFIED');
      expect(result.verifiedAt).toEqual(mockUserProfile.createdAt);
      expect(result.matchScore).toBe(0.95);
      expect(result.attempts).toBe(1);
      expect(result.canRetry).toBe(true);
    });

    it('should return not initiated status for new user', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(null);
      prismaService.verificationAttempt.findMany.mockResolvedValue([]);
      prismaService.verificationAttempt.count.mockResolvedValue(0);

      const result = await service.getVerificationStatus('user-123');

      expect(result.status).toBe('NOT_INITIATED');
      expect(result.verifiedAt).toBeNull();
      expect(result.attempts).toBe(0);
      expect(result.canRetry).toBe(true);
    });
  });

  describe('fuzzy matching algorithms', () => {
    it('should calculate exact string match correctly', () => {
      // Test private method through service invocation
      const request: AadhaarVerificationRequest = {
        aadhaarNumber: '123456789012',
        name: 'John Doe',
      };

      const mockApiData = {
        full_name: 'John Doe',
      };

      // This indirectly tests the fuzzy matching
      const service_instance = service as any;
      const matches = service_instance.calculateMatches(request, mockApiData);

      expect(matches.nameMatch).toBe(true);
    });

    it('should calculate partial string match correctly', () => {
      const request: AadhaarVerificationRequest = {
        aadhaarNumber: '123456789012',
        name: 'John Doe',
      };

      const mockApiData = {
        full_name: 'John D. Doe',
      };

      const service_instance = service as any;
      const matches = service_instance.calculateMatches(request, mockApiData);

      expect(matches.nameMatch).toBe(true); // Should still match with high similarity
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      prismaService.userProfile.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.verifyAadhaar('user-123', {
        aadhaarNumber: '123456789012',
        name: 'John Doe',
      })).rejects.toThrow(HttpException);
    });
  });
});