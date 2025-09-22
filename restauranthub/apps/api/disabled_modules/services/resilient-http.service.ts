import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CircuitBreakerService } from '../common/circuit-breaker.service';
import { LoggerService } from '../common/logger.service';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';
import { of } from 'rxjs';

export interface ResilientHttpOptions extends AxiosRequestConfig {
  circuitBreakerName?: string;
  retryAttempts?: number;
  retryDelay?: number;
  timeoutMs?: number;
  fallbackResponse?: any;
  cacheKey?: string;
  cacheTtl?: number;
}

export interface HttpRequestMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  statusCode?: number;
  error?: string;
  retryAttempts: number;
  circuitBreakerTriggered: boolean;
}

@Injectable()
export class ResilientHttpService {
  private readonly cache = new Map<string, { data: any; expiry: number }>();

  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly logger: LoggerService,
  ) {
    // Clean cache periodically
    setInterval(() => {
      this.cleanExpiredCache();
    }, 60000); // Clean every minute
  }

  /**
   * Make a resilient HTTP GET request with circuit breaker, retries, and caching
   */
  async get<T = any>(url: string, options: ResilientHttpOptions = {}): Promise<AxiosResponse<T>> {
    return this.executeRequest('GET', url, { ...options, url });
  }

  /**
   * Make a resilient HTTP POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    options: ResilientHttpOptions = {},
  ): Promise<AxiosResponse<T>> {
    return this.executeRequest('POST', url, { ...options, url, data });
  }

  /**
   * Make a resilient HTTP PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    options: ResilientHttpOptions = {},
  ): Promise<AxiosResponse<T>> {
    return this.executeRequest('PUT', url, { ...options, url, data });
  }

  /**
   * Make a resilient HTTP DELETE request
   */
  async delete<T = any>(url: string, options: ResilientHttpOptions = {}): Promise<AxiosResponse<T>> {
    return this.executeRequest('DELETE', url, { ...options, url });
  }

  /**
   * Make a resilient HTTP PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    options: ResilientHttpOptions = {},
  ): Promise<AxiosResponse<T>> {
    return this.executeRequest('PATCH', url, { ...options, url, data });
  }

  private async executeRequest<T = any>(
    method: string,
    url: string,
    options: ResilientHttpOptions,
  ): Promise<AxiosResponse<T>> {
    const {
      circuitBreakerName = `http-${this.extractServiceName(url)}`,
      retryAttempts = 3,
      retryDelay = 1000,
      timeoutMs = 10000,
      fallbackResponse,
      cacheKey,
      cacheTtl = 300000, // 5 minutes
      ...axiosOptions
    } = options;

    const metrics: HttpRequestMetrics = {
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      success: false,
      retryAttempts: 0,
      circuitBreakerTriggered: false,
    };

    // Check cache first for GET requests
    if (method === 'GET' && cacheKey) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for HTTP request`, {
          operation: 'HTTP_CACHE_HIT',
          url,
          cacheKey,
        });

        return {
          data: cached,
          status: 200,
          statusText: 'OK (Cached)',
          headers: {},
          config: axiosOptions,
        } as AxiosResponse<T>;
      }
    }

    // Create circuit breaker for this service
    const circuit = this.circuitBreakerService.createCircuitBreaker(circuitBreakerName, {
      failureThreshold: 3,
      resetTimeout: 30000,
      halfOpenMaxCalls: 2,
      expectedErrors: (error: any) => {
        // Don't count client errors (4xx) as circuit breaker failures
        return error.response?.status >= 400 && error.response?.status < 500;
      },
    });

    const operation = async (): Promise<AxiosResponse<T>> => {
      let lastError: any;

      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          if (attempt > 0) {
            metrics.retryAttempts++;

            // Exponential backoff
            const delay = retryDelay * Math.pow(2, attempt - 1);
            await this.sleep(delay);

            this.logger.warn(`Retrying HTTP request`, {
              operation: 'HTTP_RETRY',
              url,
              attempt,
              maxAttempts: retryAttempts,
              delay,
            });
          }

          const response = await firstValueFrom(
            this.httpService.request<T>({
              ...axiosOptions,
              method,
              timeout: timeoutMs,
            }).pipe(
              timeout(timeoutMs),
              catchError((error) => {
                throw error;
              }),
            ),
          );

          metrics.success = true;
          metrics.statusCode = response.status;

          // Cache successful GET responses
          if (method === 'GET' && cacheKey && response.status === 200) {
            this.setCache(cacheKey, response.data, cacheTtl);
          }

          this.logger.debug(`HTTP request successful`, {
            operation: 'HTTP_SUCCESS',
            url,
            method,
            statusCode: response.status,
            attempt,
            duration: Date.now() - metrics.startTime,
          });

          return response;
        } catch (error) {
          lastError = error;
          metrics.error = error.message;

          // Don't retry on client errors (4xx)
          if (error.response?.status >= 400 && error.response?.status < 500) {
            this.logger.warn(`HTTP client error, not retrying`, {
              operation: 'HTTP_CLIENT_ERROR',
              url,
              method,
              statusCode: error.response?.status,
              error: error.message,
            });
            break;
          }

          if (attempt < retryAttempts) {
            this.logger.warn(`HTTP request failed, will retry`, {
              operation: 'HTTP_RETRY_NEEDED',
              url,
              method,
              attempt,
              error: error.message,
            });
          }
        }
      }

      throw lastError;
    };

    try {
      const response = await circuit.execute(operation);

      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;

      // Log successful request
      this.logRequestMetrics(method, url, metrics);

      return response;
    } catch (error) {
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.circuitBreakerTriggered = circuit.isOpen();

      // Log failed request
      this.logRequestMetrics(method, url, metrics, error);

      // Try fallback response if circuit breaker is open
      if (circuit.isOpen() && fallbackResponse !== undefined) {
        this.logger.warn(`Using fallback response due to circuit breaker`, {
          operation: 'HTTP_FALLBACK',
          url,
          circuitBreakerName,
        });

        return {
          data: fallbackResponse,
          status: 200,
          statusText: 'OK (Fallback)',
          headers: {},
          config: axiosOptions,
        } as AxiosResponse<T>;
      }

      // Transform axios errors to HttpException
      if (error.response) {
        throw new HttpException(
          error.response.data || error.message,
          error.response.status,
        );
      }

      throw error;
    }
  }

  /**
   * Bulk HTTP requests with circuit breaker protection
   */
  async executeBulkRequests<T = any>(
    requests: Array<{ method: string; url: string; options?: ResilientHttpOptions }>,
    options: {
      concurrency?: number;
      failFast?: boolean;
      circuitBreakerName?: string;
    } = {},
  ): Promise<Array<{ success: boolean; data?: T; error?: any; index: number }>> {
    const { concurrency = 5, failFast = false, circuitBreakerName = 'bulk-http' } = options;

    const circuit = this.circuitBreakerService.createCircuitBreaker(circuitBreakerName, {
      failureThreshold: Math.ceil(requests.length * 0.3), // 30% failure threshold
      resetTimeout: 60000,
    });

    const results: Array<{ success: boolean; data?: T; error?: any; index: number }> = [];
    const batches = this.chunkArray(requests, concurrency);

    for (const batch of batches) {
      const batchPromises = batch.map(async (request, batchIndex) => {
        const globalIndex = results.length + batchIndex;

        try {
          const response = await circuit.execute(async () => {
            return this.executeRequest(request.method, request.url, request.options || {});
          });

          return { success: true, data: response.data, index: globalIndex };
        } catch (error) {
          if (failFast) {
            throw error;
          }

          return { success: false, error: error.message, index: globalIndex };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    this.logger.log(`Bulk HTTP requests completed`, {
      operation: 'HTTP_BULK_COMPLETE',
      totalRequests: requests.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      circuitBreakerName,
    });

    return results;
  }

  private extractServiceName(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.split('.')[0] || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (cached.expiry <= now) {
        this.cache.delete(key);
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

  private logRequestMetrics(
    method: string,
    url: string,
    metrics: HttpRequestMetrics,
    error?: any,
  ): void {
    const logData = {
      operation: metrics.success ? 'HTTP_REQUEST_SUCCESS' : 'HTTP_REQUEST_FAILURE',
      method,
      url,
      duration: metrics.duration,
      statusCode: metrics.statusCode,
      retryAttempts: metrics.retryAttempts,
      circuitBreakerTriggered: metrics.circuitBreakerTriggered,
      error: error?.message,
    };

    if (metrics.success) {
      if (metrics.duration > 5000) {
        this.logger.warn('Slow HTTP request', logData);
      } else {
        this.logger.debug('HTTP request completed', logData);
      }
    } else {
      this.logger.error('HTTP request failed', error?.stack, logData);
    }
  }

  // Health check method
  getHealthStatus(): { healthy: boolean; details: any } {
    const circuitHealth = this.circuitBreakerService.getHealthStatus();
    const cacheStats = {
      size: this.cache.size,
      hitRate: 0, // Could be implemented with more detailed metrics
    };

    return {
      healthy: circuitHealth.healthy,
      details: {
        circuitBreakers: circuitHealth.details,
        cache: cacheStats,
      },
    };
  }

  // Method to get HTTP service statistics
  getServiceStats() {
    const circuits = this.circuitBreakerService.getAllCircuitStats();
    const httpCircuits = Object.fromEntries(
      Object.entries(circuits).filter(([name]) => name.startsWith('http-'))
    );

    return {
      activeHttpCircuits: Object.keys(httpCircuits).length,
      cacheSize: this.cache.size,
      circuitDetails: httpCircuits,
    };
  }
}