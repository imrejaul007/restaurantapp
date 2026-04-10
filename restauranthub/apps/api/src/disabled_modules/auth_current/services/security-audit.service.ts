import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { SecurityConfigService } from '../security-config.service';
import { EncryptionService } from './encryption.service';

export interface SecurityEvent {
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  resourceId?: string;
  resourceType?: string;
  action?: string;
  details?: any;
  metadata?: any;
  timestamp: Date;
  source: string;
}

export interface ThreatIntelligence {
  ipAddress: string;
  threatLevel: number;
  threatTypes: string[];
  firstSeen: Date;
  lastSeen: Date;
  requestCount: number;
  blockedCount: number;
  reputation: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS' | 'BLOCKED';
}

export interface SecurityMetrics {
  failedLogins: number;
  successfulLogins: number;
  passwordResets: number;
  mfaAttempts: number;
  suspiciousActivities: number;
  blockedRequests: number;
  threatLevel: number;
  period: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  timestamp: Date;
}

export interface AuditReport {
  summary: {
    totalEvents: number;
    criticalEvents: number;
    highSeverityEvents: number;
    uniqueUsers: number;
    uniqueIPs: number;
    topThreats: string[];
  };
  timeRange: {
    from: Date;
    to: Date;
  };
  events: SecurityEvent[];
  metrics: SecurityMetrics[];
  threats: ThreatIntelligence[];
}

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);
  private readonly eventQueue: SecurityEvent[] = [];
  private readonly threatIntelligence: Map<string, ThreatIntelligence> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly securityConfig: SecurityConfigService,
    private readonly encryptionService: EncryptionService,
  ) {
    this.initializeMetricsCollection();
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'timestamp' | 'source'>): Promise<void> {
    try {
      const fullEvent: SecurityEvent = {
        ...event,
        timestamp: new Date(),
        source: 'RestoPapa-API',
      };

      // Add to event queue for batch processing
      this.eventQueue.push(fullEvent);

      // Process immediately if critical
      if (event.severity === 'CRITICAL') {
        await this.processSecurityEvent(fullEvent);
        await this.sendSecurityAlert(fullEvent);
      }

      // Update threat intelligence
      if (event.ipAddress) {
        this.updateThreatIntelligence(event.ipAddress, event);
      }

      // Log to console for immediate visibility
      this.logger.log(`Security Event [${event.severity}]: ${event.eventType}`, {
        userId: event.userId,
        ipAddress: event.ipAddress,
        details: event.details,
      });

      // Batch process events every 30 seconds
      if (this.eventQueue.length >= 10) {
        await this.processBatchEvents();
      }
    } catch (error) {
      this.logger.error('Failed to log security event', error);
    }
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_RESET' | 'MFA_SUCCESS' | 'MFA_FAILED',
    userId?: string,
    userEmail?: string,
    userRole?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    const severity = this.getAuthEventSeverity(eventType, details);

    await this.logSecurityEvent({
      eventType,
      severity,
      userId,
      userEmail,
      userRole,
      ipAddress,
      userAgent,
      action: 'AUTHENTICATION',
      details,
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
    resourceType: string,
    resourceId: string,
    userId: string,
    userEmail?: string,
    userRole?: string,
    ipAddress?: string,
    sensitive: boolean = false
  ): Promise<void> {
    if (!this.securityConfig.shouldLogEvent('data_access')) {
      return;
    }

    const severity = sensitive ? 'HIGH' : 'MEDIUM';

    await this.logSecurityEvent({
      eventType: 'DATA_ACCESS',
      severity,
      userId,
      userEmail,
      userRole,
      ipAddress,
      resourceId,
      resourceType,
      action,
      details: {
        sensitive,
        operation: `${action}_${resourceType}`,
      },
    });
  }

  /**
   * Log privilege escalation attempts
   */
  async logPrivilegeEscalation(
    userId: string,
    userEmail: string,
    currentRole: string,
    attemptedRole: string,
    ipAddress?: string,
    success: boolean = false
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'PRIVILEGE_ESCALATION',
      severity: success ? 'CRITICAL' : 'HIGH',
      userId,
      userEmail,
      userRole: currentRole,
      ipAddress,
      action: 'ROLE_CHANGE',
      details: {
        currentRole,
        attemptedRole,
        success,
      },
    });
  }

  /**
   * Log security policy violations
   */
  async logPolicyViolation(
    violation: string,
    userId?: string,
    userEmail?: string,
    ipAddress?: string,
    details?: any
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'POLICY_VIOLATION',
      severity: 'HIGH',
      userId,
      userEmail,
      ipAddress,
      action: 'POLICY_CHECK',
      details: {
        violation,
        ...details,
      },
    });
  }

  /**
   * Log suspicious activities
   */
  async logSuspiciousActivity(
    activityType: string,
    details: any,
    ipAddress?: string,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'SUSPICIOUS_ACTIVITY',
      severity: 'MEDIUM',
      userId,
      userEmail,
      ipAddress,
      action: 'ANOMALY_DETECTION',
      details: {
        activityType,
        ...details,
      },
    });
  }

  /**
   * Get security audit report
   */
  async getAuditReport(
    fromDate: Date,
    toDate: Date,
    filters?: {
      severity?: string[];
      eventTypes?: string[];
      userIds?: string[];
      ipAddresses?: string[];
    }
  ): Promise<AuditReport> {
    try {
      // Build where clause for Prisma query
      const whereClause: any = {
        timestamp: {
          gte: fromDate,
          lte: toDate,
        },
      };

      if (filters?.severity) {
        whereClause.action = {
          in: filters.severity, // Adjust based on your audit log schema
        };
      }

      // Get audit logs from database
      const auditLogs = await this.prisma.auditLog.findMany({
        where: whereClause,
        orderBy: {
          timestamp: 'desc',
        },
        take: 1000, // Limit for performance
      });

      // Convert to SecurityEvent format
      const events: SecurityEvent[] = auditLogs.map(log => ({
        eventType: log.action,
        severity: this.mapSeverityFromLog(log),
        userId: log.userId,
        userEmail: log.email,
        userRole: undefined, // Add if available in schema
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        sessionId: undefined, // Add if available
        resourceId: log.entityId,
        resourceType: log.entityType,
        action: log.action,
        details: log.details,
        metadata: log.metadata,
        timestamp: log.timestamp,
        source: 'Database',
      }));

      // Calculate summary
      const summary = {
        totalEvents: events.length,
        criticalEvents: events.filter(e => e.severity === 'CRITICAL').length,
        highSeverityEvents: events.filter(e => e.severity === 'HIGH').length,
        uniqueUsers: new Set(events.map(e => e.userId).filter(Boolean)).size,
        uniqueIPs: new Set(events.map(e => e.ipAddress).filter(Boolean)).size,
        topThreats: this.getTopThreats(events),
      };

      // Get metrics
      const metrics = await this.getSecurityMetrics(fromDate, toDate);

      // Get threat intelligence
      const threats = Array.from(this.threatIntelligence.values());

      return {
        summary,
        timeRange: { from: fromDate, to: toDate },
        events,
        metrics,
        threats,
      };
    } catch (error) {
      this.logger.error('Failed to generate audit report', error);
      throw new Error('Failed to generate audit report');
    }
  }

  /**
   * Get security metrics for dashboard
   */
  async getSecurityDashboard(): Promise<{
    realTimeMetrics: SecurityMetrics;
    alerts: SecurityEvent[];
    threatSummary: {
      totalThreats: number;
      activeThreats: number;
      blockedIPs: number;
    };
    complianceStatus: {
      auditLogsRetention: boolean;
      encryptionStatus: boolean;
      mfaCompliance: number;
    };
  }> {
    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get real-time metrics (last hour)
      const realTimeMetrics = await this.calculateMetrics('HOURLY', hourAgo, now);

      // Get recent critical alerts
      const alerts = await this.getRecentAlerts(24); // Last 24 hours

      // Threat summary
      const threats = Array.from(this.threatIntelligence.values());
      const threatSummary = {
        totalThreats: threats.length,
        activeThreats: threats.filter(t => t.reputation === 'MALICIOUS').length,
        blockedIPs: threats.filter(t => t.reputation === 'BLOCKED').length,
      };

      // Compliance status
      const complianceStatus = {
        auditLogsRetention: true, // Check if audit logs are being retained properly
        encryptionStatus: true, // Check encryption status
        mfaCompliance: await this.calculateMfaCompliance(),
      };

      return {
        realTimeMetrics,
        alerts,
        threatSummary,
        complianceStatus,
      };
    } catch (error) {
      this.logger.error('Failed to get security dashboard', error);
      throw new Error('Failed to get security dashboard');
    }
  }

  /**
   * Process security event and store in database
   */
  private async processSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Store in audit log
      await this.prisma.auditLog.create({
        data: {
          userId: event.userId!,
          action: event.eventType,
          entityType: event.resourceType || 'SYSTEM',
          entityId: event.resourceId,
          oldValues: null,
          newValues: null,
          metadata: event.metadata,
          details: event.details,
          email: event.userEmail,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          timestamp: event.timestamp,
        },
      });
    } catch (error) {
      this.logger.error('Failed to process security event', error);
    }
  }

  /**
   * Process events in batch for performance
   */
  private async processBatchEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = this.eventQueue.splice(0, 100); // Process up to 100 events

    try {
      // Process each event
      await Promise.all(events.map(event => this.processSecurityEvent(event)));
    } catch (error) {
      this.logger.error('Failed to process batch events', error);
    }
  }

  /**
   * Update threat intelligence for IP
   */
  private updateThreatIntelligence(ipAddress: string, event: SecurityEvent): void {
    let threat = this.threatIntelligence.get(ipAddress);

    if (!threat) {
      threat = {
        ipAddress,
        threatLevel: 0,
        threatTypes: [],
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        requestCount: 0,
        blockedCount: 0,
        reputation: 'CLEAN',
      };
    }

    // Update threat data
    threat.lastSeen = event.timestamp;
    threat.requestCount++;

    // Increase threat level based on event severity
    switch (event.severity) {
      case 'CRITICAL':
        threat.threatLevel += 10;
        break;
      case 'HIGH':
        threat.threatLevel += 5;
        break;
      case 'MEDIUM':
        threat.threatLevel += 2;
        break;
      case 'LOW':
        threat.threatLevel += 1;
        break;
    }

    // Add threat type
    if (!threat.threatTypes.includes(event.eventType)) {
      threat.threatTypes.push(event.eventType);
    }

    // Update reputation
    if (threat.threatLevel > 50) {
      threat.reputation = 'BLOCKED';
    } else if (threat.threatLevel > 20) {
      threat.reputation = 'MALICIOUS';
    } else if (threat.threatLevel > 10) {
      threat.reputation = 'SUSPICIOUS';
    }

    this.threatIntelligence.set(ipAddress, threat);
  }

  /**
   * Send security alerts for critical events
   */
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      this.logger.error(`SECURITY ALERT: ${event.eventType}`, {
        severity: event.severity,
        userId: event.userId,
        userEmail: event.userEmail,
        ipAddress: event.ipAddress,
        details: event.details,
        timestamp: event.timestamp.toISOString(),
      });

      // In production, integrate with:
      // - Email notifications
      // - Slack/Teams webhooks
      // - SIEM systems
      // - PagerDuty for critical alerts
    } catch (error) {
      this.logger.error('Failed to send security alert', error);
    }
  }

  /**
   * Initialize metrics collection
   */
  private initializeMetricsCollection(): void {
    // Collect metrics every 5 minutes
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 5 * 60 * 1000);
  }

  /**
   * Collect and aggregate security metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const metrics = await this.calculateMetrics('HOURLY', hourAgo, now);

      // Store metrics (in a real implementation, store in time-series database)
      this.logger.debug('Security metrics collected', metrics);
    } catch (error) {
      this.logger.error('Failed to collect metrics', error);
    }
  }

  /**
   * Calculate security metrics for a time period
   */
  private async calculateMetrics(
    period: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY',
    fromDate: Date,
    toDate: Date
  ): Promise<SecurityMetrics> {
    // In a real implementation, query your metrics storage
    // For now, return mock data
    return {
      failedLogins: 0,
      successfulLogins: 0,
      passwordResets: 0,
      mfaAttempts: 0,
      suspiciousActivities: 0,
      blockedRequests: 0,
      threatLevel: 0,
      period,
      timestamp: new Date(),
    };
  }

  private getAuthEventSeverity(eventType: string, details?: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (eventType) {
      case 'LOGIN_FAILED':
        return details?.consecutiveFailures > 5 ? 'HIGH' : 'MEDIUM';
      case 'MFA_FAILED':
        return 'MEDIUM';
      case 'LOGIN_SUCCESS':
        return 'LOW';
      case 'PASSWORD_RESET':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  private mapSeverityFromLog(log: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Map log data to severity levels
    // This depends on your audit log schema
    return 'MEDIUM';
  }

  private getTopThreats(events: SecurityEvent[]): string[] {
    const threatCounts = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(threatCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([threat]) => threat);
  }

  private async getSecurityMetrics(fromDate: Date, toDate: Date): Promise<SecurityMetrics[]> {
    // Implementation would query stored metrics
    return [];
  }

  private async getRecentAlerts(hours: number): Promise<SecurityEvent[]> {
    // Implementation would query recent critical/high severity events
    return [];
  }

  private async calculateMfaCompliance(): Promise<number> {
    try {
      const [totalUsers, mfaEnabledUsers] = await Promise.all([
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isActive: true, twoFactorEnabled: true } }),
      ]);

      return totalUsers > 0 ? (mfaEnabledUsers / totalUsers) * 100 : 0;
    } catch (error) {
      this.logger.error('Failed to calculate MFA compliance', error);
      return 0;
    }
  }
}