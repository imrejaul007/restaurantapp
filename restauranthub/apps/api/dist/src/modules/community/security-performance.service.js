"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SecurityPerformanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityPerformanceService = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const database_service_1 = require("../database/database.service");
const crypto = __importStar(require("crypto"));
let SecurityPerformanceService = SecurityPerformanceService_1 = class SecurityPerformanceService {
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.logger = new common_1.Logger(SecurityPerformanceService_1.name);
        this.rateLimitStore = new Map();
        this.cacheStore = new Map();
        this.rateLimits = {
            'create_post': { windowMs: 60 * 1000, maxRequests: 5 },
            'like_post': { windowMs: 60 * 1000, maxRequests: 30 },
            'comment_post': { windowMs: 60 * 1000, maxRequests: 10 },
            'follow_user': { windowMs: 60 * 1000, maxRequests: 10 },
            'report_content': { windowMs: 5 * 60 * 1000, maxRequests: 5 },
            'search': { windowMs: 60 * 1000, maxRequests: 20 },
            'api_general': { windowMs: 60 * 1000, maxRequests: 100 },
        };
        setInterval(() => this.cleanupRateLimit(), 5 * 60 * 1000);
        setInterval(() => this.cleanupCache(), 10 * 60 * 1000);
    }
    async checkRateLimit(userId, action) {
        const config = this.rateLimits[action] || this.rateLimits['api_general'];
        const key = this.generateRateLimitKey(userId, action);
        const now = Date.now();
        const current = this.rateLimitStore.get(key);
        if (!current || now > current.resetTime) {
            this.rateLimitStore.set(key, {
                count: 1,
                resetTime: now + config.windowMs,
            });
            return true;
        }
        if (current.count >= config.maxRequests) {
            throw new throttler_1.ThrottlerException(`Rate limit exceeded for ${action}. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds.`);
        }
        current.count++;
        return true;
    }
    validateAndSanitizePostInput(input) {
        if (!input.title || typeof input.title !== 'string') {
            throw new common_1.BadRequestException('Title is required and must be a string');
        }
        if (input.title.length < 3 || input.title.length > 200) {
            throw new common_1.BadRequestException('Title must be between 3 and 200 characters');
        }
        if (!input.content || typeof input.content !== 'string') {
            throw new common_1.BadRequestException('Content is required and must be a string');
        }
        if (input.content.length < 10 || input.content.length > 10000) {
            throw new common_1.BadRequestException('Content must be between 10 and 10,000 characters');
        }
        const sanitizedTitle = this.sanitizeText(input.title);
        const sanitizedContent = this.sanitizeText(input.content);
        let sanitizedTags = [];
        if (input.tags && Array.isArray(input.tags)) {
            sanitizedTags = input.tags
                .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
                .map(tag => this.sanitizeText(tag.trim().toLowerCase()))
                .filter(tag => tag.length >= 2 && tag.length <= 30)
                .slice(0, 10);
        }
        return {
            title: sanitizedTitle,
            content: sanitizedContent,
            tags: sanitizedTags,
        };
    }
    validateAndSanitizeCommentInput(content) {
        if (!content || typeof content !== 'string') {
            throw new common_1.BadRequestException('Comment content is required and must be a string');
        }
        if (content.length < 1 || content.length > 2000) {
            throw new common_1.BadRequestException('Comment must be between 1 and 2,000 characters');
        }
        return this.sanitizeText(content);
    }
    validateAndSanitizeSearchInput(query) {
        if (!query || typeof query !== 'string') {
            throw new common_1.BadRequestException('Search query is required and must be a string');
        }
        if (query.length < 1 || query.length > 100) {
            throw new common_1.BadRequestException('Search query must be between 1 and 100 characters');
        }
        return query
            .replace(/[<>\"']/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    async getCachedData(key) {
        const cached = this.cacheStore.get(key);
        if (!cached || Date.now() > cached.expiry) {
            this.cacheStore.delete(key);
            return null;
        }
        return cached.data;
    }
    async setCachedData(key, data, ttlSeconds, tags = []) {
        this.cacheStore.set(key, {
            data,
            expiry: Date.now() + (ttlSeconds * 1000),
            tags,
        });
    }
    async invalidateCacheByTags(tags) {
        for (const [key, cached] of this.cacheStore.entries()) {
            if (cached.tags.some(tag => tags.includes(tag))) {
                this.cacheStore.delete(key);
            }
        }
    }
    async invalidateCacheByKey(key) {
        this.cacheStore.delete(key);
    }
    generateCacheKey(type, identifier, params) {
        const baseKey = `community:${type}:${identifier}`;
        if (params) {
            const paramHash = crypto
                .createHash('md5')
                .update(JSON.stringify(params))
                .digest('hex');
            return `${baseKey}:${paramHash}`;
        }
        return baseKey;
    }
    async checkContentSecurity(content, userId) {
        const issues = [];
        let securityScore = 100;
        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe\b/gi,
            /<object\b/gi,
            /<embed\b/gi,
        ];
        for (const pattern of xssPatterns) {
            if (pattern.test(content)) {
                issues.push('Potentially malicious script detected');
                securityScore -= 40;
                break;
            }
        }
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
            /('|(\\x27)|(\\x2D\\x2D)|(%27)|(%2D%2D))/gi,
        ];
        for (const pattern of sqlPatterns) {
            if (pattern.test(content)) {
                issues.push('Potential SQL injection detected');
                securityScore -= 30;
                break;
            }
        }
        const suspiciousUrlPatterns = [
            /https?:\/\/(?:[\w-]+\.)*(?:bit\.ly|tinyurl|t\.co|goo\.gl|short\.link)/gi,
            /https?:\/\/[^\s]+\.(?:tk|ml|ga|cf)/gi,
        ];
        for (const pattern of suspiciousUrlPatterns) {
            if (pattern.test(content)) {
                issues.push('Suspicious URL detected');
                securityScore -= 20;
                break;
            }
        }
        const urlCount = (content.match(/https?:\/\/[^\s]+/gi) || []).length;
        if (urlCount > 3) {
            issues.push('Too many URLs detected');
            securityScore -= 15;
        }
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                include: { reputation: true },
            });
            if (user && user.reputation) {
                const userLevel = user.reputation.level || 1;
                if (userLevel >= 10) {
                    securityScore += 10;
                }
                else if (userLevel < 3) {
                    securityScore -= 10;
                }
            }
        }
        catch (error) {
            this.logger.warn('Failed to check user reputation for security scoring', error);
        }
        const isAllowed = securityScore >= 60;
        return { isAllowed, issues, securityScore };
    }
    async logPerformanceMetric(operation, duration, metadata) {
        if (duration > 1000) {
            this.logger.warn(`Slow operation detected: ${operation} took ${duration}ms`, metadata);
        }
        this.logger.log(`Performance metric: ${operation} - ${duration}ms`, {
            operation,
            duration,
            metadata: metadata || {},
            timestamp: new Date(),
        });
    }
    async logSecurityEvent(eventType, userId, details) {
        this.logger.warn(`Security event: ${eventType} for user ${userId}`, {
            eventType,
            userId,
            details,
            timestamp: new Date(),
            ipAddress: details.ipAddress || 'unknown',
            userAgent: details.userAgent || 'unknown',
        });
    }
    getOptimizedPagination(page, limit) {
        const normalizedPage = Math.max(1, page || 1);
        const normalizedLimit = Math.min(100, Math.max(1, limit || 20));
        return {
            skip: (normalizedPage - 1) * normalizedLimit,
            take: normalizedLimit,
        };
    }
    generateOptimizedWhereClause(filters) {
        const where = {};
        if (filters.isDeleted !== undefined) {
            where.isDeleted = filters.isDeleted;
        }
        if (filters.isActive !== undefined) {
            where.isActive = filters.isActive;
        }
        if (filters.dateFrom || filters.dateTo) {
            where.createdAt = {};
            if (filters.dateFrom) {
                where.createdAt.gte = new Date(filters.dateFrom);
            }
            if (filters.dateTo) {
                where.createdAt.lte = new Date(filters.dateTo);
            }
        }
        Object.entries(filters).forEach(([key, value]) => {
            if (!['isDeleted', 'isActive', 'dateFrom', 'dateTo', 'search'].includes(key) && value !== undefined) {
                where[key] = value;
            }
        });
        if (filters.search) {
            const searchTerm = this.validateAndSanitizeSearchInput(filters.search);
            where.OR = [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { content: { contains: searchTerm, mode: 'insensitive' } },
            ];
        }
        return where;
    }
    sanitizeText(text) {
        return text
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    }
    generateRateLimitKey(userId, action) {
        return `ratelimit:${userId}:${action}`;
    }
    cleanupRateLimit() {
        const now = Date.now();
        for (const [key, data] of this.rateLimitStore.entries()) {
            if (now > data.resetTime) {
                this.rateLimitStore.delete(key);
            }
        }
    }
    cleanupCache() {
        const now = Date.now();
        for (const [key, data] of this.cacheStore.entries()) {
            if (now > data.expiry) {
                this.cacheStore.delete(key);
            }
        }
    }
    getOptimizedIncludes(includeBehaviorHeavy = false) {
        const baseIncludes = {
            author: {
                include: {
                    profile: {
                        select: {
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            city: true,
                        },
                    },
                },
            },
        };
        if (includeBehaviorHeavy) {
            return {
                ...baseIncludes,
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        shares: true,
                    },
                },
            };
        }
        return baseIncludes;
    }
    async processBatch(items, processor, batchSize = 50) {
        const results = [];
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await processor(batch);
            results.push(...batchResults);
        }
        return results;
    }
};
exports.SecurityPerformanceService = SecurityPerformanceService;
exports.SecurityPerformanceService = SecurityPerformanceService = SecurityPerformanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SecurityPerformanceService);
//# sourceMappingURL=security-performance.service.js.map