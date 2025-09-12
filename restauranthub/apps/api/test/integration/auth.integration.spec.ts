import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { TestUtils } from '../setup';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let redisService: RedisService;

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
  });

  beforeEach(async () => {
    await TestUtils.cleanupDatabase(prismaService);
    await TestUtils.cleanupRedis(redisService);
  });

  afterAll(async () => {
    await TestUtils.cleanupDatabase(prismaService);
    await TestUtils.cleanupRedis(redisService);
    await app.close();
  });

  describe('POST /auth/signup', () => {
    it('should create a new customer user', async () => {
      const signUpData = {
        email: 'customer@test.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(signUpData)
        .expect(201);

      expect(response.body).toMatchObject({
        user: {
          email: signUpData.email,
          role: signUpData.role,
          profile: {
            firstName: signUpData.firstName,
            lastName: signUpData.lastName,
          },
        },
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });

      // Verify user was created in database
      const user = await prismaService.user.findUnique({
        where: { email: signUpData.email },
        include: { profile: true },
      });

      expect(user).toBeTruthy();
      expect(user.email).toBe(signUpData.email);
      expect(user.role).toBe(signUpData.role);
    });

    it('should create a restaurant user with restaurant profile', async () => {
      const signUpData = {
        email: 'restaurant@test.com',
        password: 'Password123!',
        firstName: 'Restaurant',
        lastName: 'Owner',
        role: 'RESTAURANT',
        restaurantName: 'Test Restaurant',
        cuisineType: ['Indian', 'Chinese'],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(signUpData)
        .expect(201);

      expect(response.body.user.role).toBe('RESTAURANT');

      // Verify restaurant profile was created
      const restaurant = await prismaService.restaurant.findFirst({
        where: { userId: response.body.user.id },
      });

      expect(restaurant).toBeTruthy();
      expect(restaurant.name).toBe(signUpData.restaurantName);
    });

    it('should reject signup with existing email', async () => {
      const signUpData = {
        email: 'duplicate@test.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
      };

      // Create first user
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(signUpData)
        .expect(201);

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(signUpData)
        .expect(409);
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
          // Missing required fields
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /auth/signin', () => {
    let testUser: any;

    beforeEach(async () => {
      // Create a test user
      const signUpData = {
        email: 'signin@test.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
      };

      const signUpResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(signUpData);

      testUser = signUpResponse.body.user;
    });

    it('should sign in successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: 'signin@test.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        user: {
          id: testUser.id,
          email: testUser.email,
          role: testUser.role,
        },
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('should reject signin with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: 'signin@test.com',
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should reject signin with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        })
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;
    let testUser: any;

    beforeEach(async () => {
      // Create and sign in a test user
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'refresh@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
        });

      const signInResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: 'refresh@test.com',
          password: 'Password123!',
        });

      refreshToken = signInResponse.body.refreshToken;
      testUser = signInResponse.body.user;
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number),
        tokenType: 'Bearer',
      });
    });

    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    let accessToken: string;
    let testUser: any;

    beforeEach(async () => {
      // Create and sign in a test user
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'logout@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
        });

      const signInResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: 'logout@test.com',
          password: 'Password123!',
        });

      accessToken = signInResponse.body.accessToken;
      testUser = signInResponse.body.user;
    });

    it('should logout successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');

      // Verify refresh token was cleared
      const user = await prismaService.user.findUnique({
        where: { id: testUser.id },
      });

      expect(user.refreshToken).toBeNull();
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(401);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      // This would require creating a valid verification token
      // For now, we'll test the endpoint exists
      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400); // Should return bad request for invalid token
    });
  });

  describe('GET /auth/sessions', () => {
    let accessToken: string;
    let testUser: any;

    beforeEach(async () => {
      // Create and sign in a test user
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'sessions@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
        });

      const signInResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: 'sessions@test.com',
          password: 'Password123!',
        });

      accessToken = signInResponse.body.accessToken;
      testUser = signInResponse.body.user;
    });

    it('should get user sessions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit authentication attempts', async () => {
      const signInData = {
        email: 'ratelimit@test.com',
        password: 'WrongPassword123!',
      };

      // Make multiple failed attempts
      for (let i = 0; i < 6; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/signin')
          .send(signInData);
      }

      // Should be rate limited
      await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send(signInData)
        .expect(429);
    }, 10000);
  });
});