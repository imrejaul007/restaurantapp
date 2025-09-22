import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PerformanceTestingService } from './performance-testing.service';
import { PerformanceTestingController } from './performance-testing.controller';
import { AdvancedCacheModule } from '../cache/advanced-cache.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [ConfigModule, AdvancedCacheModule, PrismaModule, MonitoringModule],
  providers: [PerformanceTestingService],
  controllers: [PerformanceTestingController],
  exports: [PerformanceTestingService],
})
export class PerformanceTestingModule {}