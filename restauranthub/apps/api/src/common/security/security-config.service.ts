import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Security Configuration Service
 *
 * Centralized security configuration and validation
 * Ensures all security settings meet production standards
 */
@Injectable()
export class SecurityConfigService {
  private readonly logger = new Logger(SecurityConfigService.name);

  constructor(private configService: ConfigService) {
    this.validateSecurityConfiguration();
  }

  /**
   * Validate security configuration on startup
   */
  private validateSecurityConfiguration(): void {
    const errors: string[] = [];

    // JWT Secret validation
    const jwtSecret = this.configService.get('JWT_SECRET');
    if (!jwtSecret || jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }

    const jwtRefreshSecret = this.configService.get('JWT_REFRESH_SECRET');
    if (!jwtRefreshSecret || jwtRefreshSecret.length < 32) {
      errors.push('JWT_REFRESH_SECRET must be at least 32 characters long');
    }

    // Session secret validation
    const sessionSecret = this.configService.get('SESSION_SECRET');
    if (!sessionSecret || sessionSecret.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters long');
    }

    // Rate limiting validation
    const rateLimitMax = this.configService.get('RATE_LIMIT_MAX_REQUESTS', 100);
    if (process.env.NODE_ENV === 'production' && rateLimitMax > 200) {
      errors.push('RATE_LIMIT_MAX_REQUESTS should be 200 or less in production');
    }

    const authRateLimitMax = this.configService.get('AUTH_RATE_LIMIT_MAX_REQUESTS', 5);
    if (process.env.NODE_ENV === 'production' && authRateLimitMax > 10) {
      errors.push('AUTH_RATE_LIMIT_MAX_REQUESTS should be 10 or less in production');
    }

    // Environment validation
    if (process.env.NODE_ENV === 'production') {
      // Check for development-only settings in production
      const demoPasswordsEnabled = this.configService.get('DEMO_ADMIN_PASSWORD');
      if (demoPasswordsEnabled) {
        errors.push('Demo passwords should not be enabled in production');
      }

      // Check HTTPS enforcement
      const enableHSTS = this.configService.get('ENABLE_HSTS', 'false');
      if (enableHSTS !== 'true') {
        errors.push('HSTS should be enabled in production');
      }
    }

    // Log validation results
    if (errors.length > 0) {
      this.logger.error('SECURITY CONFIGURATION ERRORS:');
      errors.forEach(error => this.logger.error(`- ${error}`));

      if (process.env.NODE_ENV === 'production') {
        throw new Error('Security configuration validation failed. Cannot start in production with invalid security settings.');
      } else {
        this.logger.warn('Security configuration has issues. Please fix before deploying to production.');
      }
    } else {
      this.logger.log('Security configuration validation passed');
    }
  }

  /**
   * Get security headers configuration
   */
  getSecurityHeaders() {
    return {
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          scriptSrc: ["'self'"],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'https://res.cloudinary.com'],
          connectSrc: ["'self'", 'https://api.stripe.com', 'https://api.razorpay.com'],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined,
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
    };
  }

  /**
   * Get CORS configuration
   */
  getCorsConfiguration() {
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? (this.configService.get('ALLOWED_ORIGINS', '').split(',').filter(Boolean))
      : [
          this.configService.get('FRONTEND_URL'),
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3003',
          'http://localhost:3004',
        ].filter(Boolean);

    return {
      origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (mobile apps, curl requests, etc.)
        if (!origin) return callback(null, true);

        if (process.env.NODE_ENV === 'production') {
          // Strict CORS in production
          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            this.logger.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
          }
        } else {
          // Development - allow all localhost origins
          if (allowedOrigins.includes(origin) || origin?.includes('localhost')) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-CSRF-Token',
        'X-API-Key',
      ],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    };
  }

  /**
   * Get rate limiting configuration
   */
  getRateLimitConfig() {
    return {
      windowMs: this.configService.get('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
      max: this.configService.get('RATE_LIMIT_MAX_REQUESTS', process.env.NODE_ENV === 'production' ? 100 : 1000),
      authWindowMs: this.configService.get('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
      authMax: this.configService.get('AUTH_RATE_LIMIT_MAX_REQUESTS', process.env.NODE_ENV === 'development' ? 20 : 5),
    };
  }

  /**
   * Check if security feature is enabled
   */
  isSecurityFeatureEnabled(feature: string): boolean {
    const enabled = this.configService.get(`ENABLE_${feature.toUpperCase()}`, 'false');
    return enabled === 'true' || process.env.NODE_ENV === 'production';
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: string, details: any): void {
    this.logger.warn(`SECURITY EVENT: ${event}`, details);
  }
}