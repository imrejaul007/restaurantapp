import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from './monitoring.service';

export interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  contentLength?: number;
  errorMessage?: string;
}

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);
  private activeRequests = new Map<string, { startTime: number; request: Request }>();

  constructor(private readonly monitoringService: MonitoringService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    // Store request info
    this.activeRequests.set(requestId, { startTime, request: req });

    // Add request ID to request object for logging
    (req as any).requestId = requestId;

    // Update active connections count
    this.monitoringService.updateActiveConnections(this.activeRequests.size);

    // Log request start
    this.logger.debug(`[${requestId}] ${req.method} ${req.url} - Request started`);

    // Override end method to capture response metrics
    const originalEnd = res.end;
    res.end = (chunk?: any) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Remove from active requests
      this.activeRequests.delete(requestId);

      // Extract route from request (if available)
      const route = this.extractRoute(req);

      // Create performance metrics
      const metrics: PerformanceMetrics = {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime,
        timestamp: new Date(startTime),
        userAgent: req.get('User-Agent'),
        ip: this.getClientIP(req),
        contentLength: res.get('Content-Length') ? parseInt(res.get('Content-Length')!) : undefined,
      };

      // Record metrics in monitoring service
      this.monitoringService.recordHttpRequest(
        req.method,
        route,
        res.statusCode,
        responseTime
      );

      // Log performance metrics
      this.logPerformanceMetrics(metrics);

      // Update active connections count
      this.monitoringService.updateActiveConnections(this.activeRequests.size);

      // Call original end method
      return originalEnd.call(res, chunk);
    };

    // Handle request errors
    res.on('error', (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      this.logger.error(`[${requestId}] Request error after ${responseTime}ms`, error.stack);

      // Clean up
      this.activeRequests.delete(requestId);
      this.monitoringService.updateActiveConnections(this.activeRequests.size);
    });

    // Handle client disconnection
    req.on('close', () => {
      if (this.activeRequests.has(requestId)) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        this.logger.warn(`[${requestId}] Client disconnected after ${responseTime}ms`);

        this.activeRequests.delete(requestId);
        this.monitoringService.updateActiveConnections(this.activeRequests.size);
      }
    });

    next();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractRoute(req: Request): string {
    // Extract route pattern from request
    // This might need adjustment based on your routing setup
    const route = (req as any).route?.path || req.url.split('?')[0];

    // Clean up route to remove dynamic segments for better grouping
    return route
      .replace(/\/\d+/g, '/:id')  // Replace numeric IDs
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')  // Replace UUIDs
      .replace(/\/[a-f0-9]{24}/g, '/:objectId'); // Replace MongoDB ObjectIds
  }

  private getClientIP(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private logPerformanceMetrics(metrics: PerformanceMetrics): void {
    const { requestId, method, url, statusCode, responseTime, ip } = metrics;

    // Determine log level based on response time and status code
    let logLevel: 'debug' | 'log' | 'warn' | 'error' = 'log';

    if (statusCode >= 500) {
      logLevel = 'error';
    } else if (statusCode >= 400) {
      logLevel = 'warn';
    } else if (responseTime > 5000) { // 5 seconds
      logLevel = 'warn';
    } else if (responseTime > 1000) { // 1 second
      logLevel = 'log';
    } else {
      logLevel = 'debug';
    }

    const logMessage = `[${requestId}] ${method} ${url} - ${statusCode} - ${responseTime}ms - ${ip}`;

    this.logger[logLevel](logMessage);

    // Log slow requests separately
    if (responseTime > 1000) {
      this.logger.warn(`Slow request detected: ${logMessage}`);
    }

    // Log error responses with more detail
    if (statusCode >= 400) {
      this.logger.warn(`HTTP Error: ${logMessage}`);
    }
  }

  // Utility method to get current performance statistics
  getActiveRequestsCount(): number {
    return this.activeRequests.size;
  }

  getActiveRequests(): Array<{ requestId: string; method: string; url: string; duration: number }> {
    const now = Date.now();
    return Array.from(this.activeRequests.entries()).map(([requestId, { startTime, request }]) => ({
      requestId,
      method: request.method,
      url: request.url,
      duration: now - startTime,
    }));
  }

  // Get performance summary for the last period
  getPerformanceSummary(): {
    activeRequests: number;
    averageResponseTime: number;
    slowRequests: number;
  } {
    const activeRequests = this.activeRequests.size;

    // These would typically be calculated from stored metrics
    // For now, return basic info
    return {
      activeRequests,
      averageResponseTime: 0, // Would be calculated from historical data
      slowRequests: 0, // Would be calculated from historical data
    };
  }
}