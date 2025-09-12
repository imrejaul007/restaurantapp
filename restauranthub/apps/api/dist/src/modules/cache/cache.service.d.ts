import { Cache } from 'cache-manager';
export declare class CacheService {
    private cacheManager;
    private readonly logger;
    constructor(cacheManager: Cache);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    clear(): Promise<void>;
    getOrSet<T>(key: string, factory: () => Promise<T> | T, ttl?: number): Promise<T>;
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    mset(keyValuePairs: Array<{
        key: string;
        value: any;
        ttl?: number;
    }>): Promise<void>;
    invalidatePattern(pattern: string): Promise<void>;
    setWithTags(key: string, value: any, tags: string[], ttl?: number): Promise<void>;
    invalidateByTags(tags: string[]): Promise<void>;
    generateUserCacheKey(userId: string, suffix?: string): string;
    generateRestaurantCacheKey(restaurantId: string, suffix?: string): string;
    generateOrderCacheKey(orderId: string, suffix?: string): string;
    generateListCacheKey(entity: string, filters: any): string;
    private simpleHash;
    getStats(): Promise<any>;
    warmupCache(): Promise<void>;
}
