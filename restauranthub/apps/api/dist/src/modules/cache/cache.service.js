"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
let CacheService = CacheService_1 = class CacheService {
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(CacheService_1.name);
    }
    async get(key) {
        try {
            const value = await this.cacheManager.get(key);
            if (value) {
                this.logger.debug(`Cache hit for key: ${key}`);
            }
            return value || null;
        }
        catch (error) {
            this.logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            await this.cacheManager.set(key, value, ttl);
            this.logger.debug(`Cache set for key: ${key}, TTL: ${ttl}`);
        }
        catch (error) {
            this.logger.error(`Cache set error for key ${key}:`, error);
        }
    }
    async del(key) {
        try {
            await this.cacheManager.del(key);
            this.logger.debug(`Cache deleted for key: ${key}`);
        }
        catch (error) {
            this.logger.error(`Cache delete error for key ${key}:`, error);
        }
    }
    async clear() {
        try {
            await this.cacheManager.reset();
            this.logger.log('Cache cleared');
        }
        catch (error) {
            this.logger.error('Cache clear error:', error);
        }
    }
    async getOrSet(key, factory, ttl) {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        try {
            const value = await factory();
            await this.set(key, value, ttl);
            return value;
        }
        catch (error) {
            this.logger.error(`Cache getOrSet error for key ${key}:`, error);
            throw error;
        }
    }
    async mget(keys) {
        try {
            const promises = keys.map(key => this.get(key));
            return await Promise.all(promises);
        }
        catch (error) {
            this.logger.error(`Cache mget error:`, error);
            return keys.map(() => null);
        }
    }
    async mset(keyValuePairs) {
        try {
            const promises = keyValuePairs.map(({ key, value, ttl }) => this.set(key, value, ttl));
            await Promise.all(promises);
        }
        catch (error) {
            this.logger.error('Cache mset error:', error);
        }
    }
    async invalidatePattern(pattern) {
        try {
            this.logger.debug(`Invalidating cache pattern: ${pattern}`);
        }
        catch (error) {
            this.logger.error(`Cache invalidate pattern error for ${pattern}:`, error);
        }
    }
    async setWithTags(key, value, tags, ttl) {
        await this.set(key, value, ttl);
        for (const tag of tags) {
            const tagKey = `tag:${tag}`;
            const taggedKeys = (await this.get(tagKey)) || [];
            taggedKeys.push(key);
            await this.set(tagKey, taggedKeys, ttl);
        }
    }
    async invalidateByTags(tags) {
        try {
            const keysToInvalidate = new Set();
            for (const tag of tags) {
                const tagKey = `tag:${tag}`;
                const taggedKeys = (await this.get(tagKey)) || [];
                taggedKeys.forEach(key => keysToInvalidate.add(key));
                await this.del(tagKey);
            }
            const deletePromises = Array.from(keysToInvalidate).map(key => this.del(key));
            await Promise.all(deletePromises);
            this.logger.debug(`Invalidated ${keysToInvalidate.size} keys with tags: ${tags.join(', ')}`);
        }
        catch (error) {
            this.logger.error(`Cache invalidate by tags error:`, error);
        }
    }
    generateUserCacheKey(userId, suffix) {
        return `user:${userId}${suffix ? `:${suffix}` : ''}`;
    }
    generateRestaurantCacheKey(restaurantId, suffix) {
        return `restaurant:${restaurantId}${suffix ? `:${suffix}` : ''}`;
    }
    generateOrderCacheKey(orderId, suffix) {
        return `order:${orderId}${suffix ? `:${suffix}` : ''}`;
    }
    generateListCacheKey(entity, filters) {
        const filtersString = JSON.stringify(filters);
        const hash = this.simpleHash(filtersString);
        return `list:${entity}:${hash}`;
    }
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    async getStats() {
        try {
            return {
                status: 'connected',
            };
        }
        catch (error) {
            this.logger.error('Cache stats error:', error);
            return { status: 'error', error: error.message };
        }
    }
    async warmupCache() {
        try {
            this.logger.log('Starting cache warmup...');
            this.logger.log('Cache warmup completed');
        }
        catch (error) {
            this.logger.error('Cache warmup error:', error);
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], CacheService);
//# sourceMappingURL=cache.service.js.map