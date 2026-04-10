import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

export interface PerformanceMetrics {
  timestamp: Date;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
}

export interface ErrorMetrics {
  timestamp: Date;
  error: Error;
  context: string;
  userId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private readonly httpRequests: Counter;
  private readonly httpDuration: Histogram;
  private readonly activeConnections: Gauge;
  private readonly memoryUsage: Gauge;
  private readonly cpuUsage: Gauge;

  constructor(private configService: ConfigService) {
    this.initializeSentry();
    this.initializePrometheus();
  }

  private initializeSentry(): void {
    const sentryDsn = this.configService.get<string>('SENTRY_DSN');

    if (sentryDsn) {
      Sentry.init({
        dsn: sentryDsn,
        environment: this.configService.get<string>('NODE_ENV', 'development'),
        integrations: [
          new ProfilingIntegration(),
        ],
        tracesSampleRate: this.configService.get<number>('SENTRY_TRACES_SAMPLE_RATE', 0.1),
        profilesSampleRate: this.configService.get<number>('SENTRY_PROFILES_SAMPLE_RATE', 0.1),
        beforeSend: (event) => {
          // Filter out sensitive data
          if (event.request?.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
          return event;
        },
      });

      this.logger.log('Sentry APM initialized');
    }
  }

  private initializePrometheus(): void {
    // Clear existing metrics to avoid conflicts
    register.clear();

    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({
      register,
      prefix: 'restopapa_',
    });

    // HTTP request counter
    this.httpRequests = new Counter({
      name: 'restopapa_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [register],
    });

    // HTTP request duration
    this.httpDuration = new Histogram({
      name: 'restopapa_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [register],
    });

    // Active connections
    this.activeConnections = new Gauge({
      name: 'restopapa_active_connections',
      help: 'Number of active connections',
      registers: [register],
    });

    // Memory usage
    this.memoryUsage = new Gauge({
      name: 'restopapa_memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'],
      registers: [register],
    });

    // CPU usage
    this.cpuUsage = new Gauge({
      name: 'restopapa_cpu_usage_percent',
      help: 'CPU usage percentage',
      registers: [register],
    });

    this.logger.log('Prometheus metrics initialized');
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ): void {
    this.httpRequests.inc({
      method: method.toUpperCase(),
      route,
      status_code: statusCode.toString(),
    });

    this.httpDuration.observe(
      {
        method: method.toUpperCase(),
        route,
        status_code: statusCode.toString(),
      },
      duration / 1000, // Convert to seconds
    );
  }

  updateActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  recordMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    this.memoryUsage.set({ type: 'rss' }, memUsage.rss);
    this.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
    this.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
    this.memoryUsage.set({ type: 'external' }, memUsage.external);
  }

  recordCpuUsage(): void {
    const startUsage = process.cpuUsage();

    setImmediate(() => {
      const cpuUsage = process.cpuUsage(startUsage);
      const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000) * 100;
      this.cpuUsage.set(cpuPercent);
    });
  }

  captureError(error: Error, context: string, metadata?: Record<string, any>): void {
    this.logger.error(`Error in ${context}: ${error.message}`, error.stack);

    Sentry.withScope((scope) => {
      scope.setTag('context', context);
      scope.setLevel('error');

      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      Sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    this.logger.log(message);
    Sentry.captureMessage(message, level);
  }

  startTransaction(name: string, operation: string) {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }

  getMetrics(): string {
    return register.metrics();
  }

  async getHealthMetrics(): Promise<{
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    timestamp: Date;
  }> {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date(),
    };
  }

  async getPerformanceReport(): Promise<{
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  }> {
    // This would typically query a time-series database
    // For now, returning mock data structure
    return {
      requestsPerMinute: 0, // Would be calculated from metrics
      averageResponseTime: 0, // Would be calculated from histogram
      errorRate: 0, // Would be calculated from error metrics
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  startPerformanceMonitoring(): void {
    // Record system metrics every 30 seconds
    setInterval(() => {
      this.recordMemoryUsage();
      this.recordCpuUsage();
    }, 30000);

    this.logger.log('Performance monitoring started');
  }
}