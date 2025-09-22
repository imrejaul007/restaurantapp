import { Injectable } from '@nestjs/common';

@Injectable()
export class MockRedisService {
  private cache = new Map<string, string>();
  private expiry = new Map<string, number>();

  async get(key: string): Promise<string | null> {
    if (this.expiry.has(key) && this.expiry.get(key)! < Date.now()) {
      this.cache.delete(key);
      this.expiry.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  async set(key: string, value: string, ttl?: number): Promise<string> {
    this.cache.set(key, value);
    if (ttl) {
      this.expiry.set(key, Date.now() + ttl * 1000);
    }
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const deleted = this.cache.delete(key);
    this.expiry.delete(key);
    return deleted ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    if (this.expiry.has(key) && this.expiry.get(key)! < Date.now()) {
      this.cache.delete(key);
      this.expiry.delete(key);
      return 0;
    }
    return this.cache.has(key) ? 1 : 0;
  }

  async expire(key: string, ttl: number): Promise<number> {
    if (this.cache.has(key)) {
      this.expiry.set(key, Date.now() + ttl * 1000);
      return 1;
    }
    return 0;
  }

  async flushall(): Promise<string> {
    this.cache.clear();
    this.expiry.clear();
    return 'OK';
  }

  async ping(): Promise<string> {
    return 'PONG';
  }
}