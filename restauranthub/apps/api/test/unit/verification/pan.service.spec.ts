import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PanService, PanVerificationRequest, PanVerificationResponse } from '../../../src/modules/verification/pan.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PanService', () => {
  let service: PanService;
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
        PanService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PanService>(PanService);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);

    // Setup default config mocks
    configService.get
      .mockReturnValueOnce('https://api.nsdl.com/v1') // NSDL_API_URL
      .mockReturnValueOnce('test-api-key') // NSDL_API_KEY
      .mockReturnValueOnce('test'); // NODE_ENV
  });

  describe('verifyPan', () => {
    const validRequest: PanVerificationRequest = {
      panNumber: 'ABCDE1234F',
      name: 'John Doe',
      dateOfBirth: '1990-01-01',
      fatherName: 'Robert Doe',
    };

    beforeEach(() => {
      prismaService.userProfile.findUnique.mockResolvedValue(null);
      prismaService.userProfile.findFirst.mockResolvedValue(null);
      prismaService.verificationAttempt.count.mockResolvedValue(0);
      prismaService.verificationAttempt.create.mockResolvedValue({} as any);
    });

    it('should successfully verify PAN in development mode', async () => {
      configService.get.mockReturnValueOnce('development'); // NODE_ENV for mockMode

      const result = await service.verifyPan('user-123', validRequest);

      expect(result.success).toBe(true);
      expect(result.matchScore).toBe(0.95);
      expect(result.details?.nameMatch).toBe(true);
      expect(result.details?.panStatus).toBe('VALID');
      expect(result.verificationId).toMatch(/mock_pan_verify_/);
      expect(prismaService.verificationAttempt.create).toHaveBeenCalled();
    });

    it('should successfully verify PAN with real API in production', async () => {
      configService.get
        .mockReturnValueOnce('production') // NODE_ENV
        .mockReturnValueOnce('real-api-key'); // NSDL_API_KEY

      const mockApiResponse = {
        data: {
          status: 'SUCCESS',
          data: {
            pan_number: 'ABCDE1234F',
            full_name: 'John Doe',
            date_of_birth: '1990-01-01',
            father_name: 'Robert Doe',
            category: 'Individual',
            pan_status: 'VALID',
            last_updated: '2023-12-01T00:00:00.000Z',
          },
          verification_id: 'real-pan-verification-id',
          match_score: 0.92,
        },
      };

      mockedAxios.post.mockResolvedValue(mockApiResponse);
      prismaService.userProfile.upsert.mockResolvedValue({} as any);

      const result = await service.verifyPan('user-123', validRequest);

      expect(result.success).toBe(true);
      expect(result.matchScore).toBe(0.92);
      expect(result.verificationId).toBe('real-pan-verification-id');
      expect(result.data?.name).toBe('John Doe');
      expect(result.data?.panNumber).toBe('ABCDE1234F');
      expect(result.details?.panStatus).toBe('VALID');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.nsdl.com/v1/verify-pan',
        expect.objectContaining({
          pan_number: 'ABCDE1234F',
          full_name: 'John Doe',
          consent: true,
          purpose: 'KYC verification for platform registration',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer real-api-key',
            'Content-Type': 'application/json',
            'X-API-Version': '2.0',
          }),
        })
      );
    });

    it('should throw error for invalid PAN format', async () => {
      const invalidRequest = { ...validRequest, panNumber: '12345' };

      await expect(service.verifyPan('user-123', invalidRequest))
        .rejects
        .toThrow(new HttpException('Invalid PAN format. PAN should be 10 characters: 5 letters, 4 digits, 1 letter', HttpStatus.BAD_REQUEST));
    });

    it('should validate PAN format correctly', () => {
      const service_instance = service as any;
      
      expect(service_instance.isValidPanFormat('ABCDE1234F')).toBe(true);
      expect(service_instance.isValidPanFormat('abcde1234f')).toBe(true); // Should handle lowercase
      expect(service_instance.isValidPanFormat('ABCD1234F')).toBe(false); // Too few letters
      expect(service_instance.isValidPanFormat('ABCDE123F')).toBe(false); // Too few digits  
      expect(service_instance.isValidPanFormat('ABCDE12345')).toBe(false); // No final letter
      expect(service_instance.isValidPanFormat('12345ABCDF')).toBe(false); // Wrong pattern
    });

    it('should throw error if user already verified PAN', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue({
        panVerified: true,
      } as any);

      await expect(service.verifyPan('user-123', validRequest))
        .rejects
        .toThrow(new HttpException('PAN already verified for this account', HttpStatus.CONFLICT));
    });

    it('should throw error if max attempts exceeded', async () => {
      prismaService.verificationAttempt.count.mockResolvedValue(3);

      await expect(service.verifyPan('user-123', validRequest))
        .rejects
        .toThrow(new HttpException('Maximum verification attempts exceeded', HttpStatus.TOO_MANY_REQUESTS));
    });

    it('should throw error if PAN already used by another user', async () => {
      prismaService.userProfile.findFirst.mockResolvedValue({
        userId: 'other-user-123',
        panVerified: true,
      } as any);

      await expect(service.verifyPan('user-123', validRequest))
        .rejects
        .toThrow(new HttpException('This PAN number is already verified with another account', HttpStatus.CONFLICT));
    });

    it('should handle mock scenarios correctly', async () => {
      configService.get.mockReturnValueOnce('development');

      // Test invalid PAN scenario
      const invalidPanRequest = { ...validRequest, panNumber: 'AAAAA0000A' };
      const invalidResult = await service.verifyPan('user-123', invalidPanRequest);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.message).toBe('PAN number is invalid or not found in records');

      // Test deactivated PAN scenario
      const deactivatedPanRequest = { ...validRequest, panNumber: 'ABCDE1234G' }; // ends with 1
      const deactivatedResult = await service.verifyPan('user-123', deactivatedPanRequest);
      expect(deactivatedResult.success).toBe(true);
      expect(deactivatedResult.details?.panStatus).toBe('DEACTIVATED');
      expect(deactivatedResult.matchScore).toBe(0.9);

      // Test low match score scenario  
      const lowScorePanRequest = { ...validRequest, panNumber: 'ABCDE1234H' }; // ends with 2
      const lowScoreResult = await service.verifyPan('user-123', lowScorePanRequest);
      expect(lowScoreResult.success).toBe(true);
      expect(lowScoreResult.matchScore).toBe(0.65);
      expect(lowScoreResult.details?.nameMatch).toBe(false);
    });

    it('should handle API rate limiting error', async () => {
      configService.get
        .mockReturnValueOnce('production')
        .mockReturnValueOnce('real-api-key');

      const rateLimitError = {
        response: {
          status: 429,
          data: { message: 'Rate limit exceeded' },
        },
      };

      mockedAxios.post.mockRejectedValue(rateLimitError);

      await expect(service.verifyPan('user-123', validRequest))
        .rejects
        .toThrow(new HttpException('Too many requests to verification service. Please try again later.', HttpStatus.TOO_MANY_REQUESTS));
    });

    it('should update user profile on successful verification with high match score and valid PAN', async () => {
      configService.get.mockReturnValueOnce('development');

      prismaService.userProfile.upsert.mockResolvedValue({} as any);

      const result = await service.verifyPan('user-123', validRequest);

      expect(result.success).toBe(true);
      expect(result.matchScore).toBeGreaterThanOrEqual(0.8);
      expect(result.details?.panStatus).toBe('VALID');
      expect(prismaService.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: expect.objectContaining({
          panVerified: true,
          panVerificationId: expect.any(String),
          panVerificationScore: expect.any(Number),
        }),
        create: expect.objectContaining({
          userId: 'user-123',
          panVerified: true,
          panVerificationId: expect.any(String),
          panVerificationScore: expect.any(Number),
        }),
      });
    });

    it('should not update user profile for deactivated PAN', async () => {
      configService.get.mockReturnValueOnce('development');

      const deactivatedPanRequest = { ...validRequest, panNumber: 'ABCDE1234G' };
      const result = await service.verifyPan('user-123', deactivatedPanRequest);

      expect(result.details?.panStatus).toBe('DEACTIVATED');
      expect(prismaService.userProfile.upsert).not.toHaveBeenCalled();
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verified status for verified user', async () => {
      const mockUserProfile = {
        panVerified: true,
        panVerificationId: 'test-pan-verification-id',
        panVerificationScore: 0.95,
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

    it('should return failed status for low match score attempts', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue({ panVerified: false } as any);
      prismaService.verificationAttempt.findMany.mockResolvedValue([
        {
          id: 'attempt-1',
          success: true,
          matchScore: 0.65,
          createdAt: new Date(),
          errorMessage: null,
        },
      ]);
      prismaService.verificationAttempt.count.mockResolvedValue(1);

      const result = await service.getVerificationStatus('user-123');

      expect(result.status).toBe('FAILED');
      expect(result.attempts).toBe(1);
      expect(result.canRetry).toBe(true);
    });
  });

  describe('getRequirements', () => {
    it('should return PAN verification requirements', async () => {
      const requirements = await service.getRequirements();

      expect(requirements.requiredFields).toContain('panNumber');
      expect(requirements.requiredFields).toContain('name');
      expect(requirements.optionalFields).toContain('dateOfBirth');
      expect(requirements.optionalFields).toContain('fatherName');
      expect(requirements.maxRetries).toBe(3);
      expect(requirements.panFormat.pattern).toBe('AAAAA0000A');
      expect(requirements.panFormat.example).toBe('ABCDE1234F');
      expect(requirements.guidelines).toEqual(
        expect.arrayContaining([
          'Enter PAN exactly as printed on PAN card',
          'Name should match as per PAN card',
        ])
      );
      expect(requirements.security).toEqual(
        expect.arrayContaining([
          'PAN number is encrypted and securely hashed',
          'Only verification status is stored',
        ])
      );
    });
  });

  describe('match score calculation', () => {
    it('should calculate weighted match scores correctly', () => {
      const service_instance = service as any;
      
      // Test with all matches
      const allMatches = {
        nameMatch: true,
        dobMatch: true,
        fatherNameMatch: true,
        panStatus: 'VALID',
      };
      
      const perfectScore = service_instance.calculateOverallMatchScore(allMatches);
      expect(perfectScore).toBe(1.0);

      // Test with some matches
      const partialMatches = {
        nameMatch: true,
        dobMatch: false,
        fatherNameMatch: true,
        panStatus: 'VALID',
      };
      
      const partialScore = service_instance.calculateOverallMatchScore(partialMatches);
      expect(partialScore).toBe(0.8); // (0.6 + 0 + 0.2) / 1.0

      // Test with invalid PAN status (should reduce score)
      const invalidPanMatches = {
        nameMatch: true,
        dobMatch: true,
        fatherNameMatch: true,
        panStatus: 'DEACTIVATED',
      };
      
      const invalidScore = service_instance.calculateOverallMatchScore(invalidPanMatches);
      expect(invalidScore).toBe(0.5); // 1.0 * 0.5 penalty
    });
  });

  describe('cryptographic functions', () => {
    it('should hash PAN numbers consistently', () => {
      const service_instance = service as any;
      
      const pan = 'ABCDE1234F';
      const hash1 = service_instance.hashPanNumber(pan);
      const hash2 = service_instance.hashPanNumber(pan);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 character hex string
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // Should be valid hex
    });

    it('should produce different hashes for different PANs', () => {
      const service_instance = service as any;
      
      const pan1 = 'ABCDE1234F';
      const pan2 = 'FGHIJ5678K';
      
      const hash1 = service_instance.hashPanNumber(pan1);
      const hash2 = service_instance.hashPanNumber(pan2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('retry functionality', () => {
    it('should retry verification using the same verification method', async () => {
      configService.get.mockReturnValueOnce('development');
      
      prismaService.userProfile.findUnique.mockResolvedValue(null);
      prismaService.userProfile.findFirst.mockResolvedValue(null);
      prismaService.verificationAttempt.count.mockResolvedValue(1); // Previous attempt
      prismaService.verificationAttempt.create.mockResolvedValue({} as any);

      const result = await service.retryVerification('user-123', validRequest);

      expect(result.success).toBe(true);
      expect(result.verificationId).toMatch(/mock_pan_verify_/);
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      prismaService.userProfile.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.verifyPan('user-123', {
        panNumber: 'ABCDE1234F',
        name: 'John Doe',
      })).rejects.toThrow(HttpException);
    });

    it('should handle API network errors', async () => {
      configService.get
        .mockReturnValueOnce('production')
        .mockReturnValueOnce('real-api-key');

      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(service.verifyPan('user-123', validRequest))
        .rejects
        .toThrow(HttpException);
    });
  });
});