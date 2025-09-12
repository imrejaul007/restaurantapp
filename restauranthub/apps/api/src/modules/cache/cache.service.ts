import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit for key: ${key}`);
      }
      return value || null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache set for key: ${key}, TTL: ${ttl}`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.log('Cache cleared');
    } catch (error) {
      this.logger.error('Cache clear error:', error);
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const value = await factory();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      this.logger.error(`Cache getOrSet error for key ${key}:`, error);
      throw error;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const promises = keys.map(key => this.get<T>(key));
      return await Promise.all(promises);
    } catch (error) {
      this.logger.error(`Cache mget error:`, error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    try {
      const promises = keyValuePairs.map(({ key, value, ttl }) =>
        this.set(key, value, ttl),
      );
      await Promise.all(promises);
    } catch (error) {
      this.logger.error('Cache mset error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // This is a simplified pattern matching - in production, you might want
      // to implement more sophisticated pattern matching
      this.logger.debug(`Invalidating cache pattern: ${pattern}`);
      // For Redis store, you would need to implement key scanning
      // This is a placeholder implementation
    } catch (error) {
      this.logger.error(`Cache invalidate pattern error for ${pattern}:`, error);
    }
  }

  // Cache tags for more sophisticated cache invalidation
  async setWithTags(key: string, value: any, tags: string[], ttl?: number): Promise<void> {
    await this.set(key, value, ttl);
    
    // Store reverse mapping from tags to keys
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const taggedKeys = (await this.get<string[]>(tagKey)) || [];
      taggedKeys.push(key);
      await this.set(tagKey, taggedKeys, ttl);
    }
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      const keysToInvalidate = new Set<string>();

      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const taggedKeys = (await this.get<string[]>(tagKey)) || [];
        
        taggedKeys.forEach(key => keysToInvalidate.add(key));
        await this.del(tagKey); // Remove the tag mapping
      }

      // Delete all tagged keys
      const deletePromises = Array.from(keysToInvalidate).map(key => this.del(key));
      await Promise.all(deletePromises);

      this.logger.debug(`Invalidated ${keysToInvalidate.size} keys with tags: ${tags.join(', ')}`);
    } catch (error) {
      this.logger.error(`Cache invalidate by tags error:`, error);
    }
  }

  // Utility methods for common cache patterns
  generateUserCacheKey(userId: string, suffix?: string): string {
    return `user:${userId}${suffix ? `:${suffix}` : ''}`;
  }

  generateRestaurantCacheKey(restaurantId: string, suffix?: string): string {
    return `restaurant:${restaurantId}${suffix ? `:${suffix}` : ''}`;
  }

  generateOrderCacheKey(orderId: string, suffix?: string): string {
    return `order:${orderId}${suffix ? `:${suffix}` : ''}`;
  }

  generateListCacheKey(entity: string, filters: any): string {
    const filtersString = JSON.stringify(filters);
    const hash = this.simpleHash(filtersString);
    return `list:${entity}:${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Performance monitoring
  async getStats(): Promise<any> {
    try {
      // This would depend on your cache implementation
      // For Redis, you might want to use Redis INFO commands
      return {
        status: 'connected',
        // Add more stats as needed
      };
    } catch (error) {
      this.logger.error('Cache stats error:', error);
      return { status: 'error', error: (error as Error).message };
    }
  }

  // Warming up cache with frequently accessed data
  async warmupCache(): Promise<void> {
    try {
      this.logger.log('Starting cache warmup...');
      
      // Add your cache warming logic here
      // For example: preload popular restaurants, categories, etc.
      
      this.logger.log('Cache warmup completed');
    } catch (error) {
      this.logger.error('Cache warmup error:', error);
    }
  }
}