import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { MockRedisService } from './mock-redis.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const mockMode = process.env.MOCK_DATABASE === 'true' || process.env.REDIS_ENABLED === 'false';
        
        if (mockMode) {
          logger.warn('Using mock Redis client - Redis functionality will be simulated in memory');
          return new MockRedisService();
        }
        
        try {
          logger.log('Connecting to Redis server...');
          return new Redis({
            host: configService.get('redis.host'),
            port: configService.get('redis.port'),
            password: configService.get('redis.password'),
            retryStrategy: (times) => {
              if (times > 3) {
                logger.error('Redis connection failed after 3 retries, falling back to mock');
                return null; // Stop retrying
              }
              return Math.min(times * 50, 2000);
            },
            maxRetriesPerRequest: 3,
            lazyConnect: true,
          });
        } catch (error) {
          logger.error('Failed to create Redis client, using mock:', (error as Error).message);
          return new MockRedisService();
        }
      },
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_SUBSCRIBER',
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const mockMode = process.env.MOCK_DATABASE === 'true' || process.env.REDIS_ENABLED === 'false';
        
        if (mockMode) {
          logger.warn('Using mock Redis subscriber - Pub/Sub will be simulated in memory');
          return new MockRedisService();
        }
        
        try {
          logger.log('Connecting Redis subscriber...');
          return new Redis({
            host: configService.get('redis.host'),
            port: configService.get('redis.port'),
            password: configService.get('redis.password'),
            retryStrategy: (times) => {
              if (times > 3) {
                logger.error('Redis subscriber connection failed after 3 retries, falling back to mock');
                return null; // Stop retrying
              }
              return Math.min(times * 50, 2000);
            },
            maxRetriesPerRequest: 3,
            lazyConnect: true,
          });
        } catch (error) {
          logger.error('Failed to create Redis subscriber, using mock:', (error as Error).message);
          return new MockRedisService();
        }
      },
      inject: [ConfigService],
    },
    {
      provide: RedisService,
      useFactory: (client: any, subscriber: any) => {
        return new RedisService(client, subscriber);
      },
      inject: ['REDIS_CLIENT', 'REDIS_SUBSCRIBER'],
    },
  ],
  exports: ['REDIS_CLIENT', 'REDIS_SUBSCRIBER', RedisService],
})
export class RedisModule {}