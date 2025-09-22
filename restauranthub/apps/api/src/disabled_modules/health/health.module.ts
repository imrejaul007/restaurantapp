import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaModule } from '../../prisma/prisma.module';
// import { RedisModule } from '../../redis/redis.module'; // Temporarily disabled

@Module({
  imports: [TerminusModule, PrismaModule], // RedisModule temporarily disabled
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}