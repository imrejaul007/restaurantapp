import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockRedisService } from './mock-redis.service';

@Module({
  providers: [
    {
      provide: 'RedisService',
      useFactory: (configService: ConfigService) => {
        // Always use mock for now to avoid Redis dependency
        return new MockRedisService();
      },
      inject: [ConfigService],
    },
  ],
  exports: ['RedisService'],
})
export class RedisModule {}