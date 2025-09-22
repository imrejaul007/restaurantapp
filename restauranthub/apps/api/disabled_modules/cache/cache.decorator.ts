import { SetMetadata, applyDecorators } from '@nestjs/common';
import { CacheConfig } from './advanced-cache.service';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_CONFIG_METADATA = 'cache:config';

/**
 * Cache decorator for automatic caching of method results
 * @param keyOrConfig Cache key or configuration object
 * @param config Additional cache configuration
 */
export function Cache(
  keyOrConfig: string | (CacheConfig & { key: string }),
  config?: CacheConfig
) {
  if (typeof keyOrConfig === 'string') {
    return applyDecorators(
      SetMetadata(CACHE_KEY_METADATA, keyOrConfig),
      SetMetadata(CACHE_CONFIG_METADATA, config || { ttl: 3600 })
    );
  } else {
    return applyDecorators(
      SetMetadata(CACHE_KEY_METADATA, keyOrConfig.key),
      SetMetadata(CACHE_CONFIG_METADATA, keyOrConfig)
    );
  }
}

/**
 * Cache invalidation decorator
 * @param keys Array of cache keys to invalidate
 * @param namespace Cache namespace
 */
export function InvalidateCache(keys: string[], namespace = 'default') {
  return SetMetadata('cache:invalidate', { keys, namespace });
}

/**
 * Cache warming decorator - preloads cache before method execution
 * @param key Cache key
 * @param config Cache configuration
 */
export function WarmCache(key: string, config: CacheConfig = { ttl: 3600 }) {
  return applyDecorators(
    SetMetadata('cache:warm', { key, config })
  );
}