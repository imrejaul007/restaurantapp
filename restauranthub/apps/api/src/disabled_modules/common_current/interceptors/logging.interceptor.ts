import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const { method, originalUrl, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = (request as any).user?.id || 'anonymous';

    this.logger.log(
      `Incoming Request: ${method} ${originalUrl} - User: ${userId} - IP: ${ip} - ${userAgent}`,
    );

    return next.handle().pipe(
      tap((data) => {
        const delay = Date.now() - now;
        this.logger.log(
          `Outgoing Response: ${method} ${originalUrl} - ${response.statusCode} - ${delay}ms`,
        );
      }),
      catchError((error) => {
        const delay = Date.now() - now;
        this.logger.error(
          `Error Response: ${method} ${originalUrl} - ${(error as any).status || 500} - ${delay}ms - ${(error as Error).message}`,
          (error as Error).stack,
        );
        throw error;
      }),
    );
  }
}