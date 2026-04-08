import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PerformanceService } from './performance.service';
import { PrometheusService } from './prometheus.service';
import { TracingService } from './tracing.service';
import { BusinessMetricsService } from './business-metrics.service';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { MetricsController } from './controllers/metrics.controller';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    PerformanceService,
    PrometheusService,
    TracingService,
    BusinessMetricsService,
    PerformanceInterceptor,
  ],
  controllers: [MetricsController],
  exports: [
    PerformanceService,
    PrometheusService,
    TracingService,
    BusinessMetricsService,
    PerformanceInterceptor,
  ],
})
export class PerformanceModule {}