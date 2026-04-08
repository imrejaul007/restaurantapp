import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MonitoringService } from './monitoring.service';
import { PerformanceService } from './performance.service';

export interface MetricPoint {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

export interface TimeSeries {
  name: string;
  points: MetricPoint[];
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
}

export interface MetricsExport {
  timestamp: Date;
  timeRange: {
    start: Date;
    end: Date;
  };
  format: 'json' | 'csv';
  data: {
    system: TimeSeries[];
    database: TimeSeries[];
    application: TimeSeries[];
    business: TimeSeries[];
    performance: TimeSeries[];
  };
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private metricsHistory: Map<string, MetricPoint[]> = new Map();
  private readonly maxHistoryPoints = 10000; // Keep last 10k points per metric

  constructor(
    private readonly configService: ConfigService,
    private readonly monitoringService: MonitoringService,
    private readonly performanceService: PerformanceService,
  ) {}

  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const point: MetricPoint = {
      timestamp: new Date(),
      value,
      labels,
    };

    if (!this.metricsHistory.has(name)) {
      this.metricsHistory.set(name, []);
    }

    const history = this.metricsHistory.get(name)!;
    history.push(point);

    // Keep only recent points to prevent memory issues
    if (history.length > this.maxHistoryPoints) {
      history.splice(0, history.length - this.maxHistoryPoints);
    }
  }

  getMetricHistory(
    name: string,
    startDate?: Date,
    endDate?: Date,
    aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count'
  ): TimeSeries {
    const history = this.metricsHistory.get(name) || [];
    let filteredPoints = history;

    if (startDate || endDate) {
      filteredPoints = history.filter(point => {
        if (startDate && point.timestamp < startDate) return false;
        if (endDate && point.timestamp > endDate) return false;
        return true;
      });
    }

    return {
      name,
      points: filteredPoints,
      aggregation,
    };
  }

  getAggregatedMetric(
    name: string,
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count',
    startDate?: Date,
    endDate?: Date
  ): number {
    const timeSeries = this.getMetricHistory(name, startDate, endDate);
    const values = timeSeries.points.map(p => p.value);

    if (values.length === 0) return 0;

    switch (aggregation) {
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        return 0;
    }
  }

  async exportMetrics(
    format: 'json' | 'csv',
    startDate: Date,
    endDate: Date
  ): Promise<MetricsExport> {
    try {
      const [systemMetrics, databaseMetrics, applicationMetrics, businessMetrics] = await Promise.all([
        this.monitoringService.getSystemMetrics(),
        this.monitoringService.getDatabaseMetrics(),
        this.monitoringService.getApplicationMetrics(),
        this.monitoringService.getBusinessMetrics(),
      ]);

      const performanceReport = await this.performanceService.generateReport(startDate, endDate);

      const export_data: MetricsExport = {
        timestamp: new Date(),
        timeRange: { start: startDate, end: endDate },
        format,
        data: {
          system: this.buildSystemTimeSeries(systemMetrics, startDate, endDate),
          database: this.buildDatabaseTimeSeries(databaseMetrics, startDate, endDate),
          application: this.buildApplicationTimeSeries(applicationMetrics, startDate, endDate),
          business: this.buildBusinessTimeSeries(businessMetrics, startDate, endDate),
          performance: this.buildPerformanceTimeSeries(performanceReport),
        },
      };

      this.logger.log(`Exported metrics in ${format} format for ${startDate} to ${endDate}`);
      return export_data;

    } catch (error) {
      this.logger.error('Failed to export metrics', error.stack);
      throw error;
    }
  }

  async generateCSV(metricsExport: MetricsExport): Promise<string> {
    const csvLines: string[] = [];

    // Headers
    csvLines.push('timestamp,metric_name,metric_value,labels');

    // Add all time series data
    Object.entries(metricsExport.data).forEach(([category, timeSeries]) => {
      timeSeries.forEach(series => {
        series.points.forEach(point => {
          const labels = point.labels ? JSON.stringify(point.labels) : '';
          csvLines.push(`${point.timestamp.toISOString()},${category}.${series.name},${point.value},"${labels}"`);
        });
      });
    });

    return csvLines.join('\n');
  }

  getMetricNames(): string[] {
    return Array.from(this.metricsHistory.keys()).sort();
  }

  getMetricsSummary(): {
    totalMetrics: number;
    totalDataPoints: number;
    oldestPoint: Date | null;
    newestPoint: Date | null;
  } {
    const allPoints: MetricPoint[] = [];
    Array.from(this.metricsHistory.values()).forEach(points => {
      allPoints.push(...points);
    });

    const timestamps = allPoints.map(p => p.timestamp).sort((a, b) => a.getTime() - b.getTime());

    return {
      totalMetrics: this.metricsHistory.size,
      totalDataPoints: allPoints.length,
      oldestPoint: timestamps.length > 0 ? timestamps[0] : null,
      newestPoint: timestamps.length > 0 ? timestamps[timestamps.length - 1] : null,
    };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async collectSystemMetrics() {
    try {
      const metrics = await this.monitoringService.getSystemMetrics();

      this.recordMetric('system.cpu.usage', metrics.cpu.usage);
      this.recordMetric('system.memory.usage', metrics.memory.usage);
      this.recordMetric('system.memory.total', metrics.memory.total);
      this.recordMetric('system.memory.used', metrics.memory.used);
      this.recordMetric('system.memory.free', metrics.memory.free);
      this.recordMetric('system.disk.usage', metrics.disk.usage);
      this.recordMetric('system.process.uptime', metrics.process.uptime);
      this.recordMetric('system.process.memory.rss', metrics.process.memoryUsage.rss);
      this.recordMetric('system.process.memory.heapUsed', metrics.process.memoryUsage.heapUsed);
      this.recordMetric('system.process.memory.heapTotal', metrics.process.memoryUsage.heapTotal);

    } catch (error) {
      this.logger.error('Failed to collect system metrics for storage', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async collectDatabaseMetrics() {
    try {
      const metrics = await this.monitoringService.getDatabaseMetrics();

      this.recordMetric('database.connections.active', metrics.connections.active);
      this.recordMetric('database.connections.idle', metrics.connections.idle);
      this.recordMetric('database.connections.total', metrics.connections.total);
      this.recordMetric('database.queries.total', metrics.queries.total);
      this.recordMetric('database.queries.slow', metrics.queries.slow);
      this.recordMetric('database.queries.averageResponseTime', metrics.queries.averageResponseTime);

    } catch (error) {
      this.logger.error('Failed to collect database metrics for storage', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async collectBusinessMetrics() {
    try {
      const metrics = await this.monitoringService.getBusinessMetrics();

      this.recordMetric('business.users.total', metrics.users.total);
      this.recordMetric('business.users.active', metrics.users.active);
      this.recordMetric('business.users.activeDaily', metrics.users.activeDaily);
      this.recordMetric('business.users.activeWeekly', metrics.users.activeWeekly);
      this.recordMetric('business.users.activeMonthly', metrics.users.activeMonthly);
      this.recordMetric('business.restaurants.total', metrics.restaurants.total);
      this.recordMetric('business.restaurants.active', metrics.restaurants.active);
      this.recordMetric('business.restaurants.verified', metrics.restaurants.verified);
      this.recordMetric('business.jobs.total', metrics.jobs.total);
      this.recordMetric('business.jobs.active', metrics.jobs.active);
      this.recordMetric('business.jobs.applications', metrics.jobs.applications);

    } catch (error) {
      this.logger.error('Failed to collect business metrics for storage', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldMetrics() {
    try {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      let removedCount = 0;

      this.metricsHistory.forEach((points, metricName) => {
        const originalLength = points.length;
        const filtered = points.filter(point => point.timestamp > cutoffDate);
        this.metricsHistory.set(metricName, filtered);
        removedCount += originalLength - filtered.length;
      });

      if (removedCount > 0) {
        this.logger.log(`Cleaned up ${removedCount} old metric points`);
      }

    } catch (error) {
      this.logger.error('Failed to cleanup old metrics', error.stack);
    }
  }

  private buildSystemTimeSeries(metrics: any, startDate: Date, endDate: Date): TimeSeries[] {
    return [
      {
        name: 'cpu_usage',
        points: [{ timestamp: new Date(metrics.timestamp), value: metrics.cpu.usage }],
      },
      {
        name: 'memory_usage',
        points: [{ timestamp: new Date(metrics.timestamp), value: metrics.memory.usage }],
      },
      {
        name: 'disk_usage',
        points: [{ timestamp: new Date(metrics.timestamp), value: metrics.disk.usage }],
      },
    ];
  }

  private buildDatabaseTimeSeries(metrics: any, startDate: Date, endDate: Date): TimeSeries[] {
    return [
      {
        name: 'active_connections',
        points: [{ timestamp: new Date(metrics.timestamp), value: metrics.connections.active }],
      },
      {
        name: 'average_response_time',
        points: [{ timestamp: new Date(metrics.timestamp), value: metrics.queries.averageResponseTime }],
      },
      {
        name: 'slow_queries',
        points: [{ timestamp: new Date(metrics.timestamp), value: metrics.queries.slow }],
      },
    ];
  }

  private buildApplicationTimeSeries(metrics: any, startDate: Date, endDate: Date): TimeSeries[] {
    return [
      {
        name: 'total_requests',
        points: [{ timestamp: new Date(metrics.timestamp), value: metrics.http.totalRequests }],
      },
      {
        name: 'error_rate',
        points: [{ timestamp: new Date(metrics.timestamp), value: metrics.http.errorRate }],
      },
      {
        name: 'average_response_time',
        points: [{ timestamp: new Date(metrics.timestamp), value: metrics.http.averageResponseTime }],
      },
    ];
  }

  private buildBusinessTimeSeries(metrics: any, startDate: Date, endDate: Date): TimeSeries[] {
    return [
      {
        name: 'total_users',
        points: [{ timestamp: new Date(metrics.timestamp), value: metrics.users.total }],
      },
      {
        name: 'active_users',
        points: [{ timestamp: new Date(metrics.timestamp), value: metrics.users.active }],
      },
      {
        name: 'total_restaurants',
        points: [{ timestamp: new Date(metrics.timestamp), value: metrics.restaurants.total }],
      },
      {
        name: 'total_jobs',
        points: [{ timestamp: new Date(metrics.timestamp), value: metrics.jobs.total }],
      },
    ];
  }

  private buildPerformanceTimeSeries(report: any): TimeSeries[] {
    return [
      {
        name: 'total_requests',
        points: [{ timestamp: new Date(), value: report.summary.totalRequests }],
      },
      {
        name: 'average_response_time',
        points: [{ timestamp: new Date(), value: report.summary.averageResponseTime }],
      },
      {
        name: 'error_rate',
        points: [{ timestamp: new Date(), value: report.summary.errorRate }],
      },
      {
        name: 'p95_response_time',
        points: [{ timestamp: new Date(), value: report.summary.p95ResponseTime }],
      },
      {
        name: 'p99_response_time',
        points: [{ timestamp: new Date(), value: report.summary.p99ResponseTime }],
      },
    ];
  }
}