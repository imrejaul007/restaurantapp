"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheSearchResults = exports.CacheForumsList = exports.CacheUserProfile = exports.CachePostsList = exports.Cache = exports.CACHE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.CACHE_KEY = 'cache_config';
const Cache = (options) => (0, common_1.applyDecorators)((0, common_1.SetMetadata)(exports.CACHE_KEY, options));
exports.Cache = Cache;
const CachePostsList = (ttl = 300) => (0, exports.Cache)({
    ttl,
    tags: ['posts', 'community'],
    keyGenerator: (params) => `posts:list:${JSON.stringify(params)}`,
});
exports.CachePostsList = CachePostsList;
const CacheUserProfile = (ttl = 900) => (0, exports.Cache)({
    ttl,
    tags: ['users', 'profiles'],
    keyGenerator: (userId) => `user:profile:${userId}`,
});
exports.CacheUserProfile = CacheUserProfile;
const CacheForumsList = (ttl = 1800) => (0, exports.Cache)({
    ttl,
    tags: ['forums'],
    keyGenerator: () => 'forums:list',
});
exports.CacheForumsList = CacheForumsList;
const CacheSearchResults = (ttl = 600) => (0, exports.Cache)({
    ttl,
    tags: ['search'],
    keyGenerator: (params) => `search:${JSON.stringify(params)}`,
});
exports.CacheSearchResults = CacheSearchResults;
//# sourceMappingURL=cache.decorator.js.map