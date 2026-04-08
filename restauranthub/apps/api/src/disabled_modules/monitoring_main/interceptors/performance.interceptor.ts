import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { PerformanceService } from '../performance.service';
import { PrometheusService } from '../prometheus.service';
import { TracingService } from '../tracing.service';
import { BusinessMetricsService } from '../business-metrics.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  constructor(
    private performanceService: PerformanceService,
    private prometheusService: PrometheusService,
    private tracingService: TracingService,
    private businessMetricsService: BusinessMetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request: Request & { requestId?: string; startTime?: number } = httpContext.getRequest();
    const response: Response = httpContext.getResponse();

    // Generate unique request ID
    const requestId = uuidv4();
    request.requestId = requestId;
    request.startTime = Date.now();

    // Extract request information
    const method = request.method;
    const url = request.url;
    const route = this.getRoutePattern(context);
    const userAgent = request.headers['user-agent'] || '';
    const userRole = this.extractUserRole(request);
    const userId = this.extractUserId(request);

    // Add request ID to response headers for tracking
    response.setHeader('X-Request-ID', requestId);

    // Record request start
    this.performanceService.recordRequestStart(requestId);
    this.prometheusService.incrementHttpRequestsInFlight();

    // Start distributed tracing
    return this.tracingService.traceHttpRequest(
      method,
      url,
      (span) => {
        // Add request attributes to span
        span.setAttributes({
          'http.request_id': requestId,
          'http.user_agent': userAgent,
          'http.route': route,
          'user.id': userId || '',
          'user.role': userRole || 'anonymous',
        });

        // Add timing event
        span.addEvent('request.started', {
          'request.timestamp': request.startTime!,
        });

        return next.handle().pipe(
          tap((responseData) => {
            // Record successful response
            this.recordSuccessfulResponse(
              requestId,
              method,
              route,
              response.statusCode,
              userRole,
              request.startTime!,
              responseData,
            );

            // Add success event to span
            span.addEvent('request.completed', {
              'response.status_code': response.statusCode,
              'response.size': JSON.stringify(responseData).length,
            });

            // Record business metrics based on endpoint
            this.recordBusinessMetrics(method, route, response.statusCode, userId, userRole);
          }),
          catchError((error) => {
            // Record error response
            this.recordErrorResponse(
              requestId,
              method,
              route,
              error,
              userRole,
              request.startTime!,
            );

            // Add error event to span
            span.addEvent('request.error', {
              'error.name': error.name,
              'error.message': error.message,
            });

            // Record exception in span
            span.recordException(error);

            throw error;
          }),
        );
      },
      userId,
      userRole,
    );
  }

  /**
   * Record successful HTTP response metrics
   */
  private recordSuccessfulResponse(
    requestId: string,
    method: string,
    route: string,
    statusCode: number,
    userRole: string | undefined,
    startTime: number,
    responseData: any,
  ): void {
    const duration = Date.now() - startTime;

    // Record in performance service
    this.performanceService.recordRequestEnd(requestId, statusCode);

    // Record in Prometheus
    this.prometheusService.recordHttpRequest(
      method,
      route,
      statusCode,
      duration,
      userRole,
    );
    this.prometheusService.decrementHttpRequestsInFlight();

    // Log performance metrics for slow requests
    if (duration > 1000) {
      this.logger.warn(`Slow request detected`, {
        requestId,
        method,
        route,
        duration: `${duration}ms`,
        statusCode,
        userRole,
        responseSize: JSON.stringify(responseData).length,
      });
    }

    // Record custom metrics for specific thresholds
    if (duration > 5000) {
      this.performanceService.recordCustomMetric('slow_requests_5s_total', 1);
    } else if (duration > 2000) {
      this.performanceService.recordCustomMetric('slow_requests_2s_total', 1);
    }
  }

  /**
   * Record error HTTP response metrics
   */
  private recordErrorResponse(
    requestId: string,
    method: string,
    route: string,
    error: any,
    userRole: string | undefined,
    startTime: number,
  ): void {
    const duration = Date.now() - startTime;
    const statusCode = error.status || error.statusCode || 500;

    // Record in performance service
    this.performanceService.recordRequestEnd(requestId, statusCode);

    // Record in Prometheus
    this.prometheusService.recordHttpRequest(
      method,
      route,
      statusCode,
      duration,
      userRole,
    );
    this.prometheusService.decrementHttpRequestsInFlight();

    // Record error metrics
    this.prometheusService.recordError(
      error.name || 'UnknownError',
      this.getErrorSeverity(statusCode),
      route,
    );

    // Log error with context
    this.logger.error(`Request error`, {
      requestId,
      method,
      route,
      duration: `${duration}ms`,
      statusCode,
      userRole,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500), // Limit stack trace length
      },
    });
  }

  /**
   * Record business metrics based on endpoint patterns
   */
  private recordBusinessMetrics(
    method: string,
    route: string,
    statusCode: number,
    userId?: string,
    userRole?: string,
  ): void {
    if (statusCode >= 400) return; // Don't record business metrics for errors

    try {
      // User registration and authentication
      if (route.includes('/auth/register') && method === 'POST') {
        this.businessMetricsService.recordUserRegistration(
          userRole || 'customer',
          'web_app',
        );
      }

      if (route.includes('/auth/login') && method === 'POST') {
        this.businessMetricsService.recordUserLogin(
          userRole || 'customer',
          'password',
        );
      }

      // Job management
      if (route.includes('/jobs') && method === 'POST') {
        this.businessMetricsService.recordJobPosting(
          'general', // Would extract from request body
          'small', // Would extract from request body
        );
      }

      if (route.includes('/jobs/') && route.includes('/apply') && method === 'POST') {
        this.businessMetricsService.recordJobApplication(
          'general',
          'submitted',
        );
      }

      // Order management
      if (route.includes('/orders') && method === 'POST') {
        this.businessMetricsService.recordOrderCreation(
          'food_order',
          userRole || 'customer',
        );
      }

      // Payment transactions
      if (route.includes('/payments') && method === 'POST') {
        this.businessMetricsService.recordPaymentTransaction(
          'card', // Would extract from request body
          'success',
          'USD', // Would extract from request body
        );
      }

      // Restaurant registration
      if (route.includes('/restaurants') && method === 'POST') {
        this.businessMetricsService.recordRestaurantRegistration(
          'quick_service',
          'basic',
        );
      }

      // Vendor registration
      if (route.includes('/vendors') && method === 'POST') {
        this.businessMetricsService.recordVendorRegistration(
          'food_supplier',
          'pending',
        );
      }
    } catch (error) {
      this.logger.error('Error recording business metrics', {
        route,
        method,
        error: error.message,
      });
    }
  }

  /**
   * Extract route pattern from execution context
   */
  private getRoutePattern(context: ExecutionContext): string {
    const handler = context.getHandler();
    const controller = context.getClass();

    // Get route from metadata if available
    const controllerPath = Reflect.getMetadata('path', controller) || '';
    const handlerPath = Reflect.getMetadata('path', handler) || '';

    return `${controllerPath}${handlerPath}`.replace(/\/+/g, '/') || '/unknown';
  }

  /**
   * Extract user role from request
   */
  private extractUserRole(request: Request): string | undefined {
    // Extract from JWT token or request context
    const user = (request as any).user;
    return user?.role || user?.userType;
  }

  /**
   * Extract user ID from request
   */
  private extractUserId(request: Request): string | undefined {
    // Extract from JWT token or request context
    const user = (request as any).user;
    return user?.id || user?.userId;
  }

  /**
   * Determine error severity based on status code
   */
  private getErrorSeverity(statusCode: number): string {
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'warning';
    return 'info';
  }
}