import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FilterXSS } from 'xss';
import * as mongoSanitize from 'express-mongo-sanitize';

@Injectable()
export class SanitizationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SanitizationMiddleware.name);
  private readonly xssFilter = new FilterXSS({
    whiteList: {}, // Remove all HTML tags
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Sanitize request body, query parameters, and params
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }

    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }

    if (req.params) {
      req.params = this.sanitizeObject(req.params);
    }

    next();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeValue(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeValue(key);
      sanitized[sanitizedKey] = this.sanitizeObject(value);
    }

    return sanitized;
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      // Remove potential XSS
      let sanitized = this.xssFilter.process(value);

      // Remove potential NoSQL injection attempts
      // mongoSanitize.sanitize expects an object, so we wrap the string in an object
      const mongoSanitized = mongoSanitize.sanitize({ value: sanitized });
      if (mongoSanitized && typeof mongoSanitized === 'object' && 'value' in mongoSanitized) {
        sanitized = String(mongoSanitized.value || '');
      } else {
        // If sanitization removed the value completely, use empty string
        sanitized = '';
      }

      // Remove potential SQL injection patterns
      sanitized = this.removeSQLInjectionPatterns(sanitized);

      // Normalize whitespace
      sanitized = sanitized.trim().replace(/\s+/g, ' ');

      return sanitized;
    }

    return value;
  }

  private removeSQLInjectionPatterns(input: string): string {
    // Common SQL injection patterns to remove/escape
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
      /(-{2,}|\/\*[\s\S]*?\*\/)/g, // SQL comments
      /(;|\||&)/g, // Command separators
      /(\bOR\b|\bAND\b)(\s+)?\d+(\s+)?=(\s+)?\d+/gi, // OR/AND injection patterns
      /('|(\\)?('|"|`|;|\\|\/\*))/g, // Quote escaping attempts
    ];

    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return sanitized;
  }
}

// Additional utility functions for specific sanitization needs
export class SanitizationUtils {
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim().replace(/[^a-zA-Z0-9@._-]/g, '');
  }

  static sanitizePhoneNumber(phone: string): string {
    return phone.replace(/[^0-9+()-\s]/g, '').trim();
  }

  static sanitizeAlphanumeric(input: string): string {
    return input.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  }

  static sanitizeNumeric(input: string): string {
    return input.replace(/[^0-9.-]/g, '');
  }

  static sanitizeURL(url: string): string {
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }
      return urlObj.toString();
    } catch {
      return '';
    }
  }

  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/\.{2,}/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .substring(0, 255);
  }

  static sanitizeJSON(input: string): any {
    try {
      const parsed = JSON.parse(input);
      return this.deepSanitizeObject(parsed);
    } catch {
      return null;
    }
  }

  private static deepSanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      if (typeof obj === 'string') {
        return new FilterXSS().process(obj);
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.deepSanitizeObject(value);
    }

    return sanitized;
  }
}