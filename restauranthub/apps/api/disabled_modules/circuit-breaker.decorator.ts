import { SetMetadata, applyDecorators } from '@nestjs/common';
import { CircuitBreakerOptions } from '../common/circuit-breaker.service';

export const CIRCUIT_BREAKER_KEY = 'circuit-breaker';

export interface CircuitBreakerDecoratorOptions extends Partial<CircuitBreakerOptions> {
  name?: string;
  fallback?: string; // Method name for fallback
}

/**
 * Circuit Breaker decorator for automatic circuit breaking on method calls
 *
 * @param options Circuit breaker configuration
 *
 * @example
 * ```typescript
 * @CircuitBreaker({
 *   name: 'user-service',
 *   failureThreshold: 3,
 *   resetTimeout: 30000,
 *   fallback: 'getUserFromCache'
 * })
 * async getUser(id: string): Promise<User> {
 *   return await this.userService.findById(id);
 * }
 *
 * async getUserFromCache(id: string): Promise<User> {
 *   return this.cacheService.get(`user:${id}`);
 * }
 * ```
 */
export function CircuitBreaker(options: CircuitBreakerDecoratorOptions = {}) {
  return applyDecorators(
    SetMetadata(CIRCUIT_BREAKER_KEY, options),
  );
}

// Specialized decorators for common use cases

/**
 * Database circuit breaker decorator
 */
export function DatabaseCircuitBreaker(options: Partial<CircuitBreakerDecoratorOptions> = {}) {
  return CircuitBreaker({
    name: 'database',
    failureThreshold: 3,
    resetTimeout: 30000,
    expectedErrors: (error: any) => {
      return error.code === 'VALIDATION_ERROR' ||
             error.code === 'NOT_FOUND' ||
             error.status === 400 ||
             error.status === 404;
    },
    ...options,
  });
}

/**
 * External API circuit breaker decorator
 */
export function ExternalApiCircuitBreaker(serviceName: string, options: Partial<CircuitBreakerDecoratorOptions> = {}) {
  return CircuitBreaker({
    name: `external-api-${serviceName}`,
    failureThreshold: 3,
    resetTimeout: 60000,
    halfOpenMaxCalls: 2,
    expectedErrors: (error: any) => {
      return error.status >= 400 && error.status < 500;
    },
    ...options,
  });
}

/**
 * Microservice circuit breaker decorator
 */
export function MicroserviceCircuitBreaker(serviceName: string, options: Partial<CircuitBreakerDecoratorOptions> = {}) {
  return CircuitBreaker({
    name: `microservice-${serviceName}`,
    failureThreshold: 5,
    resetTimeout: 30000,
    halfOpenMaxCalls: 3,
    expectedErrors: (error: any) => {
      return !(error.status >= 500 || error.code === 'TIMEOUT' || error.code === 'ECONNREFUSED');
    },
    ...options,
  });
}

/**
 * Redis circuit breaker decorator
 */
export function RedisCircuitBreaker(options: Partial<CircuitBreakerDecoratorOptions> = {}) {
  return CircuitBreaker({
    name: 'redis',
    failureThreshold: 2,
    resetTimeout: 15000,
    halfOpenMaxCalls: 1,
    expectedErrors: () => false,
    ...options,
  });
}

/**
 * Payment gateway circuit breaker decorator
 */
export function PaymentCircuitBreaker(gatewayName: string, options: Partial<CircuitBreakerDecoratorOptions> = {}) {
  return CircuitBreaker({
    name: `payment-${gatewayName}`,
    failureThreshold: 2, // Payment failures should be handled quickly
    resetTimeout: 120000, // 2 minutes
    halfOpenMaxCalls: 1,
    expectedErrors: (error: any) => {
      // Only count gateway/network errors, not payment declined or validation errors
      return error.code === 'PAYMENT_DECLINED' ||
             error.code === 'INVALID_CARD' ||
             error.code === 'INSUFFICIENT_FUNDS' ||
             error.status === 400;
    },
    ...options,
  });
}

/**
 * Email service circuit breaker decorator
 */
export function EmailCircuitBreaker(options: Partial<CircuitBreakerDecoratorOptions> = {}) {
  return CircuitBreaker({
    name: 'email-service',
    failureThreshold: 3,
    resetTimeout: 60000,
    halfOpenMaxCalls: 2,
    expectedErrors: (error: any) => {
      // Don't count invalid email addresses as circuit breaker failures
      return error.code === 'INVALID_EMAIL' || error.status === 400;
    },
    ...options,
  });
}

/**
 * File upload circuit breaker decorator
 */
export function FileUploadCircuitBreaker(options: Partial<CircuitBreakerDecoratorOptions> = {}) {
  return CircuitBreaker({
    name: 'file-upload',
    failureThreshold: 3,
    resetTimeout: 45000,
    halfOpenMaxCalls: 2,
    expectedErrors: (error: any) => {
      // Don't count file validation errors
      return error.code === 'FILE_TOO_LARGE' ||
             error.code === 'INVALID_FILE_TYPE' ||
             error.status === 400;
    },
    ...options,
  });
}