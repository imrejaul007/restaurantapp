import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CircuitBreakerService, CircuitBreakerOptions } from '../common/circuit-breaker.service';
import { LoggerService } from '../common/logger.service';
import { CIRCUIT_BREAKER_KEY, CircuitBreakerDecoratorOptions } from '../decorators/circuit-breaker.decorator';

@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  constructor(
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly reflector: Reflector,
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<CircuitBreakerDecoratorOptions>(
      CIRCUIT_BREAKER_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const circuitName = options.name || `${className}.${methodName}`;

    // Create or get existing circuit breaker
    const circuit = this.circuitBreakerService.createCircuitBreaker(circuitName, options);

    // Get the handler instance for fallback method
    const instance = context.switchToHttp().getNext();
    const fallbackMethod = options.fallback ? instance[options.fallback] : null;

    return new Observable((subscriber) => {
      // Execute the operation through circuit breaker
      const operation = () => {
        return new Promise((resolve, reject) => {
          const subscription = next.handle().subscribe({
            next: (value) => resolve(value),
            error: (error) => reject(error),
          });

          // Cleanup subscription if needed
          return () => subscription.unsubscribe();
        });
      };

      circuit
        .execute(operation)
        .then((result) => {
          subscriber.next(result);
          subscriber.complete();
        })
        .catch((error) => {
          // If circuit is open and we have a fallback method, try it
          if (circuit.isOpen() && fallbackMethod && typeof fallbackMethod === 'function') {
            this.logger.warn(`Circuit breaker open, executing fallback`, {
              operation: 'CIRCUIT_BREAKER_FALLBACK',
              circuitName,
              fallbackMethod: options.fallback,
            });

            try {
              // Get the original arguments
              const request = context.switchToHttp().getRequest();
              const args = this.extractMethodArguments(context, request);

              // Execute fallback method
              const fallbackResult = fallbackMethod.apply(instance, args);

              if (fallbackResult instanceof Promise) {
                fallbackResult
                  .then((result) => {
                    subscriber.next(result);
                    subscriber.complete();
                  })
                  .catch((fallbackError) => {
                    this.logger.error(`Fallback method failed`, fallbackError.stack, {
                      operation: 'CIRCUIT_BREAKER_FALLBACK_FAILED',
                      circuitName,
                      fallbackMethod: options.fallback,
                    });
                    subscriber.error(fallbackError);
                  });
              } else {
                subscriber.next(fallbackResult);
                subscriber.complete();
              }
            } catch (fallbackError) {
              this.logger.error(`Fallback method failed`, fallbackError.stack, {
                operation: 'CIRCUIT_BREAKER_FALLBACK_FAILED',
                circuitName,
                fallbackMethod: options.fallback,
              });
              subscriber.error(fallbackError);
            }
          } else {
            subscriber.error(error);
          }
        });
    });
  }

  private extractMethodArguments(context: ExecutionContext, request: any): any[] {
    // This is a simplified argument extraction
    // In a real implementation, you might need more sophisticated argument mapping
    const args = [];

    // Add common arguments that fallback methods might need
    if (request.params) {
      Object.values(request.params).forEach(param => args.push(param));
    }

    if (request.query) {
      args.push(request.query);
    }

    if (request.body) {
      args.push(request.body);
    }

    return args;
  }
}

// Global circuit breaker interceptor that can be applied at the application level
@Injectable()
export class GlobalCircuitBreakerInterceptor implements NestInterceptor {
  constructor(
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const isControllerMethod = context.getType() === 'http';

    // Only apply global circuit breaking to controller methods
    if (!isControllerMethod) {
      return next.handle();
    }

    const circuitName = `global-${className}.${methodName}`;

    // Create a global circuit breaker with conservative settings
    const circuit = this.circuitBreakerService.createCircuitBreaker(circuitName, {
      failureThreshold: 10, // Higher threshold for global breaker
      resetTimeout: 30000,
      halfOpenMaxCalls: 3,
      expectedErrors: (error: any) => {
        // Don't count client errors (4xx) as global failures
        return error.status >= 400 && error.status < 500;
      },
    });

    return new Observable((subscriber) => {
      const operation = () => {
        return new Promise((resolve, reject) => {
          const subscription = next.handle().subscribe({
            next: (value) => resolve(value),
            error: (error) => reject(error),
          });

          return () => subscription.unsubscribe();
        });
      };

      circuit
        .execute(operation)
        .then((result) => {
          subscriber.next(result);
          subscriber.complete();
        })
        .catch((error) => {
          subscriber.error(error);
        });
    });
  }
}