import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PerformanceService } from './performance.service';
import { PerformanceMiddleware, ErrorTrackingMiddleware } from './performance.middleware';
import { MonitoringController } from './monitoring.controller';

@Module({
  imports: [ConfigModule],
  providers: [PerformanceService],
  controllers: [MonitoringController],
  exports: [PerformanceService],
})
export class MonitoringModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PerformanceMiddleware, ErrorTrackingMiddleware)
      .forRoutes('*');
  }
}