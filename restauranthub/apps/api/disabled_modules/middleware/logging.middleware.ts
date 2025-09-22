import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../common/logger.service';
import * as uuid from 'uuid';

export interface RequestWithLogging extends Request {
  id: string;
  startTime: number;
  logger: LoggerService;
}

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: RequestWithLogging, res: Response, next: NextFunction) {
    // Generate unique request ID
    req.id = req.headers['x-request-id'] as string || uuid.v4();
    req.startTime = Date.now();

    // Create logger with request context
    req.logger = this.logger.withRequestId(req.id);

    // Add request ID to response headers
    res.set('X-Request-ID', req.id);

    // Log incoming request
    this.logger.logApiRequest(req, { statusCode: 'PENDING' } as any, 0, {
      requestId: req.id,
      operation: 'REQUEST_START',
      metadata: {
        headers: this.sanitizeHeaders(req.headers),
        query: req.query,
        params: req.params,
        body: this.sanitizeBody(req.body),
      },
    });

    // Capture response finish event
    const originalSend = res.send;
    res.send = function (body) {
      const responseTime = Date.now() - req.startTime;

      // Log response
      req.logger.logApiRequest(req, res, responseTime, {
        requestId: req.id,
        operation: 'REQUEST_COMPLETE',
        metadata: {
          responseSize: Buffer.isBuffer(body) ? body.length : JSON.stringify(body).length,
        },
      });

      // Log slow requests
      if (responseTime > 5000) {
        req.logger.logPerformanceMetric('SLOW_REQUEST', responseTime, {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
        }, {
          requestId: req.id,
          operation: 'PERFORMANCE_WARNING',
        });
      }

      // Log errors
      if (res.statusCode >= 400) {
        const logLevel = res.statusCode >= 500 ? 'error' : 'warn';
        const errorMessage = `${req.method} ${req.url} - ${res.statusCode}`;

        if (logLevel === 'error') {
          req.logger.error(errorMessage, undefined, {
            requestId: req.id,
            operation: 'REQUEST_ERROR',
            metadata: {
              statusCode: res.statusCode,
              method: req.method,
              url: req.url,
              responseTime,
              responseBody: typeof body === 'string' ? body : JSON.stringify(body),
            },
          });
        } else {
          req.logger.warn(errorMessage, {
            requestId: req.id,
            operation: 'REQUEST_WARNING',
            metadata: {
              statusCode: res.statusCode,
              method: req.method,
              url: req.url,
              responseTime,
            },
          });
        }
      }

      return originalSend.call(this, body);
    };

    // Capture response errors
    res.on('error', (error) => {
      req.logger.error('Response Error', error.stack, {
        requestId: req.id,
        operation: 'RESPONSE_ERROR',
        metadata: {
          error: error.message,
          method: req.method,
          url: req.url,
        },
      });
    });

    next();
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];

    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      if (obj && typeof obj === 'object') {
        const result = {};
        Object.keys(obj).forEach(key => {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            result[key] = '[REDACTED]';
          } else {
            result[key] = sanitizeObject(obj[key]);
          }
        });
        return result;
      }

      return obj;
    };

    return sanitizeObject(sanitized);
  }
}