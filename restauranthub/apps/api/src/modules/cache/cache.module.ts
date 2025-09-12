import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
// import { RedisModule } from '../../redis/redis.module'; // Temporarily disabled
// import { redisStore } from 'cache-manager-redis-store'; // Temporarily disabled

@Global()
@Module({
  imports: [
    ConfigModule,
    // RedisModule, // Temporarily disabled
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        // Using memory store instead of Redis temporarily
        // store: redisStore as any,
        // host: configService.get('REDIS_HOST', 'localhost'),
        // port: configService.get('REDIS_PORT', 6379),
        // password: configService.get('REDIS_PASSWORD'),
        // db: configService.get('REDIS_DB', 1), // Use different DB for cache
        ttl: configService.get('CACHE_TTL', 300), // 5 minutes default
        max: configService.get('CACHE_MAX', 1000), // Maximum number of items in cache
        isGlobal: true,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}