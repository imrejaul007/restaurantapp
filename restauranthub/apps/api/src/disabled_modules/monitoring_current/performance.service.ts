import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PerformanceReport {
  timeRange: {
    start: Date;
    end: Date;
  };
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  endpoints: Array<{
    path: string;
    method: string;
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
  errors: Array<{
    timestamp: Date;
    method: string;
    path: string;
    statusCode: number;
    message: string;
  }>;
}

export interface PerformanceMetric {
  timestamp: Date;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
  errorMessage?: string;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private performanceData: PerformanceMetric[] = [];
  private readonly maxDataPoints = 10000; // Keep last 10k requests in memory

  constructor(private readonly configService: ConfigService) {}

  recordPerformanceMetric(metric: PerformanceMetric): void {
    this.performanceData.push(metric);

    // Keep only recent data to prevent memory issues
    if (this.performanceData.length > this.maxDataPoints) {
      this.performanceData = this.performanceData.slice(-this.maxDataPoints);
    }

    // Log slow requests
    if (metric.responseTime > 5000) { // 5 seconds
      this.logger.warn(
        `Slow request detected: ${metric.method} ${metric.path} - ${metric.responseTime}ms`
      );
    }

    // Log error responses
    if (metric.statusCode >= 400) {
      this.logger.warn(
        `Error response: ${metric.method} ${metric.path} - ${metric.statusCode} - ${metric.responseTime}ms`
      );
    }
  }

  async generateReport(
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<PerformanceReport> {
    try {
      // Filter data by date range
      const filteredData = this.performanceData.filter(
        metric => metric.timestamp >= startDate && metric.timestamp <= endDate
      );

      if (filteredData.length === 0) {
        return this.getEmptyReport(startDate, endDate);
      }

      // Calculate summary metrics
      const totalRequests = filteredData.length;
      const responseTimes = filteredData.map(m => m.responseTime).sort((a, b) => a - b);
      const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / totalRequests;
      const errorCount = filteredData.filter(m => m.statusCode >= 400).length;
      const errorRate = (errorCount / totalRequests) * 100;

      // Calculate percentiles
      const p95Index = Math.floor(totalRequests * 0.95);
      const p99Index = Math.floor(totalRequests * 0.99);
      const p95ResponseTime = responseTimes[p95Index] || 0;
      const p99ResponseTime = responseTimes[p99Index] || 0;

      // Group by endpoint
      const endpointGroups = this.groupByEndpoint(filteredData);
      const endpoints = Array.from(endpointGroups.entries()).map(([key, metrics]) => {
        const [method, path] = key.split(' ');
        const requestCount = metrics.length;
        const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / requestCount;
        const errorCount = metrics.filter(m => m.statusCode >= 400).length;
        const endpointErrorRate = (errorCount / requestCount) * 100;

        return {
          path,
          method,
          requestCount,
          averageResponseTime: Math.round(avgResponseTime),
          errorRate: Math.round(endpointErrorRate * 100) / 100,
        };
      }).sort((a, b) => b.requestCount - a.requestCount).slice(0, limit);

      // Get recent errors
      const errors = filteredData
        .filter(m => m.statusCode >= 400)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)
        .map(m => ({
          timestamp: m.timestamp,
          method: m.method,
          path: m.path,
          statusCode: m.statusCode,
          message: m.errorMessage || `HTTP ${m.statusCode}`,
        }));

      const report: PerformanceReport = {
        timeRange: { start: startDate, end: endDate },
        summary: {
          totalRequests,
          averageResponseTime: Math.round(averageResponseTime),
          errorRate: Math.round(errorRate * 100) / 100,
          p95ResponseTime: Math.round(p95ResponseTime),
          p99ResponseTime: Math.round(p99ResponseTime),
        },
        endpoints,
        errors,
      };

      this.logger.debug(`Generated performance report: ${totalRequests} requests analyzed`);
      return report;

    } catch (error) {
      this.logger.error('Failed to generate performance report', error.stack);
      throw error;
    }
  }

  getPerformanceMetrics(
    startDate: Date,
    endDate: Date,
    filters?: {
      method?: string;
      statusCode?: number;
      minResponseTime?: number;
      maxResponseTime?: number;
    }
  ): PerformanceMetric[] {
    let filteredData = this.performanceData.filter(
      metric => metric.timestamp >= startDate && metric.timestamp <= endDate
    );

    if (filters) {
      if (filters.method) {
        filteredData = filteredData.filter(m => m.method === filters.method);
      }
      if (filters.statusCode) {
        filteredData = filteredData.filter(m => m.statusCode === filters.statusCode);
      }
      if (filters.minResponseTime) {
        filteredData = filteredData.filter(m => m.responseTime >= filters.minResponseTime!);
      }
      if (filters.maxResponseTime) {
        filteredData = filteredData.filter(m => m.responseTime <= filters.maxResponseTime!);
      }
    }

    return filteredData;
  }

  getSlowRequests(threshold: number = 1000, limit: number = 50): PerformanceMetric[] {
    return this.performanceData
      .filter(metric => metric.responseTime > threshold)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, limit);
  }

  getErrorRequests(limit: number = 50): PerformanceMetric[] {
    return this.performanceData
      .filter(metric => metric.statusCode >= 400)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getRequestsByStatusCode(): Record<number, number> {
    const statusCounts: Record<number, number> = {};

    this.performanceData.forEach(metric => {
      statusCounts[metric.statusCode] = (statusCounts[metric.statusCode] || 0) + 1;
    });

    return statusCounts;
  }

  getRequestsByMethod(): Record<string, number> {
    const methodCounts: Record<string, number> = {};

    this.performanceData.forEach(metric => {
      methodCounts[metric.method] = (methodCounts[metric.method] || 0) + 1;
    });

    return methodCounts;
  }

  getTrendData(
    intervalMinutes: number = 5
  ): Array<{
    timestamp: Date;
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
  }> {
    const now = new Date();
    const intervals: Map<string, PerformanceMetric[]> = new Map();

    // Group metrics by time intervals
    this.performanceData.forEach(metric => {
      const intervalStart = new Date(
        Math.floor(metric.timestamp.getTime() / (intervalMinutes * 60 * 1000)) *
        (intervalMinutes * 60 * 1000)
      );
      const key = intervalStart.toISOString();

      if (!intervals.has(key)) {
        intervals.set(key, []);
      }
      intervals.get(key)!.push(metric);
    });

    // Calculate metrics for each interval
    return Array.from(intervals.entries())
      .map(([timestampStr, metrics]) => {
        const requestCount = metrics.length;
        const averageResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / requestCount;
        const errorCount = metrics.filter(m => m.statusCode >= 400).length;
        const errorRate = (errorCount / requestCount) * 100;

        return {
          timestamp: new Date(timestampStr),
          requestCount,
          averageResponseTime: Math.round(averageResponseTime),
          errorRate: Math.round(errorRate * 100) / 100,
        };
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  clearOldData(olderThanHours: number = 24): void {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const originalLength = this.performanceData.length;

    this.performanceData = this.performanceData.filter(
      metric => metric.timestamp > cutoffDate
    );

    const removedCount = originalLength - this.performanceData.length;
    if (removedCount > 0) {
      this.logger.log(`Cleaned up ${removedCount} old performance metrics`);
    }
  }

  private groupByEndpoint(metrics: PerformanceMetric[]): Map<string, PerformanceMetric[]> {
    const groups = new Map<string, PerformanceMetric[]>();

    metrics.forEach(metric => {
      // Clean up path to group similar requests
      const cleanPath = this.cleanPath(metric.path);
      const key = `${metric.method} ${cleanPath}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(metric);
    });

    return groups;
  }

  private cleanPath(path: string): string {
    // Remove query parameters
    const pathOnly = path.split('?')[0];

    // Replace dynamic segments with placeholders
    return pathOnly
      .replace(/\/\d+/g, '/:id')  // Replace numeric IDs
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')  // Replace UUIDs
      .replace(/\/[a-f0-9]{24}/g, '/:objectId'); // Replace MongoDB ObjectIds
  }

  private getEmptyReport(startDate: Date, endDate: Date): PerformanceReport {
    return {
      timeRange: { start: startDate, end: endDate },
      summary: {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      },
      endpoints: [],
      errors: [],
    };
  }
}