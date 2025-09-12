import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { DatabaseService } from '../database/database.service';
import * as crypto from 'crypto';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (userId: string, action: string) => string;
}

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
  tags?: string[];
}

@Injectable()
export class SecurityPerformanceService {
  private readonly logger = new Logger(SecurityPerformanceService.name);
  private readonly rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  private readonly cacheStore = new Map<string, { data: any; expiry: number; tags: string[] }>();
  
  // Security configurations
  private readonly rateLimits: { [key: string]: RateLimitConfig } = {
    // Post operations
    'create_post': { windowMs: 60 * 1000, maxRequests: 5 }, // 5 posts per minute
    'like_post': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 likes per minute
    'comment_post': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 comments per minute
    
    // User operations
    'follow_user': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 follows per minute
    'report_content': { windowMs: 5 * 60 * 1000, maxRequests: 5 }, // 5 reports per 5 minutes
    
    // Search operations
    'search': { windowMs: 60 * 1000, maxRequests: 20 }, // 20 searches per minute
    
    // General API
    'api_general': { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  };

  constructor(private readonly databaseService: DatabaseService) {
    // Clean up expired rate limit entries every 5 minutes
    setInterval(() => this.cleanupRateLimit(), 5 * 60 * 1000);
    
    // Clean up expired cache entries every 10 minutes
    setInterval(() => this.cleanupCache(), 10 * 60 * 1000);
  }

  // Rate limiting functionality
  async checkRateLimit(userId: string, action: string): Promise<boolean> {
    const config = this.rateLimits[action] || this.rateLimits['api_general'];
    const key = this.generateRateLimitKey(userId, action);
    const now = Date.now();
    
    const current = this.rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      // First request or window expired
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }
    
    if (current.count >= config.maxRequests) {
      throw new ThrottlerException(
        `Rate limit exceeded for ${action}. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds.`
      );
    }
    
    current.count++;
    return true;
  }

  // Input validation and sanitization
  validateAndSanitizePostInput(input: {
    title: string;
    content: string;
    tags?: string[];
  }): { title: string; content: string; tags: string[] } {
    // Title validation
    if (!input.title || typeof input.title !== 'string') {
      throw new BadRequestException('Title is required and must be a string');
    }
    
    if (input.title.length < 3 || input.title.length > 200) {
      throw new BadRequestException('Title must be between 3 and 200 characters');
    }
    
    // Content validation
    if (!input.content || typeof input.content !== 'string') {
      throw new BadRequestException('Content is required and must be a string');
    }
    
    if (input.content.length < 10 || input.content.length > 10000) {
      throw new BadRequestException('Content must be between 10 and 10,000 characters');
    }
    
    // Sanitize inputs
    const sanitizedTitle = this.sanitizeText(input.title);
    const sanitizedContent = this.sanitizeText(input.content);
    
    // Tags validation and sanitization
    let sanitizedTags: string[] = [];
    if (input.tags && Array.isArray(input.tags)) {
      sanitizedTags = input.tags
        .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
        .map(tag => this.sanitizeText(tag.trim().toLowerCase()))
        .filter(tag => tag.length >= 2 && tag.length <= 30)
        .slice(0, 10); // Limit to 10 tags
    }
    
    return {
      title: sanitizedTitle,
      content: sanitizedContent,
      tags: sanitizedTags,
    };
  }

  validateAndSanitizeCommentInput(content: string): string {
    if (!content || typeof content !== 'string') {
      throw new BadRequestException('Comment content is required and must be a string');
    }
    
    if (content.length < 1 || content.length > 2000) {
      throw new BadRequestException('Comment must be between 1 and 2,000 characters');
    }
    
    return this.sanitizeText(content);
  }

  validateAndSanitizeSearchInput(query: string): string {
    if (!query || typeof query !== 'string') {
      throw new BadRequestException('Search query is required and must be a string');
    }
    
    if (query.length < 1 || query.length > 100) {
      throw new BadRequestException('Search query must be between 1 and 100 characters');
    }
    
    // Remove potentially harmful characters but keep basic search functionality
    return query
      .replace(/[<>\"']/g, '') // Remove basic XSS characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Caching functionality
  async getCachedData<T>(key: string): Promise<T | null> {
    const cached = this.cacheStore.get(key);
    
    if (!cached || Date.now() > cached.expiry) {
      this.cacheStore.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  async setCachedData<T>(key: string, data: T, ttlSeconds: number, tags: string[] = []): Promise<void> {
    this.cacheStore.set(key, {
      data,
      expiry: Date.now() + (ttlSeconds * 1000),
      tags,
    });
  }

  async invalidateCacheByTags(tags: string[]): Promise<void> {
    for (const [key, cached] of this.cacheStore.entries()) {
      if (cached.tags.some(tag => tags.includes(tag))) {
        this.cacheStore.delete(key);
      }
    }
  }

  async invalidateCacheByKey(key: string): Promise<void> {
    this.cacheStore.delete(key);
  }

  // Generate cache keys for common operations
  generateCacheKey(type: string, identifier: string, params?: any): string {
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

  // Content filtering and security
  async checkContentSecurity(content: string, userId: string): Promise<{
    isAllowed: boolean;
    issues: string[];
    securityScore: number;
  }> {
    const issues: string[] = [];
    let securityScore = 100;
    
    // XSS Detection
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
    
    // SQL Injection Detection
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
    
    // Suspicious URL detection
    const suspiciousUrlPatterns = [
      /https?:\/\/(?:[\w-]+\.)*(?:bit\.ly|tinyurl|t\.co|goo\.gl|short\.link)/gi,
      /https?:\/\/[^\s]+\.(?:tk|ml|ga|cf)/gi, // Suspicious TLDs
    ];
    
    for (const pattern of suspiciousUrlPatterns) {
      if (pattern.test(content)) {
        issues.push('Suspicious URL detected');
        securityScore -= 20;
        break;
      }
    }
    
    // Check for excessive URLs (potential spam)
    const urlCount = (content.match(/https?:\/\/[^\s]+/gi) || []).length;
    if (urlCount > 3) {
      issues.push('Too many URLs detected');
      securityScore -= 15;
    }
    
    // Check for user reputation to adjust security score
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: { reputation: true },
      });
      
      if (user && user.reputation) {
        const userLevel = user.reputation.level || 1;
        if (userLevel >= 10) {
          securityScore += 10; // Trusted users get bonus
        } else if (userLevel < 3) {
          securityScore -= 10; // New users are more restricted
        }
      }
    } catch (error) {
      this.logger.warn('Failed to check user reputation for security scoring', error);
    }
    
    const isAllowed = securityScore >= 60; // 60% threshold
    
    return { isAllowed, issues, securityScore };
  }

  // Performance monitoring
  async logPerformanceMetric(operation: string, duration: number, metadata?: any): Promise<void> {
    if (duration > 1000) { // Log slow operations (>1s)
      this.logger.warn(`Slow operation detected: ${operation} took ${duration}ms`, metadata);
    }
    
    // TODO: Implement performanceLog model in Prisma schema
    // For now, we'll just log to console for analysis
    this.logger.log(`Performance metric: ${operation} - ${duration}ms`, {
      operation,
      duration,
      metadata: metadata || {},
      timestamp: new Date(),
    });
  }

  // Security audit logging
  async logSecurityEvent(eventType: string, userId: string, details: any): Promise<void> {
    // TODO: Implement securityLog model in Prisma schema
    // For now, we'll just log security events to console
    this.logger.warn(`Security event: ${eventType} for user ${userId}`, {
      eventType,
      userId,
      details,
      timestamp: new Date(),
      ipAddress: details.ipAddress || 'unknown',
      userAgent: details.userAgent || 'unknown',
    });
  }

  // Database query optimization helpers
  getOptimizedPagination(page: number, limit: number): { skip: number; take: number } {
    const normalizedPage = Math.max(1, page || 1);
    const normalizedLimit = Math.min(100, Math.max(1, limit || 20)); // Limit between 1-100
    
    return {
      skip: (normalizedPage - 1) * normalizedLimit,
      take: normalizedLimit,
    };
  }

  // Create optimized database queries with proper indexing hints
  generateOptimizedWhereClause(filters: any): any {
    const where: any = {};
    
    // Always include performance-friendly filters first
    if (filters.isDeleted !== undefined) {
      where.isDeleted = filters.isDeleted;
    }
    
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    
    // Add date range filters (indexed)
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }
    
    // Add other filters
    Object.entries(filters).forEach(([key, value]) => {
      if (!['isDeleted', 'isActive', 'dateFrom', 'dateTo', 'search'].includes(key) && value !== undefined) {
        where[key] = value;
      }
    });
    
    // Add search filters last (potentially expensive)
    if (filters.search) {
      const searchTerm = this.validateAndSanitizeSearchInput(filters.search);
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    
    return where;
  }

  private sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '') // Remove angle brackets to prevent basic XSS
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  private generateRateLimitKey(userId: string, action: string): string {
    return `ratelimit:${userId}:${action}`;
  }

  private cleanupRateLimit(): void {
    const now = Date.now();
    for (const [key, data] of this.rateLimitStore.entries()) {
      if (now > data.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, data] of this.cacheStore.entries()) {
      if (now > data.expiry) {
        this.cacheStore.delete(key);
      }
    }
  }

  // Method to create performance-aware database includes
  getOptimizedIncludes(includeBehaviorHeavy = false): any {
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

  // Batch operation helper for better performance
  async processBatch<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize = 50
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }
    
    return results;
  }
}