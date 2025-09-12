import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { TestUtils } from '../setup';

describe('Verification E2E Tests - Complete User Journey', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let restaurantAccessToken: string;
  let customerAccessToken: string;
  let restaurantUserId: string;
  let customerUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider('EmailService')
    .useValue({
      sendEmail: jest.fn().mockResolvedValue(true),
    })
    .overrideProvider('FileUploadService')
    .useValue({
      uploadSingle: jest.fn().mockResolvedValue({
        url: 'https://example.com/test-document.jpg',
        publicId: 'test-document',
      }),
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

    await setupTestUsers();
  });

  async function setupTestUsers() {
    // Create restaurant user
    const restaurantSignUp = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: 'restaurant-verification@e2e.com',
        password: 'Password123!',
        firstName: 'Restaurant',
        lastName: 'Owner',
        role: 'RESTAURANT',
        restaurantName: 'Verification Test Restaurant',
        cuisineType: ['Indian'],
      });

    restaurantAccessToken = restaurantSignUp.body.accessToken;
    restaurantUserId = restaurantSignUp.body.user.id;

    // Create customer user
    const customerSignUp = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: 'customer-verification@e2e.com',
        password: 'Password123!',
        firstName: 'Customer',
        lastName: 'User',
        role: 'CUSTOMER',
      });

    customerAccessToken = customerSignUp.body.accessToken;
    customerUserId = customerSignUp.body.user.id;
  }

  beforeEach(async () => {
    // Clean verification data but keep users
    await prismaService.verificationAttempt.deleteMany();
    await prismaService.userProfile.deleteMany();
    await TestUtils.cleanupRedis(redisService);
  });

  afterAll(async () => {
    await TestUtils.cleanupDatabase(prismaService);
    await TestUtils.cleanupRedis(redisService);
    await app.close();
  });

  describe('Complete Restaurant Owner KYC Journey', () => {
    it('should complete full KYC verification workflow for restaurant owner', async () => {
      console.log('🏁 Starting complete restaurant KYC verification journey...');

      // Step 1: Restaurant owner checks verification requirements
      const aadhaarRequirements = await request(app.getHttpServer())
        .get('/api/v1/verification/aadhaar/requirements')
        .expect(200);

      expect(aadhaarRequirements.body.requirements).toContain('Valid 12-digit Aadhaar number');

      const panRequirements = await request(app.getHttpServer())
        .get('/api/v1/verification/pan/requirements')
        .expect(200);

      expect(panRequirements.body.maxRetries).toBe(3);

      // Step 2: Check initial verification status (should be NOT_INITIATED)
      const initialAadhaarStatus = await request(app.getHttpServer())
        .get('/api/v1/verification/aadhaar/status')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .expect(200);

      expect(initialAadhaarStatus.body.status).toBe('NOT_INITIATED');

      const initialPanStatus = await request(app.getHttpServer())
        .get('/api/v1/verification/pan/status')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .expect(200);

      expect(initialPanStatus.body.status).toBe('NOT_INITIATED');

      // Step 3: Attempt PAN verification first (should succeed)
      console.log('📋 Verifying PAN...');
      const panVerification = await request(app.getHttpServer())
        .post('/api/v1/verification/pan/verify')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send({
          panNumber: 'RESTO1234P',
          name: 'Restaurant Owner',
          dateOfBirth: '1985-06-15',
          fatherName: 'Owner Father',
        })
        .expect(200);

      expect(panVerification.body.success).toBe(true);
      expect(panVerification.body.details.panStatus).toBe('VALID');
      expect(panVerification.body.matchScore).toBeGreaterThanOrEqual(0.8);
      console.log('✅ PAN verification successful');

      // Step 4: Verify PAN status is now VERIFIED
      const verifiedPanStatus = await request(app.getHttpServer())
        .get('/api/v1/verification/pan/status')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .expect(200);

      expect(verifiedPanStatus.body.status).toBe('VERIFIED');
      expect(verifiedPanStatus.body.attempts).toBe(1);

      // Step 5: Attempt Aadhaar verification (should succeed)
      console.log('📋 Verifying Aadhaar...');
      const aadhaarVerification = await request(app.getHttpServer())
        .post('/api/v1/verification/aadhaar/verify')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send({
          aadhaarNumber: '987654321012',
          name: 'Restaurant Owner',
          dateOfBirth: '1985-06-15',
          address: '123 Business District, Food City, 560001',
          phoneNumber: '9876543210',
        })
        .expect(200);

      expect(aadhaarVerification.body.success).toBe(true);
      expect(aadhaarVerification.body.matchScore).toBeGreaterThanOrEqual(0.8);
      console.log('✅ Aadhaar verification successful');

      // Step 6: Check final verification status
      const finalAadhaarStatus = await request(app.getHttpServer())
        .get('/api/v1/verification/aadhaar/status')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .expect(200);

      expect(finalAadhaarStatus.body.status).toBe('VERIFIED');

      // Step 7: Verify user profile was updated correctly
      const userProfile = await prismaService.userProfile.findUnique({
        where: { userId: restaurantUserId }
      });

      expect(userProfile).toBeTruthy();
      expect(userProfile.aadhaarVerified).toBe(true);
      expect(userProfile.panVerified).toBe(true);
      expect(userProfile.aadhaarVerificationId).toBeTruthy();
      expect(userProfile.panVerificationId).toBeTruthy();

      // Step 8: Verify attempt records were created
      const verificationAttempts = await prismaService.verificationAttempt.findMany({
        where: { userId: restaurantUserId },
        orderBy: { createdAt: 'asc' }
      });

      expect(verificationAttempts).toHaveLength(2);
      expect(verificationAttempts[0].type).toBe('PAN');
      expect(verificationAttempts[0].success).toBe(true);
      expect(verificationAttempts[1].type).toBe('AADHAAR');
      expect(verificationAttempts[1].success).toBe(true);

      console.log('🎉 Complete restaurant KYC verification journey completed successfully!');
    }, 30000);
  });

  describe('Customer Verification Journey with Retry Scenarios', () => {
    it('should handle customer verification with retry scenarios', async () => {
      console.log('🏁 Starting customer verification with retry scenarios...');

      // Step 1: First attempt with Aadhaar that will fail (ending with 0)
      console.log('❌ Attempting verification with data that will fail...');
      const failedAttempt = await request(app.getHttpServer())
        .post('/api/v1/verification/aadhaar/verify')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          aadhaarNumber: '123456789010', // Ends with 0, triggers failure in mock
          name: 'Customer User',
          dateOfBirth: '1992-03-10',
        })
        .expect(200);

      expect(failedAttempt.body.success).toBe(false);
      expect(failedAttempt.body.message).toContain('not found');

      // Step 2: Check status after failed attempt
      const statusAfterFail = await request(app.getHttpServer())
        .get('/api/v1/verification/aadhaar/status')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(200);

      expect(statusAfterFail.body.status).toBe('PENDING');
      expect(statusAfterFail.body.attempts).toBe(1);
      expect(statusAfterFail.body.canRetry).toBe(true);

      // Step 3: Second attempt with low confidence score (ending with 1)
      console.log('⚠️ Attempting verification with low confidence score...');
      const lowConfidenceAttempt = await request(app.getHttpServer())
        .post('/api/v1/verification/aadhaar/retry')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          aadhaarNumber: '123456789011', // Ends with 1, triggers low score in mock
          name: 'Customer User',
          dateOfBirth: '1992-03-10',
        })
        .expect(200);

      expect(lowConfidenceAttempt.body.success).toBe(true);
      expect(lowConfidenceAttempt.body.matchScore).toBe(0.65); // Below threshold
      expect(lowConfidenceAttempt.body.details.nameMatch).toBe(false);

      // Step 4: Check status after low confidence attempt
      const statusAfterLowConfidence = await request(app.getHttpServer())
        .get('/api/v1/verification/aadhaar/status')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(200);

      expect(statusAfterLowConfidence.body.attempts).toBe(2);
      expect(statusAfterLowConfidence.body.canRetry).toBe(true);

      // Step 5: Third attempt with successful data
      console.log('✅ Attempting verification with successful data...');
      const successfulAttempt = await request(app.getHttpServer())
        .post('/api/v1/verification/aadhaar/retry')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          aadhaarNumber: '123456789012', // Will succeed
          name: 'Customer User',
          dateOfBirth: '1992-03-10',
          address: '456 Residential Area, User City, 560002',
          phoneNumber: '9123456789',
        })
        .expect(200);

      expect(successfulAttempt.body.success).toBe(true);
      expect(successfulAttempt.body.matchScore).toBe(0.95);
      expect(successfulAttempt.body.details.nameMatch).toBe(true);

      // Step 6: Check final status
      const finalStatus = await request(app.getHttpServer())
        .get('/api/v1/verification/aadhaar/status')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(200);

      expect(finalStatus.body.status).toBe('VERIFIED');
      expect(finalStatus.body.attempts).toBe(3);
      expect(finalStatus.body.recentAttempts).toHaveLength(3);

      // Step 7: Attempt to verify again (should be rejected)
      console.log('🚫 Attempting duplicate verification (should fail)...');
      await request(app.getHttpServer())
        .post('/api/v1/verification/aadhaar/verify')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          aadhaarNumber: '123456789013',
          name: 'Customer User',
        })
        .expect(409); // Conflict - already verified

      console.log('🎉 Customer verification with retry scenarios completed successfully!');
    }, 30000);
  });

  describe('Rate Limiting and Security Tests', () => {
    it('should enforce rate limiting after max attempts', async () => {
      console.log('🔒 Testing rate limiting enforcement...');

      const badData = {
        aadhaarNumber: '123456789010', // Will always fail
        name: 'Rate Limit Test',
      };

      // Use up all attempts
      for (let i = 0; i < 3; i++) {
        console.log(`⏳ Attempt ${i + 1}/3...`);
        await request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .send(badData)
          .expect(200); // Should still work
      }

      // Fourth attempt should be rate limited
      console.log('🚫 Attempting 4th verification (should be rate limited)...');
      await request(app.getHttpServer())
        .post('/api/v1/verification/aadhaar/verify')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(badData)
        .expect(429); // Too Many Requests

      const status = await request(app.getHttpServer())
        .get('/api/v1/verification/aadhaar/status')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(200);

      expect(status.body.attempts).toBe(3);
      expect(status.body.canRetry).toBe(false);

      console.log('✅ Rate limiting working correctly');
    });

    it('should prevent verification with already used Aadhaar from another user', async () => {
      console.log('🔒 Testing duplicate Aadhaar prevention...');

      const aadhaarData = {
        aadhaarNumber: '555666777888',
        name: 'First User',
      };

      // First user verifies successfully
      await request(app.getHttpServer())
        .post('/api/v1/verification/aadhaar/verify')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send(aadhaarData)
        .expect(200);

      // Manually mark as verified to simulate successful verification
      await prismaService.userProfile.create({
        data: {
          userId: restaurantUserId,
          aadhaarVerified: true,
          aadhaarHash: 'simulated-hash-555666777888',
        }
      });

      // Second user tries to use same Aadhaar (should fail)
      await request(app.getHttpServer())
        .post('/api/v1/verification/aadhaar/verify')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          ...aadhaarData,
          name: 'Second User', // Different name, same Aadhaar
        })
        .expect(409); // Should be rejected

      console.log('✅ Duplicate Aadhaar prevention working correctly');
    });
  });

  describe('Cross-Service Integration Tests', () => {
    it('should integrate verification status with restaurant approval process', async () => {
      console.log('🔗 Testing verification integration with restaurant approval...');

      // Step 1: Complete both verifications for restaurant owner
      await request(app.getHttpServer())
        .post('/api/v1/verification/aadhaar/verify')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send({
          aadhaarNumber: '999888777666',
          name: 'Restaurant Owner',
          dateOfBirth: '1985-06-15',
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/verification/pan/verify')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send({
          panNumber: 'FINAL1234Z',
          name: 'Restaurant Owner',
        })
        .expect(200);

      // Step 2: Check that both verifications are complete
      const aadhaarStatus = await request(app.getHttpServer())
        .get('/api/v1/verification/aadhaar/status')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .expect(200);

      const panStatus = await request(app.getHttpServer())
        .get('/api/v1/verification/pan/status')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .expect(200);

      expect(aadhaarStatus.body.status).toBe('VERIFIED');
      expect(panStatus.body.status).toBe('VERIFIED');

      // Step 3: This would typically trigger restaurant approval workflow
      // For this test, we'll just verify the data is properly stored
      const userProfile = await prismaService.userProfile.findUnique({
        where: { userId: restaurantUserId }
      });

      expect(userProfile.aadhaarVerified).toBe(true);
      expect(userProfile.panVerified).toBe(true);

      // In a real system, this would trigger:
      // - Restaurant status update to "PENDING_APPROVAL" 
      // - Notification to admin for document review
      // - Email to restaurant owner about next steps

      console.log('✅ Verification integration test completed');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle various input validation edge cases', async () => {
      console.log('🧪 Testing edge cases and validation...');

      // Test edge case: Exactly 12 digits Aadhaar
      await request(app.getHttpServer())
        .post('/api/v1/verification/aadhaar/verify')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          aadhaarNumber: '123456789012',
          name: 'Edge Case Test',
        })
        .expect(200);

      // Clean up
      await prismaService.verificationAttempt.deleteMany({
        where: { userId: customerUserId }
      });

      // Test edge case: PAN with mixed case (should work)
      await request(app.getHttpServer())
        .post('/api/v1/verification/pan/verify')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          panNumber: 'aBcDe1234F', // Mixed case
          name: 'Edge Case Test',
        })
        .expect(200);

      // Test validation: Empty name (should fail)
      await request(app.getHttpServer())
        .post('/api/v1/verification/aadhaar/verify')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          aadhaarNumber: '123456789012',
          name: '', // Empty name
        })
        .expect(400);

      // Test validation: Very long name (should fail)
      await request(app.getHttpServer())
        .post('/api/v1/verification/aadhaar/verify')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          aadhaarNumber: '123456789012',
          name: 'A'.repeat(101), // Too long
        })
        .expect(400);

      console.log('✅ Edge cases handled correctly');
    });
  });
});