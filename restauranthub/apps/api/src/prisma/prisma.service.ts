import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly isMockMode = process.env.MOCK_DATABASE === 'true';

  constructor() {
    // Only initialize PrismaClient if not in mock mode
    if (!process.env.MOCK_DATABASE || process.env.MOCK_DATABASE !== 'true') {
      super({
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        },
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
        ],
        errorFormat: 'pretty',
      });

      // Log slow queries in development
      if (process.env.NODE_ENV === 'development') {
        this.$on('query', (e) => {
          if (e.duration > 1000) { // Log queries slower than 1 second
            this.logger.warn(`Slow query detected: ${e.query} (Duration: ${e.duration}ms)`);
          }
        });
      }

      this.$on('error', (e) => {
        this.logger.error('Database error:', e);
      });
    } else {
      // Mock mode - minimal initialization
      super();
      this.logger.log('PrismaService initialized in MOCK MODE - database operations will be bypassed');
    }
  }

  async onModuleInit() {
    if (this.isMockMode) {
      this.logger.log('Mock database mode enabled - skipping real database connection');
      return;
    }

    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');

      // Connection pool optimization - only in real database mode
      await this.$executeRaw`SET statement_timeout = '30s'`;
      await this.$executeRaw`SET idle_in_transaction_session_timeout = '5min'`;

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
        total_connections: 1,
        active_connections: 1,
        idle_connections: 0
      };
    }

    try {
      const result = await this.$queryRaw`
        SELECT
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      return result[0];
    } catch (error) {
      this.logger.error('Failed to get connection pool status:', error);
      return null;
    }
  }

  // Health check method for monitoring
  async healthCheck() {
    if (this.isMockMode) {
      return {
        status: 'healthy',
        mode: 'mock',
        timestamp: new Date().toISOString()
      };
    }

    try {
      await this.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        mode: 'database',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        mode: 'database',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}