import { LoggerService } from '@nestjs/common';

export class SecureLogger implements LoggerService {
  private sensitiveFields = new Set([
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'socialSecurityNumber',
    'twoFactorSecret'
  ]);

  log(message: any, context?: string): void {
    console.log(this.sanitizeMessage(message), context);
  }

  error(message: any, trace?: string, context?: string): void {
    console.error(this.sanitizeMessage(message), trace, context);
  }

  warn(message: any, context?: string): void {
    console.warn(this.sanitizeMessage(message), context);
  }

  debug(message: any, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.sanitizeMessage(message), context);
    }
  }

  verbose(message: any, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[VERBOSE]', this.sanitizeMessage(message), context);
    }
  }

  private sanitizeMessage(message: any): any {
    if (typeof message === 'string') {
      return this.sanitizeString(message);
    }

    if (typeof message === 'object' && message !== null) {
      return this.sanitizeObject(message);
    }

    return message;
  }

  private sanitizeString(str: string): string {
    // Mask potential tokens and sensitive data in strings
    return str.replace(/\b[A-Za-z0-9+/]{20,}={0,2}\b/g, '[REDACTED_TOKEN]')
              .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_CARD]')
              .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeMessage(item));
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      if (this.sensitiveFields.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('token')) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}