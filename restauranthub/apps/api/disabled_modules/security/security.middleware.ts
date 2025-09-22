import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityService } from './security.service';
import * as ipFilter from 'express-ipfilter';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(private readonly securityService: SecurityService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Analyze request pattern
      const analysis = await this.securityService.analyzeRequestPattern(req);

      if (analysis.shouldBlock) {
        await this.securityService.blockIP(
          req.ip,
          `Automatic block: ${analysis.reasons.join(', ')}`,
          3600 * 24
        );

        throw new HttpException(
          {
            error: 'Access denied',
            message: 'Your request has been blocked for security reasons',
            code: 'SECURITY_BLOCK',
          },
          HttpStatus.FORBIDDEN
        );
      }

      // Add security headers
      this.addSecurityHeaders(res);

      // Validate request body for injection attacks
      if (req.body && Object.keys(req.body).length > 0) {
        const validation = await this.securityService.validateInput(req.body, req);

        if (!validation.isValid) {
          throw new HttpException(
            {
              error: 'Invalid input detected',
              message: 'Request contains potentially malicious content',
              threats: validation.threats,
            },
            HttpStatus.BAD_REQUEST
          );
        }
      }

      // Add risk score to request for logging
      (req as any).securityRiskScore = analysis.riskScore;

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Log unexpected errors but don't block the request
      console.error('Security middleware error:', error);
      next();
    }
  }

  private addSecurityHeaders(res: Response): void {
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';"
    );

    // Prevent XSS attacks
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()'
    );

    // Remove server information
    res.removeHeader('X-Powered-By');
  }
}

@Injectable()
export class IPFilterMiddleware implements NestMiddleware {
  private ipFilter: any;

  constructor(private readonly securityService: SecurityService) {
    this.initializeIPFilter();
  }

  private initializeIPFilter(): void {
    // Allow all by default, but we'll implement custom blocking logic
    this.ipFilter = ipFilter({
      mode: 'allow',
      allows: ['*'],
      log: false,
      logF: (clientIp: string, message: string) => {
        console.log(`IP Filter: ${clientIp} - ${message}`);
      },
    });
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const clientIP = req.ip;

    // Check if IP is manually blocked
    const blockedIPs = await this.getBlockedIPs();
    if (blockedIPs.includes(clientIP)) {
      return res.status(403).json({
        error: 'IP address blocked',
        message: 'Your IP address has been blocked due to security concerns',
      });
    }

    // Check against known malicious IP databases (mock implementation)
    const isMalicious = await this.checkMaliciousIP(clientIP);
    if (isMalicious) {
      await this.securityService.blockIP(
        clientIP,
        'IP found in malicious IP database',
        3600 * 24 * 7 // 7 days
      );

      return res.status(403).json({
        error: 'IP address blocked',
        message: 'Your IP address has been flagged as malicious',
      });
    }

    next();
  }

  private async getBlockedIPs(): Promise<string[]> {
    // This would typically fetch from database or cache
    return [];
  }

  private async checkMaliciousIP(ip: string): Promise<boolean> {
    // Mock implementation - in real app, integrate with threat intelligence feeds
    const knownMaliciousIPs = [
      '192.0.2.1', // Example IP
      '203.0.113.1', // Example IP
    ];

    return knownMaliciousIPs.includes(ip);
  }
}

@Injectable()
export class RequestSanitizerMiddleware implements NestMiddleware {
  constructor(private readonly securityService: SecurityService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Sanitize query parameters
      if (req.query) {
        req.query = this.sanitizeObject(req.query);
      }

      // Sanitize request body
      if (req.body) {
        req.body = this.sanitizeObject(req.body);
      }

      // Sanitize headers (be careful not to break functionality)
      this.sanitizeHeaders(req);

      next();
    } catch (error) {
      console.error('Request sanitizer error:', error);
      next(); // Continue even if sanitization fails
    }
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[this.sanitizeString(key)] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  private sanitizeString(str: string): string {
    if (typeof str !== 'string') return str;

    return str
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove or encode potentially dangerous characters
      .replace(/[<>'"]/g, (match) => {
        const encodings: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
        };
        return encodings[match] || match;
      })
      // Limit length to prevent buffer overflow attempts
      .substring(0, 10000);
  }

  private sanitizeHeaders(req: Request): void {
    // Remove potentially dangerous headers
    const dangerousHeaders = [
      'x-forwarded-host',
      'x-cluster-client-ip',
      'x-real-ip',
    ];

    dangerousHeaders.forEach(header => {
      if (req.headers[header]) {
        delete req.headers[header];
      }
    });

    // Validate User-Agent length
    const userAgent = req.headers['user-agent'];
    if (userAgent && userAgent.length > 500) {
      req.headers['user-agent'] = userAgent.substring(0, 500);
    }
  }
}