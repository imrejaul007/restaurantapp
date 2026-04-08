import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import * as DOMPurify from 'isomorphic-dompurify';
import * as validator from 'validator';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: { [key: string]: string[] };
  stripTags?: boolean;
  escapeHtml?: boolean;
  trimWhitespace?: boolean;
  normalizeEmail?: boolean;
  removeXSS?: boolean;
}

@Injectable()
export class InputValidationService {
  private readonly logger = new Logger(InputValidationService.name);

  // XSS patterns to detect and block
  private readonly xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
    /onclick=/gi,
    /onmouseover=/gi,
    /expression\(/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  ];

  // SQL injection patterns
  private readonly sqlInjectionPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/ix,
    /exec(\s|\+)+(s|x)p\w+/ix,
    /union([^a-z]|[\s\+\-\/*])*select/ix,
    /select([^a-z]|[\s\+\-\/*])*from/ix,
    /insert([^a-z]|[\s\+\-\/*])*into/ix,
    /delete([^a-z]|[\s\+\-\/*])*from/ix,
    /update([^a-z]|[\s\+\-\/*])*set/ix,
    /drop([^a-z]|[\s\+\-\/*])*table/ix,
    /create([^a-z]|[\s\+\-\/*])*table/ix,
    /alter([^a-z]|[\s\+\-\/*])*table/ix,
  ];

  // Command injection patterns
  private readonly commandInjectionPatterns = [
    /[;&|`\$\(\)><]/,
    /\b(cat|ls|pwd|id|uname|whoami|which|where|ps|kill|rm|mkdir|rmdir|mv|cp|chmod|chown)\b/i,
    /\.\./,
    /\/etc\/passwd/i,
    /\/bin\//i,
    /cmd\.exe/i,
    /powershell/i,
  ];

  // LDAP injection patterns
  private readonly ldapInjectionPatterns = [
    /\*|\(|\)|\\|\/|\!|&|\||=|<|>|~|\+|-|;|,|\x00/,
  ];

  // Path traversal patterns
  private readonly pathTraversalPatterns = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%2e%2e\\/i,
    /\.\.%2f/i,
    /\.\.%5c/i,
  ];

  /**
   * Comprehensive input sanitization
   */
  async sanitizeInput(input: any, options: SanitizationOptions = {}): Promise<any> {
    if (input === null || input === undefined) {
      return input;
    }

    const defaultOptions: SanitizationOptions = {
      stripTags: true,
      escapeHtml: true,
      trimWhitespace: true,
      removeXSS: true,
      ...options,
    };

    if (typeof input === 'string') {
      return this.sanitizeString(input, defaultOptions);
    }

    if (Array.isArray(input)) {
      return Promise.all(input.map(item => this.sanitizeInput(item, options)));
    }

    if (typeof input === 'object') {
      const sanitizedObject: any = {};
      for (const [key, value] of Object.entries(input)) {
        const sanitizedKey = await this.sanitizeString(key, { stripTags: true, escapeHtml: true });
        sanitizedObject[sanitizedKey] = await this.sanitizeInput(value, options);
      }
      return sanitizedObject;
    }

    return input;
  }

  private async sanitizeString(input: string, options: SanitizationOptions): Promise<string> {
    let sanitized = input;

    // Trim whitespace
    if (options.trimWhitespace) {
      sanitized = sanitized.trim();
    }

    // Remove XSS patterns
    if (options.removeXSS) {
      sanitized = this.removeXSSPatterns(sanitized);
    }

    // Escape HTML
    if (options.escapeHtml) {
      sanitized = validator.escape(sanitized);
    }

    // Strip tags if configured
    if (options.stripTags) {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: options.allowedTags || [],
        ALLOWED_ATTR: options.allowedAttributes || {},
      });
    }

    // Normalize email
    if (options.normalizeEmail && validator.isEmail(sanitized)) {
      sanitized = validator.normalizeEmail(sanitized) || sanitized;
    }

    return sanitized;
  }

  /**
   * Validate input against security threats
   */
  async validateSecurity(input: any, fieldName: string = 'input'): Promise<ValidationResult> {
    const errors: string[] = [];

    if (typeof input === 'string') {
      // Check for XSS
      if (this.containsXSS(input)) {
        errors.push(`${fieldName} contains potential XSS payload`);
      }

      // Check for SQL injection
      if (this.containsSQLInjection(input)) {
        errors.push(`${fieldName} contains potential SQL injection`);
      }

      // Check for command injection
      if (this.containsCommandInjection(input)) {
        errors.push(`${fieldName} contains potential command injection`);
      }

      // Check for LDAP injection
      if (this.containsLDAPInjection(input)) {
        errors.push(`${fieldName} contains potential LDAP injection`);
      }

      // Check for path traversal
      if (this.containsPathTraversal(input)) {
        errors.push(`${fieldName} contains potential path traversal`);
      }

      // Check for excessively long input (potential DoS)
      if (input.length > 10000) {
        errors.push(`${fieldName} exceeds maximum allowed length`);
      }

      // Check for null bytes
      if (input.includes('\x00')) {
        errors.push(`${fieldName} contains null bytes`);
      }
    }

    if (Array.isArray(input)) {
      // Validate array elements
      for (let i = 0; i < input.length; i++) {
        const elementResult = await this.validateSecurity(input[i], `${fieldName}[${i}]`);
        errors.push(...elementResult.errors);
      }

      // Check for excessively large arrays
      if (input.length > 1000) {
        errors.push(`${fieldName} array exceeds maximum allowed size`);
      }
    }

    if (typeof input === 'object' && input !== null) {
      // Validate object properties
      for (const [key, value] of Object.entries(input)) {
        const keyResult = await this.validateSecurity(key, `${fieldName}.key`);
        const valueResult = await this.validateSecurity(value, `${fieldName}.${key}`);
        errors.push(...keyResult.errors, ...valueResult.errors);
      }

      // Check for excessively deep nesting
      if (this.getObjectDepth(input) > 10) {
        errors.push(`${fieldName} object nesting exceeds maximum allowed depth`);
      }

      // Check for too many properties
      if (Object.keys(input).length > 100) {
        errors.push(`${fieldName} object has too many properties`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email format and security
   */
  validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    if (!email) {
      errors.push('Email is required');
      return { isValid: false, errors };
    }

    // Basic email validation
    if (!validator.isEmail(email)) {
      errors.push('Invalid email format');
    }

    // Additional security checks
    const securityResult = this.validateSecurity(email, 'email');
    errors.push(...securityResult.errors);

    // Check for disposable email domains
    if (this.isDisposableEmail(email)) {
      errors.push('Disposable email addresses are not allowed');
    }

    // Normalize and return sanitized email
    const sanitizedEmail = validator.normalizeEmail(email);

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitizedEmail,
    };
  }

  /**
   * Validate password strength and security
   */
  validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    // Length check
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }

    // Character requirements
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

    // Check for common weak patterns
    if (/(.)\1{3,}/.test(password)) {
      errors.push('Password cannot contain four or more consecutive identical characters');
    }

    if (/123456|654321|abcdef|qwerty|password|admin|root/i.test(password)) {
      errors.push('Password contains common sequences and is not allowed');
    }

    // Check for personal information patterns (would need user context)
    // This is a simplified check - in practice, you'd compare against user data
    if (/name|email|username|birthday/i.test(password)) {
      errors.push('Password should not contain personal information');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phone: string, countryCode?: string): ValidationResult {
    const errors: string[] = [];

    if (!phone) {
      return { isValid: true, errors }; // Phone is optional
    }

    // Remove common formatting characters
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');

    // Basic format validation
    if (!validator.isMobilePhone(cleanPhone, 'any')) {
      errors.push('Invalid phone number format');
    }

    // Security validation
    const securityResult = this.validateSecurity(phone, 'phone');
    errors.push(...securityResult.errors);

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: cleanPhone,
    };
  }

  /**
   * Validate URL
   */
  validateURL(url: string, options: { allowedProtocols?: string[]; allowLocalhost?: boolean } = {}): ValidationResult {
    const errors: string[] = [];

    if (!url) {
      return { isValid: true, errors };
    }

    const defaultOptions = {
      allowedProtocols: ['http', 'https'],
      allowLocalhost: false,
      ...options,
    };

    // Basic URL validation
    if (!validator.isURL(url, {
      protocols: defaultOptions.allowedProtocols,
      require_protocol: true,
      allow_underscores: false,
      allow_trailing_dot: false,
    })) {
      errors.push('Invalid URL format');
    }

    // Security checks
    const securityResult = this.validateSecurity(url, 'url');
    errors.push(...securityResult.errors);

    // Check for localhost/internal URLs in production
    if (!defaultOptions.allowLocalhost && process.env.NODE_ENV === 'production') {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1' || urlObj.hostname.startsWith('192.168.')) {
        errors.push('Internal URLs are not allowed');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: url,
    };
  }

  /**
   * Security threat detection methods
   */
  private containsXSS(input: string): boolean {
    return this.xssPatterns.some(pattern => pattern.test(input));
  }

  private containsSQLInjection(input: string): boolean {
    return this.sqlInjectionPatterns.some(pattern => pattern.test(input));
  }

  private containsCommandInjection(input: string): boolean {
    return this.commandInjectionPatterns.some(pattern => pattern.test(input));
  }

  private containsLDAPInjection(input: string): boolean {
    return this.ldapInjectionPatterns.some(pattern => pattern.test(input));
  }

  private containsPathTraversal(input: string): boolean {
    return this.pathTraversalPatterns.some(pattern => pattern.test(input));
  }

  private removeXSSPatterns(input: string): string {
    let sanitized = input;
    for (const pattern of this.xssPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }
    return sanitized;
  }

  private getObjectDepth(obj: any): number {
    if (typeof obj !== 'object' || obj === null) {
      return 0;
    }

    let maxDepth = 0;
    for (const value of Object.values(obj)) {
      const depth = this.getObjectDepth(value);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth + 1;
  }

  private isDisposableEmail(email: string): boolean {
    // List of known disposable email domains
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      'yopmail.com',
      'temp-mail.org',
      // Add more as needed
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  }

  /**
   * Validate file upload
   */
  validateFileUpload(
    file: Express.Multer.File,
    options: {
      allowedMimeTypes?: string[];
      maxSize?: number;
      allowedExtensions?: string[];
    } = {}
  ): ValidationResult {
    const errors: string[] = [];

    if (!file) {
      errors.push('File is required');
      return { isValid: false, errors };
    }

    const defaultOptions = {
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
      ...options,
    };

    // Check file size
    if (file.size > defaultOptions.maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${defaultOptions.maxSize} bytes`);
    }

    // Check MIME type
    if (!defaultOptions.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check file extension
    const fileExtension = '.' + file.originalname.split('.').pop()?.toLowerCase();
    if (!defaultOptions.allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension ${fileExtension} is not allowed`);
    }

    // Check for malicious file names
    const securityResult = this.validateSecurity(file.originalname, 'filename');
    errors.push(...securityResult.errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Rate limiting validation
   */
  async validateRateLimit(
    identifier: string,
    action: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    // This would typically use Redis or another cache
    // For now, we'll use a simple in-memory implementation
    const key = `rate_limit:${identifier}:${action}`;

    // In a real implementation, you would:
    // 1. Check current count in Redis
    // 2. Increment counter
    // 3. Set expiration if first request
    // 4. Return remaining requests and reset time

    return {
      allowed: true, // Simplified for now
      remaining: limit - 1,
      resetTime: new Date(Date.now() + windowMs),
    };
  }

  /**
   * Content validation for rich text
   */
  validateRichText(content: string, options: { maxLength?: number; allowedTags?: string[] } = {}): ValidationResult {
    const errors: string[] = [];

    if (!content) {
      return { isValid: true, errors };
    }

    const defaultOptions = {
      maxLength: 50000,
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ...options,
    };

    // Check length
    if (content.length > defaultOptions.maxLength) {
      errors.push(`Content exceeds maximum length of ${defaultOptions.maxLength} characters`);
    }

    // Security validation
    const securityResult = this.validateSecurity(content, 'content');
    errors.push(...securityResult.errors);

    // Sanitize HTML
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: defaultOptions.allowedTags,
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitizedContent,
    };
  }

  /**
   * Comprehensive request validation
   */
  async validateRequest(requestData: any): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Validate overall structure
      const structureResult = await this.validateSecurity(requestData, 'request');
      errors.push(...structureResult.errors);

      // Check for excessively large payload
      const jsonString = JSON.stringify(requestData);
      if (jsonString.length > 1024 * 1024) { // 1MB
        errors.push('Request payload exceeds maximum allowed size');
      }

      // Sanitize the entire request
      const sanitizedData = await this.sanitizeInput(requestData);

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedValue: sanitizedData,
      };
    } catch (error) {
      this.logger.error('Request validation error:', error);
      return {
        isValid: false,
        errors: ['Request validation failed'],
      };
    }
  }
}