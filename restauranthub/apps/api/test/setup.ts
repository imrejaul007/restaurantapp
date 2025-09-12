import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';

// Global test configuration
jest.setTimeout(30000);

// Mock external services
jest.mock('../src/modules/email/email.service');
jest.mock('../src/modules/files/file-upload.service');
jest.mock('../src/modules/payments/payment.service');

// Global test utilities
export class TestUtils {
  static async createTestApp(moduleMetadata: any): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule(moduleMetadata).compile();
    
    const app = moduleFixture.createNestApplication();
    
    // Apply same configuration as main app
    app.useGlobalPipes(
      new (await import('@nestjs/common')).ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    
    await app.init();
    return app;
  }

  static async cleanupDatabase(prisma: PrismaService) {
    // Clean up test data in reverse dependency order
    await prisma.notification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.session.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.review.deleteMany();
    await prisma.job.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.product.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();
  }

  static async cleanupRedis(redis: RedisService) {
    // Clear test cache data
    await redis.clear();
  }

  static generateMockUser(overrides = {}) {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      isActive: true,
      passwordHash: '$2b$12$test.hash',
      profile: {
        firstName: 'Test',
        lastName: 'User',
      },
      ...overrides,
    };
  }

  static generateMockRestaurant(overrides = {}) {
    return {
      id: 'test-restaurant-id',
      name: 'Test Restaurant',
      description: 'Test Description',
      address: 'Test Address',
      city: 'Test City',
      cuisineType: ['Indian'],
      isActive: true,
      status: 'ACTIVE',
      ...overrides,
    };
  }

  static generateMockOrder(overrides = {}) {
    return {
      id: 'test-order-id',
      customerId: 'test-customer-id',
      restaurantId: 'test-restaurant-id',
      status: 'PENDING',
      totalAmount: 100,
      currency: 'INR',
      orderItems: [],
      ...overrides,
    };
  }
}

// Global mocks for external dependencies
global.fetch = jest.fn();
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};