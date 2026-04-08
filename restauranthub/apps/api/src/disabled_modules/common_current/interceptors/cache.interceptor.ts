import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private cacheService: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request);

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        // Cache successful responses for 5 minutes
        if (response && !response.error) {
          await this.cacheService.set(cacheKey, response, 300);
        }
      })
    );
  }

  private generateCacheKey(request: any): string {
    const { method, url, user } = request;
    const userId = user?.sub || 'anonymous';
    return `api:${method}:${url}:user:${userId}`;
  }
}