import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AdvancedCacheService } from './advanced-cache.service';
import { CACHE_KEY_METADATA, CACHE_CONFIG_METADATA } from './cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: AdvancedCacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler());
    const cacheConfig = this.reflector.get(CACHE_CONFIG_METADATA, context.getHandler());

    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const finalCacheKey = this.buildCacheKey(cacheKey, request);

    try {
      // Try to get from cache
      const cached = await this.cacheService.get(finalCacheKey, cacheConfig?.namespace);

      if (cached !== null) {
        this.logger.debug(`Cache hit for key: ${finalCacheKey}`);
        return of(cached);
      }

      // Cache miss, execute handler and cache result
      this.logger.debug(`Cache miss for key: ${finalCacheKey}`);

      return next.handle().pipe(
        tap(async (data) => {
          if (data !== undefined && data !== null) {
            await this.cacheService.set(finalCacheKey, data, cacheConfig);
            this.logger.debug(`Cached result for key: ${finalCacheKey}`);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache error for key ${finalCacheKey}:`, error);
      return next.handle();
    }
  }

  private buildCacheKey(template: string, request: any): string {
    // Replace placeholders in cache key template
    let key = template;

    // Replace user-specific placeholders
    if (request.user?.id) {
      key = key.replace('{userId}', request.user.id);
    }

    // Replace query parameters
    if (request.query) {
      Object.keys(request.query).forEach(param => {
        key = key.replace(`{${param}}`, request.query[param]);
      });
    }

    // Replace route parameters
    if (request.params) {
      Object.keys(request.params).forEach(param => {
        key = key.replace(`{${param}}`, request.params[param]);
      });
    }

    // Add timestamp for time-sensitive caches
    key = key.replace('{timestamp}', Math.floor(Date.now() / 60000).toString()); // Minute precision

    return key;
  }
}