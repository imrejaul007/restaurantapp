import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

export interface SecurityEvent {
  type: 'AUTH_FAILURE' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY' | 'UNAUTHORIZED_ACCESS' | 'DATA_BREACH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  ip: string;
  userAgent?: string;
  details: any;
  timestamp: Date;
}

@Injectable()
export class LoggingService implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  // Standard logging methods
  log(message: string, context?: string | LogContext) {
    this.info(message, context);
  }

  error(message: string, trace?: string, context?: string | LogContext) {
    const meta = this.buildMeta(context);
    if (trace) {
      meta.trace = trace;
    }
    this.logger.error(message, meta);
  }

  warn(message: string, context?: string | LogContext) {
    const meta = this.buildMeta(context);
    this.logger.warn(message, meta);
  }

  debug(message: string, context?: string | LogContext) {
    const meta = this.buildMeta(context);
    this.logger.debug(message, meta);
  }

  verbose(message: string, context?: string | LogContext) {
    const meta = this.buildMeta(context);
    this.logger.verbose(message, meta);
  }

  info(message: string, context?: string | LogContext) {
    const meta = this.buildMeta(context);
    this.logger.info(message, meta);
  }

  // HTTP request logging
  logHttpRequest(req: any, res: any, responseTime: number) {
    const context: LogContext = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      requestId: req.id,
      contentLength: res.get('Content-Length'),
      referer: req.get('Referer'),
    };

    const message = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${responseTime}ms`;
    
    this.logger.http(message, context);
  }

  // Security event logging
  logSecurityEvent(event: SecurityEvent) {
    const message = `Security Event: ${event.type} - ${event.severity}`;
    
    this.logger.log({
      level: this.getSecurityLogLevel(event.severity),
      message,
      ...event,
      category: 'security',
    });

    // For critical security events, also log to error level
    if (event.severity === 'CRITICAL') {
      this.error(`CRITICAL SECURITY EVENT: ${event.type}`, JSON.stringify(event.details));
    }
  }

  // Database operation logging
  logDatabaseQuery(query: string, params: any[], executionTime: number, context?: LogContext) {
    const meta = {
      ...this.buildMeta(context),
      query: this.sanitizeQuery(query),
      paramCount: params.length,
      executionTime,
      category: 'database',
    };

    if (executionTime > 1000) {
      this.warn(`Slow database query detected (${executionTime}ms)`, meta);
    } else {
      this.debug(`Database query executed`, meta);
    }
  }

  // Business logic logging
  logBusinessEvent(event: string, data: any, context?: LogContext) {
    const meta = {
      ...this.buildMeta(context),
      eventData: data,
      category: 'business',
    };

    this.info(`Business Event: ${event}`, meta);
  }

  // Payment logging
  logPaymentEvent(event: string, paymentId: string, amount: number, currency: string, context?: LogContext) {
    const meta = {
      ...this.buildMeta(context),
      paymentId,
      amount,
      currency,
      category: 'payment',
    };

    this.info(`Payment Event: ${event}`, meta);
  }

  // Order logging
  logOrderEvent(event: string, orderId: string, customerId: string, restaurantId: string, context?: LogContext) {
    const meta = {
      ...this.buildMeta(context),
      orderId,
      customerId,
      restaurantId,
      category: 'order',
    };

    this.info(`Order Event: ${event}`, meta);
  }

  // File operation logging
  logFileOperation(operation: string, filename: string, size: number, context?: LogContext) {
    const meta = {
      ...this.buildMeta(context),
      operation,
      filename,
      size,
      category: 'file',
    };

    this.info(`File Operation: ${operation}`, meta);
  }

  // Email logging
  logEmailEvent(event: string, recipient: string, template?: string, context?: LogContext) {
    const meta = {
      ...this.buildMeta(context),
      recipient: this.maskEmail(recipient),
      template,
      category: 'email',
    };

    this.info(`Email Event: ${event}`, meta);
  }

  // Performance logging
  logPerformanceMetric(metric: string, value: number, unit: string, context?: LogContext) {
    const meta = {
      ...this.buildMeta(context),
      metric,
      value,
      unit,
      category: 'performance',
    };

    this.info(`Performance Metric: ${metric}`, meta);
  }

  // API rate limiting logging
  logRateLimitEvent(ip: string, endpoint: string, limit: number, current: number, context?: LogContext) {
    const meta = {
      ...this.buildMeta(context),
      ip,
      endpoint,
      limit,
      current,
      category: 'ratelimit',
    };

    if (current >= limit) {
      this.warn(`Rate limit exceeded for ${ip} on ${endpoint}`, meta);
      
      // Log as security event if significantly over limit
      if (current > limit * 2) {
        this.logSecurityEvent({
          type: 'RATE_LIMIT',
          severity: 'MEDIUM',
          ip,
          details: { endpoint, limit, current },
          timestamp: new Date(),
        });
      }
    } else {
      this.debug(`Rate limit check for ${ip} on ${endpoint}`, meta);
    }
  }

  // Utility methods
  private buildMeta(context?: string | LogContext): any {
    if (typeof context === 'string') {
      return { context };
    }
    
    if (typeof context === 'object') {
      return { ...context };
    }
    
    return {};
  }

  private getSecurityLogLevel(severity: SecurityEvent['severity']): string {
    switch (severity) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warn';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
      default:
        return 'debug';
    }
  }

  private sanitizeQuery(query: string): string {
    // Remove or mask sensitive data from queries
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
      .replace(/email\s*=\s*'[^']*'/gi, "email='***@***.***'")
      .replace(/token\s*=\s*'[^']*'/gi, "token='***'");
  }

  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '***';
    }
    
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.length > 2 
      ? `${localPart[0]}***${localPart[localPart.length - 1]}`
      : '***';
    
    return `${maskedLocal}@${domain}`;
  }

  // Query logs
  async queryLogs(filters: {
    level?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    limit?: number;
  }) {
    // This would typically query a log aggregation service like ELK Stack
    // For now, we'll return a placeholder
    return {
      logs: [],
      total: 0,
      filters,
      message: 'Log querying would be implemented with a log aggregation service',
    };
  }

  // Health check for logging system
  async checkHealth(): Promise<{ status: string; details?: any }> {
    try {
      // Test if we can write to the logger
      this.debug('Logging health check', { timestamp: new Date() });
      
      return {
        status: 'healthy',
        details: {
          transports: this.logger.transports?.length || 0,
          level: this.logger.level,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
        },
      };
    }
  }

  // Create structured logs for monitoring systems
  createMetricLog(name: string, value: number, tags: Record<string, string> = {}) {
    this.info('METRIC', {
      metric: {
        name,
        value,
        tags,
        timestamp: Date.now(),
      },
      category: 'metric',
    });
  }

  // Correlation ID support for distributed tracing
  setCorrelationId(correlationId: string) {
    // This would typically be stored in async local storage
    // For now, we'll include it in the default meta
    this.logger.defaultMeta = {
      ...this.logger.defaultMeta,
      correlationId,
    };
  }
}