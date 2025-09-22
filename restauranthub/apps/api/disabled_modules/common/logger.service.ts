import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

export interface LogContext {
  requestId?: string;
  userId?: string;
  service?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly winston: winston.Logger;
  private readonly serviceName = 'restauranthub-api';

  constructor() {
    const transports: winston.transport[] = [
      // Console transport for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} [${level}] ${message} ${metaStr}`;
          }),
        ),
      }),

      // File transport
      new winston.transports.File({
        filename: 'logs/api/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),

      new winston.transports.File({
        filename: 'logs/api/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ];

    // Add Elasticsearch transport if configured
    if (process.env.ELASTICSEARCH_URL) {
      transports.push(
        new ElasticsearchTransport({
          clientOpts: {
            node: process.env.ELASTICSEARCH_URL,
          },
          index: `restauranthub-application-${new Date().toISOString().slice(0, 10)}`,
          level: 'info',
          transformer: (logData) => {
            return {
              '@timestamp': new Date().toISOString(),
              service: this.serviceName,
              environment: process.env.NODE_ENV || 'development',
              level: logData.level,
              message: logData.message,
              logtype: 'application',
              ...logData.meta,
            };
          },
        }),
      );
    }

    this.winston = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: this.serviceName,
        environment: process.env.NODE_ENV || 'development',
      },
      transports,
    });
  }

  log(message: string, context?: LogContext) {
    this.winston.info(message, {
      context: context?.operation || 'App',
      logtype: 'application',
      ...context,
    });
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.winston.error(message, {
      trace,
      context: context?.operation || 'App',
      logtype: 'error',
      ...context,
    });
  }

  warn(message: string, context?: LogContext) {
    this.winston.warn(message, {
      context: context?.operation || 'App',
      logtype: 'application',
      ...context,
    });
  }

  debug(message: string, context?: LogContext) {
    this.winston.debug(message, {
      context: context?.operation || 'App',
      logtype: 'debug',
      ...context,
    });
  }

  verbose(message: string, context?: LogContext) {
    this.winston.verbose(message, {
      context: context?.operation || 'App',
      logtype: 'verbose',
      ...context,
    });
  }

  // Custom logging methods for specific use cases

  logApiRequest(req: any, res: any, responseTime: number, context?: LogContext) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      requestId: req.id,
      userId: req.user?.id,
      logtype: 'access',
      ...context,
    };

    if (res.statusCode >= 400) {
      this.winston.error('API Request Error', logData);
    } else {
      this.winston.info('API Request', logData);
    }
  }

  logDatabaseQuery(query: string, duration: number, context?: LogContext) {
    const logData = {
      query: query.substring(0, 1000), // Truncate long queries
      duration,
      logtype: 'database',
      ...context,
    };

    if (duration > 5000) {
      this.winston.warn('Slow Database Query', {
        ...logData,
        slow_query: true,
      });
    } else {
      this.winston.debug('Database Query', logData);
    }
  }

  logSecurityEvent(event: string, details: any, context?: LogContext) {
    this.winston.warn('Security Event', {
      securityEvent: event,
      details,
      logtype: 'security',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logPerformanceMetric(operation: string, duration: number, metadata?: any, context?: LogContext) {
    const logData = {
      operation,
      duration,
      metadata,
      logtype: 'performance',
      ...context,
    };

    if (duration > 10000) {
      this.winston.warn('Performance Issue', {
        ...logData,
        performance_issue: true,
      });
    } else {
      this.winston.info('Performance Metric', logData);
    }
  }

  logBusinessEvent(event: string, data: any, context?: LogContext) {
    this.winston.info('Business Event', {
      businessEvent: event,
      data,
      logtype: 'business',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logAuthEvent(event: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'REGISTER', userId?: string, details?: any, context?: LogContext) {
    const logData = {
      authEvent: event,
      userId,
      details,
      logtype: 'security',
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (event === 'LOGIN_FAILED') {
      this.winston.warn('Authentication Failed', logData);
    } else {
      this.winston.info('Authentication Event', logData);
    }
  }

  logJobEvent(event: string, jobId: string, details: any, context?: LogContext) {
    this.winston.info('Job Event', {
      jobEvent: event,
      jobId,
      details,
      logtype: 'business',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logRestaurantEvent(event: string, restaurantId: string, details: any, context?: LogContext) {
    this.winston.info('Restaurant Event', {
      restaurantEvent: event,
      restaurantId,
      details,
      logtype: 'business',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logOrderEvent(event: string, orderId: string, details: any, context?: LogContext) {
    this.winston.info('Order Event', {
      orderEvent: event,
      orderId,
      details,
      logtype: 'business',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logPaymentEvent(event: string, paymentId: string, amount: number, details: any, context?: LogContext) {
    this.winston.info('Payment Event', {
      paymentEvent: event,
      paymentId,
      amount,
      details,
      logtype: 'business',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  // Structured logging for errors with categorization
  logApplicationError(error: Error, category: string, context?: LogContext) {
    this.winston.error('Application Error', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorCategory: category,
      logtype: 'error',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  // Method to flush logs (useful for testing)
  async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.winston.on('finish', resolve);
      this.winston.end();
    });
  }

  // Method to add correlation ID for request tracing
  withRequestId(requestId: string): LoggerService {
    const logger = Object.create(this);
    logger.defaultContext = { requestId };
    return logger;
  }

  // Method to add user context
  withUser(userId: string): LoggerService {
    const logger = Object.create(this);
    logger.defaultContext = { ...this.defaultContext, userId };
    return logger;
  }

  private defaultContext: LogContext = {};

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context };
  }
}