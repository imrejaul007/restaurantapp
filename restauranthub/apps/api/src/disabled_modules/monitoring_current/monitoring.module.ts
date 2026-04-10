import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PromModule } from '@digikare/nestjs-prom';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PerformanceService } from './performance.service';
import { PerformanceMiddleware } from './performance.middleware';
import { MetricsService } from './metrics.service';
import { AlertService } from './alert.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    TerminusModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    PromModule.forRoot({
      defaultLabels: {
        app: 'restopapa-api',
        version: process.env.npm_package_version || '1.0.0',
      },
      withDefaultsMetrics: true,
      withDefaultController: true,
    }),
    PrismaModule,
  ],
  controllers: [MonitoringController, HealthController],
  providers: [
    MonitoringService,
    HealthService,
    PerformanceService,
    PerformanceMiddleware,
    MetricsService,
    AlertService,
  ],
  exports: [
    MonitoringService,
    HealthService,
    PerformanceService,
    PerformanceMiddleware,
    MetricsService,
    AlertService,
  ],
})
export class MonitoringModule {}