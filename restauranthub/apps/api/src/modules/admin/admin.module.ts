import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { VerificationService } from './verification.service';
import { AnalyticsService } from './analytics.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AdminService, VerificationService, AnalyticsService],
  controllers: [AdminController],
  exports: [AdminService, VerificationService, AnalyticsService],
})
export class AdminModule {}