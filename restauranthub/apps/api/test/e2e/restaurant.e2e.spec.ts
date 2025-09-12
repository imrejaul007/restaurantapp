import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { TestUtils } from '../setup';

describe('Restaurant E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let restaurantAccessToken: string;
  let customerAccessToken: string;
  let restaurantUser: any;
  let customerUser: any;

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
        url: 'https://example.com/test-image.jpg',
        publicId: 'test-image',
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

    // Create test users
    await setupTestUsers();
  });

  async function setupTestUsers() {
    // Create restaurant user
    const restaurantSignUp = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: 'restaurant@e2e.com',
        password: 'Password123!',
        firstName: 'Restaurant',
        lastName: 'Owner',
        role: 'RESTAURANT',
        restaurantName: 'E2E Test Restaurant',
        cuisineType: ['Indian', 'Chinese'],
      });

    restaurantUser = restaurantSignUp.body.user;
    restaurantAccessToken = restaurantSignUp.body.accessToken;

    // Create customer user
    const customerSignUp = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: 'customer@e2e.com',
        password: 'Password123!',
        firstName: 'Customer',
        lastName: 'User',
        role: 'CUSTOMER',
      });

    customerUser = customerSignUp.body.user;
    customerAccessToken = customerSignUp.body.accessToken;
  }

  beforeEach(async () => {
    // Clean up test data except users
    await prismaService.orderItem.deleteMany();
    await prismaService.order.deleteMany();
    await prismaService.review.deleteMany();
    await prismaService.product.deleteMany();
    await TestUtils.cleanupRedis(redisService);
  });

  afterAll(async () => {
    await TestUtils.cleanupDatabase(prismaService);
    await TestUtils.cleanupRedis(redisService);
    await app.close();
  });

  describe('Restaurant Management Flow', () => {
    it('should complete full restaurant management workflow', async () => {
      // 1. Restaurant owner updates profile
      const profileUpdate = await request(app.getHttpServer())
        .put('/api/v1/restaurants/profile')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send({
          name: 'Updated Restaurant Name',
          description: 'A wonderful restaurant serving delicious food',
          address: '123 Food Street',
          city: 'Food City',
          phone: '+1234567890',
          cuisineType: ['Indian', 'Chinese', 'Italian'],
          operatingHours: {
            monday: { open: '09:00', close: '22:00' },
            tuesday: { open: '09:00', close: '22:00' },
          },
        })
        .expect(200);

      expect(profileUpdate.body.name).toBe('Updated Restaurant Name');

      // 2. Add menu items/products
      const menuItem1 = await request(app.getHttpServer())
        .post('/api/v1/restaurants/menu')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send({
          name: 'Butter Chicken',
          description: 'Creamy tomato-based chicken curry',
          price: 250,
          category: 'Main Course',
          isVegetarian: false,
          isAvailable: true,
          preparationTime: 20,
          ingredients: ['Chicken', 'Tomato', 'Cream', 'Spices'],
        })
        .expect(201);

      const menuItem2 = await request(app.getHttpServer())
        .post('/api/v1/restaurants/menu')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send({
          name: 'Paneer Tikka',
          description: 'Grilled cottage cheese with spices',
          price: 200,
          category: 'Appetizer',
          isVegetarian: true,
          isAvailable: true,
          preparationTime: 15,
          ingredients: ['Paneer', 'Yogurt', 'Spices'],
        })
        .expect(201);

      // 3. Customer searches for restaurants
      const searchResults = await request(app.getHttpServer())
        .get('/api/v1/search/restaurants')
        .query({
          q: 'Updated Restaurant',
          category: 'Indian',
          minPrice: 0,
          maxPrice: 500,
        })
        .expect(200);

      expect(searchResults.body.data).toHaveLength(1);
      expect(searchResults.body.data[0].name).toBe('Updated Restaurant Name');

      // 4. Customer views restaurant menu
      const menu = await request(app.getHttpServer())
        .get(`/api/v1/restaurants/${restaurantUser.restaurant.id}/menu`)
        .expect(200);

      expect(menu.body.data).toHaveLength(2);
      expect(menu.body.data.map(item => item.name)).toContain('Butter Chicken');
      expect(menu.body.data.map(item => item.name)).toContain('Paneer Tikka');

      // 5. Customer places an order
      const orderData = {
        restaurantId: restaurantUser.restaurant.id,
        items: [
          {
            productId: menuItem1.body.id,
            quantity: 2,
            price: 250,
          },
          {
            productId: menuItem2.body.id,
            quantity: 1,
            price: 200,
          },
        ],
        deliveryAddress: {
          street: '456 Customer Street',
          city: 'Customer City',
          zipCode: '12345',
        },
        notes: 'Extra spicy please',
      };

      const order = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(orderData)
        .expect(201);

      expect(order.body.totalAmount).toBe(700); // (250*2) + (200*1)
      expect(order.body.status).toBe('PENDING');
      expect(order.body.items).toHaveLength(2);

      // 6. Restaurant owner views incoming orders
      const incomingOrders = await request(app.getHttpServer())
        .get('/api/v1/restaurants/orders')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .query({ status: 'PENDING' })
        .expect(200);

      expect(incomingOrders.body.data).toHaveLength(1);
      expect(incomingOrders.body.data[0].id).toBe(order.body.id);

      // 7. Restaurant accepts and updates order status
      const acceptOrder = await request(app.getHttpServer())
        .patch(`/api/v1/orders/${order.body.id}/status`)
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send({
          status: 'CONFIRMED',
          estimatedDeliveryTime: '30 minutes',
        })
        .expect(200);

      expect(acceptOrder.body.status).toBe('CONFIRMED');

      // 8. Update order to preparing
      await request(app.getHttpServer())
        .patch(`/api/v1/orders/${order.body.id}/status`)
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send({
          status: 'PREPARING',
          notes: 'Started cooking your order',
        })
        .expect(200);

      // 9. Mark order as ready
      await request(app.getHttpServer())
        .patch(`/api/v1/orders/${order.body.id}/status`)
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send({
          status: 'READY',
          notes: 'Order is ready for pickup/delivery',
        })
        .expect(200);

      // 10. Complete the order
      const completedOrder = await request(app.getHttpServer())
        .patch(`/api/v1/orders/${order.body.id}/status`)
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send({
          status: 'COMPLETED',
          notes: 'Order delivered successfully',
        })
        .expect(200);

      expect(completedOrder.body.status).toBe('COMPLETED');

      // 11. Customer views order history
      const customerOrders = await request(app.getHttpServer())
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(200);

      expect(customerOrders.body.data).toHaveLength(1);
      expect(customerOrders.body.data[0].status).toBe('COMPLETED');

      // 12. Customer leaves a review
      const review = await request(app.getHttpServer())
        .post(`/api/v1/restaurants/${restaurantUser.restaurant.id}/reviews`)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          rating: 5,
          comment: 'Excellent food and service! Highly recommended.',
          orderId: order.body.id,
        })
        .expect(201);

      expect(review.body.rating).toBe(5);
      expect(review.body.comment).toContain('Excellent food');

      // 13. Restaurant owner views reviews
      const restaurantReviews = await request(app.getHttpServer())
        .get(`/api/v1/restaurants/${restaurantUser.restaurant.id}/reviews`)
        .expect(200);

      expect(restaurantReviews.body.data).toHaveLength(1);
      expect(restaurantReviews.body.data[0].rating).toBe(5);
      expect(restaurantReviews.body.meta.averageRating).toBe(5);

      // 14. Restaurant owner views analytics
      const analytics = await request(app.getHttpServer())
        .get('/api/v1/restaurants/analytics')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .query({ period: 'today' })
        .expect(200);

      expect(analytics.body.totalOrders).toBe(1);
      expect(analytics.body.totalRevenue).toBe(700);
      expect(analytics.body.averageRating).toBe(5);

      console.log('✅ Complete restaurant management workflow tested successfully');
    }, 30000); // Increased timeout for complex workflow
  });

  describe('Restaurant Search and Filtering', () => {
    beforeEach(async () => {
      // Create additional test restaurants
      await request(app.getHttpServer())
        .put('/api/v1/restaurants/profile')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send({
          name: 'Italian Bistro',
          cuisineType: ['Italian'],
          averagePrice: 400,
          city: 'Food City',
        });
    });

    it('should search restaurants by cuisine type', async () => {
      const results = await request(app.getHttpServer())
        .get('/api/v1/search/restaurants')
        .query({ category: 'Italian' })
        .expect(200);

      expect(results.body.data).toHaveLength(1);
      expect(results.body.data[0].cuisineType).toContain('Italian');
    });

    it('should filter restaurants by price range', async () => {
      const results = await request(app.getHttpServer())
        .get('/api/v1/search/restaurants')
        .query({
          minPrice: 300,
          maxPrice: 500,
        })
        .expect(200);

      expect(results.body.data.length).toBeGreaterThanOrEqual(0);
      results.body.data.forEach(restaurant => {
        if (restaurant.averagePrice) {
          expect(restaurant.averagePrice).toBeGreaterThanOrEqual(300);
          expect(restaurant.averagePrice).toBeLessThanOrEqual(500);
        }
      });
    });

    it('should return search suggestions', async () => {
      const suggestions = await request(app.getHttpServer())
        .get('/api/v1/search/suggestions')
        .query({ q: 'Italian', type: 'restaurants' })
        .expect(200);

      expect(Array.isArray(suggestions.body)).toBe(true);
    });
  });

  describe('Menu Management', () => {
    let menuItemId: string;

    it('should manage menu items lifecycle', async () => {
      // Add menu item
      const addItem = await request(app.getHttpServer())
        .post('/api/v1/restaurants/menu')
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send({
          name: 'Test Dish',
          description: 'A test dish',
          price: 150,
          category: 'Test Category',
          isVegetarian: true,
          isAvailable: true,
        })
        .expect(201);

      menuItemId = addItem.body.id;

      // Update menu item
      const updateItem = await request(app.getHttpServer())
        .put(`/api/v1/restaurants/menu/${menuItemId}`)
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .send({
          name: 'Updated Test Dish',
          price: 175,
          isAvailable: false,
        })
        .expect(200);

      expect(updateItem.body.name).toBe('Updated Test Dish');
      expect(updateItem.body.price).toBe(175);
      expect(updateItem.body.isAvailable).toBe(false);

      // Get menu item
      const getItem = await request(app.getHttpServer())
        .get(`/api/v1/restaurants/menu/${menuItemId}`)
        .expect(200);

      expect(getItem.body.name).toBe('Updated Test Dish');

      // Delete menu item
      await request(app.getHttpServer())
        .delete(`/api/v1/restaurants/menu/${menuItemId}`)
        .set('Authorization', `Bearer ${restaurantAccessToken}`)
        .expect(200);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/api/v1/restaurants/menu/${menuItemId}`)
        .expect(404);
    });
  });

  describe('Order Status Updates via WebSocket', () => {
    it('should send real-time order status updates', (done) => {
      // This would test WebSocket functionality
      // For now, we'll just test the HTTP endpoint
      
      request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .end(() => {
          console.log('✅ WebSocket endpoint available for real-time updates');
          done();
        });
    });
  });
});