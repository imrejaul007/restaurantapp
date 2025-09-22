import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Strong Password Validator
 *
 * Enforces strong password requirements:
 * - Minimum 12 characters (production security standard)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - No common weak patterns
 */
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    if (typeof password !== 'string') return false;

    // Minimum length check
    if (password.length < 12) return false;

    // Character requirements
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      return false;
    }

    // Check for common weak patterns
    const weakPatterns = [
      /(.)\1{2,}/, // Three or more repeated characters
      /123456|654321|abcdef|qwerty|password|admin/i, // Common sequences
      /password|admin|user|test|demo/i, // Common words
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must be at least 12 characters long and contain uppercase, lowercase, number, and special character. Avoid common patterns.';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

/**
 * Secure Email Validator
 *
 * Enhanced email validation with security considerations:
 * - Standard email format validation
 * - Domain validation
 * - Prevents email injection attacks
 * - Blocks disposable email domains (optional)
 */
@ValidatorConstraint({ name: 'isSecureEmail', async: false })
export class IsSecureEmailConstraint implements ValidatorConstraintInterface {
  validate(email: string, args: ValidationArguments) {
    if (typeof email !== 'string') return false;

    // Basic email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;

    // Security checks
    // Check for email injection patterns
    const injectionPatterns = [
      /[<>'"]/,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(email)) return false;
    }

    // Optional: Block known disposable email domains
    const disposableDomains = [
      '10minutemail.com',
      'guerrillamail.com',
      'tempmail.org',
      'mailinator.com',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && disposableDomains.includes(domain)) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Email must be a valid, secure email address from a permanent domain.';
  }
}

export function IsSecureEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSecureEmailConstraint,
    });
  };
}

/**
 * Safe Text Validator
 *
 * Validates text input to prevent injection attacks:
 * - Removes/blocks HTML tags
 * - Prevents SQL injection patterns
 * - Prevents XSS patterns
 * - Limits special characters
 */
@ValidatorConstraint({ name: 'isSafeText', async: false })
export class IsSafeTextConstraint implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    if (typeof text !== 'string') return false;

    // Check for HTML tags
    if (/<[^>]*>/.test(text)) return false;

    // Check for SQL injection patterns
    const sqlPatterns = [
      /('|(\\?'|\\'|\\\\))|(-{2})|(\?\/\*)|(\*\?\/)|(;[\s]*$)/i,
      /\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/i,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(text)) return false;
    }

    // Check for XSS patterns
    const xssPatterns = [
      /javascript:/i,
      /vbscript:/i,
      /data:/i,
      /on(click|load|error|mouseover)/i,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(text)) return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Text contains unsafe characters or patterns. Please use only safe characters.';
  }
}

export function IsSafeText(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeTextConstraint,
    });
  };
}

/**
 * JWT Token Validator
 *
 * Validates JWT token format and basic structure
 */
@ValidatorConstraint({ name: 'isValidJWT', async: false })
export class IsValidJWTConstraint implements ValidatorConstraintInterface {
  validate(token: string, args: ValidationArguments) {
    if (typeof token !== 'string') return false;

    // JWT should have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Each part should be base64url encoded
    const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
    return parts.every(part => base64UrlPattern.test(part));
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid JWT token format.';
  }
}

export function IsValidJWT(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidJWTConstraint,
    });
  };
}