import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class ErrorHandlingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorHandlingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.debug(`${request.method} ${request.url} completed in ${duration}ms`);
      }),
      catchError(error => {
        const duration = Date.now() - startTime;
        this.logger.error(`${request.method} ${request.url} failed after ${duration}ms`, error.stack);
        return throwError(() => error);
      })
    );
  }
}