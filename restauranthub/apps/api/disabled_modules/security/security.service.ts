import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ExpressBrute from 'express-brute';
import * as slowDown from 'express-slow-down';
import { AdvancedCacheService } from '../cache/advanced-cache.service';
import { PerformanceService } from '../monitoring/performance.service';

export interface SecurityThreat {
  id: string;
  type: 'brute_force' | 'ddos' | 'injection' | 'xss' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent?: string;
  endpoint: string;
  timestamp: Date;
  details: Record<string, any>;
  mitigated: boolean;
}

export interface SecurityMetrics {
  totalThreats: number;
  threatsBlocked: number;
  suspiciousIPs: string[];
  topAttackTypes: Array<{ type: string; count: number }>;
  riskScore: number;
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private bruteStore: any;
  private slowDownStore: any;
  private suspiciousIPs = new Set<string>();
  private blockedIPs = new Set<string>();
  private securityThreats: SecurityThreat[] = [];

  constructor(
    private configService: ConfigService,
    private cacheService: AdvancedCacheService,
    private performanceService: PerformanceService,
  ) {
    this.initializeBruteForceProtection();
    this.initializeSlowDown();
    this.loadBlockedIPs();
  }

  private initializeBruteForceProtection(): void {
    this.bruteStore = new ExpressBrute.MemoryStore();

    this.bruteForceProtection = new ExpressBrute(this.bruteStore, {
      freeRetries: 3,
      minWait: 5 * 60 * 1000, // 5 minutes
      maxWait: 60 * 60 * 1000, // 1 hour
      lifetime: 24 * 60 * 60, // 24 hours
      failCallback: (req: any, res: any, next: any, nextValidRequestDate: any) => {
        this.logSecurityThreat({
          type: 'brute_force',
          severity: 'high',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          details: {
            attempts: req.brute?.attempts || 0,
            nextValidRequestDate,
          },
        });

        res.status(429).json({
          error: 'Too many failed attempts',
          nextValidRequestDate,
          retryAfter: Math.ceil((nextValidRequestDate.getTime() - Date.now()) / 1000),
        });
      },
    });
  }

  private initializeSlowDown(): void {
    this.slowDownMiddleware = slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // Allow 50 requests per windowMs without delay
      delayMs: 500, // Add 500ms delay for each request after delayAfter
      maxDelayMs: 10000, // Maximum delay of 10 seconds
      skipSuccessfulRequests: true,
      skipFailedRequests: false,
      onLimitReached: (req: any) => {
        this.logSecurityThreat({
          type: 'ddos',
          severity: 'medium',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          details: {
            requestCount: req.slowDown?.current || 0,
            windowMs: 15 * 60 * 1000,
          },
        });
      },
    });
  }

  bruteForceProtection: any;
  slowDownMiddleware: any;

  async detectSQLInjection(input: string): Promise<boolean> {
    const sqlPatterns = [
      /(\bunion\b.*\bselect\b)/i,
      /(\bselect\b.*\bfrom\b)/i,
      /(\binsert\b.*\binto\b)/i,
      /(\bdelete\b.*\bfrom\b)/i,
      /(\bdrop\b.*\btable\b)/i,
      /(\bupdate\b.*\bset\b)/i,
      /(\bor\b.*1\s*=\s*1)/i,
      /(\band\b.*1\s*=\s*1)/i,
      /(--|\/\*|\*\/)/,
      /(\bexec\b.*\()/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  async detectXSS(input: string): Promise<boolean> {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*src[^>]*onerror[^>]*>/gi,
      /<svg[^>]*onload[^>]*>/gi,
      /eval\s*\(/gi,
      /document\.cookie/gi,
      /window\.location/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  async validateInput(input: any, req: any): Promise<{ isValid: boolean; threats: string[] }> {
    const threats: string[] = [];

    if (typeof input === 'string') {
      if (await this.detectSQLInjection(input)) {
        threats.push('sql_injection');
        this.logSecurityThreat({
          type: 'injection',
          severity: 'high',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          details: { input: input.substring(0, 100), type: 'sql' },
        });
      }

      if (await this.detectXSS(input)) {
        threats.push('xss');
        this.logSecurityThreat({
          type: 'xss',
          severity: 'high',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          details: { input: input.substring(0, 100) },
        });
      }
    }

    if (typeof input === 'object' && input !== null) {
      for (const [key, value] of Object.entries(input)) {
        if (typeof value === 'string') {
          const result = await this.validateInput(value, req);
          threats.push(...result.threats);
        }
      }
    }

    return {
      isValid: threats.length === 0,
      threats,
    };
  }

  async analyzeRequestPattern(req: any): Promise<{
    riskScore: number;
    reasons: string[];
    shouldBlock: boolean;
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check if IP is already suspicious or blocked
    if (this.blockedIPs.has(req.ip)) {
      return {
        riskScore: 1.0,
        reasons: ['IP is in blocklist'],
        shouldBlock: true,
      };
    }

    if (this.suspiciousIPs.has(req.ip)) {
      riskScore += 0.3;
      reasons.push('IP has suspicious activity history');
    }

    // Analyze request frequency
    const recentRequests = await this.getRecentRequestCount(req.ip);
    if (recentRequests > 100) {
      riskScore += 0.4;
      reasons.push('High request frequency');
    }

    // Check user agent
    const userAgent = req.get('User-Agent') || '';
    if (this.isSuspiciousUserAgent(userAgent)) {
      riskScore += 0.3;
      reasons.push('Suspicious user agent');
    }

    // Check for common attack patterns in URL
    if (this.hasAttackPatterns(req.path + req.url)) {
      riskScore += 0.5;
      reasons.push('Attack patterns in URL');
    }

    // Geolocation risk (mock implementation)
    const geoRisk = await this.getGeolocationRisk(req.ip);
    riskScore += geoRisk;
    if (geoRisk > 0.2) {
      reasons.push('High-risk geographical location');
    }

    return {
      riskScore: Math.min(riskScore, 1.0),
      reasons,
      shouldBlock: riskScore > 0.8,
    };
  }

  async blockIP(ip: string, reason: string, duration?: number): Promise<void> {
    this.blockedIPs.add(ip);

    // Cache the blocked IP
    await this.cacheService.set(
      `blocked_ip_${ip}`,
      { reason, blockedAt: new Date(), duration },
      { ttl: duration || 3600 * 24, namespace: 'security' }
    );

    this.logger.warn(`IP ${ip} blocked: ${reason}`);

    // Report to monitoring
    this.performanceService.captureMessage(`IP blocked: ${ip} - ${reason}`, 'warning');
  }

  async unblockIP(ip: string): Promise<void> {
    this.blockedIPs.delete(ip);
    await this.cacheService.del(`blocked_ip_${ip}`, 'security');
    this.logger.log(`IP ${ip} unblocked`);
  }

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);

    const recentThreats = this.securityThreats.filter(
      threat => threat.timestamp.getTime() > last24Hours
    );

    const threatCounts = recentThreats.reduce((acc, threat) => {
      acc[threat.type] = (acc[threat.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topAttackTypes = Object.entries(threatCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const suspiciousIPs = Array.from(this.suspiciousIPs);
    const riskScore = this.calculateOverallRiskScore(recentThreats);

    return {
      totalThreats: recentThreats.length,
      threatsBlocked: recentThreats.filter(t => t.mitigated).length,
      suspiciousIPs,
      topAttackTypes,
      riskScore,
    };
  }

  async getSecurityReport(): Promise<{
    summary: SecurityMetrics;
    recentThreats: SecurityThreat[];
    blockedIPs: Array<{ ip: string; reason: string; blockedAt: Date }>;
    recommendations: string[];
  }> {
    const summary = await this.getSecurityMetrics();
    const recentThreats = this.securityThreats.slice(-50); // Last 50 threats

    const blockedIPsList = await Promise.all(
      Array.from(this.blockedIPs).map(async (ip) => {
        const cached = await this.cacheService.get(`blocked_ip_${ip}`, 'security');
        return {
          ip,
          reason: cached?.reason || 'Unknown',
          blockedAt: cached?.blockedAt || new Date(),
        };
      })
    );

    const recommendations = this.generateSecurityRecommendations(summary);

    return {
      summary,
      recentThreats,
      blockedIPs: blockedIPsList,
      recommendations,
    };
  }

  private async loadBlockedIPs(): Promise<void> {
    try {
      // Load blocked IPs from cache/database
      // This is a simplified implementation
      const blockedIPs = await this.cacheService.get<string[]>('global_blocked_ips', 'security') || [];
      blockedIPs.forEach(ip => this.blockedIPs.add(ip));
    } catch (error) {
      this.logger.error('Failed to load blocked IPs:', error);
    }
  }

  private logSecurityThreat(threat: Omit<SecurityThreat, 'id' | 'timestamp' | 'mitigated'>): void {
    const fullThreat: SecurityThreat = {
      ...threat,
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      mitigated: false,
    };

    this.securityThreats.push(fullThreat);

    // Keep only last 1000 threats in memory
    if (this.securityThreats.length > 1000) {
      this.securityThreats = this.securityThreats.slice(-1000);
    }

    // Add to suspicious IPs if high severity
    if (threat.severity === 'high' || threat.severity === 'critical') {
      this.suspiciousIPs.add(threat.ip);
    }

    // Auto-block on critical threats
    if (threat.severity === 'critical') {
      this.blockIP(threat.ip, `Critical threat: ${threat.type}`, 3600 * 24);
      fullThreat.mitigated = true;
    }

    this.logger.warn(`Security threat detected: ${threat.type} from ${threat.ip}`);
    this.performanceService.captureError(
      new Error(`Security threat: ${threat.type}`),
      'security',
      threat.details
    );
  }

  private async getRecentRequestCount(ip: string): Promise<number> {
    const cacheKey = `request_count_${ip}`;
    const count = await this.cacheService.get<number>(cacheKey, 'security') || 0;

    // Increment and cache for 15 minutes
    await this.cacheService.set(cacheKey, count + 1, { ttl: 900, namespace: 'security' });

    return count;
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /python/i,
      /curl/i,
      /wget/i,
      /scanner/i,
    ];

    // Allow legitimate bots
    const legitimateBots = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i,
      /duckduckbot/i,
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    const isLegitimate = legitimateBots.some(pattern => pattern.test(userAgent));

    return isSuspicious && !isLegitimate;
  }

  private hasAttackPatterns(url: string): boolean {
    const attackPatterns = [
      /\.\.\//, // Directory traversal
      /\bselect\b.*\bfrom\b/i, // SQL injection
      /<script/i, // XSS
      /\bexec\b/i, // Command injection
      /\beval\b/i, // Code injection
      /\bphp\b/i, // PHP injection attempts
    ];

    return attackPatterns.some(pattern => pattern.test(url));
  }

  private async getGeolocationRisk(ip: string): Promise<number> {
    // Mock implementation - in real app, use IP geolocation service
    const highRiskCountries = ['CN', 'RU', 'KP'];
    const mockCountry = ip.startsWith('192.168.') ? 'US' : 'CN';

    return highRiskCountries.includes(mockCountry) ? 0.3 : 0.1;
  }

  private calculateOverallRiskScore(threats: SecurityThreat[]): number {
    if (threats.length === 0) return 0;

    const severityScores = {
      low: 0.1,
      medium: 0.3,
      high: 0.7,
      critical: 1.0,
    };

    const totalScore = threats.reduce((sum, threat) => {
      return sum + severityScores[threat.severity];
    }, 0);

    return Math.min(totalScore / threats.length, 1.0);
  }

  private generateSecurityRecommendations(metrics: SecurityMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.riskScore > 0.7) {
      recommendations.push('Consider implementing additional IP filtering');
      recommendations.push('Enable stricter rate limiting');
    }

    if (metrics.suspiciousIPs.length > 10) {
      recommendations.push('Review and update IP blocklist');
      recommendations.push('Consider implementing geofencing');
    }

    if (metrics.totalThreats > 100) {
      recommendations.push('Implement Web Application Firewall (WAF)');
      recommendations.push('Consider DDoS protection service');
    }

    if (recommendations.length === 0) {
      recommendations.push('Security posture is good - maintain current practices');
      recommendations.push('Consider periodic security audits');
    }

    return recommendations;
  }
}