import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from '@/modules/database/database.module';

@Module({
  imports: [
    TerminusModule,
    ConfigModule,
    DatabaseModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class MonitoringModule {}