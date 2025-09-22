import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GdprController } from './gdpr.controller';
import { GdprService } from './services/gdpr.service';
import { DataExportService } from './services/data-export.service';
import { DataDeletionService } from './services/data-deletion.service';
import { ConsentService } from './services/consent.service';
import { AuditLogService } from './services/audit-log.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    RedisModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [GdprController],
  providers: [
    GdprService,
    DataExportService,
    DataDeletionService,
    ConsentService,
    AuditLogService,
  ],
  exports: [
    GdprService,
    ConsentService,
    AuditLogService,
    DataExportService,
    DataDeletionService,
  ],
})
export class GdprModule {}