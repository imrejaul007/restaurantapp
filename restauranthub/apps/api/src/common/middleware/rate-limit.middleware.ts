import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  constructor(private config: RateLimitConfig) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const key = this.getKey(req);
    const now = Date.now();

    // Clean up expired entries
    this.cleanup(now);

    const current = this.requestCounts.get(key);

    if (!current || now > current.resetTime) {
      // New window
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      next();
      return;
    }

    if (current.count >= this.config.maxRequests) {
      // Rate limit exceeded
      throw new HttpException(
        this.config.message || 'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Increment count
    current.count++;
    next();
  }

  private getKey(req: Request): string {
    // Use IP + User-Agent for better uniqueness
    return `${req.ip}-${req.headers['user-agent'] || 'unknown'}`;
  }

  private cleanup(now: number): void {
    for (const [key, data] of this.requestCounts.entries()) {
      if (now > data.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }
}

// Factory functions for different rate limits
export function createAuthRateLimit(): RateLimitMiddleware {
  return new RateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per IP per 15 minutes
    message: 'Too many authentication attempts. Please try again later.'
  });
}

export function createApiRateLimit(): RateLimitMiddleware {
  return new RateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // 1000 requests per IP per 15 minutes
    message: 'Too many API requests. Please try again later.'
  });
}