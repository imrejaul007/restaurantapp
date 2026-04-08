import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SecurityConfig {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventReuse: number;
    maxAge: number; // days
  };
  lockoutPolicy: {
    maxAttempts: number;
    lockoutDuration: number; // minutes
    incrementalLockout: boolean;
  };
  sessionSecurity: {
    maxSessions: number;
    sessionTimeout: number; // minutes
    concurrentSessionsAllowed: boolean;
  };
  twoFactorAuth: {
    enforceForAdmins: boolean;
    enforceForRoles: string[];
    backupCodesCount: number;
    tokenWindowSize: number;
  };
  auditLogging: {
    logFailedLogins: boolean;
    logPasswordChanges: boolean;
    logRoleChanges: boolean;
    logDataAccess: boolean;
    retentionDays: number;
  };
}

@Injectable()
export class SecurityConfigService {
  private readonly logger = new Logger(SecurityConfigService.name);
  private readonly securityConfig: SecurityConfig;

  constructor(private configService: ConfigService) {
    this.securityConfig = this.loadSecurityConfig();
    this.validateConfig();
  }

  private loadSecurityConfig(): SecurityConfig {
    return {
      passwordPolicy: {
        minLength: this.configService.get('PASSWORD_MIN_LENGTH', 12),
        requireUppercase: this.configService.get('PASSWORD_REQUIRE_UPPERCASE', 'true') === 'true',
        requireLowercase: this.configService.get('PASSWORD_REQUIRE_LOWERCASE', 'true') === 'true',
        requireNumbers: this.configService.get('PASSWORD_REQUIRE_NUMBERS', 'true') === 'true',
        requireSpecialChars: this.configService.get('PASSWORD_REQUIRE_SPECIAL', 'true') === 'true',
        preventReuse: this.configService.get('PASSWORD_PREVENT_REUSE', 5),
        maxAge: this.configService.get('PASSWORD_MAX_AGE_DAYS', 90),
      },
      lockoutPolicy: {
        maxAttempts: this.configService.get('LOCKOUT_MAX_ATTEMPTS', 5),
        lockoutDuration: this.configService.get('LOCKOUT_DURATION_MINUTES', 30),
        incrementalLockout: this.configService.get('LOCKOUT_INCREMENTAL', 'true') === 'true',
      },
      sessionSecurity: {
        maxSessions: this.configService.get('MAX_SESSIONS_PER_USER', 5),
        sessionTimeout: this.configService.get('SESSION_TIMEOUT_MINUTES', 30),
        concurrentSessionsAllowed: this.configService.get('ALLOW_CONCURRENT_SESSIONS', 'true') === 'true',
      },
      twoFactorAuth: {
        enforceForAdmins: this.configService.get('MFA_ENFORCE_ADMINS', 'true') === 'true',
        enforceForRoles: this.configService.get('MFA_ENFORCE_ROLES', 'ADMIN').split(','),
        backupCodesCount: this.configService.get('MFA_BACKUP_CODES_COUNT', 8),
        tokenWindowSize: this.configService.get('MFA_TOKEN_WINDOW', 2),
      },
      auditLogging: {
        logFailedLogins: this.configService.get('AUDIT_LOG_FAILED_LOGINS', 'true') === 'true',
        logPasswordChanges: this.configService.get('AUDIT_LOG_PASSWORD_CHANGES', 'true') === 'true',
        logRoleChanges: this.configService.get('AUDIT_LOG_ROLE_CHANGES', 'true') === 'true',
        logDataAccess: this.configService.get('AUDIT_LOG_DATA_ACCESS', 'true') === 'true',
        retentionDays: this.configService.get('AUDIT_LOG_RETENTION_DAYS', 365),
      },
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate password policy
    if (this.securityConfig.passwordPolicy.minLength < 8) {
      errors.push('Password minimum length must be at least 8 characters');
    }

    // Validate lockout policy
    if (this.securityConfig.lockoutPolicy.maxAttempts < 3) {
      errors.push('Lockout max attempts must be at least 3');
    }

    // Validate session security
    if (this.securityConfig.sessionSecurity.maxSessions < 1) {
      errors.push('Max sessions per user must be at least 1');
    }

    if (errors.length > 0) {
      this.logger.error('Security configuration validation failed:', errors);
      throw new Error(`Security configuration errors: ${errors.join(', ')}`);
    }

    this.logger.log('Security configuration validated successfully');
  }

  getConfig(): SecurityConfig {
    return { ...this.securityConfig };
  }

  getPasswordPolicy() {
    return { ...this.securityConfig.passwordPolicy };
  }

  getLockoutPolicy() {
    return { ...this.securityConfig.lockoutPolicy };
  }

  getSessionSecurity() {
    return { ...this.securityConfig.sessionSecurity };
  }

  getTwoFactorAuthConfig() {
    return { ...this.securityConfig.twoFactorAuth };
  }

  getAuditLoggingConfig() {
    return { ...this.securityConfig.auditLogging };
  }

  isPasswordPolicyCompliant(password: string): { isCompliant: boolean; errors: string[] } {
    const errors: string[] = [];
    const policy = this.securityConfig.passwordPolicy;

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak patterns
    const weakPatterns = [
      /(.)\1{3,}/, // Four or more consecutive identical characters
      /123456|654321|abcdef|qwerty|password/i, // Common sequences
      /^(.{1,3})\1+$/, // Repeated short patterns
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains weak patterns and is not allowed');
        break;
      }
    }

    return {
      isCompliant: errors.length === 0,
      errors,
    };
  }

  isMfaRequired(role: string): boolean {
    const config = this.securityConfig.twoFactorAuth;

    if (config.enforceForAdmins && role === 'ADMIN') {
      return true;
    }

    return config.enforceForRoles.includes(role.toUpperCase());
  }

  shouldLogEvent(eventType: string): boolean {
    const auditConfig = this.securityConfig.auditLogging;

    switch (eventType.toLowerCase()) {
      case 'failed_login':
        return auditConfig.logFailedLogins;
      case 'password_change':
        return auditConfig.logPasswordChanges;
      case 'role_change':
        return auditConfig.logRoleChanges;
      case 'data_access':
        return auditConfig.logDataAccess;
      default:
        return false;
    }
  }

  calculateLockoutDuration(attemptCount: number): number {
    const policy = this.securityConfig.lockoutPolicy;

    if (!policy.incrementalLockout) {
      return policy.lockoutDuration;
    }

    // Exponential backoff: base duration * 2^(attempts - maxAttempts)
    const multiplier = Math.pow(2, Math.max(0, attemptCount - policy.maxAttempts));
    return Math.min(policy.lockoutDuration * multiplier, 24 * 60); // Max 24 hours
  }

  getSecurityHeaders() {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
  }

  getContentSecurityPolicy() {
    return {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'connect-src': ["'self'", 'wss:', 'ws:'],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'child-src': ["'none'"],
      'frame-src': ["'none'"],
      'worker-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'manifest-src': ["'self'"],
    };
  }
}