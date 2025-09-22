import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { VerificationService } from './verification.service';
import { AnalyticsService } from './analytics.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AdminService, VerificationService, AnalyticsService],
  controllers: [AdminController],
  exports: [AdminService, VerificationService, AnalyticsService],
})
export class AdminModule {}