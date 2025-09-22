import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdvancedCacheService } from './advanced-cache.service';
import { CacheInterceptor } from './cache.interceptor';
import { CacheController } from './cache.controller';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AdvancedCacheService, CacheInterceptor],
  controllers: [CacheController],
  exports: [AdvancedCacheService, CacheInterceptor],
})
export class AdvancedCacheModule {}