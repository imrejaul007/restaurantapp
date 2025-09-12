import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { TestUtils } from '../setup';
import { TestDataFactory } from '../utils/test-data-factory';

describe('Verification Performance & Load Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let accessTokens: string[] = [];
  let testUsers: any[] = [];

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

    // Create multiple test users for concurrent testing
    await setupMultipleTestUsers(10);
  }, 60000);

  async function setupMultipleTestUsers(count: number) {
    console.log(`🏭 Creating ${count} test users for load testing...`);
    
    for (let i = 0; i < count; i++) {
      const signUpResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `load-test-${i}@example.com`,
          password: 'Password123!',
          firstName: `LoadTest${i}`,
          lastName: 'User',
          role: 'CUSTOMER',
        });

      testUsers.push(signUpResponse.body.user);
      accessTokens.push(signUpResponse.body.accessToken);
    }
    
    console.log(`✅ Created ${count} test users`);
  }

  beforeEach(async () => {
    // Clean verification data
    await prismaService.verificationAttempt.deleteMany();
    await prismaService.userProfile.deleteMany({
      where: { userId: { in: testUsers.map(u => u.id) } }
    });
    await TestUtils.cleanupRedis(redisService);
  });

  afterAll(async () => {
    await TestUtils.cleanupDatabase(prismaService);
    await TestUtils.cleanupRedis(redisService);
    await app.close();
  });

  describe('Concurrent Verification Requests', () => {
    it('should handle concurrent Aadhaar verification requests', async () => {
      console.log('🔄 Testing concurrent Aadhaar verifications...');
      const startTime = Date.now();

      const concurrentRequests = accessTokens.map((token, index) => {
        const aadhaarData = {
          aadhaarNumber: `12345678901${index.toString().padStart(1, '0')}`, // Unique Aadhaar for each
          name: `LoadTest${index} User`,
          dateOfBirth: '1990-01-01',
        };

        return request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .set('Authorization', `Bearer ${token}`)
          .send(aadhaarData);
      });

      const results = await Promise.all(concurrentRequests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all requests completed successfully
      results.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      console.log(`✅ ${results.length} concurrent requests completed in ${duration}ms`);
      console.log(`📊 Average response time: ${duration / results.length}ms per request`);
      
      // Performance assertions
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(duration / results.length).toBeLessThan(5000); // Average should be less than 5 seconds per request
    }, 60000);

    it('should handle concurrent PAN verification requests', async () => {
      console.log('🔄 Testing concurrent PAN verifications...');
      const startTime = Date.now();

      const concurrentRequests = accessTokens.slice(0, 5).map((token, index) => {
        const panData = {
          panNumber: `LOAD${index}1234${String.fromCharCode(65 + index)}`, // LOADA1234A, LOADB1234B, etc.
          name: `LoadTest${index} User`,
        };

        return request(app.getHttpServer())
          .post('/api/v1/verification/pan/verify')
          .set('Authorization', `Bearer ${token}`)
          .send(panData);
      });

      const results = await Promise.all(concurrentRequests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      results.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      console.log(`✅ ${results.length} concurrent PAN requests completed in ${duration}ms`);
      console.log(`📊 Average response time: ${duration / results.length}ms per request`);
    }, 30000);
  });

  describe('Sequential Load Testing', () => {
    it('should handle rapid sequential verification requests', async () => {
      console.log('⚡ Testing rapid sequential verifications...');
      const token = accessTokens[0];
      const requestCount = 20;
      const results: number[] = [];

      for (let i = 0; i < requestCount; i++) {
        const startTime = Date.now();
        
        const response = await request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .set('Authorization', `Bearer ${token}`)
          .send({
            aadhaarNumber: `98765432101${i.toString().padStart(1, '0')}`,
            name: `Sequential Test ${i}`,
          });

        const endTime = Date.now();
        results.push(endTime - startTime);

        expect(response.status).toBe(200);
        
        // Clean up for next iteration (since same user)
        if (i < requestCount - 1) {
          await prismaService.verificationAttempt.deleteMany({
            where: { userId: testUsers[0].id }
          });
          await prismaService.userProfile.deleteMany({
            where: { userId: testUsers[0].id }
          });
        }
      }

      const averageTime = results.reduce((a, b) => a + b, 0) / results.length;
      const maxTime = Math.max(...results);
      const minTime = Math.min(...results);

      console.log(`📊 Sequential performance stats:`);
      console.log(`   - Requests: ${requestCount}`);
      console.log(`   - Average: ${averageTime}ms`);
      console.log(`   - Min: ${minTime}ms`);
      console.log(`   - Max: ${maxTime}ms`);

      expect(averageTime).toBeLessThan(3000); // Average should be under 3 seconds
      expect(maxTime).toBeLessThan(10000); // No request should take more than 10 seconds
    }, 120000);
  });

  describe('Database Performance Under Load', () => {
    it('should maintain database performance with many verification attempts', async () => {
      console.log('💾 Testing database performance with many records...');
      
      // First, create a large number of verification attempts
      const bulkAttempts = [];
      for (let i = 0; i < 100; i++) {
        const attempt = TestDataFactory.generateVerificationAttempt(
          testUsers[i % testUsers.length].id,
          i % 2 === 0 ? 'AADHAAR' : 'PAN'
        );
        bulkAttempts.push(attempt);
      }

      // Use raw database insert for speed
      await prismaService.verificationAttempt.createMany({
        data: bulkAttempts,
      });

      console.log(`📝 Created ${bulkAttempts.length} verification attempt records`);

      // Now test query performance with large dataset
      const queryStartTime = Date.now();
      
      const statusResponse = await request(app.getHttpServer())
        .get('/api/v1/verification/aadhaar/status')
        .set('Authorization', `Bearer ${accessTokens[0]}`)
        .expect(200);

      const queryEndTime = Date.now();
      const queryDuration = queryEndTime - queryStartTime;

      expect(statusResponse.body.status).toBeDefined();
      expect(queryDuration).toBeLessThan(2000); // Should respond within 2 seconds even with large dataset

      console.log(`⚡ Status query completed in ${queryDuration}ms with ${bulkAttempts.length} records in database`);
    }, 30000);
  });

  describe('Memory and Resource Usage', () => {
    it('should not have memory leaks during repeated operations', async () => {
      console.log('🧠 Testing for memory leaks...');
      const token = accessTokens[0];
      const initialMemory = process.memoryUsage();

      // Perform many operations
      for (let cycle = 0; cycle < 5; cycle++) {
        console.log(`   Cycle ${cycle + 1}/5`);
        
        const promises = [];
        for (let i = 0; i < 10; i++) {
          promises.push(
            request(app.getHttpServer())
              .post('/api/v1/verification/aadhaar/verify')
              .set('Authorization', `Bearer ${token}`)
              .send({
                aadhaarNumber: `11111111111${i}`,
                name: `Memory Test ${cycle}-${i}`,
              })
          );
        }

        await Promise.all(promises);

        // Clean up after each cycle
        await prismaService.verificationAttempt.deleteMany({
          where: { userId: testUsers[0].id }
        });
        await prismaService.userProfile.deleteMany({
          where: { userId: testUsers[0].id }
        });

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;

      console.log(`📊 Memory usage:`);
      console.log(`   - Initial: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);
      console.log(`   - Final: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
      console.log(`   - Increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB (${memoryIncreasePercent.toFixed(2)}%)`);

      // Memory increase should be reasonable (less than 50% increase)
      expect(memoryIncreasePercent).toBeLessThan(50);
    }, 60000);
  });

  describe('Rate Limiting Performance', () => {
    it('should efficiently enforce rate limits under load', async () => {
      console.log('🚦 Testing rate limiting performance...');
      const token = accessTokens[0];

      // Quickly exhaust rate limit
      const rateLimitRequests = [];
      for (let i = 0; i < 5; i++) { // More than the limit of 3
        rateLimitRequests.push(
          request(app.getHttpServer())
            .post('/api/v1/verification/aadhaar/verify')
            .set('Authorization', `Bearer ${token}`)
            .send({
              aadhaarNumber: '123456789010', // This will fail
              name: `Rate Limit Test ${i}`,
            })
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(rateLimitRequests);
      const endTime = Date.now();

      // First 3 should succeed (or at least be processed), last 2 should be rate limited
      const successfulRequests = results.filter(r => r.status === 200).length;
      const rateLimitedRequests = results.filter(r => r.status === 429).length;

      console.log(`📊 Rate limiting results:`);
      console.log(`   - Successful: ${successfulRequests}`);
      console.log(`   - Rate limited: ${rateLimitedRequests}`);
      console.log(`   - Total time: ${endTime - startTime}ms`);

      expect(rateLimitedRequests).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(10000); // Should handle rate limiting quickly
    }, 30000);
  });

  describe('Error Handling Under Load', () => {
    it('should handle errors gracefully under concurrent load', async () => {
      console.log('❌ Testing error handling under load...');

      // Mix of valid and invalid requests
      const mixedRequests = accessTokens.slice(0, 8).map((token, index) => {
        const isValidRequest = index % 2 === 0;
        
        return request(app.getHttpServer())
          .post('/api/v1/verification/aadhaar/verify')
          .set('Authorization', `Bearer ${token}`)
          .send({
            aadhaarNumber: isValidRequest ? `12345678901${index}` : '12345', // Mix valid and invalid
            name: `Error Test ${index}`,
          });
      });

      const results = await Promise.all(mixedRequests);

      const successfulRequests = results.filter(r => r.status === 200);
      const errorRequests = results.filter(r => r.status === 400);

      expect(successfulRequests.length).toBeGreaterThan(0);
      expect(errorRequests.length).toBeGreaterThan(0);

      // All error responses should have proper error messages
      errorRequests.forEach(response => {
        expect(response.body.message).toBeDefined();
        expect(typeof response.body.message).toBe('string');
      });

      console.log(`✅ Handled ${successfulRequests.length} valid and ${errorRequests.length} invalid requests`);
    }, 30000);
  });
});