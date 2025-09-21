import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { VendorsModule } from './modules/vendors/vendors.module';
// import { EmployeesModule } from './modules/employees/employees.module'; // Temporarily disabled
import { JobsModule } from './modules/jobs/jobs.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
// import { MessagingModule } from './modules/messaging/messaging.module'; // Temporarily disabled
// import { CommunityModule } from './modules/community/community.module'; // Temporarily disabled
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
// import { WebsocketModule } from './modules/websocket/websocket.module'; // Temporarily disabled
// import { FilesModule } from './modules/files/files.module'; // Temporarily disabled
import { EmailModule } from './modules/email/email.module';
// import { SearchModule } from './modules/search/search.module'; // Temporarily disabled
// import { AdvancedCacheModule } from './cache/advanced-cache.module';
// import { MonitoringModule } from './monitoring/monitoring.module';
// import { GraphQLApiModule } from './graphql/graphql.module';
// import { AIModule } from './ai/ai.module';
// import { SecurityModule } from './security/security.module';
// import { AdvancedAnalyticsModule } from './analytics/advanced-analytics.module';
import { LegalModule } from './modules/legal/legal.module';
import { RedisModule } from './redis/redis.module';
import { DatabaseModule } from './modules/database/database.module';
import { WebSocketModule } from './websocket/websocket.module';
import { SharedModule } from './shared/shared.module';
// Restaurant Operations Modules
import { InventoryModule } from './modules/inventory/inventory.module';
import { MenuModule } from './modules/menu/menu.module';
import { PosModule } from './modules/pos/pos.module';
import { CustomerModule } from './modules/customer/customer.module';
import { FinancialModule } from './modules/financial/financial.module';
// import { PerformanceTestingModule } from './performance/performance-testing.module';
// import { MicroservicesModule } from './microservices/microservices.module';
// import { HealthModule } from './health/health.module'; // Temporarily disabled
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [{
        ttl: parseInt(configService.get('THROTTLE_TTL') || '60000'),
        limit: parseInt(configService.get('THROTTLE_LIMIT') || (configService.get('NODE_ENV') === 'development' ? '10000' : '100')),
      }],
      inject: [ConfigService],
    }),
    PrismaModule,
    DatabaseModule,
    RedisModule,
    SharedModule,
    // Only essential modules that compile without errors
    AuthModule,
    UsersModule,
    EmailModule,
    LegalModule,
    // Additional modules temporarily disabled for compilation issues
    RestaurantsModule, // Re-enabled for Phase 1
    VendorsModule, // Re-enabled for Phase 1  
    // EmployeesModule, // Temporarily disabled due to Redis dependency
    JobsModule, // Re-enabled with full backend implementation
    MarketplaceModule, // Re-enabled with basic module
    OrdersModule, // Re-enabled with basic module
    PaymentsModule, // Re-enabled with basic module
    // MessagingModule, // Temporarily disabled
    // CommunityModule, // Temporarily disabled due to websocket dependency
    AdminModule, // Re-enabled for Phase 2
    NotificationsModule, // Re-enabled with basic module
    AnalyticsModule, // Re-enabled with basic module
    WebSocketModule, // Re-enabled with real-time features

    // Restaurant Operations Modules
    InventoryModule, // Inventory management with stock tracking
    MenuModule, // Menu management with pricing and variants
    PosModule, // Point of Sale integration with table management
    CustomerModule, // Customer management with profiles and loyalty
    FinancialModule, // Financial management with invoicing, payments, and accounting

    // FilesModule, // Temporarily disabled - schema issues
    // SearchModule, // Temporarily disabled due to Redis dependency
    // AdvancedCacheModule, // Temporarily disabled due to Redis configuration issues
    // MonitoringModule, // Temporarily disabled due to dependency issues
    // GraphQLApiModule, // Temporarily disabled due to Apollo dependency issues
    // AIModule, // Temporarily disabled due to auth dependency issues
    // SecurityModule, // Temporarily disabled due to dependency issues
    // AdvancedAnalyticsModule, // Temporarily disabled due to auth dependency issues
    // PerformanceTestingModule, // Temporarily disabled due to dependency issues
    // MicroservicesModule, // Temporarily disabled due to dependency issues
    // HealthModule, // Temporarily disabled due to Redis syntax errors
  ],
  providers: [
    // Environment-controlled global rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ].filter(provider => provider !== null),
})
export class AppModule {}