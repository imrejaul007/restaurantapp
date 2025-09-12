import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { sanitize } from 'class-sanitizer';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(CustomValidationPipe.name);

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Transform plain object to class instance
    const object = plainToInstance(metatype, value);

    // Sanitize the object
    sanitize(object);

    // Validate the object
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    });

    if (errors.length > 0) {
      const errorMessages = this.formatErrors(errors);
      this.logger.warn(`Validation failed: ${JSON.stringify(errorMessages)}`);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorMessages,
        statusCode: 400,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: any[]): any {
    const result: Record<string, any> = {};
    
    errors.forEach((error) => {
      const property = error.property;
      const constraints = error.constraints;
      
      if (constraints) {
        result[property] = Object.values(constraints);
      }
      
      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        result[property] = this.formatErrors(error.children);
      }
    });
    
    return result;
  }
}