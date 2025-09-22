import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PerformanceService } from './performance.service';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  constructor(private readonly performanceService: PerformanceService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    // Capture request start
    const transaction = this.performanceService.startTransaction(
      `${req.method} ${req.route?.path || req.path}`,
      'http.server'
    );

    // Override end method to capture metrics
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Record HTTP metrics
      performanceService.recordHttpRequest(
        req.method,
        req.route?.path || req.path,
        res.statusCode,
        duration
      );

      // End transaction
      transaction.setHttpStatus(res.statusCode);
      transaction.finish();

      // Call original end method
      originalEnd.call(this, chunk, encoding);
    } as any;

    next();
  }
}

@Injectable()
export class ErrorTrackingMiddleware implements NestMiddleware {
  constructor(private readonly performanceService: PerformanceService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Capture unhandled errors
    const originalSend = res.send;
    res.send = function(data: any) {
      if (res.statusCode >= 400) {
        performanceService.captureError(
          new Error(`HTTP ${res.statusCode}: ${req.method} ${req.path}`),
          'http.error',
          {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
          }
        );
      }

      return originalSend.call(this, data);
    } as any;

    next();
  }
}