import { DatabaseService } from '../database/database.service';
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (userId: string, action: string) => string;
}
export interface CacheConfig {
    ttl: number;
    key: string;
    tags?: string[];
}
export declare class SecurityPerformanceService {
    private readonly databaseService;
    private readonly logger;
    private readonly rateLimitStore;
    private readonly cacheStore;
    private readonly rateLimits;
    constructor(databaseService: DatabaseService);
    checkRateLimit(userId: string, action: string): Promise<boolean>;
    validateAndSanitizePostInput(input: {
        title: string;
        content: string;
        tags?: string[];
    }): {
        title: string;
        content: string;
        tags: string[];
    };
    validateAndSanitizeCommentInput(content: string): string;
    validateAndSanitizeSearchInput(query: string): string;
    getCachedData<T>(key: string): Promise<T | null>;
    setCachedData<T>(key: string, data: T, ttlSeconds: number, tags?: string[]): Promise<void>;
    invalidateCacheByTags(tags: string[]): Promise<void>;
    invalidateCacheByKey(key: string): Promise<void>;
    generateCacheKey(type: string, identifier: string, params?: any): string;
    checkContentSecurity(content: string, userId: string): Promise<{
        isAllowed: boolean;
        issues: string[];
        securityScore: number;
    }>;
    logPerformanceMetric(operation: string, duration: number, metadata?: any): Promise<void>;
    logSecurityEvent(eventType: string, userId: string, details: any): Promise<void>;
    getOptimizedPagination(page: number, limit: number): {
        skip: number;
        take: number;
    };
    generateOptimizedWhereClause(filters: any): any;
    private sanitizeText;
    private generateRateLimitKey;
    private cleanupRateLimit;
    private cleanupCache;
    getOptimizedIncludes(includeBehaviorHeavy?: boolean): any;
    processBatch<T, R>(items: T[], processor: (batch: T[]) => Promise<R[]>, batchSize?: number): Promise<R[]>;
}
