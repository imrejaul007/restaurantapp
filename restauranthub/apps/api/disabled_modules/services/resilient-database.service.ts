import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CircuitBreakerService } from '../common/circuit-breaker.service';
import { LoggerService } from '../common/logger.service';

export interface DatabaseOperationOptions {
  circuitBreakerName?: string;
  retryAttempts?: number;
  retryDelay?: number;
  timeoutMs?: number;
  logSlowQueries?: boolean;
  slowQueryThreshold?: number;
}

export interface QueryMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
  retryAttempts: number;
  circuitBreakerTriggered: boolean;
  queryType: 'read' | 'write' | 'transaction';
}

@Injectable()
export class ResilientDatabaseService {
  private readonly queryCache = new Map<string, { data: any; expiry: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly logger: LoggerService,
  ) {
    // Clean query cache periodically
    setInterval(() => {
      this.cleanExpiredCache();
    }, 60000); // Clean every minute
  }

  /**
   * Execute a database read operation with circuit breaker protection
   */
  async executeReadOperation<T>(
    operation: () => Promise<T>,
    options: DatabaseOperationOptions & { cacheKey?: string; cacheTtl?: number } = {},
  ): Promise<T> {
    const {
      circuitBreakerName = 'database-read',
      cacheKey,
      cacheTtl = 300000, // 5 minutes
      ...baseOptions
    } = options;

    // Check cache first
    if (cacheKey) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.logger.debug(`Database cache hit`, {
          operation: 'DATABASE_CACHE_HIT',
          cacheKey,
        });
        return cached;
      }
    }

    const result = await this.executeWithCircuitBreaker(
      operation,
      { ...baseOptions, circuitBreakerName, queryType: 'read' },
    );

    // Cache successful read results
    if (cacheKey && result !== null && result !== undefined) {
      this.setCache(cacheKey, result, cacheTtl);
    }

    return result;
  }

  /**
   * Execute a database write operation with circuit breaker protection
   */
  async executeWriteOperation<T>(
    operation: () => Promise<T>,
    options: DatabaseOperationOptions = {},
  ): Promise<T> {
    const { circuitBreakerName = 'database-write', ...baseOptions } = options;

    return this.executeWithCircuitBreaker(
      operation,
      { ...baseOptions, circuitBreakerName, queryType: 'write' },
    );
  }

  /**
   * Execute a database transaction with circuit breaker protection
   */
  async executeTransaction<T>(
    operation: (tx: any) => Promise<T>,
    options: DatabaseOperationOptions = {},
  ): Promise<T> {
    const { circuitBreakerName = 'database-transaction', ...baseOptions } = options;

    const transactionOperation = async () => {
      return this.prisma.$transaction(async (tx) => {
        return operation(tx);
      });
    };

    return this.executeWithCircuitBreaker(
      transactionOperation,
      { ...baseOptions, circuitBreakerName, queryType: 'transaction' },
    );
  }

  /**
   * Execute multiple read operations in parallel with circuit breaker protection
   */
  async executeBulkReadOperations<T>(
    operations: Array<() => Promise<T>>,
    options: DatabaseOperationOptions & { concurrency?: number } = {},
  ): Promise<Array<{ success: boolean; data?: T; error?: any; index: number }>> {
    const { concurrency = 5, circuitBreakerName = 'database-bulk-read', ...baseOptions } = options;

    const circuit = this.circuitBreakerService.createCircuitBreaker(circuitBreakerName, {
      failureThreshold: Math.ceil(operations.length * 0.3), // 30% failure threshold
      resetTimeout: 30000,
      expectedErrors: (error: any) => {
        return error.code === 'P2025' || // Record not found
               error.code === 'P2003'; // Foreign key constraint
      },
    });

    const results: Array<{ success: boolean; data?: T; error?: any; index: number }> = [];
    const batches = this.chunkArray(operations, concurrency);

    for (const batch of batches) {
      const batchPromises = batch.map(async (operation, batchIndex) => {
        const globalIndex = results.length + batchIndex;

        try {
          const result = await circuit.execute(operation);
          return { success: true, data: result, index: globalIndex };
        } catch (error) {
          return { success: false, error: error.message, index: globalIndex };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    this.logger.log(`Bulk database operations completed`, {
      operation: 'DATABASE_BULK_COMPLETE',
      totalOperations: operations.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      circuitBreakerName,
    });

    return results;
  }

  private async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    options: DatabaseOperationOptions & { queryType: 'read' | 'write' | 'transaction' },
  ): Promise<T> {
    const {
      circuitBreakerName = 'database',
      retryAttempts = 3,
      retryDelay = 1000,
      timeoutMs = 30000,
      logSlowQueries = true,
      slowQueryThreshold = 5000,
      queryType,
    } = options;

    const metrics: QueryMetrics = {
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      success: false,
      retryAttempts: 0,
      circuitBreakerTriggered: false,
      queryType,
    };

    // Create circuit breaker with database-specific configuration
    const circuit = this.circuitBreakerService.createCircuitBreaker(circuitBreakerName, {
      failureThreshold: queryType === 'write' ? 3 : 5, // Stricter for writes
      resetTimeout: 30000,
      halfOpenMaxCalls: queryType === 'transaction' ? 1 : 3,
      expectedErrors: (error: any) => {
        // Prisma-specific error codes that shouldn't trigger circuit breaker
        const expectedCodes = [
          'P2025', // Record not found
          'P2002', // Unique constraint violation
          'P2003', // Foreign key constraint violation
          'P2004', // Constraint violation
          'P2014', // Required relation missing
        ];

        return expectedCodes.includes(error.code) ||
               (error.message && error.message.includes('Record to update not found'));
      },
    });

    const operationWithTimeout = async (): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Database operation timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        operation()
          .then((result) => {
            clearTimeout(timeoutId);
            resolve(result);
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
      });
    };

    const operationWithRetry = async (): Promise<T> => {
      let lastError: any;

      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          if (attempt > 0) {
            metrics.retryAttempts++;

            // Exponential backoff for database retries
            const delay = retryDelay * Math.pow(2, attempt - 1);
            await this.sleep(delay);

            this.logger.warn(`Retrying database operation`, {
              operation: 'DATABASE_RETRY',
              attempt,
              maxAttempts: retryAttempts,
              delay,
              queryType,
            });
          }

          const result = await operationWithTimeout();
          metrics.success = true;

          this.logger.debug(`Database operation successful`, {
            operation: 'DATABASE_SUCCESS',
            attempt,
            duration: Date.now() - metrics.startTime,
            queryType,
          });

          return result;
        } catch (error) {
          lastError = error;
          metrics.error = error.message;

          // Don't retry on validation/constraint errors
          if (this.isNonRetryableError(error)) {
            this.logger.debug(`Non-retryable database error`, {
              operation: 'DATABASE_NON_RETRYABLE_ERROR',
              error: error.message,
              code: error.code,
              queryType,
            });
            break;
          }

          if (attempt < retryAttempts) {
            this.logger.warn(`Database operation failed, will retry`, {
              operation: 'DATABASE_RETRY_NEEDED',
              attempt,
              error: error.message,
              code: error.code,
              queryType,
            });
          }
        }
      }

      throw lastError;
    };

    try {
      const result = await circuit.execute(operationWithRetry);

      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;

      // Log slow queries
      if (logSlowQueries && metrics.duration > slowQueryThreshold) {
        this.logger.warn(`Slow database query detected`, {
          operation: 'DATABASE_SLOW_QUERY',
          duration: metrics.duration,
          threshold: slowQueryThreshold,
          queryType,
          circuitBreakerName,
        });
      }

      // Log successful operation
      this.logQueryMetrics(metrics);

      return result;
    } catch (error) {
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.circuitBreakerTriggered = circuit.isOpen();

      // Log failed operation
      this.logQueryMetrics(metrics, error);

      throw error;
    }
  }

  private isNonRetryableError(error: any): boolean {
    // Prisma error codes that should not be retried
    const nonRetryableCodes = [
      'P2002', // Unique constraint violation
      'P2003', // Foreign key constraint violation
      'P2004', // Constraint violation
      'P2014', // Required relation missing
      'P2025', // Record not found (when updating)
    ];

    return nonRetryableCodes.includes(error.code) ||
           (error.message && (
             error.message.includes('Unique constraint') ||
             error.message.includes('Foreign key constraint') ||
             error.message.includes('Record to update not found')
           ));
  }

  private getFromCache(key: string): any {
    const cached = this.queryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    if (cached) {
      this.queryCache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.queryCache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.queryCache.entries()) {
      if (cached.expiry <= now) {
        this.queryCache.delete(key);
      }
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logQueryMetrics(metrics: QueryMetrics, error?: any): void {
    const logData = {
      operation: metrics.success ? 'DATABASE_QUERY_SUCCESS' : 'DATABASE_QUERY_FAILURE',
      duration: metrics.duration,
      queryType: metrics.queryType,
      retryAttempts: metrics.retryAttempts,
      circuitBreakerTriggered: metrics.circuitBreakerTriggered,
      error: error?.message,
      errorCode: error?.code,
    };

    if (metrics.success) {
      this.logger.debug('Database query completed', logData);
    } else {
      this.logger.error('Database query failed', error?.stack, logData);
    }
  }

  // Health check methods
  async checkDatabaseHealth(): Promise<{ healthy: boolean; details: any }> {
    try {
      const startTime = Date.now();

      // Simple query to check database connectivity
      await this.prisma.$queryRaw`SELECT 1 as health_check`;

      const responseTime = Date.now() - startTime;

      const circuitHealth = this.circuitBreakerService.getHealthStatus();

      return {
        healthy: circuitHealth.healthy && responseTime < 5000,
        details: {
          responseTime,
          circuitBreakers: circuitHealth.details,
          cacheSize: this.queryCache.size,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Database health check failed', error.stack, {
        operation: 'DATABASE_HEALTH_CHECK_FAILED',
      });

      return {
        healthy: false,
        details: {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  getServiceStats() {
    const circuits = this.circuitBreakerService.getAllCircuitStats();
    const dbCircuits = Object.fromEntries(
      Object.entries(circuits).filter(([name]) => name.startsWith('database'))
    );

    return {
      activeDatabaseCircuits: Object.keys(dbCircuits).length,
      cacheSize: this.queryCache.size,
      circuitDetails: dbCircuits,
    };
  }

  // Method to clear cache (useful for testing or cache invalidation)
  clearCache(pattern?: string): number {
    if (pattern) {
      let cleared = 0;
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
          cleared++;
        }
      }
      return cleared;
    } else {
      const size = this.queryCache.size;
      this.queryCache.clear();
      return size;
    }
  }
}