import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { performance, PerformanceObserver } from 'perf_hooks';
import * as process from 'process';

export interface PerformanceMetrics {
  timestamp: number;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  eventLoopDelay: number;
  eventLoopUtilization: number;
  gcStats?: {
    majorGCCount: number;
    minorGCCount: number;
    totalGCTime: number;
  };
  httpMetrics: {
    activeConnections: number;
    totalRequests: number;
    totalResponses: number;
    averageResponseTime: number;
  };
  customMetrics: Map<string, number>;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private performanceObserver: PerformanceObserver;
  private metricsInterval: NodeJS.Timeout;
  private httpMetrics = {
    activeConnections: 0,
    totalRequests: 0,
    totalResponses: 0,
    responseTimes: [] as number[],
  };
  private customMetrics = new Map<string, number>();
  private gcStats = {
    majorGCCount: 0,
    minorGCCount: 0,
    totalGCTime: 0,
  };

  constructor(private configService: ConfigService) {}

  /**
   * Initialize comprehensive performance monitoring
   */
  startPerformanceMonitoring(): void {
    this.logger.log('🚀 Starting performance monitoring system...');

    // Initialize Performance Observer for detailed metrics
    this.initializePerformanceObserver();

    // Setup GC monitoring
    this.setupGCMonitoring();

    // Start periodic metrics collection
    this.startMetricsCollection();

    // Setup process event listeners
    this.setupProcessEventListeners();

    this.logger.log('✅ Performance monitoring system initialized successfully');
  }

  /**
   * Initialize Performance Observer for timing metrics
   */
  private initializePerformanceObserver(): void {
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        switch (entry.entryType) {
          case 'measure':
            this.recordCustomMetric(`measure_${entry.name}`, entry.duration);
            break;
          case 'navigation':
            // Browser navigation metrics (for server-side rendering)
            this.recordCustomMetric('navigation_duration', entry.duration);
            break;
          case 'resource':
            // Resource loading metrics
            this.recordCustomMetric(`resource_${entry.name}_duration`, entry.duration);
            break;
        }
      });
    });

    // Observe all supported entry types
    this.performanceObserver.observe({
      entryTypes: ['measure', 'navigation', 'resource', 'mark']
    });
  }

  /**
   * Setup Garbage Collection monitoring
   */
  private setupGCMonitoring(): void {
    if (process.env.NODE_ENV === 'production' && (global as any).gc) {
      const originalGC = (global as any).gc;

      (global as any).gc = () => {
        const startTime = performance.now();
        const result = originalGC();
        const endTime = performance.now();

        this.gcStats.totalGCTime += endTime - startTime;
        this.gcStats.majorGCCount++;

        return result;
      };
    }
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    const collectionInterval = this.configService.get<number>('METRICS_COLLECTION_INTERVAL', 30000);

    this.metricsInterval = setInterval(() => {
      this.collectAndLogMetrics();
    }, collectionInterval);
  }

  /**
   * Setup process event listeners for monitoring
   */
  private setupProcessEventListeners(): void {
    // Monitor uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.recordCustomMetric('uncaught_exceptions_total', 1);
      this.logger.error('Uncaught exception recorded in performance metrics', error);
    });

    // Monitor unhandled rejections
    process.on('unhandledRejection', (reason) => {
      this.recordCustomMetric('unhandled_rejections_total', 1);
      this.logger.error('Unhandled rejection recorded in performance metrics', reason);
    });

    // Monitor warning events
    process.on('warning', (warning) => {
      this.recordCustomMetric('process_warnings_total', 1);
      this.logger.warn('Process warning recorded in performance metrics', warning);
    });
  }

  /**
   * Collect comprehensive performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    const eventLoopUtilization = performance.eventLoopUtilization();

    return {
      timestamp: Date.now(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      eventLoopDelay: await this.measureEventLoopDelay(),
      eventLoopUtilization: eventLoopUtilization.utilization,
      gcStats: { ...this.gcStats },
      httpMetrics: {
        activeConnections: this.httpMetrics.activeConnections,
        totalRequests: this.httpMetrics.totalRequests,
        totalResponses: this.httpMetrics.totalResponses,
        averageResponseTime: this.calculateAverageResponseTime(),
      },
      customMetrics: new Map(this.customMetrics),
    };
  }

  /**
   * Measure event loop delay
   */
  private measureEventLoopDelay(): Promise<number> {
    return new Promise((resolve) => {
      const start = performance.now();
      setImmediate(() => {
        const delay = performance.now() - start;
        resolve(delay);
      });
    });
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(): number {
    if (this.httpMetrics.responseTimes.length === 0) return 0;

    const sum = this.httpMetrics.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.httpMetrics.responseTimes.length;
  }

  /**
   * Record HTTP request start
   */
  recordRequestStart(requestId: string): void {
    this.httpMetrics.activeConnections++;
    this.httpMetrics.totalRequests++;
    this.recordCustomMetric('http_requests_total', 1);

    performance.mark(`request_start_${requestId}`);
  }

  /**
   * Record HTTP request end
   */
  recordRequestEnd(requestId: string, statusCode: number): void {
    this.httpMetrics.activeConnections--;
    this.httpMetrics.totalResponses++;

    performance.mark(`request_end_${requestId}`);
    performance.measure(`request_duration_${requestId}`, `request_start_${requestId}`, `request_end_${requestId}`);

    const measure = performance.getEntriesByName(`request_duration_${requestId}`)[0];
    if (measure) {
      this.httpMetrics.responseTimes.push(measure.duration);

      // Keep only last 1000 response times to prevent memory leak
      if (this.httpMetrics.responseTimes.length > 1000) {
        this.httpMetrics.responseTimes = this.httpMetrics.responseTimes.slice(-1000);
      }
    }

    // Record status code metrics
    this.recordCustomMetric(`http_responses_${Math.floor(statusCode / 100)}xx_total`, 1);

    // Clean up performance entries
    performance.clearMarks(`request_start_${requestId}`);
    performance.clearMarks(`request_end_${requestId}`);
    performance.clearMeasures(`request_duration_${requestId}`);
  }

  /**
   * Record custom metric
   */
  recordCustomMetric(name: string, value: number): void {
    const currentValue = this.customMetrics.get(name) || 0;
    this.customMetrics.set(name, currentValue + value);
  }

  /**
   * Set custom metric (absolute value)
   */
  setCustomMetric(name: string, value: number): void {
    this.customMetrics.set(name, value);
  }

  /**
   * Get custom metric value
   */
  getCustomMetric(name: string): number {
    return this.customMetrics.get(name) || 0;
  }

  /**
   * Record database operation metrics
   */
  recordDatabaseOperation(operation: string, duration: number, success: boolean): void {
    this.recordCustomMetric(`db_operations_${operation}_total`, 1);
    this.recordCustomMetric(`db_operations_${operation}_duration_ms`, duration);

    if (success) {
      this.recordCustomMetric(`db_operations_${operation}_success_total`, 1);
    } else {
      this.recordCustomMetric(`db_operations_${operation}_error_total`, 1);
    }
  }

  /**
   * Record cache operation metrics
   */
  recordCacheOperation(operation: string, hit: boolean): void {
    this.recordCustomMetric(`cache_operations_${operation}_total`, 1);

    if (hit) {
      this.recordCustomMetric(`cache_hits_total`, 1);
    } else {
      this.recordCustomMetric(`cache_misses_total`, 1);
    }
  }

  /**
   * Record business operation metrics
   */
  recordBusinessOperation(operation: string, value?: number): void {
    this.recordCustomMetric(`business_operations_${operation}_total`, 1);

    if (value !== undefined) {
      this.recordCustomMetric(`business_operations_${operation}_value`, value);
    }
  }

  /**
   * Collect and log current metrics
   */
  private async collectAndLogMetrics(): void {
    try {
      const metrics = await this.collectMetrics();

      // Log important metrics
      this.logger.debug('Performance Metrics', {
        timestamp: metrics.timestamp,
        uptime: `${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m`,
        memoryUsage: {
          heapUsed: `${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(metrics.memoryUsage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(metrics.memoryUsage.external / 1024 / 1024)}MB`,
          rss: `${Math.round(metrics.memoryUsage.rss / 1024 / 1024)}MB`,
        },
        eventLoopDelay: `${metrics.eventLoopDelay.toFixed(2)}ms`,
        eventLoopUtilization: `${(metrics.eventLoopUtilization * 100).toFixed(2)}%`,
        httpMetrics: metrics.httpMetrics,
        customMetricsCount: metrics.customMetrics.size,
      });

      // Alert on concerning metrics
      this.checkPerformanceAlerts(metrics);

    } catch (error) {
      this.logger.error('Error collecting performance metrics', error);
    }
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(metrics: PerformanceMetrics): void {
    // Memory usage alerts
    const heapUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    if (heapUsagePercent > 85) {
      this.logger.warn(`High memory usage: ${heapUsagePercent.toFixed(2)}%`);
    }

    // Event loop delay alerts
    if (metrics.eventLoopDelay > 10) {
      this.logger.warn(`High event loop delay: ${metrics.eventLoopDelay.toFixed(2)}ms`);
    }

    // Event loop utilization alerts
    if (metrics.eventLoopUtilization > 0.9) {
      this.logger.warn(`High event loop utilization: ${(metrics.eventLoopUtilization * 100).toFixed(2)}%`);
    }

    // Response time alerts
    if (metrics.httpMetrics.averageResponseTime > 1000) {
      this.logger.warn(`High average response time: ${metrics.httpMetrics.averageResponseTime.toFixed(2)}ms`);
    }
  }

  /**
   * Gracefully shutdown monitoring
   */
  stopPerformanceMonitoring(): void {
    this.logger.log('🛑 Stopping performance monitoring system...');

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    this.logger.log('✅ Performance monitoring system stopped');
  }

  /**
   * Get current health status
   */
  async getHealthStatus(): Promise<{ status: string; metrics: any }> {
    const metrics = await this.collectMetrics();

    let status = 'healthy';
    const issues: string[] = [];

    // Check various health indicators
    const heapUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    if (heapUsagePercent > 90) {
      status = 'critical';
      issues.push(`Critical memory usage: ${heapUsagePercent.toFixed(2)}%`);
    } else if (heapUsagePercent > 80) {
      status = 'warning';
      issues.push(`High memory usage: ${heapUsagePercent.toFixed(2)}%`);
    }

    if (metrics.eventLoopDelay > 50) {
      status = 'critical';
      issues.push(`Critical event loop delay: ${metrics.eventLoopDelay.toFixed(2)}ms`);
    } else if (metrics.eventLoopDelay > 20) {
      status = status === 'healthy' ? 'warning' : status;
      issues.push(`High event loop delay: ${metrics.eventLoopDelay.toFixed(2)}ms`);
    }

    if (metrics.httpMetrics.averageResponseTime > 2000) {
      status = 'critical';
      issues.push(`Critical response time: ${metrics.httpMetrics.averageResponseTime.toFixed(2)}ms`);
    } else if (metrics.httpMetrics.averageResponseTime > 1000) {
      status = status === 'healthy' ? 'warning' : status;
      issues.push(`High response time: ${metrics.httpMetrics.averageResponseTime.toFixed(2)}ms`);
    }

    return {
      status,
      metrics: {
        uptime: metrics.uptime,
        memoryUsage: metrics.memoryUsage,
        eventLoopDelay: metrics.eventLoopDelay,
        eventLoopUtilization: metrics.eventLoopUtilization,
        httpMetrics: metrics.httpMetrics,
        issues,
      },
    };
  }
}