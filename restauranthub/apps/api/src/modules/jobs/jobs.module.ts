import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobApplicationsService } from './job-applications.service';
import { JobApplicationsController } from './job-applications.controller';
import { EmployeeAvailabilityService } from './employee-availability.service';
import { EmployeeAvailabilityController } from './employee-availability.controller';
import { JobModerationService } from './job-moderation.service';
import { JobModerationController } from './job-moderation.controller';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [DatabaseModule, RedisModule],
  providers: [JobsService, JobApplicationsService, EmployeeAvailabilityService, JobModerationService],
  controllers: [JobsController, JobApplicationsController, EmployeeAvailabilityController, JobModerationController],
  exports: [JobsService, JobApplicationsService, EmployeeAvailabilityService, JobModerationService],
})
export class JobsModule {}