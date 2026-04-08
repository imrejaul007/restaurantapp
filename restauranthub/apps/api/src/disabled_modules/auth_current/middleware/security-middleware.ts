import { Injectable, NestMiddleware, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { SecurityConfigService } from '../security-config.service';
import * as validator from 'validator';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as rateLimit from 'express-rate-limit';

export interface SecurityRequest extends Request {
  security?: {
    riskScore: number;
    threats: string[];
    sanitizedBody?: any;
    sanitizedQuery?: any;
    clientInfo: {
      ip: string;
      userAgent: string;
      fingerprint: string;
    };
  };
}

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly securityConfig: SecurityConfigService,
  ) {}

  use(req: SecurityRequest, res: Response, next: NextFunction) {
    // Initialize security context
    req.security = {
      riskScore: 0,
      threats: [],
      clientInfo: {
        ip: this.getClientIp(req),
        userAgent: req.get('User-Agent') || 'Unknown',
        fingerprint: this.generateClientFingerprint(req),
      },
    };

    // Run security checks
    this.performSecurityChecks(req, res);

    // Sanitize input data
    this.sanitizeInputData(req);

    // Log security events if suspicious
    if (req.security.riskScore > 50) {
      this.logSecurityEvent(req);
    }

    next();
  }

  private performSecurityChecks(req: SecurityRequest, res: Response): void {
    // Check for common attack patterns
    this.checkSqlInjectionPatterns(req);
    this.checkXssPatterns(req);
    this.checkPathTraversalPatterns(req);
    this.checkMaliciousHeaders(req);
    this.checkSuspiciousUserAgent(req);
    this.checkRequestSize(req);
    this.checkFileUploadSecurity(req);

    // Set security headers
    this.setSecurityHeaders(res);
  }

  private checkSqlInjectionPatterns(req: SecurityRequest): void {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\'(''|[^'])*\')/i,
      /(\;|\|\|)/,
      /(\-\-[^\r\n]*)/,
      /(\/\*[\w\W]*?(?:\*\/|$))/,
    ];

    const checkString = (str: string, context: string) => {
      for (const pattern of sqlPatterns) {
        if (pattern.test(str)) {
          req.security!.threats.push(`SQL injection attempt in ${context}`);
          req.security!.riskScore += 30;
          break;
        }
      }
    };

    // Check URL parameters
    Object.values(req.query).forEach((value, index) => {
      if (typeof value === 'string') {
        checkString(value, `query parameter ${Object.keys(req.query)[index]}`);
      }
    });

    // Check request body
    if (req.body && typeof req.body === 'object') {
      this.recursiveStringCheck(req.body, 'request body', checkString);
    }
  }

  private checkXssPatterns(req: SecurityRequest): void {
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[\s\S]*?src[\s\S]*?=[\s\S]*?javascript:/gi,
    ];

    const checkString = (str: string, context: string) => {
      for (const pattern of xssPatterns) {
        if (pattern.test(str)) {
          req.security!.threats.push(`XSS attempt in ${context}`);
          req.security!.riskScore += 25;
          break;
        }
      }
    };

    // Check all string inputs
    Object.values(req.query).forEach((value, index) => {
      if (typeof value === 'string') {
        checkString(value, `query parameter ${Object.keys(req.query)[index]}`);
      }
    });

    if (req.body && typeof req.body === 'object') {
      this.recursiveStringCheck(req.body, 'request body', checkString);
    }
  }

  private checkPathTraversalPatterns(req: SecurityRequest): void {
    const pathTraversalPatterns = [
      /\.\.[\/\\]/,
      /\.(exe|bat|sh|cmd|com|pif|scr|jar|dll|so|dylib)$/i,
      /(\/etc\/passwd|\/etc\/shadow|win\.ini|boot\.ini)/i,
    ];

    const urlPath = req.url || '';
    for (const pattern of pathTraversalPatterns) {
      if (pattern.test(urlPath)) {
        req.security!.threats.push('Path traversal attempt');
        req.security!.riskScore += 40;
        break;
      }
    }
  }

  private checkMaliciousHeaders(req: SecurityRequest): void {
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-client-ip'];
    const maliciousPatterns = [
      /[<>\"']/,
      /script/i,
      /javascript/i,
    ];

    suspiciousHeaders.forEach(header => {
      const value = req.get(header);
      if (value) {
        for (const pattern of maliciousPatterns) {
          if (pattern.test(value)) {
            req.security!.threats.push(`Malicious header: ${header}`);
            req.security!.riskScore += 15;
            break;
          }
        }
      }
    });
  }

  private checkSuspiciousUserAgent(req: SecurityRequest): void {
    const userAgent = req.get('User-Agent') || '';
    const suspiciousPatterns = [
      /bot|crawler|spider/i,
      /curl|wget|python|php/i,
      /sqlmap|nikto|nmap|burp/i,
      /^$/,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        req.security!.threats.push('Suspicious user agent');
        req.security!.riskScore += 10;
        break;
      }
    }
  }

  private checkRequestSize(req: SecurityRequest): void {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxSize = this.configService.get('MAX_REQUEST_SIZE', 10 * 1024 * 1024); // 10MB default

    if (contentLength > maxSize) {
      req.security!.threats.push('Oversized request');
      req.security!.riskScore += 20;
    }
  }

  private checkFileUploadSecurity(req: SecurityRequest): void {
    if (req.files || (req.body && req.body.files)) {
      const dangerousExtensions = [
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.jar',
        '.sh', '.ps1', '.vbs', '.js', '.jar', '.app', '.deb',
        '.pkg', '.dmg', '.iso', '.img',
      ];

      // Check for dangerous file extensions in filenames
      const checkFiles = (files: any) => {
        if (Array.isArray(files)) {
          files.forEach(file => {
            if (file.originalname || file.filename) {
              const filename = (file.originalname || file.filename).toLowerCase();
              if (dangerousExtensions.some(ext => filename.endsWith(ext))) {
                req.security!.threats.push('Dangerous file upload attempt');
                req.security!.riskScore += 35;
              }
            }
          });
        }
      };

      if (req.files) checkFiles(req.files);
      if (req.body && req.body.files) checkFiles(req.body.files);
    }
  }

  private sanitizeInputData(req: SecurityRequest): void {
    // Sanitize query parameters
    req.security!.sanitizedQuery = this.sanitizeObject(req.query);

    // Sanitize request body
    if (req.body) {
      req.security!.sanitizedBody = this.sanitizeObject(req.body);
    }
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  private sanitizeString(str: string): string {
    if (!str || typeof str !== 'string') return str;

    // Remove null bytes
    str = str.replace(/\x00/g, '');

    // Escape HTML
    str = validator.escape(str);

    // Remove control characters
    str = str.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    return str;
  }

  private setSecurityHeaders(res: Response): void {
    const securityHeaders = this.securityConfig.getSecurityHeaders();

    Object.entries(securityHeaders).forEach(([header, value]) => {
      res.setHeader(header, value);
    });

    // Set CSP header
    const csp = this.securityConfig.getContentSecurityPolicy();
    const cspString = Object.entries(csp)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');

    res.setHeader('Content-Security-Policy', cspString);

    // Set additional security headers
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }

  private recursiveStringCheck(
    obj: any,
    context: string,
    checkFn: (str: string, context: string) => void
  ): void {
    if (typeof obj === 'string') {
      checkFn(obj, context);
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.recursiveStringCheck(item, `${context}[${index}]`, checkFn);
      });
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        this.recursiveStringCheck(value, `${context}.${key}`, checkFn);
      });
    }
  }

  private getClientIp(req: Request): string {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any)?.socket?.remoteAddress ||
      'Unknown'
    );
  }

  private generateClientFingerprint(req: Request): string {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';

    const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
    return Buffer.from(fingerprint).toString('base64').slice(0, 16);
  }

  private logSecurityEvent(req: SecurityRequest): void {
    this.logger.warn('Security threat detected', {
      ip: req.security!.clientInfo.ip,
      userAgent: req.security!.clientInfo.userAgent,
      fingerprint: req.security!.clientInfo.fingerprint,
      path: req.path,
      method: req.method,
      threats: req.security!.threats,
      riskScore: req.security!.riskScore,
      timestamp: new Date().toISOString(),
    });
  }
}

@Injectable()
export class RequestSizeMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestSizeMiddleware.name);

  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const maxSize = this.configService.get('MAX_REQUEST_SIZE', 10 * 1024 * 1024); // 10MB
    const contentLength = parseInt(req.get('content-length') || '0');

    if (contentLength > maxSize) {
      this.logger.warn(`Request too large: ${contentLength} bytes from ${req.ip}`);
      throw new HttpException('Request entity too large', HttpStatus.PAYLOAD_TOO_LARGE);
    }

    next();
  }
}

@Injectable()
export class SecurityValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityValidationMiddleware.name);

  use(req: SecurityRequest, res: Response, next: NextFunction) {
    // Block requests with high risk scores
    if (req.security && req.security.riskScore > 75) {
      this.logger.error('Blocking high-risk request', {
        ip: req.security.clientInfo.ip,
        riskScore: req.security.riskScore,
        threats: req.security.threats,
        path: req.path,
      });

      throw new HttpException(
        'Request blocked due to security concerns',
        HttpStatus.FORBIDDEN
      );
    }

    next();
  }
}