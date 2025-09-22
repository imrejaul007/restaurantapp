import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { SecurityPerformanceService } from '../security-performance.service';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';
import { CACHE_KEY, CacheOptions } from '../decorators/cache.decorator';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly securityPerformanceService: SecurityPerformanceService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();
    
    const operationName = `${controller.name}.${handler.name}`;
    
    // Check rate limiting
    this.checkRateLimit(context, request);
    
    // Check cache
    const cacheResult = this.checkCache(context, request);
    if (cacheResult) {
      return new Observable(subscriber => {
        subscriber.next(cacheResult);
        subscriber.complete();
      });
    }

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;
        
        // Log performance metrics
        await this.securityPerformanceService.logPerformanceMetric(
          operationName,
          duration,
          {
            method: request.method,
            url: request.url,
            userId: request.user?.id,
            responseSize: JSON.stringify(response).length,
          }
        );
        
        // Cache the response if configured
        await this.cacheResponse(context, request, response);
      })
    );
  }

  private async checkRateLimit(context: ExecutionContext, request: any): Promise<void> {
    const rateLimitConfig = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler()
    );

    if (!rateLimitConfig || !request.user?.id) {
      return;
    }

    if (rateLimitConfig.skipIf && rateLimitConfig.skipIf(request)) {
      return;
    }

    await this.securityPerformanceService.checkRateLimit(
      request.user.id,
      rateLimitConfig.action
    );
  }

  private async checkCache(context: ExecutionContext, request: any): Promise<any> {
    const cacheConfig = this.reflector.get<CacheOptions>(
      CACHE_KEY,
      context.getHandler()
    );

    if (!cacheConfig) {
      return null;
    }

    const cacheKey = this.generateCacheKey(cacheConfig, request, context);
    return await this.securityPerformanceService.getCachedData(cacheKey);
  }

  private async cacheResponse(
    context: ExecutionContext,
    request: any,
    response: any
  ): Promise<void> {
    const cacheConfig = this.reflector.get<CacheOptions>(
      CACHE_KEY,
      context.getHandler()
    );

    if (!cacheConfig) {
      return;
    }

    if (cacheConfig.skipIf && cacheConfig.skipIf(request, response)) {
      return;
    }

    const cacheKey = this.generateCacheKey(cacheConfig, request, context);
    await this.securityPerformanceService.setCachedData(
      cacheKey,
      response,
      cacheConfig.ttl,
      cacheConfig.tags
    );
  }

  private generateCacheKey(
    config: CacheOptions,
    request: any,
    context: ExecutionContext
  ): string {
    if (config.keyGenerator) {
      const args = [request.params, request.query, request.body].filter(Boolean);
      return config.keyGenerator(...args);
    }

    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    const params = JSON.stringify({
      params: request.params,
      query: request.query,
      userId: request.user?.id,
    });

    return `${controller}:${handler}:${params}`;
  }
}