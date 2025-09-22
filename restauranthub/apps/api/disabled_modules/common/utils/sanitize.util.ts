import { createDOMPurify } from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOMPurify instance for server-side use
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'u', 'em', 'strong', 'br', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
}

/**
 * Strip all HTML tags from content
 * @param html - HTML string to strip
 * @returns Plain text string
 */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  });
}

/**
 * Sanitize plain text input (remove potentially dangerous characters)
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  // Remove null bytes and control characters except newlines and tabs
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Sanitize email input
 * @param email - Email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }

  return email
    .toLowerCase()
    .replace(/[^\w@.-]/g, '')
    .trim();
}

/**
 * Sanitize phone number input
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }

  return phone
    .replace(/[^\d+\-\s()]/g, '')
    .trim();
}

/**
 * Sanitize an object recursively, applying appropriate sanitization to string values
 * @param obj - Object to sanitize
 * @param options - Sanitization options
 * @returns Sanitized object
 */
export function sanitizeObject(
  obj: any,
  options: {
    htmlFields?: string[];
    textFields?: string[];
    emailFields?: string[];
    phoneFields?: string[];
  } = {}
): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        if (options.htmlFields?.includes(key)) {
          sanitized[key] = sanitizeHtml(value);
        } else if (options.emailFields?.includes(key)) {
          sanitized[key] = sanitizeEmail(value);
        } else if (options.phoneFields?.includes(key)) {
          sanitized[key] = sanitizePhone(value);
        } else if (options.textFields?.includes(key)) {
          sanitized[key] = sanitizeText(value);
        } else {
          // Default to text sanitization for unknown string fields
          sanitized[key] = sanitizeText(value);
        }
      } else {
        sanitized[key] = sanitizeObject(value, options);
      }
    }

    return sanitized;
  }

  return obj;
}