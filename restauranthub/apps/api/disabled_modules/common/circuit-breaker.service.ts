import { Injectable } from '@nestjs/common';
import { LoggerService } from './logger.service';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  expectedErrors?: (error: any) => boolean;
  name?: string;
  halfOpenMaxCalls?: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
  uptime: number;
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private totalCalls = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private readonly startTime = new Date();
  private halfOpenCalls = 0;

  constructor(
    private readonly options: Required<CircuitBreakerOptions>,
    private readonly logger: LoggerService,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalCalls++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < (this.nextAttemptTime?.getTime() || 0)) {
        const error = new Error(`Circuit breaker '${this.options.name}' is OPEN`);
        this.logger.warn(`Circuit breaker prevented call`, {
          operation: 'CIRCUIT_BREAKER_OPEN',
          circuitName: this.options.name,
          state: this.state,
          nextAttemptTime: this.nextAttemptTime,
        });
        throw error;
      } else {
        // Transition to half-open
        this.setState(CircuitState.HALF_OPEN);
        this.halfOpenCalls = 0;
      }
    }

    // Execute operation
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.successCount++;
    this.totalSuccesses++;

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;

      // If we've had enough successful calls in half-open state, close the circuit
      if (this.halfOpenCalls >= this.options.halfOpenMaxCalls) {
        this.setState(CircuitState.CLOSED);
        this.reset();
        this.logger.log(`Circuit breaker closed after successful recovery`, {
          operation: 'CIRCUIT_BREAKER_CLOSED',
          circuitName: this.options.name,
          successCount: this.halfOpenCalls,
        });
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success when circuit is closed
      this.failureCount = 0;
    }
  }

  private onFailure(error: any): void {
    this.totalFailures++;
    this.lastFailureTime = new Date();

    // Check if this is an expected error that shouldn't count towards circuit breaking
    if (this.options.expectedErrors && this.options.expectedErrors(error)) {
      this.logger.debug(`Expected error ignored by circuit breaker`, {
        operation: 'CIRCUIT_BREAKER_EXPECTED_ERROR',
        circuitName: this.options.name,
        error: error.message,
      });
      return;
    }

    this.failureCount++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state immediately opens the circuit
      this.setState(CircuitState.OPEN);
      this.scheduleNextAttempt();
      this.logger.warn(`Circuit breaker opened from half-open state`, {
        operation: 'CIRCUIT_BREAKER_OPENED_FROM_HALF_OPEN',
        circuitName: this.options.name,
        error: error.message,
      });
    } else if (this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold) {
      // Open circuit if failure threshold is reached
      this.setState(CircuitState.OPEN);
      this.scheduleNextAttempt();
      this.logger.error(`Circuit breaker opened due to failure threshold`, {
        operation: 'CIRCUIT_BREAKER_OPENED',
        circuitName: this.options.name,
        failureCount: this.failureCount,
        threshold: this.options.failureThreshold,
        error: error.message,
      });
    }
  }

  private setState(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    if (oldState !== newState) {
      this.logger.log(`Circuit breaker state changed`, {
        operation: 'CIRCUIT_BREAKER_STATE_CHANGE',
        circuitName: this.options.name,
        oldState,
        newState,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private scheduleNextAttempt(): void {
    this.nextAttemptTime = new Date(Date.now() + this.options.resetTimeout);
  }

  private reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = undefined;
    this.halfOpenCalls = 0;
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  getName(): string {
    return this.options.name;
  }

  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  isClosed(): boolean {
    return this.state === CircuitState.CLOSED;
  }

  isHalfOpen(): boolean {
    return this.state === CircuitState.HALF_OPEN;
  }
}

@Injectable()
export class CircuitBreakerService {
  private readonly circuits = new Map<string, CircuitBreaker>();
  private readonly defaultOptions: Required<CircuitBreakerOptions> = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitoringPeriod: 10000, // 10 seconds
    expectedErrors: () => false,
    name: 'default',
    halfOpenMaxCalls: 3,
  };

  constructor(private readonly logger: LoggerService) {
    // Start monitoring interval
    setInterval(() => {
      this.logCircuitStats();
    }, this.defaultOptions.monitoringPeriod);
  }

  createCircuitBreaker(name: string, options: Partial<CircuitBreakerOptions> = {}): CircuitBreaker {
    const finalOptions: Required<CircuitBreakerOptions> = {
      ...this.defaultOptions,
      ...options,
      name,
    };

    if (this.circuits.has(name)) {
      return this.circuits.get(name)!;
    }

    const circuit = new CircuitBreaker(finalOptions, this.logger);
    this.circuits.set(name, circuit);

    this.logger.log(`Circuit breaker created`, {
      operation: 'CIRCUIT_BREAKER_CREATED',
      circuitName: name,
      options: finalOptions,
    });

    return circuit;
  }

  getCircuitBreaker(name: string): CircuitBreaker | undefined {
    return this.circuits.get(name);
  }

  getAllCircuits(): Map<string, CircuitBreaker> {
    return new Map(this.circuits);
  }

  getCircuitStats(name: string): CircuitBreakerStats | undefined {
    const circuit = this.circuits.get(name);
    return circuit?.getStats();
  }

  getAllCircuitStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};

    for (const [name, circuit] of this.circuits) {
      stats[name] = circuit.getStats();
    }

    return stats;
  }

  // Convenience method for database operations
  async executeWithDatabaseCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    const circuit = this.createCircuitBreaker('database', {
      failureThreshold: 3,
      resetTimeout: 30000,
      expectedErrors: (error: any) => {
        // Don't count validation errors or user errors as circuit breaker failures
        return error.code === 'VALIDATION_ERROR' ||
               error.code === 'NOT_FOUND' ||
               error.status === 400 ||
               error.status === 404;
      },
    });

    return circuit.execute(operation);
  }

  // Convenience method for external API calls
  async executeWithExternalApiCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const circuit = this.createCircuitBreaker(`external-api-${serviceName}`, {
      failureThreshold: 3,
      resetTimeout: 60000,
      halfOpenMaxCalls: 2,
      expectedErrors: (error: any) => {
        // Don't count client errors (4xx) as circuit breaker failures
        return error.status >= 400 && error.status < 500;
      },
    });

    return circuit.execute(operation);
  }

  // Convenience method for microservice calls
  async executeWithMicroserviceCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const circuit = this.createCircuitBreaker(`microservice-${serviceName}`, {
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenMaxCalls: 3,
      expectedErrors: (error: any) => {
        // Only count 5xx errors and timeouts as failures
        return !(error.status >= 500 || error.code === 'TIMEOUT' || error.code === 'ECONNREFUSED');
      },
    });

    return circuit.execute(operation);
  }

  // Convenience method for Redis operations
  async executeWithRedisCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    const circuit = this.createCircuitBreaker('redis', {
      failureThreshold: 2, // Redis should fail fast
      resetTimeout: 15000,
      halfOpenMaxCalls: 1,
      expectedErrors: () => false, // All Redis errors are significant
    });

    return circuit.execute(operation);
  }

  private logCircuitStats(): void {
    const stats = this.getAllCircuitStats();
    const openCircuits = Object.entries(stats).filter(([, stat]) => stat.state === CircuitState.OPEN);
    const halfOpenCircuits = Object.entries(stats).filter(([, stat]) => stat.state === CircuitState.HALF_OPEN);

    // Log open circuits as warnings
    openCircuits.forEach(([name, stat]) => {
      this.logger.warn(`Circuit breaker is open`, {
        operation: 'CIRCUIT_BREAKER_MONITORING',
        circuitName: name,
        state: stat.state,
        failureCount: stat.failureCount,
        totalFailures: stat.totalFailures,
        nextAttemptTime: stat.nextAttemptTime,
      });
    });

    // Log half-open circuits as info
    halfOpenCircuits.forEach(([name, stat]) => {
      this.logger.log(`Circuit breaker is half-open`, {
        operation: 'CIRCUIT_BREAKER_MONITORING',
        circuitName: name,
        state: stat.state,
        successCount: stat.successCount,
      });
    });

    // Periodic stats logging (only if there are circuits and some activity)
    const hasActivity = Object.values(stats).some(stat => stat.totalCalls > 0);
    if (hasActivity && Object.keys(stats).length > 0) {
      this.logger.debug(`Circuit breaker statistics`, {
        operation: 'CIRCUIT_BREAKER_STATS',
        circuits: Object.keys(stats).length,
        openCircuits: openCircuits.length,
        halfOpenCircuits: halfOpenCircuits.length,
        stats,
      });
    }
  }

  // Method to manually reset a circuit breaker
  resetCircuitBreaker(name: string): boolean {
    const circuit = this.circuits.get(name);
    if (!circuit) {
      return false;
    }

    // Reset by creating a new circuit with the same options
    this.circuits.delete(name);
    this.createCircuitBreaker(name);

    this.logger.log(`Circuit breaker manually reset`, {
      operation: 'CIRCUIT_BREAKER_RESET',
      circuitName: name,
    });

    return true;
  }

  // Health check method
  getHealthStatus(): { healthy: boolean; details: Record<string, any> } {
    const stats = this.getAllCircuitStats();
    const openCircuits = Object.entries(stats).filter(([, stat]) => stat.state === CircuitState.OPEN);

    return {
      healthy: openCircuits.length === 0,
      details: {
        totalCircuits: Object.keys(stats).length,
        openCircuits: openCircuits.length,
        circuitDetails: stats,
      },
    };
  }
}