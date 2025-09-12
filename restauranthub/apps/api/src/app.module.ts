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
import { CommunityModule } from './modules/community/community.module'; // Re-enabled to identify specific errors
import { AdminModule } from './modules/admin/admin.module';
// // import { NotificationsModule } from './modules/notifications/notifications.module'; // Temporarily disabled
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WebsocketModule } from './modules/websocket/websocket.module'; // Re-enabled for community module
// import { FilesModule } from './modules/files/files.module'; // Temporarily disabled
import { EmailModule } from './modules/email/email.module';
// import { SearchModule } from './modules/search/search.module'; // Temporarily disabled
// import { CacheModule } from './modules/cache/cache.module'; // Temporarily disabled
// import { MonitoringModule } from './modules/monitoring/monitoring.module'; // Temporarily disabled
import { LegalModule } from './modules/legal/legal.module';
import { RedisModule } from './redis/redis.module';
import { DatabaseModule } from './modules/database/database.module';
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
    MarketplaceModule,
    OrdersModule, // Re-enabled for Phase 1
    PaymentsModule, // Re-enabled for Phase 1
    // MessagingModule, // Temporarily disabled
    CommunityModule, // Re-enabled to identify specific errors
    AdminModule, // Re-enabled for Phase 2
    // NotificationsModule, // Temporarily disabled
    AnalyticsModule, // Re-enabled for Phase 2
    WebsocketModule, // Re-enabled for community module dependency
    // FilesModule, // Temporarily disabled - schema issues
    // SearchModule, // Temporarily disabled due to Redis dependency
    // CacheModule, // Temporarily disabled due to Redis dependency
    // MonitoringModule, // Temporarily disabled due to Redis dependency
    // HealthModule, // Temporarily disabled due to Redis syntax errors
  ],
  providers: [
    // Environment-controlled global rate limiting
    {
      provide: APP_GUARD,
      useFactory: (configService: ConfigService) => {
        const enableThrottling = configService.get('ENABLE_THROTTLING', 'true') === 'true';
        if (!enableThrottling) {
          console.warn('⚠️ RATE LIMITING DISABLED - Check ENABLE_THROTTLING environment variable');
          return null;
        }
        return new ThrottlerGuard();
      },
      inject: [ConfigService],
    },
  ].filter(provider => provider !== null),
})
export class AppModule {}