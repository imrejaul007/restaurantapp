import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { SecurityAuditService } from './security-audit.service';

export interface RateLimitRule {
  path: string;
  method?: string;
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
  handler?: (req: any, res: any) => void;
  onLimitReached?: (req: any, res: any) => void;
  whitelist?: string[];
  blacklist?: string[];
}

export interface RateLimitInfo {
  totalHits: number;
  resetTime: Date;
  remaining: number;
  isBlocked: boolean;
  blockReason?: string;
}

export interface RateLimitConfig {
  global: RateLimitRule;
  auth: RateLimitRule;
  api: RateLimitRule;
  upload: RateLimitRule;
  search: RateLimitRule;
  strictAuth: RateLimitRule[];
  perUser: RateLimitRule[];
  perIP: RateLimitRule[];
}

@Injectable()
export class RateLimitingService {
  private readonly logger = new Logger(RateLimitingService.name);
  private readonly rateLimitCache = new Map<string, { count: number; resetTime: number; blocked?: boolean }>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditService: SecurityAuditService,
  ) {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60 * 1000);
  }

  /**
   * Get comprehensive rate limiting configuration
   */
  getRateLimitConfig(): RateLimitConfig {
    const isDev = this.configService.get('NODE_ENV') === 'development';
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    return {
      global: {
        path: '*',
        maxRequests: isProduction ? 1000 : 5000,
        windowMs: 15 * 60 * 1000, // 15 minutes
        keyGenerator: (req) => this.getClientKey(req),
        onLimitReached: (req, res) => this.handleGlobalRateLimit(req, res),
      },

      auth: {
        path: '/api/v1/auth/*',
        maxRequests: isDev ? 50 : 20,
        windowMs: 15 * 60 * 1000, // 15 minutes
        keyGenerator: (req) => this.getClientKey(req),
        onLimitReached: (req, res) => this.handleAuthRateLimit(req, res),
      },

      api: {
        path: '/api/v1/*',
        maxRequests: isProduction ? 1000 : 2000,
        windowMs: 60 * 60 * 1000, // 1 hour
        skipSuccessfulRequests: false,
        keyGenerator: (req) => this.getClientKey(req),
      },

      upload: {
        path: '/api/v1/upload/*',
        maxRequests: 10,
        windowMs: 60 * 60 * 1000, // 1 hour
        keyGenerator: (req) => this.getClientKey(req),
      },

      search: {
        path: '/api/v1/search/*',
        maxRequests: 100,
        windowMs: 60 * 60 * 1000, // 1 hour
        keyGenerator: (req) => this.getClientKey(req),
      },

      strictAuth: [
        {
          path: '/api/v1/auth/forgot-password',
          maxRequests: 3,
          windowMs: 60 * 60 * 1000, // 1 hour
          keyGenerator: (req) => this.getClientKey(req),
        },
        {
          path: '/api/v1/auth/reset-password',
          maxRequests: 5,
          windowMs: 60 * 60 * 1000, // 1 hour
          keyGenerator: (req) => this.getClientKey(req),
        },
        {
          path: '/api/v1/auth/change-password',
          maxRequests: 5,
          windowMs: 60 * 60 * 1000, // 1 hour
          keyGenerator: (req) => this.getUserKey(req),
        },
        {
          path: '/api/v1/auth/verify-email',
          maxRequests: 5,
          windowMs: 24 * 60 * 60 * 1000, // 24 hours
          keyGenerator: (req) => this.getClientKey(req),
        },
      ],

      perUser: [
        {
          path: '/api/v1/orders',
          method: 'POST',
          maxRequests: 20,
          windowMs: 60 * 60 * 1000, // 1 hour
          keyGenerator: (req) => this.getUserKey(req),
        },
        {
          path: '/api/v1/messages',
          method: 'POST',
          maxRequests: 100,
          windowMs: 60 * 60 * 1000, // 1 hour
          keyGenerator: (req) => this.getUserKey(req),
        },
      ],

      perIP: [
        {
          path: '/api/v1/auth/signup',
          maxRequests: 5,
          windowMs: 24 * 60 * 60 * 1000, // 24 hours
          keyGenerator: (req) => this.getIPKey(req),
        },
        {
          path: '/api/v1/contact',
          method: 'POST',
          maxRequests: 3,
          windowMs: 60 * 60 * 1000, // 1 hour
          keyGenerator: (req) => this.getIPKey(req),
        },
      ],
    };
  }

  /**
   * Check if request should be rate limited
   */
  async checkRateLimit(req: any, rule: RateLimitRule): Promise<RateLimitInfo> {
    const key = rule.keyGenerator ? rule.keyGenerator(req) : this.getClientKey(req);
    const now = Date.now();
    const windowStart = now - rule.windowMs;

    // Check if IP is whitelisted
    if (rule.whitelist && this.isIPWhitelisted(req, rule.whitelist)) {
      return {
        totalHits: 0,
        resetTime: new Date(now + rule.windowMs),
        remaining: rule.maxRequests,
        isBlocked: false,
      };
    }

    // Check if IP is blacklisted
    if (rule.blacklist && this.isIPBlacklisted(req, rule.blacklist)) {
      await this.logRateLimitViolation(req, rule, 'BLACKLISTED');
      return {
        totalHits: rule.maxRequests + 1,
        resetTime: new Date(now + rule.windowMs),
        remaining: 0,
        isBlocked: true,
        blockReason: 'IP blacklisted',
      };
    }

    // Get current count
    let entry = this.rateLimitCache.get(key);

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + rule.windowMs,
        blocked: false,
      };
    }

    // Increment count
    entry.count++;
    this.rateLimitCache.set(key, entry);

    const remaining = Math.max(0, rule.maxRequests - entry.count);
    const isBlocked = entry.count > rule.maxRequests;

    // Log rate limit violation
    if (isBlocked && !entry.blocked) {
      entry.blocked = true;
      this.rateLimitCache.set(key, entry);
      await this.logRateLimitViolation(req, rule, 'RATE_LIMIT_EXCEEDED');
    }

    // Handle rate limit reached
    if (isBlocked && rule.onLimitReached) {
      rule.onLimitReached(req, {});
    }

    return {
      totalHits: entry.count,
      resetTime: new Date(entry.resetTime),
      remaining,
      isBlocked,
      blockReason: isBlocked ? 'Rate limit exceeded' : undefined,
    };
  }

  /**
   * Advanced rate limiting with multiple algorithms
   */
  async checkAdvancedRateLimit(
    req: any,
    algorithm: 'fixed_window' | 'sliding_window' | 'token_bucket' | 'leaky_bucket',
    options: {
      maxRequests: number;
      windowMs: number;
      burst?: number;
      refillRate?: number;
    }
  ): Promise<RateLimitInfo> {
    const key = this.getClientKey(req);

    switch (algorithm) {
      case 'fixed_window':
        return this.fixedWindowRateLimit(key, options);
      case 'sliding_window':
        return this.slidingWindowRateLimit(key, options);
      case 'token_bucket':
        return this.tokenBucketRateLimit(key, options);
      case 'leaky_bucket':
        return this.leakyBucketRateLimit(key, options);
      default:
        throw new Error(`Unsupported rate limiting algorithm: ${algorithm}`);
    }
  }

  /**
   * Adaptive rate limiting based on system load and user behavior
   */
  async checkAdaptiveRateLimit(req: any, baseRule: RateLimitRule): Promise<RateLimitInfo> {
    const key = this.getClientKey(req);
    const userPattern = await this.analyzeUserPattern(key);
    const systemLoad = await this.getSystemLoad();

    // Adjust limits based on user behavior
    let adjustedLimit = baseRule.maxRequests;

    if (userPattern.isTrusted) {
      adjustedLimit *= 1.5; // Increase limit for trusted users
    } else if (userPattern.isSuspicious) {
      adjustedLimit *= 0.5; // Decrease limit for suspicious users
    }

    // Adjust based on system load
    if (systemLoad > 0.8) {
      adjustedLimit *= 0.7; // Reduce limits during high load
    } else if (systemLoad < 0.3) {
      adjustedLimit *= 1.2; // Increase limits during low load
    }

    const adaptedRule = {
      ...baseRule,
      maxRequests: Math.floor(adjustedLimit),
    };

    return this.checkRateLimit(req, adaptedRule);
  }

  /**
   * Geographic rate limiting
   */
  async checkGeographicRateLimit(
    req: any,
    countryLimits: { [country: string]: number },
    defaultLimit: number,
    windowMs: number
  ): Promise<RateLimitInfo> {
    const clientIP = this.getClientIP(req);
    const country = await this.getCountryFromIP(clientIP);
    const maxRequests = countryLimits[country] || defaultLimit;

    const rule: RateLimitRule = {
      path: req.path,
      maxRequests,
      windowMs,
      keyGenerator: (req) => `geo:${country}:${this.getClientKey(req)}`,
    };

    return this.checkRateLimit(req, rule);
  }

  /**
   * DDoS protection with progressive penalties
   */
  async checkDDoSProtection(req: any): Promise<{ blocked: boolean; reason?: string; penalty?: number }> {
    const clientIP = this.getClientIP(req);
    const key = `ddos:${clientIP}`;

    // Check request pattern in last minute
    const recentRequests = await this.getRecentRequestCount(clientIP, 60 * 1000);

    // Progressive thresholds
    const thresholds = [
      { requests: 100, penalty: 5 * 60 * 1000 }, // 100 req/min -> 5 min block
      { requests: 200, penalty: 15 * 60 * 1000 }, // 200 req/min -> 15 min block
      { requests: 500, penalty: 60 * 60 * 1000 }, // 500 req/min -> 1 hour block
      { requests: 1000, penalty: 24 * 60 * 60 * 1000 }, // 1000 req/min -> 24 hour block
    ];

    for (const threshold of thresholds) {
      if (recentRequests >= threshold.requests) {
        await this.blockIP(clientIP, threshold.penalty, 'DDoS_PROTECTION');
        await this.auditService.logSecurityEvent({
          eventType: 'DDOS_ATTACK_DETECTED',
          severity: 'CRITICAL',
          ipAddress: clientIP,
          userAgent: req.get('User-Agent'),
          action: 'DDOS_PROTECTION',
          details: {
            requestCount: recentRequests,
            threshold: threshold.requests,
            penaltyMs: threshold.penalty,
          },
        });

        return {
          blocked: true,
          reason: 'DDoS protection activated',
          penalty: threshold.penalty,
        };
      }
    }

    return { blocked: false };
  }

  /**
   * API quota management for different user tiers
   */
  async checkAPIQuota(req: any, userTier: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE'): Promise<RateLimitInfo> {
    const quotas = {
      FREE: { daily: 1000, hourly: 100 },
      BASIC: { daily: 10000, hourly: 1000 },
      PREMIUM: { daily: 100000, hourly: 10000 },
      ENTERPRISE: { daily: 1000000, hourly: 100000 },
    };

    const quota = quotas[userTier];
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('User ID required for quota check');
    }

    // Check daily quota
    const dailyUsage = await this.getDailyAPIUsage(userId);
    if (dailyUsage >= quota.daily) {
      return {
        totalHits: dailyUsage,
        resetTime: this.getNextMidnight(),
        remaining: 0,
        isBlocked: true,
        blockReason: 'Daily quota exceeded',
      };
    }

    // Check hourly quota
    const hourlyUsage = await this.getHourlyAPIUsage(userId);
    if (hourlyUsage >= quota.hourly) {
      return {
        totalHits: hourlyUsage,
        resetTime: this.getNextHour(),
        remaining: 0,
        isBlocked: true,
        blockReason: 'Hourly quota exceeded',
      };
    }

    return {
      totalHits: hourlyUsage,
      resetTime: this.getNextHour(),
      remaining: quota.hourly - hourlyUsage,
      isBlocked: false,
    };
  }

  // Helper methods

  private getClientKey(req: any): string {
    const ip = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    const userId = req.user?.id;

    if (userId) {
      return `user:${userId}`;
    }

    // Create fingerprint from IP and User-Agent
    const fingerprint = Buffer.from(`${ip}:${userAgent}`).toString('base64').slice(0, 16);
    return `client:${fingerprint}`;
  }

  private getUserKey(req: any): string {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User authentication required');
    }
    return `user:${userId}`;
  }

  private getIPKey(req: any): string {
    return `ip:${this.getClientIP(req)}`;
  }

  private getClientIP(req: any): string {
    return (
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.headers['x-forwarded-for']?.split(',')[0] ||
      'unknown'
    );
  }

  private isIPWhitelisted(req: any, whitelist: string[]): boolean {
    const clientIP = this.getClientIP(req);
    return whitelist.includes(clientIP);
  }

  private isIPBlacklisted(req: any, blacklist: string[]): boolean {
    const clientIP = this.getClientIP(req);
    return blacklist.includes(clientIP);
  }

  private async logRateLimitViolation(req: any, rule: RateLimitRule, reason: string): Promise<void> {
    await this.auditService.logSecurityEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'MEDIUM',
      ipAddress: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      action: 'RATE_LIMITING',
      details: {
        path: req.path,
        method: req.method,
        limit: rule.maxRequests,
        windowMs: rule.windowMs,
        reason,
      },
    });
  }

  private async handleGlobalRateLimit(req: any, res: any): Promise<void> {
    this.logger.warn(`Global rate limit exceeded for ${this.getClientIP(req)}`);
  }

  private async handleAuthRateLimit(req: any, res: any): Promise<void> {
    this.logger.warn(`Auth rate limit exceeded for ${this.getClientIP(req)}`);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.rateLimitCache.entries()) {
      if (entry.resetTime < now) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.rateLimitCache.delete(key);
    }

    if (toDelete.length > 0) {
      this.logger.debug(`Cleaned up ${toDelete.length} expired rate limit entries`);
    }
  }

  // Rate limiting algorithms implementation

  private async fixedWindowRateLimit(key: string, options: any): Promise<RateLimitInfo> {
    // Implementation would use a time-based window
    const now = Date.now();
    const windowStart = Math.floor(now / options.windowMs) * options.windowMs;
    const windowKey = `${key}:${windowStart}`;

    let entry = this.rateLimitCache.get(windowKey);
    if (!entry) {
      entry = { count: 0, resetTime: windowStart + options.windowMs };
    }

    entry.count++;
    this.rateLimitCache.set(windowKey, entry);

    const remaining = Math.max(0, options.maxRequests - entry.count);
    const isBlocked = entry.count > options.maxRequests;

    return {
      totalHits: entry.count,
      resetTime: new Date(entry.resetTime),
      remaining,
      isBlocked,
    };
  }

  private async slidingWindowRateLimit(key: string, options: any): Promise<RateLimitInfo> {
    // Implementation would track requests in a sliding window
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // This would typically use a sorted set in Redis
    // For simplicity, using fixed window here
    return this.fixedWindowRateLimit(key, options);
  }

  private async tokenBucketRateLimit(key: string, options: any): Promise<RateLimitInfo> {
    // Token bucket implementation
    const now = Date.now();
    const bucket = this.rateLimitCache.get(key) || {
      count: options.maxRequests,
      resetTime: now,
    };

    // Refill tokens
    const timePassed = now - bucket.resetTime;
    const refillRate = options.refillRate || 1;
    const tokensToAdd = Math.floor(timePassed / 1000) * refillRate;
    bucket.count = Math.min(options.maxRequests, bucket.count + tokensToAdd);
    bucket.resetTime = now;

    const canProceed = bucket.count > 0;
    if (canProceed) {
      bucket.count--;
    }

    this.rateLimitCache.set(key, bucket);

    return {
      totalHits: options.maxRequests - bucket.count,
      resetTime: new Date(now + options.windowMs),
      remaining: bucket.count,
      isBlocked: !canProceed,
    };
  }

  private async leakyBucketRateLimit(key: string, options: any): Promise<RateLimitInfo> {
    // Leaky bucket implementation
    const now = Date.now();
    const bucket = this.rateLimitCache.get(key) || {
      count: 0,
      resetTime: now,
    };

    // Leak tokens
    const timePassed = now - bucket.resetTime;
    const leakRate = options.refillRate || 1;
    const tokensToLeak = Math.floor(timePassed / 1000) * leakRate;
    bucket.count = Math.max(0, bucket.count - tokensToLeak);
    bucket.resetTime = now;

    const canProceed = bucket.count < options.maxRequests;
    if (canProceed) {
      bucket.count++;
    }

    this.rateLimitCache.set(key, bucket);

    return {
      totalHits: bucket.count,
      resetTime: new Date(now + options.windowMs),
      remaining: options.maxRequests - bucket.count,
      isBlocked: !canProceed,
    };
  }

  // Utility methods for advanced features

  private async analyzeUserPattern(key: string): Promise<{ isTrusted: boolean; isSuspicious: boolean }> {
    // Analyze user behavior patterns
    // This would typically involve machine learning models
    return { isTrusted: false, isSuspicious: false };
  }

  private async getSystemLoad(): Promise<number> {
    // Get current system load (CPU, memory, etc.)
    // This would integrate with monitoring systems
    return 0.5; // Mock value
  }

  private async getCountryFromIP(ip: string): Promise<string> {
    // Get country from IP using GeoIP service
    // This would integrate with services like MaxMind
    return 'US'; // Mock value
  }

  private async getRecentRequestCount(ip: string, windowMs: number): Promise<number> {
    // Count requests from IP in the specified window
    // This would query a time-series database
    return 50; // Mock value
  }

  private async blockIP(ip: string, durationMs: number, reason: string): Promise<void> {
    // Block IP for specified duration
    const key = `blocked:${ip}`;
    const entry = {
      count: 0,
      resetTime: Date.now() + durationMs,
      blocked: true,
    };
    this.rateLimitCache.set(key, entry);

    this.logger.warn(`IP ${ip} blocked for ${durationMs}ms due to ${reason}`);
  }

  private async getDailyAPIUsage(userId: string): Promise<number> {
    // Get daily API usage for user
    // This would query API usage metrics
    return 100; // Mock value
  }

  private async getHourlyAPIUsage(userId: string): Promise<number> {
    // Get hourly API usage for user
    // This would query API usage metrics
    return 10; // Mock value
  }

  private getNextMidnight(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  private getNextHour(): Date {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return nextHour;
  }
}