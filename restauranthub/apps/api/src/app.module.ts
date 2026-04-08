import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { CacheConfigModule } from './cache/cache.module';
import { SecurityModule } from './common/modules/security.module';
import { RezBridgeModule } from './modules/auth/rez-bridge/rez-bridge.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { TrainingModule } from './modules/training/training.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FintechModule } from './modules/fintech/fintech.module';
import { QrTemplatesModule } from './modules/qr-templates/qr-templates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: (config) => {
        // Validate security-critical environment variables
        SecurityModule.validateEnvironmentVariables();
        return config;
      },
    }),

    // Rate limiting with Throttler
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ([{
        ttl: configService.get('RATE_LIMIT_WINDOW_MS', 60000), // 1 minute
        limit: configService.get('RATE_LIMIT_MAX_REQUESTS', 100),
      }]),
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),
    PrismaModule,
    CacheConfigModule.forRoot(),
    SecurityModule,
    RezBridgeModule,
    UsersModule,
    OrdersModule,
    JobsModule,
    MarketplaceModule,
    TrainingModule,
    AnalyticsModule,
    FintechModule,
    QrTemplatesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const environment = this.configService.get('NODE_ENV', 'development');

    this.logger.log('🔐 Security Module Initialized');
    this.logger.log(`🌍 Environment: ${environment}`);

    if (environment === 'production') {
      this.logger.log('🔒 Production security features enabled');
      this.logger.log('✓ HTTPS enforcement');
      this.logger.log('✓ Strict CORS policy');
      this.logger.log('✓ Enhanced rate limiting');
      this.logger.log('✓ CSRF protection');
    } else {
      this.logger.warn('⚠️  Development mode - some security features relaxed');
    }

    // Log security configuration
    this.logger.log('🛡️  Security features active:');
    this.logger.log('✓ JWT token blacklisting');
    this.logger.log('✓ Session management');
    this.logger.log('✓ Brute force protection');
    this.logger.log('✓ Input validation & sanitization');
    this.logger.log('✓ Security headers (HSTS, CSP, etc.)');
    this.logger.log('✓ Request/response logging');
    this.logger.log('✓ API key authentication');
    this.logger.log('✓ Automated security cleanup tasks');
  }
}