import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { SecurityPerformanceService } from '../security-performance.service';
export declare class PerformanceInterceptor implements NestInterceptor {
    private readonly reflector;
    private readonly securityPerformanceService;
    constructor(reflector: Reflector, securityPerformanceService: SecurityPerformanceService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private checkRateLimit;
    private checkCache;
    private cacheResponse;
    private generateCacheKey;
}
