import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectMetric } from '@digikare/nestjs-prom';
import { Counter, Gauge, Histogram, Summary } from 'prom-client';
import * as os from 'os';
import * as process from 'process';
import { PrismaService } from '../prisma/prisma.service';

export interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
    heap: NodeJS.MemoryUsage;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    connections: number;
    activeHandles: number;
    activeRequests: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    version: string;
  };
}

export interface DatabaseMetrics {
  timestamp: string;
  connections: {
    active: number;
    idle: number;
    waiting: number;
    total: number;
  };
  queries: {
    total: number;
    slow: number;
    failed: number;
    averageResponseTime: number;
  };
  performance: {
    throughput: number;
    latency: {
      p50: number;
      p95: number;
      p99: number;
    };
  };
  storage: {
    size: string;
    tables: number;
    indexes: number;
  };
}

export interface ApplicationMetrics {
  timestamp: string;
  http: {
    totalRequests: number;
    activeRequests: number;
    errorRate: number;
    averageResponseTime: number;
    requestsPerSecond: number;
    statusCodes: Record<string, number>;
  };
  websocket: {
    activeConnections: number;
    totalMessages: number;
    messageRate: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictions: number;
    memory: number;
    operations: number;
  };
  queue: {
    jobs: {
      active: number;
      waiting: number;
      completed: number;
      failed: number;
    };
  };
}

export interface BusinessMetrics {
  timestamp: string;
  users: {
    total: number;
    active: number;
    newRegistrations: number;
    activeDaily: number;
    activeWeekly: number;
    activeMonthly: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    revenue: number;
    averageOrderValue: number;
    ordersPerHour: number;
  };
  restaurants: {
    total: number;
    active: number;
    verified: number;
    newRegistrations: number;
  };
  jobs: {
    total: number;
    active: number;
    applications: number;
    filled: number;
  };
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
    @InjectMetric('active_connections')
    private readonly activeConnections: Gauge<string>,
    @InjectMetric('database_query_duration_seconds')
    private readonly databaseQueryDuration: Histogram<string>,
    @InjectMetric('system_cpu_usage')
    private readonly systemCpuUsage: Gauge<string>,
    @InjectMetric('system_memory_usage')
    private readonly systemMemoryUsage: Gauge<string>,
    @InjectMetric('business_metrics')
    private readonly businessMetricsGauge: Gauge<string>,
  ) {}

  // Core Metrics Collection
  async getSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date().toISOString();

    try {
      // CPU metrics
      const cpuUsage = await this.getCpuUsage();
      const loadAverage = os.loadavg();
      const cores = os.cpus().length;

      // Memory metrics
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsage = (usedMemory / totalMemory) * 100;
      const heapUsage = process.memoryUsage();

      // Disk metrics
      const diskInfo = await this.getDiskInfo();

      // Network metrics
      const networkInfo = await this.getNetworkInfo();

      // Process metrics
      const processInfo = {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        version: process.version,
      };

      const metrics: SystemMetrics = {
        timestamp,
        cpu: {
          usage: cpuUsage,
          loadAverage,
          cores,
        },
        memory: {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
          usage: memoryUsage,
          heap: heapUsage,
        },
        disk: diskInfo,
        network: networkInfo,
        process: processInfo,
      };

      // Update Prometheus metrics
      this.systemCpuUsage.set({ instance: 'api' }, cpuUsage);
      this.systemMemoryUsage.set({ instance: 'api' }, memoryUsage);

      this.logger.debug('System metrics collected successfully');
      return metrics;
    } catch (error) {
      this.logger.error('Failed to collect system metrics', error.stack);
      throw error;
    }
  }

  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    const timestamp = new Date().toISOString();

    try {
      // Database connection stats
      const connectionStats = await this.prisma.$queryRaw`
        SELECT
          count(*) as total_connections,
          sum(case when state = 'active' then 1 else 0 end) as active_connections,
          sum(case when state = 'idle' then 1 else 0 end) as idle_connections,
          sum(case when state = 'idle in transaction' then 1 else 0 end) as waiting_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      ` as any[];

      // Query performance stats
      const queryStats = await this.prisma.$queryRaw`
        SELECT
          sum(calls) as total_queries,
          sum(case when mean_exec_time > 1000 then calls else 0 end) as slow_queries,
          avg(mean_exec_time) as average_response_time,
          sum(calls) / extract(epoch from (now() - stats_reset)) as throughput
        FROM pg_stat_statements
        WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
      ` as any[];

      // Database size and structure
      const sizeStats = await this.prisma.$queryRaw`
        SELECT
          pg_size_pretty(pg_database_size(current_database())) as size,
          count(*) as table_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      ` as any[];

      // Index count
      const indexStats = await this.prisma.$queryRaw`
        SELECT count(*) as index_count
        FROM pg_indexes
        WHERE schemaname = 'public'
      ` as any[];

      const connectionData = connectionStats[0] || {};
      const queryData = queryStats[0] || {};
      const sizeData = sizeStats[0] || {};
      const indexData = indexStats[0] || {};

      const metrics: DatabaseMetrics = {
        timestamp,
        connections: {
          active: parseInt(connectionData.active_connections || '0'),
          idle: parseInt(connectionData.idle_connections || '0'),
          waiting: parseInt(connectionData.waiting_connections || '0'),
          total: parseInt(connectionData.total_connections || '0'),
        },
        queries: {
          total: parseInt(queryData.total_queries || '0'),
          slow: parseInt(queryData.slow_queries || '0'),
          failed: 0, // Would need additional tracking
          averageResponseTime: parseFloat(queryData.average_response_time || '0'),
        },
        performance: {
          throughput: parseFloat(queryData.throughput || '0'),
          latency: {
            p50: 0, // Would need histogram data
            p95: 0,
            p99: 0,
          },
        },
        storage: {
          size: sizeData.size || '0 bytes',
          tables: parseInt(sizeData.table_count || '0'),
          indexes: parseInt(indexData.index_count || '0'),
        },
      };

      this.logger.debug('Database metrics collected successfully');
      return metrics;
    } catch (error) {
      this.logger.error('Failed to collect database metrics', error.stack);
      throw error;
    }
  }

  async getApplicationMetrics(): Promise<ApplicationMetrics> {
    const timestamp = new Date().toISOString();

    try {
      // Get HTTP metrics from Prometheus (would be populated by middleware)
      const httpMetrics = {
        totalRequests: 0,
        activeRequests: 0,
        errorRate: 0,
        averageResponseTime: 0,
        requestsPerSecond: 0,
        statusCodes: {},
      };

      const metrics: ApplicationMetrics = {
        timestamp,
        http: httpMetrics,
        websocket: {
          activeConnections: 0,
          totalMessages: 0,
          messageRate: 0,
        },
        cache: {
          hitRate: 0,
          missRate: 0,
          evictions: 0,
          memory: 0,
          operations: 0,
        },
        queue: {
          jobs: {
            active: 0,
            waiting: 0,
            completed: 0,
            failed: 0,
          },
        },
      };

      this.logger.debug('Application metrics collected successfully');
      return metrics;
    } catch (error) {
      this.logger.error('Failed to collect application metrics', error.stack);
      throw error;
    }
  }

  async getBusinessMetrics(): Promise<BusinessMetrics> {
    const timestamp = new Date().toISOString();

    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // User metrics
      const [
        totalUsers,
        newUsers,
        activeUsersDaily,
        activeUsersWeekly,
        activeUsersMonthly
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: { createdAt: { gte: oneDayAgo } }
        }),
        this.prisma.user.count({
          where: { updatedAt: { gte: oneDayAgo } }
        }),
        this.prisma.user.count({
          where: { updatedAt: { gte: oneWeekAgo } }
        }),
        this.prisma.user.count({
          where: { updatedAt: { gte: oneMonthAgo } }
        })
      ]);

      // Restaurant metrics
      const [
        totalRestaurants,
        activeRestaurants,
        verifiedRestaurants,
        newRestaurants
      ] = await Promise.all([
        this.prisma.restaurant.count(),
        this.prisma.restaurant.count({
          where: { status: 'ACTIVE' }
        }),
        this.prisma.restaurant.count({
          where: { verificationStatus: 'VERIFIED' }
        }),
        this.prisma.restaurant.count({
          where: { createdAt: { gte: oneDayAgo } }
        })
      ]);

      // Job metrics
      const [
        totalJobs,
        activeJobs,
        totalApplications,
        filledJobs
      ] = await Promise.all([
        this.prisma.job.count(),
        this.prisma.job.count({
          where: { status: 'ACTIVE' }
        }),
        this.prisma.jobApplication.count(),
        this.prisma.job.count({
          where: { status: 'FILLED' }
        })
      ]);

      const metrics: BusinessMetrics = {
        timestamp,
        users: {
          total: totalUsers,
          active: activeUsersDaily,
          newRegistrations: newUsers,
          activeDaily: activeUsersDaily,
          activeWeekly: activeUsersWeekly,
          activeMonthly: activeUsersMonthly,
        },
        orders: {
          total: 0,
          pending: 0,
          completed: 0,
          cancelled: 0,
          revenue: 0,
          averageOrderValue: 0,
          ordersPerHour: 0,
        },
        restaurants: {
          total: totalRestaurants,
          active: activeRestaurants,
          verified: verifiedRestaurants,
          newRegistrations: newRestaurants,
        },
        jobs: {
          total: totalJobs,
          active: activeJobs,
          applications: totalApplications,
          filled: filledJobs,
        },
      };

      // Update Prometheus business metrics
      this.businessMetricsGauge.set({ metric: 'total_users' }, totalUsers);
      this.businessMetricsGauge.set({ metric: 'active_users_daily' }, activeUsersDaily);
      this.businessMetricsGauge.set({ metric: 'total_restaurants' }, totalRestaurants);
      this.businessMetricsGauge.set({ metric: 'total_jobs' }, totalJobs);

      this.logger.debug('Business metrics collected successfully');
      return metrics;
    } catch (error) {
      this.logger.error('Failed to collect business metrics', error.stack);
      throw error;
    }
  }

  // Performance tracking methods
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });

    this.httpRequestDuration.observe(
      { method, route },
      duration / 1000 // Convert to seconds
    );
  }

  recordDatabaseQuery(operation: string, duration: number): void {
    this.databaseQueryDuration.observe(
      { operation },
      duration / 1000 // Convert to seconds
    );
  }

  updateActiveConnections(count: number): void {
    this.activeConnections.set({ type: 'http' }, count);
  }

  // Scheduled metric collection
  @Cron(CronExpression.EVERY_MINUTE)
  async collectSystemMetrics() {
    try {
      await this.getSystemMetrics();
    } catch (error) {
      this.logger.error('Failed to collect system metrics in cron job', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async collectDatabaseMetrics() {
    try {
      await this.getDatabaseMetrics();
    } catch (error) {
      this.logger.error('Failed to collect database metrics in cron job', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async collectBusinessMetrics() {
    try {
      await this.getBusinessMetrics();
    } catch (error) {
      this.logger.error('Failed to collect business metrics in cron job', error.stack);
    }
  }

  // Health check methods
  async isHealthy(): Promise<boolean> {
    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      // Check system resources
      const systemMetrics = await this.getSystemMetrics();

      // Basic health checks
      if (systemMetrics.cpu.usage > 95) return false;
      if (systemMetrics.memory.usage > 95) return false;
      if (systemMetrics.disk.usage > 95) return false;

      return true;
    } catch (error) {
      this.logger.error('Health check failed', error.stack);
      return false;
    }
  }

  // Private helper methods
  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const totalUsage = currentUsage.user + currentUsage.system;
        const totalTime = 100000; // 100ms in microseconds
        const cpuPercent = (totalUsage / totalTime) * 100;
        resolve(Math.min(cpuPercent, 100));
      }, 100);
    });
  }

  private async getDiskInfo(): Promise<any> {
    // In production, use a library like 'node-disk-info' or system calls
    // This is a simplified implementation
    return {
      total: 100 * 1024 * 1024 * 1024, // 100GB placeholder
      used: 50 * 1024 * 1024 * 1024,   // 50GB placeholder
      free: 50 * 1024 * 1024 * 1024,   // 50GB placeholder
      usage: 50,
    };
  }

  private async getNetworkInfo(): Promise<any> {
    return {
      connections: 0,
      activeHandles: (process as any)._getActiveHandles?.()?.length || 0,
      activeRequests: (process as any)._getActiveRequests?.()?.length || 0,
    };
  }
}