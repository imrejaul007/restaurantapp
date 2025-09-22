import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true, // Strip non-whitelisted properties
    forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
    transform: true, // Transform payload to DTO instance
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (validationErrors: ValidationError[] = []) => {
      const errors = validationErrors.map(error => ({
        field: error.property,
        constraints: error.constraints,
        value: error.value
      }));

      return new BadRequestException({
        message: 'Validation failed',
        errors,
        statusCode: 400
      });
    },
  });
}