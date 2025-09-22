import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import {
  SecurityMiddleware,
  IPFilterMiddleware,
  RequestSanitizerMiddleware,
} from './security.middleware';
import { AdvancedCacheModule } from '../cache/advanced-cache.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [ConfigModule, AdvancedCacheModule, MonitoringModule],
  providers: [
    SecurityService,
    SecurityMiddleware,
    IPFilterMiddleware,
    RequestSanitizerMiddleware,
  ],
  controllers: [SecurityController],
  exports: [SecurityService, SecurityMiddleware],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        IPFilterMiddleware,
        RequestSanitizerMiddleware,
        SecurityMiddleware,
      )
      .forRoutes('*');
  }
}