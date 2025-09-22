import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggingService } from './logging.service';
import * as crypto from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    // Generate request ID for correlation
    const requestId = crypto.randomUUID();
    (request as any).id = requestId;
    
    // Set correlation ID for distributed tracing
    this.loggingService.setCorrelationId(requestId);

    const { method, originalUrl, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = (request as any).user?.id;

    // Log incoming request
    this.loggingService.debug('Incoming Request', {
      requestId,
      method,
      url: originalUrl,
      ip,
      userAgent,
      userId,
      headers: this.sanitizeHeaders(headers),
    });

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - now;
        
        // Log successful response
        this.loggingService.logHttpRequest(request, response, responseTime);

        // Log slow requests
        if (responseTime > 2000) {
          this.loggingService.warn('Slow request detected', {
            requestId,
            method,
            url: originalUrl,
            responseTime,
            userId,
          });
        }

        // Log business events based on endpoint
        this.logBusinessEvents(request, response, data);
      }),
      catchError((error) => {
        const responseTime = Date.now() - now;
        
        // Log error response
        this.loggingService.error(
          `Request failed: ${method} ${originalUrl}`,
          (error as Error).stack,
          {
            requestId,
            method,
            url: originalUrl,
            statusCode: (error as any).status || 500,
            responseTime,
            ip,
            userAgent,
            userId,
            errorName: (error as Error).name,
            errorMessage: (error as Error).message,
          },
        );

        // Log security events for specific errors
        this.logSecurityEvents(request, error);

        throw error;
      }),
    );
  }

  private sanitizeHeaders(headers: any): any {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '***';
      }
    });
    
    return sanitized;
  }

  private logBusinessEvents(request: Request, response: Response, data: any) {
    const { method, originalUrl, user } = request as any;
    const userId = user?.id;

    // Order events
    if (originalUrl.includes('/orders')) {
      if (method === 'POST' && response.statusCode === 201) {
        this.loggingService.logOrderEvent(
          'ORDER_CREATED',
          data?.id,
          data?.customerId || userId,
          data?.restaurantId,
          { userId, orderId: data?.id }
        );
      } else if (method === 'PATCH' && originalUrl.includes('/status')) {
        this.loggingService.logOrderEvent(
          'ORDER_STATUS_UPDATED',
          data?.id,
          data?.customerId,
          data?.restaurantId,
          { userId, orderId: data?.id, newStatus: data?.status }
        );
      }
    }

    // Payment events
    if (originalUrl.includes('/payments')) {
      if (method === 'POST' && response.statusCode === 201) {
        this.loggingService.logPaymentEvent(
          'PAYMENT_INITIATED',
          data?.id,
          data?.amount,
          data?.currency,
          { userId, paymentMethod: data?.paymentMethod }
        );
      }
    }

    // Authentication events
    if (originalUrl.includes('/auth')) {
      if (originalUrl.includes('/signin') && method === 'POST') {
        if (response.statusCode === 200) {
          this.loggingService.logBusinessEvent('USER_SIGNED_IN', {
            userId: data?.user?.id,
            userRole: data?.user?.role,
          });
        }
      } else if (originalUrl.includes('/signup') && method === 'POST') {
        if (response.statusCode === 201) {
          this.loggingService.logBusinessEvent('USER_REGISTERED', {
            userId: data?.user?.id,
            userRole: data?.user?.role,
            userEmail: data?.user?.email,
          });
        }
      } else if (originalUrl.includes('/logout') && method === 'POST') {
        if (response.statusCode === 200) {
          this.loggingService.logBusinessEvent('USER_LOGGED_OUT', {
            userId,
          });
        }
      }
    }

    // File upload events
    if (originalUrl.includes('/files') && method === 'POST') {
      if (response.statusCode === 201) {
        this.loggingService.logFileOperation(
          'FILE_UPLOADED',
          data?.filename || 'unknown',
          data?.size || 0,
          { userId }
        );
      }
    }

    // Restaurant management events
    if (originalUrl.includes('/restaurants')) {
      if (originalUrl.includes('/menu') && method === 'POST') {
        if (response.statusCode === 201) {
          this.loggingService.logBusinessEvent('MENU_ITEM_ADDED', {
            menuItemId: data?.id,
            restaurantId: data?.restaurantId,
            itemName: data?.name,
          }, { userId });
        }
      } else if (originalUrl.includes('/reviews') && method === 'POST') {
        if (response.statusCode === 201) {
          this.loggingService.logBusinessEvent('REVIEW_SUBMITTED', {
            reviewId: data?.id,
            restaurantId: data?.restaurantId,
            rating: data?.rating,
          }, { userId });
        }
      }
    }
  }

  private logSecurityEvents(request: Request, error: any) {
    const ip = request.ip || request.connection?.remoteAddress || '';
    const userAgent = request.get('User-Agent') || '';
    const url = request.originalUrl || request.url;

    // Unauthorized access attempts
    if ((error as any).status === 401) {
      this.loggingService.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        ip,
        userAgent,
        details: {
          endpoint: url,
          method: request.method,
          errorMessage: (error as Error).message,
        },
        timestamp: new Date(),
      });
    }

    // Forbidden access attempts
    if ((error as any).status === 403) {
      this.loggingService.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'HIGH',
        userId: (request as any).user?.id,
        ip,
        userAgent,
        details: {
          endpoint: url,
          method: request.method,
          userRole: (request as any).user?.role,
          errorMessage: (error as Error).message,
        },
        timestamp: new Date(),
      });
    }

    // Rate limiting
    if ((error as any).status === 429) {
      this.loggingService.logSecurityEvent({
        type: 'RATE_LIMIT',
        severity: 'MEDIUM',
        ip,
        userAgent,
        details: {
          endpoint: url,
          method: request.method,
          errorMessage: (error as Error).message,
        },
        timestamp: new Date(),
      });
    }

    // Suspicious activity (multiple error types from same IP)
    if ((error as any).status >= 400 && (error as any).status < 500) {
      // This would typically increment a counter per IP and trigger alerts
      // For now, we'll just log the suspicious activity
      this.loggingService.debug('Potential suspicious activity', {
        ip,
        userAgent,
        endpoint: url,
        errorStatus: (error as any).status,
        errorMessage: (error as Error).message,
      });
    }
  }
}