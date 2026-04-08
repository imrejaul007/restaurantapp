import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

// Enhanced error response interface
interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error?: string;
  errors?: any;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  details?: any;
}

// Error categories for better monitoring
enum ErrorCategory {
  VALIDATION = 'validation',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly errorCounts = new Map<string, number>();
  private readonly maxErrorLogRate = 100; // Max errors to log per minute
  private readonly errorLogWindow = 60000; // 1 minute window
  private lastErrorLogReset = Date.now();

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate request ID if not present
    const requestId = (request as any).id || this.generateRequestId();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let errors: any = null;
    let category = ErrorCategory.UNKNOWN;
    let details: any = null;

    // Enhanced error handling with categorization
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        errors = (exceptionResponse as any).errors || null;
        error = (exceptionResponse as any).error || exception.constructor.name;
      } else {
        message = exceptionResponse as string;
        error = exception.constructor.name;
      }

      // Categorize HTTP exceptions
      if (status === HttpStatus.UNAUTHORIZED) {
        category = ErrorCategory.AUTHENTICATION;
      } else if (status === HttpStatus.FORBIDDEN) {
        category = ErrorCategory.AUTHORIZATION;
      } else if (status >= 400 && status < 500) {
        category = ErrorCategory.VALIDATION;
      } else if (status >= 500) {
        category = ErrorCategory.SYSTEM;
      }

    } else if (exception instanceof PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      message = this.handlePrismaError(exception);
      error = 'Database Error';
      category = ErrorCategory.DATABASE;
      details = {
        code: (exception as any).code,
        clientVersion: (exception as any).clientVersion
      };

    } else if (exception instanceof PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database validation error';
      error = 'Database Validation Error';
      category = ErrorCategory.DATABASE;
      errors = { validation: this.sanitizeDbError(exception.message) };

    } else if (exception instanceof Error) {
      // Handle different error types
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        category = ErrorCategory.VALIDATION;
        error = 'Validation Error';
      } else if (exception.name === 'UnauthorizedError') {
        status = HttpStatus.UNAUTHORIZED;
        category = ErrorCategory.AUTHENTICATION;
        error = 'Unauthorized Error';
      } else if (exception.name === 'ForbiddenError') {
        status = HttpStatus.FORBIDDEN;
        category = ErrorCategory.AUTHORIZATION;
        error = 'Forbidden Error';
      } else if (exception.name === 'TimeoutError') {
        status = HttpStatus.REQUEST_TIMEOUT;
        category = ErrorCategory.EXTERNAL_SERVICE;
        error = 'Timeout Error';
      } else {
        category = ErrorCategory.SYSTEM;
        error = 'System Error';
      }

      message = this.sanitizeErrorMessage(exception.message);
    }

    // Rate-limited error logging
    this.logErrorWithRateLimit(exception, request, status, category, requestId);

    // Create comprehensive error response
    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      message: this.sanitizeMessage(message),
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId,
      ...(errors && { errors }),
      ...(details && process.env.NODE_ENV === 'development' && { details })
    };

    // Add security headers
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');

    // Set appropriate cache headers for errors
    if (status >= 500) {
      response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    response.status(status).json(errorResponse);
  }

  private handlePrismaError(error: PrismaClientKnownRequestError): string {
    switch ((error as any).code) {
      case 'P2000':
        return 'The provided value is too long';
      case 'P2001':
        return 'Record does not exist';
      case 'P2002':
        const target = (error as any).meta?.target;
        if (Array.isArray(target)) {
          return `${target.join(', ')} must be unique`;
        }
        return 'Unique constraint violation';
      case 'P2003':
        return 'Foreign key constraint violation';
      case 'P2004':
        return 'Database constraint violation';
      case 'P2005':
        return 'Invalid field value';
      case 'P2006':
        return 'Invalid field value';
      case 'P2007':
        return 'Data validation error';
      case 'P2008':
        return 'Failed to parse query';
      case 'P2009':
        return 'Failed to validate query';
      case 'P2010':
        return 'Raw query failed';
      case 'P2011':
        return 'Null constraint violation';
      case 'P2012':
        return 'Missing required value';
      case 'P2013':
        return 'Missing required argument';
      case 'P2014':
        return 'Required relation violation';
      case 'P2015':
        return 'Related record not found';
      case 'P2016':
        return 'Query interpretation error';
      case 'P2017':
        return 'Records are not connected';
      case 'P2018':
        return 'Required connected records not found';
      case 'P2019':
        return 'Input error';
      case 'P2020':
        return 'Value out of range';
      case 'P2021':
        return 'Table does not exist';
      case 'P2022':
        return 'Column does not exist';
      case 'P2023':
        return 'Inconsistent column data';
      case 'P2024':
        return 'Connection pool timeout';
      case 'P2025':
        return 'Record not found';
      case 'P2026':
        return 'Unsupported feature';
      case 'P2027':
        return 'Multiple errors occurred';
      default:
        return `Database error: ${(error as Error).message}`;
    }
  }

  private logErrorWithRateLimit(
    exception: unknown,
    request: Request,
    status: number,
    category: ErrorCategory,
    requestId: string
  ): void {
    // Reset error count window if needed
    const now = Date.now();
    if (now - this.lastErrorLogReset > this.errorLogWindow) {
      this.errorCounts.clear();
      this.lastErrorLogReset = now;
    }

    // Rate limit error logging per category
    const errorKey = `${category}_${status}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;

    if (currentCount < this.maxErrorLogRate) {
      this.errorCounts.set(errorKey, currentCount + 1);

      // Enhanced error logging with context
      const errorContext = {
        requestId,
        category,
        userAgent: request.headers['user-agent'],
        ip: request.ip || request.connection.remoteAddress,
        url: request.url,
        method: request.method,
        userId: (request as any).user?.id,
        timestamp: new Date().toISOString()
      };

      if (status >= 500) {
        this.logger.error(
          `[${category.toUpperCase()}] HTTP ${status} Error: ${request.method} ${request.url}`,
          {
            ...errorContext,
            stack: exception instanceof Error ? exception.stack : undefined,
            exception: exception instanceof Error ? exception.message : exception
          }
        );
      } else if (status >= 400) {
        this.logger.warn(
          `[${category.toUpperCase()}] HTTP ${status} Error: ${request.method} ${request.url}`,
          {
            ...errorContext,
            message: exception instanceof Error ? exception.message : 'Client error'
          }
        );
      }
    } else if (currentCount === this.maxErrorLogRate) {
      // Log rate limit warning once
      this.errorCounts.set(errorKey, currentCount + 1);
      this.logger.warn(
        `Error logging rate limit reached for ${category}:${status}. Suppressing further logs in this window.`
      );
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeMessage(message: string): string {
    if (!message || typeof message !== 'string') {
      return 'An error occurred';
    }

    // Remove sensitive information patterns
    return message
      .replace(/password[=:\s]+\S+/gi, 'password=***')
      .replace(/token[=:\s]+\S+/gi, 'token=***')
      .replace(/key[=:\s]+\S+/gi, 'key=***')
      .replace(/secret[=:\s]+\S+/gi, 'secret=***')
      .replace(/authorization[=:\s]+\S+/gi, 'authorization=***')
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '****-****-****-****') // Credit card
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***') // Email
      .slice(0, 500); // Limit message length
  }

  private sanitizeErrorMessage(message: string): string {
    // Additional sanitization for generic error messages
    return this.sanitizeMessage(message)
      .replace(/at Object\.[^(]+\([^)]+\)/g, '[Function]') // Stack trace cleanup
      .replace(/\/[^\s]+\/node_modules\/[^\s]+/g, '[Module]') // Module paths
      .replace(/file:\/\/\/[^\s]+/g, '[File]'); // File paths
  }

  private sanitizeDbError(message: string): string {
    // Sanitize database-specific error messages
    return this.sanitizeMessage(message)
      .replace(/Query: .+/g, 'Query: [REDACTED]') // SQL queries
      .replace(/Parameters: \[.+\]/g, 'Parameters: [REDACTED]') // Query parameters
      .replace(/Table `[^`]+`/g, 'Table [REDACTED]') // Table names in some cases
      .slice(0, 200); // Shorter limit for DB errors
  }

  // Error metrics for monitoring
  getErrorMetrics() {
    return {
      errorCounts: Object.fromEntries(this.errorCounts),
      lastReset: this.lastErrorLogReset,
      rateLimitThreshold: this.maxErrorLogRate,
      windowDuration: this.errorLogWindow
    };
  }
}