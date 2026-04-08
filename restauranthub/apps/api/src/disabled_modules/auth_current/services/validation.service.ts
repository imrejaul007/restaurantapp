import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as validator from 'validator';
import * as DOMPurify from 'isomorphic-dompurify';
import * as xss from 'xss';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
  metadata?: {
    originalLength: number;
    sanitizedLength: number;
    removedElements: string[];
  };
}

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'phone' | 'url' | 'uuid' | 'date' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
  sanitize?: boolean;
  allowedTags?: string[];
  allowedAttributes?: { [tag: string]: string[] };
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validate and sanitize input data based on schema
   */
  validateAndSanitize(data: any, schema: ValidationSchema): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: any = {};
    const metadata = {
      originalLength: JSON.stringify(data).length,
      sanitizedLength: 0,
      removedElements: [] as string[],
    };

    try {
      for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        const fieldResult = this.validateField(field, value, rules);

        if (!fieldResult.isValid) {
          errors.push(...fieldResult.errors);
        } else if (fieldResult.sanitizedValue !== undefined) {
          sanitizedData[field] = fieldResult.sanitizedValue;
        } else if (value !== undefined) {
          sanitizedData[field] = value;
        }

        if (fieldResult.metadata?.removedElements) {
          metadata.removedElements.push(...fieldResult.metadata.removedElements);
        }
      }

      metadata.sanitizedLength = JSON.stringify(sanitizedData).length;

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedValue: sanitizedData,
        metadata,
      };
    } catch (error) {
      this.logger.error('Validation failed', error);
      return {
        isValid: false,
        errors: ['Validation process failed'],
      };
    }
  }

  /**
   * Validate individual field
   */
  private validateField(fieldName: string, value: any, rules: ValidationRule): ValidationResult {
    const errors: string[] = [];
    let sanitizedValue = value;
    const removedElements: string[] = [];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors };
    }

    // Skip validation if value is not provided and not required
    if (value === undefined || value === null) {
      return { isValid: true, errors: [] };
    }

    // Type validation
    if (rules.type) {
      const typeResult = this.validateType(fieldName, value, rules.type);
      if (!typeResult.isValid) {
        errors.push(...typeResult.errors);
      }
    }

    // String validations
    if (typeof value === 'string') {
      // Length validation
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${fieldName} must be no more than ${rules.maxLength} characters long`);
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${fieldName} does not match the required pattern`);
      }

      // Sanitization
      if (rules.sanitize) {
        const sanitizationResult = this.sanitizeString(value, rules);
        sanitizedValue = sanitizationResult.sanitizedValue;
        if (sanitizationResult.removedElements) {
          removedElements.push(...sanitizationResult.removedElements);
        }
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${fieldName} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${fieldName} must be no more than ${rules.max}`);
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${fieldName} must be one of: ${rules.enum.join(', ')}`);
    }

    // Custom validation
    if (rules.custom) {
      const customResult = rules.custom(value);
      if (customResult !== true) {
        errors.push(typeof customResult === 'string' ? customResult : `${fieldName} failed custom validation`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
      metadata: { originalLength: 0, sanitizedLength: 0, removedElements },
    };
  }

  /**
   * Validate field type
   */
  private validateType(fieldName: string, value: any, expectedType: string): ValidationResult {
    const errors: string[] = [];

    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${fieldName} must be a string`);
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${fieldName} must be a valid number`);
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !validator.isEmail(value)) {
          errors.push(`${fieldName} must be a valid email address`);
        }
        break;

      case 'phone':
        if (typeof value !== 'string' || !this.isValidPhone(value)) {
          errors.push(`${fieldName} must be a valid phone number`);
        }
        break;

      case 'url':
        if (typeof value !== 'string' || !validator.isURL(value)) {
          errors.push(`${fieldName} must be a valid URL`);
        }
        break;

      case 'uuid':
        if (typeof value !== 'string' || !validator.isUUID(value)) {
          errors.push(`${fieldName} must be a valid UUID`);
        }
        break;

      case 'date':
        if (!validator.isISO8601(value)) {
          errors.push(`${fieldName} must be a valid ISO 8601 date`);
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${fieldName} must be a boolean`);
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${fieldName} must be an array`);
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push(`${fieldName} must be an object`);
        }
        break;

      default:
        errors.push(`Unknown type validation: ${expectedType}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Sanitize string content
   */
  private sanitizeString(value: string, rules: ValidationRule): {
    sanitizedValue: string;
    removedElements: string[];
  } {
    let sanitized = value;
    const removedElements: string[] = [];

    // Remove null bytes
    sanitized = sanitized.replace(/\x00/g, '');

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // HTML sanitization
    if (rules.allowedTags || rules.allowedAttributes) {
      const originalLength = sanitized.length;
      sanitized = xss(sanitized, {
        allowList: rules.allowedTags ? this.buildXssAllowList(rules) : {},
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style'],
      });

      if (sanitized.length < originalLength) {
        removedElements.push('HTML elements');
      }
    } else {
      // Strip all HTML by default
      const originalLength = sanitized.length;
      sanitized = validator.escape(sanitized);
      if (sanitized.length !== originalLength) {
        removedElements.push('HTML characters');
      }
    }

    // Remove SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\/\*[\w\W]*?(?:\*\/|$))/g,
      /(\-\-[^\r\n]*)/g,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, '');
        removedElements.push('SQL injection patterns');
      }
    }

    // Remove JavaScript event handlers
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    return { sanitizedValue: sanitized, removedElements };
  }

  /**
   * Build XSS allowlist from rules
   */
  private buildXssAllowList(rules: ValidationRule): any {
    const allowList: any = {};

    if (rules.allowedTags) {
      for (const tag of rules.allowedTags) {
        allowList[tag] = rules.allowedAttributes?.[tag] || [];
      }
    }

    return allowList;
  }

  /**
   * Validate phone number (Indian format support)
   */
  private isValidPhone(phone: string): boolean {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Indian phone number patterns
    const patterns = [
      /^[6-9]\d{9}$/, // 10-digit mobile number
      /^91[6-9]\d{9}$/, // With country code
      /^0[6-9]\d{9}$/, // With leading zero
    ];

    return patterns.some(pattern => pattern.test(digits));
  }

  /**
   * Validate Aadhaar number
   */
  validateAadhaar(aadhaar: string): ValidationResult {
    const errors: string[] = [];

    if (!aadhaar) {
      errors.push('Aadhaar number is required');
      return { isValid: false, errors };
    }

    // Remove spaces and dashes
    const cleanedAadhaar = aadhaar.replace(/[\s-]/g, '');

    // Check if it's 12 digits
    if (!/^\d{12}$/.test(cleanedAadhaar)) {
      errors.push('Aadhaar number must be 12 digits');
    }

    // Luhn algorithm check for Aadhaar
    if (errors.length === 0 && !this.validateAadhaarChecksum(cleanedAadhaar)) {
      errors.push('Invalid Aadhaar number checksum');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: cleanedAadhaar,
    };
  }

  /**
   * Validate PAN number
   */
  validatePAN(pan: string): ValidationResult {
    const errors: string[] = [];

    if (!pan) {
      errors.push('PAN number is required');
      return { isValid: false, errors };
    }

    const cleanedPAN = pan.toUpperCase().trim();

    // PAN format: 5 letters, 4 digits, 1 letter
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanedPAN)) {
      errors.push('Invalid PAN number format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: cleanedPAN,
    };
  }

  /**
   * Validate GST number
   */
  validateGST(gst: string): ValidationResult {
    const errors: string[] = [];

    if (!gst) {
      errors.push('GST number is required');
      return { isValid: false, errors };
    }

    const cleanedGST = gst.toUpperCase().trim();

    // GST format: 15 characters
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanedGST)) {
      errors.push('Invalid GST number format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: cleanedGST,
    };
  }

  /**
   * Validate IFSC code
   */
  validateIFSC(ifsc: string): ValidationResult {
    const errors: string[] = [];

    if (!ifsc) {
      errors.push('IFSC code is required');
      return { isValid: false, errors };
    }

    const cleanedIFSC = ifsc.toUpperCase().trim();

    // IFSC format: 4 letters + 7 alphanumeric
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanedIFSC)) {
      errors.push('Invalid IFSC code format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: cleanedIFSC,
    };
  }

  /**
   * Validate and sanitize file upload
   */
  validateFileUpload(file: any, allowedTypes: string[], maxSize: number): ValidationResult {
    const errors: string[] = [];

    if (!file) {
      errors.push('File is required');
      return { isValid: false, errors };
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
    }

    // Check file type
    const fileExtension = file.originalname?.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
    }

    // Check MIME type
    const allowedMimeTypes = this.getmimeTypesForExtensions(allowedTypes);
    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push('Invalid file MIME type');
    }

    // Check for dangerous file names
    if (this.isDangerousFileName(file.originalname)) {
      errors.push('Dangerous file name detected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: {
        ...file,
        originalname: this.sanitizeFileName(file.originalname),
      },
    };
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    // Length check
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }

    // Complexity checks
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Common password check
    if (this.isCommonPassword(password)) {
      errors.push('Password is too common');
    }

    // Patterns to avoid
    if (/(.)\1{3,}/.test(password)) {
      errors.push('Password cannot have 4 or more consecutive identical characters');
    }

    if (/123456|654321|abcdef|qwerty|password/i.test(password)) {
      errors.push('Password contains common sequences');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Bulk validation for arrays
   */
  validateArray(items: any[], itemSchema: ValidationSchema): ValidationResult {
    const errors: string[] = [];
    const sanitizedItems: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const itemResult = this.validateAndSanitize(items[i], itemSchema);
      if (!itemResult.isValid) {
        errors.push(`Item ${i}: ${itemResult.errors.join(', ')}`);
      } else {
        sanitizedItems.push(itemResult.sanitizedValue);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitizedItems,
    };
  }

  // Helper methods

  private validateAadhaarChecksum(aadhaar: string): boolean {
    // Verhoeff algorithm for Aadhaar validation
    const d = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];

    const p = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];

    let c = 0;
    const myArray = aadhaar.split('').reverse();

    for (let i = 0; i < myArray.length; i++) {
      c = d[c][p[((i + 1) % 8)][parseInt(myArray[i])]];
    }

    return c === 0;
  }

  private getmimeTypesForExtensions(extensions: string[]): string[] {
    const mimeMap: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return extensions.map(ext => mimeMap[ext]).filter(Boolean);
  }

  private isDangerousFileName(filename: string): boolean {
    const dangerousPatterns = [
      /\.(exe|bat|cmd|com|pif|scr|jar|sh|ps1|vbs)$/i,
      /\.\./,
      /[<>:"|?*]/,
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,
    ];

    return dangerousPatterns.some(pattern => pattern.test(filename));
  }

  private sanitizeFileName(filename: string): string {
    return filename
      .replace(/[<>:"|?*]/g, '')
      .replace(/\.\./g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      'dragon', '123123', 'football', 'iloveyou', 'admin123'
    ];

    return commonPasswords.includes(password.toLowerCase());
  }
}