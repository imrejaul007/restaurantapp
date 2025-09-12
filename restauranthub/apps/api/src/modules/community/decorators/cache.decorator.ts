import { SetMetadata, applyDecorators } from '@nestjs/common';

export const CACHE_KEY = 'cache_config';

export interface CacheOptions {
  ttl: number; // Time to live in seconds
  keyGenerator?: (...args: any[]) => string;
  tags?: string[];
  skipIf?: (req: any, result: any) => boolean;
}

export const Cache = (options: CacheOptions) =>
  applyDecorators(SetMetadata(CACHE_KEY, options));

// Pre-defined cache decorators for common use cases
export const CachePostsList = (ttl = 300) => // 5 minutes
  Cache({
    ttl,
    tags: ['posts', 'community'],
    keyGenerator: (params) => `posts:list:${JSON.stringify(params)}`,
  });

export const CacheUserProfile = (ttl = 900) => // 15 minutes
  Cache({
    ttl,
    tags: ['users', 'profiles'],
    keyGenerator: (userId) => `user:profile:${userId}`,
  });

export const CacheForumsList = (ttl = 1800) => // 30 minutes
  Cache({
    ttl,
    tags: ['forums'],
    keyGenerator: () => 'forums:list',
  });

export const CacheSearchResults = (ttl = 600) => // 10 minutes
  Cache({
    ttl,
    tags: ['search'],
    keyGenerator: (params) => `search:${JSON.stringify(params)}`,
  });