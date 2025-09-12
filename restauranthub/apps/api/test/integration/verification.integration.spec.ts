import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { TestUtils } from '../setup';

describe('Verification Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let customerAccessToken: string;
  let customerUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider('EmailService')
    .useValue({
      sendEmail: jest.fn().mockResolvedValue(true),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    redisService = moduleFixture.get<RedisService>(RedisService);

    // Create test user
    await setupTestUser();
  });

  async function setupTestUser() {
    const customerSignUp = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: 'verification-test@test.com',
        password: 'Password123!',
        firstName: 'Verification',
        lastName: 'User',
        role: 'CUSTOMER',
      });

    customerAccessToken = customerSignUp.body.accessToken;
    customerUserId = customerSignUp.body.user.id;
  }

  beforeEach(async () => {
    // Clean verification data
    await prismaService.verificationAttempt.deleteMany();
    await prismaService.userProfile.deleteMany({
      where: { userId: customerUserId }
    });
    await TestUtils.cleanupRedis(redisService);
  });

  afterAll(async () => {
    await TestUtils.cleanupDatabase(prismaService);
    await TestUtils.cleanupRedis(redisService);
    await app.close();
  });

  describe('Aadhaar Verification', () => {
    describe('POST /verification/aadhaar/verify', () => {
      const validAadhaarData = {
        aadhaarNumber: '123456789012',
        name: 'Verification User',
        dateOfBirth: '1990-01-01',
        address: '123 Test Street, Test City',
        phoneNumber: '9876543210',
      };

      it('should verify Aadhaar successfully in development mode', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send(validAadhaarData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: expect.any(String),
          verificationId: expect.any(String),
          matchScore: expect.any(Number),
          details: {
            nameMatch: expect.any(Boolean),
            dobMatch: expect.any(Boolean),
            addressMatch: expect.any(Boolean),
            phoneMatch: expect.any(Boolean),
          },
        });

        expect(response.body.matchScore).toBeGreaterThanOrEqual(0);
        expect(response.body.matchScore).toBeLessThanOrEqual(1);

        // Verify verification attempt was stored
        const attempts = await prismaService.verificationAttempt.findMany({
          where: { userId: customerUserId, type: 'AADHAAR' }
        });
        expect(attempts).toHaveLength(1);
        expect(attempts[0].success).toBe(response.body.success);
      });

      it('should reject invalid Aadhaar format', async () => {
        const invalidData = { ...validAadhaarData, aadhaarNumber: '12345' };

        const response = await request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toContain('Aadhaar number must be exactly 12 digits');
      });

      it('should reject non-numeric Aadhaar', async () => {
        const invalidData = { ...validAadhaarData, aadhaarNumber: '12345678901A' };

        await request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send(invalidData)
          .expect(400);
      });

      it('should validate required fields', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send({
            aadhaarNumber: '123456789012',
            // Missing name
          })
          .expect(400);
      });

      it('should validate phone number format', async () => {
        const invalidData = { ...validAadhaarData, phoneNumber: '123456789' }; // Less than 10 digits

        await request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send(invalidData)
          .expect(400);
      });

      it('should validate date format', async () => {
        const invalidData = { ...validAadhaarData, dateOfBirth: '01/01/1990' }; // Wrong format

        await request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send(invalidData)
          .expect(400);
      });

      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .send(validAadhaarData)
          .expect(401);
      });

      it('should prevent duplicate verification for same user', async () => {
        // First verification
        await request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send(validAadhaarData)
          .expect(200);

        // Mark as verified manually for test
        await prismaService.userProfile.create({
          data: {
            userId: customerUserId,
            aadhaarVerified: true,
            aadhaarHash: 'test-hash',
          }
        });

        // Second verification should fail
        await request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send(validAadhaarData)
          .expect(409);
      });
    });

    describe('POST /verification/aadhaar/retry', () => {
      it('should allow retry verification', async () => {
        const validData = {
          aadhaarNumber: '123456789011', // This triggers low score in mock
          name: 'Verification User',
        };

        // First attempt (should get low score)
        await request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send(validData)
          .expect(200);

        // Retry attempt
        const retryResponse = await request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/retry')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send({
            ...validData,
            aadhaarNumber: '123456789012', // This should succeed
          })
          .expect(200);

        expect(retryResponse.body.success).toBe(true);
      });
    });

    describe('GET /verification/aadhaar/status', () => {
      it('should return verification status', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/verification/aadhaar/status')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          status: expect.stringMatching(/^(NOT_INITIATED|PENDING|VERIFIED|FAILED)$/),
          verifiedAt: expect.anything(),
          matchScore: expect.anything(),
          attempts: expect.any(Number),
          canRetry: expect.any(Boolean),
          message: expect.any(String),
          recentAttempts: expect.any(Array),
        });
      });
    });

    describe('GET /verification/aadhaar/requirements', () => {
      it('should return verification requirements', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/verification/aadhaar/requirements')
          .expect(200);

        expect(response.body).toMatchObject({
          requirements: expect.arrayContaining([
            expect.stringContaining('12-digit Aadhaar'),
          ]),
          guidelines: expect.arrayContaining([
            expect.stringContaining('spaces or dashes'),
          ]),
          security: expect.arrayContaining([
            expect.stringContaining('encrypted'),
          ]),
          supportedDocuments: expect.any(Array),
        });
      });
    });
  });

  describe('PAN Verification', () => {
    describe('POST /verification/pan/verify', () => {
      const validPanData = {
        panNumber: 'ABCDE1234F',
        name: 'Verification User',
        dateOfBirth: '1990-01-01',
        fatherName: 'Father Name',
      };

      it('should verify PAN successfully in development mode', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/verification/pan/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send(validPanData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: expect.any(String),
          verificationId: expect.any(String),
          matchScore: expect.any(Number),
          details: {
            nameMatch: expect.any(Boolean),
            panStatus: expect.stringMatching(/^(VALID|INVALID|DEACTIVATED|BLOCKED)$/),
          },
        });

        // Verify verification attempt was stored
        const attempts = await prismaService.verificationAttempt.findMany({
          where: { userId: customerUserId, type: 'PAN' }
        });
        expect(attempts).toHaveLength(1);
      });

      it('should reject invalid PAN format', async () => {
        const invalidData = { ...validPanData, panNumber: '12345' };

        const response = await request(app.getHttpServer())
          .post('/api/v1/verification/pan/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toContain('Invalid PAN format');
      });

      it('should handle various PAN formats', async () => {
        // Test valid formats
        const validFormats = [
          'ABCDE1234F',
          'abcde1234f', // Should accept lowercase
          'XyZaB9876C',
        ];

        for (const panNumber of validFormats) {
          await request(app.getHttpServer())
            .post('/api/v1/verification/pan/verify')
            .set('Authorization', `Bearer ${customerAccessToken}`)
            .send({ ...validPanData, panNumber })
            .expect(200);

          // Clean up for next test
          await prismaService.verificationAttempt.deleteMany({
            where: { userId: customerUserId, type: 'PAN' }
          });
        }
      });

      it('should reject invalid PAN patterns', async () => {
        const invalidFormats = [
          'ABCD1234F',   // Too few letters at start
          'ABCDE123F',   // Too few digits
          'ABCDE12345',  // No final letter
          '12345ABCDE',  // Wrong pattern
          'ABCDE1234FF', // Too long
        ];

        for (const panNumber of invalidFormats) {
          await request(app.getHttpServer())
            .post('/api/v1/verification/pan/verify')
            .set('Authorization', `Bearer ${customerAccessToken}`)
            .send({ ...validPanData, panNumber })
            .expect(400);
        }
      });

      it('should prevent duplicate verification for same user', async () => {
        // First verification
        await request(app.getHttpServer())
          .post('/api/v1/verification/pan/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send(validPanData)
          .expect(200);

        // Mark as verified for test
        await prismaService.userProfile.upsert({
          where: { userId: customerUserId },
          create: {
            userId: customerUserId,
            panVerified: true,
            panHash: 'test-hash',
          },
          update: {
            panVerified: true,
            panHash: 'test-hash',
          }
        });

        // Second verification should fail
        await request(app.getHttpServer())
          .post('/api/v1/verification/pan/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send(validPanData)
          .expect(409);
      });
    });

    describe('GET /verification/pan/status', () => {
      it('should return PAN verification status', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/verification/pan/status')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          status: expect.stringMatching(/^(NOT_INITIATED|PENDING|VERIFIED|FAILED)$/),
          verifiedAt: expect.anything(),
          matchScore: expect.anything(),
          attempts: expect.any(Number),
          canRetry: expect.any(Boolean),
          message: expect.any(String),
          recentAttempts: expect.any(Array),
        });
      });
    });

    describe('GET /verification/pan/requirements', () => {
      it('should return PAN verification requirements', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/verification/pan/requirements')
          .expect(200);

        expect(response.body).toMatchObject({
          requiredFields: expect.arrayContaining(['panNumber', 'name']),
          optionalFields: expect.arrayContaining(['dateOfBirth', 'fatherName']),
          documentTypes: expect.arrayContaining(['pan']),
          maxRetries: 3,
          panFormat: {
            pattern: 'AAAAA0000A',
            description: expect.any(String),
            example: 'ABCDE1234F',
          },
          guidelines: expect.any(Array),
          security: expect.any(Array),
        });
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit verification attempts', async () => {
      const verificationData = {
        aadhaarNumber: '123456789010', // This will fail in mock
        name: 'Test User',
      };

      // Make multiple failed attempts
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send(verificationData);
      }

      // Fourth attempt should be rate limited
      await request(app.getHttpServer())
        .post('/api/v1/verification/aadhaar/verify')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(verificationData)
        .expect(429);
    }, 10000);
  });

  describe('Cross-verification scenarios', () => {
    it('should handle user with both Aadhaar and PAN verification', async () => {
      const aadhaarData = {
        aadhaarNumber: '123456789012',
        name: 'Verification User',
      };

      const panData = {
        panNumber: 'ABCDE1234F',
        name: 'Verification User',
      };

      // Verify Aadhaar first
      const aadhaarResponse = await request(app.getHttpServer())
        .post('/api/v1/verification/aadhaar/verify')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(aadhaarData)
        .expect(200);

      expect(aadhaarResponse.body.success).toBe(true);

      // Then verify PAN
      const panResponse = await request(app.getHttpServer())
        .post('/api/v1/verification/pan/verify')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(panData)
        .expect(200);

      expect(panResponse.body.success).toBe(true);

      // Check both statuses
      const aadhaarStatus = await request(app.getHttpServer())
        .get('/api/v1/verification/aadhaar/status')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(200);

      const panStatus = await request(app.getHttpServer())
        .get('/api/v1/verification/pan/status')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(200);

      // Both should show attempts
      expect(aadhaarStatus.body.attempts).toBeGreaterThan(0);
      expect(panStatus.body.attempts).toBeGreaterThan(0);
    });
  });
});