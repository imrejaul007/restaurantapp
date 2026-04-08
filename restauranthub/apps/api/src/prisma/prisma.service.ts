import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly isMockMode = process.env.MOCK_DATABASE === 'true';
  private connectionPoolMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    lastUpdated: new Date(),
  };

  constructor() {
    // Enhanced Prisma configuration with optimized connection pooling
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://mock:mock@localhost:5432/mock'
        }
      },
      errorFormat: 'pretty',
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
      // Note: __internal configuration removed due to compatibility issues
    });

    if (this.isMockMode) {
      this.logger.log('PrismaService initialized in MOCK MODE - database operations will be bypassed');
    } else {
      this.logger.log(`PrismaService initialized with connection limit: ${process.env.DATABASE_CONNECTION_LIMIT || '20'}`);

      // Set up connection pool monitoring
      this.setupConnectionPoolMonitoring();
    }
  }

  private setupConnectionPoolMonitoring() {
    // Monitor connection pool every 30 seconds
    setInterval(async () => {
      try {
        const metrics = await this.getConnectionPoolStatus();
        if (metrics) {
          this.connectionPoolMetrics = {
            ...metrics,
            lastUpdated: new Date(),
          };

          // Log warnings if connection pool is under stress
          const utilizationRate = (metrics.activeConnections / (metrics.totalConnections || 1)) * 100;
          if (utilizationRate > 80) {
            this.logger.warn(`High connection pool utilization: ${utilizationRate.toFixed(1)}% (${metrics.activeConnections}/${metrics.totalConnections})`);
          }
        }
      } catch (error) {
        this.logger.debug('Connection pool monitoring failed:', error);
      }
    }, 30000);
  }

  async onModuleInit() {
    if (this.isMockMode) {
      this.logger.log('Mock database mode enabled - skipping real database connection');
      return;
    }

    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');

      // Enhanced connection pool optimization for PostgreSQL
      await this.$executeRaw`SET statement_timeout = '30s'`;
      await this.$executeRaw`SET idle_in_transaction_session_timeout = '5min'`;
      await this.$executeRaw`SET lock_timeout = '10s'`;
      await this.$executeRaw`SET log_min_duration_statement = 1000`; // Log slow queries > 1s

      // Connection pool specific optimizations
      await this.$executeRaw`SET max_connections = ${parseInt(process.env.DATABASE_MAX_CONNECTIONS || '100')}`;
      await this.$executeRaw`SET shared_buffers = '256MB'`;
      await this.$executeRaw`SET effective_cache_size = '1GB'`;
      await this.$executeRaw`SET maintenance_work_mem = '64MB'`;
      await this.$executeRaw`SET checkpoint_completion_target = 0.9`;
      await this.$executeRaw`SET wal_buffers = '16MB'`;
      await this.$executeRaw`SET default_statistics_target = 100`;

      this.logger.log('Database connection pool optimizations applied');

    } catch (error) {
      this.logger.error('Failed to connect to database:', error);

      // In development, log warning but don't throw to allow mock services to work
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn('Database connection failed in development - continuing with mock mode behavior');
        return;
      }

      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.isMockMode) {
      this.logger.log('Mock database mode - skipping disconnect');
      return;
    }

    try {
      await this.$disconnect();
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.warn('Error during database disconnect:', error);
    }
  }

  async getConnectionPoolStatus() {
    if (this.isMockMode) {
      this.logger.log('Mock database mode - returning mock connection pool status');
      return {
        totalConnections: 1,
        activeConnections: 1,
        idleConnections: 0,
        waitingConnections: 0,
        queryCount: 0,
        slowQueries: 0
      };
    }

    try {
      const [connectionStats, queryStats] = await Promise.all([
        this.$queryRaw`
          SELECT
            count(*) as total_connections,
            count(*) FILTER (WHERE state = 'active') as active_connections,
            count(*) FILTER (WHERE state = 'idle') as idle_connections,
            count(*) FILTER (WHERE wait_event IS NOT NULL) as waiting_connections
          FROM pg_stat_activity
          WHERE datname = current_database()
        `,
        this.$queryRaw`
          SELECT
            sum(calls) as query_count,
            sum(CASE WHEN mean_exec_time > 1000 THEN calls ELSE 0 END) as slow_queries
          FROM pg_stat_statements
          WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
        `
      ]);

      const connStats = (connectionStats as any)[0];
      const qStats = (queryStats as any)[0] || { query_count: 0, slow_queries: 0 };

      return {
        totalConnections: parseInt(connStats.total_connections) || 0,
        activeConnections: parseInt(connStats.active_connections) || 0,
        idleConnections: parseInt(connStats.idle_connections) || 0,
        waitingConnections: parseInt(connStats.waiting_connections) || 0,
        queryCount: parseInt(qStats.query_count) || 0,
        slowQueries: parseInt(qStats.slow_queries) || 0
      };
    } catch (error) {
      this.logger.error('Failed to get connection pool status:', error);
      return null;
    }
  }

  // Enhanced health check method for monitoring
  async healthCheck() {
    if (this.isMockMode) {
      return {
        status: 'healthy',
        mode: 'mock',
        timestamp: new Date().toISOString(),
        connectionPool: this.connectionPoolMetrics,
        performance: {
          avgResponseTime: 5,
          queriesPerSecond: 10
        }
      };
    }

    const startTime = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;
      const poolStatus = await this.getConnectionPoolStatus();

      return {
        status: 'healthy',
        mode: 'database',
        timestamp: new Date().toISOString(),
        connectionPool: poolStatus,
        performance: {
          responseTime,
          avgResponseTime: responseTime,
          queriesPerSecond: poolStatus?.queryCount || 0
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        mode: 'database',
        error: (error as any).message,
        timestamp: new Date().toISOString(),
        connectionPool: null
      };
    }
  }

  // Get current connection pool metrics
  getConnectionPoolMetrics() {
    return this.connectionPoolMetrics;
  }

  // Execute query with performance monitoring
  async executeWithMetrics<T>(queryFn: () => Promise<T>): Promise<{ result: T; metrics: { duration: number; timestamp: Date } }> {
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > 1000) {
        this.logger.warn(`Slow query detected: ${duration}ms`);
      }

      return {
        result,
        metrics: {
          duration,
          timestamp: new Date()
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Query failed after ${duration}ms:`, error);
      throw error;
    }
  }

  // Optimize connection pool based on current usage
  async optimizeConnectionPool() {
    if (this.isMockMode) {
      this.logger.log('Mock mode - skipping connection pool optimization');
      return;
    }

    try {
      const status = await this.getConnectionPoolStatus();
      if (!status) return;

      const utilizationRate = (status.activeConnections / status.totalConnections) * 100;

      if (utilizationRate > 90) {
        this.logger.warn(`Very high connection pool utilization: ${utilizationRate.toFixed(1)}%`);
        // Could implement dynamic scaling here if supported
      } else if (utilizationRate < 10 && status.totalConnections > 5) {
        this.logger.debug(`Low connection pool utilization: ${utilizationRate.toFixed(1)}% - consider reducing pool size`);
      }

      // Log connection pool health
      this.logger.debug(`Connection Pool Status: ${status.activeConnections}/${status.totalConnections} active, ${status.waitingConnections} waiting, ${status.slowQueries} slow queries`);

    } catch (error) {
      this.logger.error('Failed to optimize connection pool:', error);
    }
  }
}