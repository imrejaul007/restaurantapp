import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  namespace?: string;
  compress?: boolean;
  serialize?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  memory: number;
}

@Injectable()
export class AdvancedCacheService implements OnModuleInit {
  private readonly logger = new Logger(AdvancedCacheService.name);
  private redis: Redis | null = null;
  private localCache = new Map<string, { data: any; expires: number }>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    memory: 0,
  };

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeRedis();
    this.startCleanupInterval();
  }

  private async initializeRedis(): Promise<void> {
    try {
      if (process.env.MOCK_DATABASE === 'true') {
        this.logger.log('Using local cache (Redis mocked)');
        return;
      }

      const redisUrl = this.configService.get<string>('REDIS_URL');
      if (!redisUrl) {
        this.logger.log('Redis URL not configured, using local cache');
        return;
      }

      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      await this.redis.connect();
      this.logger.log('Redis cache connected successfully');

      // Redis event handlers
      this.redis.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
        this.redis = null;
      });

      this.redis.on('connect', () => {
        this.logger.log('Redis connected');
      });

      this.redis.on('disconnect', () => {
        this.logger.warn('Redis disconnected, falling back to local cache');
      });

    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      this.redis = null;
    }
  }

  async get<T>(key: string, namespace = 'default'): Promise<T | null> {
    const fullKey = this.buildKey(key, namespace);

    try {
      // Try Redis first
      if (this.redis) {
        const cached = await this.redis.get(fullKey);
        if (cached !== null) {
          this.stats.hits++;
          return JSON.parse(cached);
        }
      }

      // Fall back to local cache
      const localEntry = this.localCache.get(fullKey);
      if (localEntry && localEntry.expires > Date.now()) {
        this.stats.hits++;
        return localEntry.data;
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${fullKey}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    config: CacheConfig = { ttl: 3600 }
  ): Promise<boolean> {
    const fullKey = this.buildKey(key, config.namespace || 'default');
    const serialized = JSON.stringify(value);

    try {
      // Store in Redis
      if (this.redis) {
        await this.redis.setex(fullKey, config.ttl, serialized);
      }

      // Store in local cache as backup
      this.localCache.set(fullKey, {
        data: value,
        expires: Date.now() + (config.ttl * 1000),
      });

      this.stats.sets++;
      return true;
    } catch (error) {
      this.logger.error(`Error setting cache key ${fullKey}:`, error);
      return false;
    }
  }

  async del(key: string, namespace = 'default'): Promise<boolean> {
    const fullKey = this.buildKey(key, namespace);

    try {
      // Delete from Redis
      if (this.redis) {
        await this.redis.del(fullKey);
      }

      // Delete from local cache
      this.localCache.delete(fullKey);

      this.stats.deletes++;
      return true;
    } catch (error) {
      this.logger.error(`Error deleting cache key ${fullKey}:`, error);
      return false;
    }
  }

  async mget<T>(keys: string[], namespace = 'default'): Promise<(T | null)[]> {
    const fullKeys = keys.map(key => this.buildKey(key, namespace));

    try {
      if (this.redis) {
        const results = await this.redis.mget(...fullKeys);
        return results.map(result => {
          if (result !== null) {
            this.stats.hits++;
            return JSON.parse(result);
          }
          this.stats.misses++;
          return null;
        });
      }

      // Fall back to local cache
      return fullKeys.map(fullKey => {
        const localEntry = this.localCache.get(fullKey);
        if (localEntry && localEntry.expires > Date.now()) {
          this.stats.hits++;
          return localEntry.data;
        }
        this.stats.misses++;
        return null;
      });
    } catch (error) {
      this.logger.error('Error in mget:', error);
      return keys.map(() => null);
    }
  }

  async mset<T>(
    entries: Array<{ key: string; value: T; config?: CacheConfig }>,
    namespace = 'default'
  ): Promise<boolean> {
    try {
      if (this.redis) {
        const pipeline = this.redis.pipeline();

        entries.forEach(({ key, value, config = { ttl: 3600 } }) => {
          const fullKey = this.buildKey(key, namespace);
          const serialized = JSON.stringify(value);
          pipeline.setex(fullKey, config.ttl, serialized);
        });

        await pipeline.exec();
      }

      // Store in local cache
      entries.forEach(({ key, value, config = { ttl: 3600 } }) => {
        const fullKey = this.buildKey(key, namespace);
        this.localCache.set(fullKey, {
          data: value,
          expires: Date.now() + (config.ttl * 1000),
        });
      });

      this.stats.sets += entries.length;
      return true;
    } catch (error) {
      this.logger.error('Error in mset:', error);
      return false;
    }
  }

  async exists(key: string, namespace = 'default'): Promise<boolean> {
    const fullKey = this.buildKey(key, namespace);

    try {
      if (this.redis) {
        const exists = await this.redis.exists(fullKey);
        return exists === 1;
      }

      const localEntry = this.localCache.get(fullKey);
      return localEntry ? localEntry.expires > Date.now() : false;
    } catch (error) {
      this.logger.error(`Error checking existence of ${fullKey}:`, error);
      return false;
    }
  }

  async expire(key: string, ttl: number, namespace = 'default'): Promise<boolean> {
    const fullKey = this.buildKey(key, namespace);

    try {
      if (this.redis) {
        await this.redis.expire(fullKey, ttl);
      }

      const localEntry = this.localCache.get(fullKey);
      if (localEntry) {
        localEntry.expires = Date.now() + (ttl * 1000);
      }

      return true;
    } catch (error) {
      this.logger.error(`Error setting TTL for ${fullKey}:`, error);
      return false;
    }
  }

  async flush(namespace?: string): Promise<boolean> {
    try {
      if (namespace) {
        const pattern = this.buildKey('*', namespace);

        if (this.redis) {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        }

        // Clear from local cache
        for (const key of this.localCache.keys()) {
          if (key.startsWith(`${namespace}:`)) {
            this.localCache.delete(key);
          }
        }
      } else {
        if (this.redis) {
          await this.redis.flushdb();
        }
        this.localCache.clear();
      }

      return true;
    } catch (error) {
      this.logger.error('Error flushing cache:', error);
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = { ttl: 3600 }
  ): Promise<T> {
    const cached = await this.get<T>(key, config.namespace);

    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    await this.set(key, fresh, config);
    return fresh;
  }

  async remember<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = 3600,
    namespace = 'default'
  ): Promise<T> {
    return this.getOrSet(key, fetcher, { ttl, namespace });
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  async getInfo(): Promise<{
    redis: boolean;
    localCacheSize: number;
    stats: CacheStats;
    memory?: string;
  }> {
    const info = {
      redis: this.redis !== null,
      localCacheSize: this.localCache.size,
      stats: this.getStats(),
    };

    if (this.redis) {
      try {
        const memory = await this.redis.memory('usage');
        return { ...info, memory: `${memory} bytes` };
      } catch (error) {
        // Ignore error if Redis doesn't support memory command
      }
    }

    return info;
  }

  private buildKey(key: string, namespace: string): string {
    return `restauranthub:${namespace}:${key}`;
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      let evicted = 0;

      for (const [key, entry] of this.localCache.entries()) {
        if (entry.expires <= now) {
          this.localCache.delete(key);
          evicted++;
        }
      }

      if (evicted > 0) {
        this.stats.evictions += evicted;
        this.logger.debug(`Evicted ${evicted} expired entries from local cache`);
      }
    }, 60000); // Clean up every minute
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}