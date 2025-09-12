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

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        errors = (exceptionResponse as any).errors || null;
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      message = this.handlePrismaError(exception);
    } else if (exception instanceof PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database validation error';
      errors = { validation: exception.message };
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    // Log the error
    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} Error: ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : exception,
      );
    } else {
      this.logger.warn(
        `HTTP ${status} Error: ${request.method} ${request.url} - ${message}`,
      );
    }

    // Send error response
    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

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
}