import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MonitoringService } from './monitoring.service';
import { PerformanceService } from './performance.service';

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // minutes
  lastTriggered?: Date;
  description?: string;
  tags?: string[];
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationConfig {
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channels: Record<string, string>; // severity -> channel
  };
  email?: {
    enabled: boolean;
    recipients: string[];
    smtpConfig: any;
  };
  pagerduty?: {
    enabled: boolean;
    integrationKey: string;
    routingKey?: string;
  };
  webhook?: {
    enabled: boolean;
    url: string;
    headers?: Record<string, string>;
  };
}

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private notificationConfig: NotificationConfig;
  private readonly maxAlerts = 1000; // Keep last 1000 alerts in memory

  constructor(
    private readonly configService: ConfigService,
    private readonly monitoringService: MonitoringService,
    private readonly performanceService: PerformanceService,
  ) {
    this.initializeAlertRules();
    this.initializeNotificationConfig();
  }

  // Alert Rule Management
  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    const alertRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.alertRules.push(alertRule);
    this.logger.log(`Alert rule created: ${alertRule.name} (${alertRule.id})`);

    return alertRule;
  }

  async updateAlertRule(id: string, updates: Partial<AlertRule>): Promise<AlertRule> {
    const ruleIndex = this.alertRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) {
      throw new Error(`Alert rule not found: ${id}`);
    }

    this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
    this.logger.log(`Alert rule updated: ${this.alertRules[ruleIndex].name} (${id})`);

    return this.alertRules[ruleIndex];
  }

  async deleteAlertRule(id: string): Promise<void> {
    const initialLength = this.alertRules.length;
    this.alertRules = this.alertRules.filter(rule => rule.id !== id);

    if (this.alertRules.length === initialLength) {
      throw new Error(`Alert rule not found: ${id}`);
    }

    this.logger.log(`Alert rule deleted: ${id}`);
  }

  async getAlertRules(): Promise<AlertRule[]> {
    return [...this.alertRules];
  }

  // Alert Management
  async getAlerts(filter?: {
    severity?: string;
    acknowledged?: boolean;
    resolved?: boolean;
    limit?: number;
    ruleId?: string;
  }): Promise<Alert[]> {
    let filteredAlerts = [...this.alerts];

    if (filter) {
      if (filter.severity) {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === filter.severity);
      }
      if (filter.acknowledged !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => alert.acknowledged === filter.acknowledged);
      }
      if (filter.resolved !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => alert.resolved === filter.resolved);
      }
      if (filter.ruleId) {
        filteredAlerts = filteredAlerts.filter(alert => alert.ruleId === filter.ruleId);
      }
      if (filter.limit) {
        filteredAlerts = filteredAlerts.slice(0, filter.limit);
      }
    }

    return filteredAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    this.logger.log(`Alert acknowledged: ${alertId} by ${userId}`);
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    this.logger.log(`Alert resolved: ${alertId}`);
  }

  async createTestAlert(): Promise<Alert> {
    return this.createAlert({
      ruleId: 'test_rule',
      ruleName: 'Test Alert',
      message: 'This is a test alert to verify the alerting system is working',
      severity: 'low',
      value: 100,
      threshold: 50,
      metadata: { test: true },
    });
  }

  // Alert Processing
  @Cron(CronExpression.EVERY_MINUTE)
  async checkSystemAlerts() {
    try {
      const metrics = await this.monitoringService.getSystemMetrics();
      await this.evaluateAlerts('system', metrics);
    } catch (error) {
      this.logger.error('Failed to check system alerts', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkDatabaseAlerts() {
    try {
      const metrics = await this.monitoringService.getDatabaseMetrics();
      await this.evaluateAlerts('database', metrics);
    } catch (error) {
      this.logger.error('Failed to check database alerts', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkApplicationAlerts() {
    try {
      const metrics = await this.monitoringService.getApplicationMetrics();
      await this.evaluateAlerts('application', metrics);
    } catch (error) {
      this.logger.error('Failed to check application alerts', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkPerformanceAlerts() {
    try {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const report = await this.performanceService.generateReport(tenMinutesAgo, now);

      await this.evaluateAlerts('performance', report.summary);
    } catch (error) {
      this.logger.error('Failed to check performance alerts', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldAlerts() {
    try {
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const originalLength = this.alerts.length;

      this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffDate);

      const removedCount = originalLength - this.alerts.length;
      if (removedCount > 0) {
        this.logger.log(`Cleaned up ${removedCount} old alerts`);
      }

      // Also limit total alerts to prevent memory issues
      if (this.alerts.length > this.maxAlerts) {
        this.alerts = this.alerts
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, this.maxAlerts);
      }

    } catch (error) {
      this.logger.error('Failed to cleanup old alerts', error.stack);
    }
  }

  // Private Methods
  private async evaluateAlerts(category: string, metrics: any): Promise<void> {
    const relevantRules = this.alertRules.filter(rule =>
      rule.enabled && rule.condition.startsWith(category)
    );

    for (const rule of relevantRules) {
      if (this.shouldSkipAlert(rule)) continue;

      const value = this.extractMetricValue(metrics, rule.condition.replace(`${category}.`, ''));

      if (this.evaluateCondition(value, rule.operator, rule.threshold)) {
        await this.createAlert({
          ruleId: rule.id,
          ruleName: rule.name,
          message: `${rule.name}: ${rule.condition} is ${value} (threshold: ${rule.threshold})`,
          severity: rule.severity,
          value,
          threshold: rule.threshold,
          metadata: { category, condition: rule.condition },
        });

        rule.lastTriggered = new Date();
      }
    }
  }

  private shouldSkipAlert(rule: AlertRule): boolean {
    if (!rule.lastTriggered) return false;

    const cooldownMs = rule.cooldown * 60 * 1000;
    return Date.now() - rule.lastTriggered.getTime() < cooldownMs;
  }

  private extractMetricValue(metrics: any, condition: string): number {
    const paths = condition.split('.');
    let value = metrics;

    for (const path of paths) {
      value = value?.[path];
      if (value === undefined) return 0;
    }

    return typeof value === 'number' ? value : 0;
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  private async createAlert(alertData: {
    ruleId: string;
    ruleName: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    value: number;
    threshold: number;
    metadata?: Record<string, any>;
  }): Promise<Alert> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      ...alertData,
    };

    this.alerts.push(alert);

    // Send notifications
    await this.sendNotifications(alert);

    this.logger.warn(`Alert created: ${alert.message} (${alert.id})`);
    return alert;
  }

  private async sendNotifications(alert: Alert): Promise<void> {
    try {
      // Send Slack notification
      if (this.notificationConfig.slack?.enabled) {
        await this.sendSlackNotification(alert);
      }

      // Send email for high/critical alerts
      if (this.notificationConfig.email?.enabled && ['high', 'critical'].includes(alert.severity)) {
        await this.sendEmailNotification(alert);
      }

      // Send PagerDuty for critical alerts
      if (this.notificationConfig.pagerduty?.enabled && alert.severity === 'critical') {
        await this.sendPagerDutyAlert(alert);
      }

      // Send webhook notification
      if (this.notificationConfig.webhook?.enabled) {
        await this.sendWebhookNotification(alert);
      }

    } catch (error) {
      this.logger.error('Failed to send alert notifications', error.stack);
    }
  }

  private async sendSlackNotification(alert: Alert): Promise<void> {
    const config = this.notificationConfig.slack!;
    const color = this.getSeverityColor(alert.severity);

    const payload = {
      attachments: [{
        color,
        title: `🚨 Alert: ${alert.severity.toUpperCase()}`,
        text: alert.message,
        fields: [
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Value', value: alert.value.toString(), short: true },
          { title: 'Threshold', value: alert.threshold.toString(), short: true },
          { title: 'Time', value: alert.timestamp.toISOString(), short: true },
          { title: 'Rule', value: alert.ruleName, short: true },
          { title: 'Alert ID', value: alert.id, short: true },
        ],
        footer: 'RestaurantHub Monitoring',
        ts: Math.floor(alert.timestamp.getTime() / 1000),
      }],
    };

    // This would make an HTTP request to Slack webhook
    this.logger.log(`Would send Slack notification for alert: ${alert.id}`);
  }

  private async sendEmailNotification(alert: Alert): Promise<void> {
    const recipients = this.notificationConfig.email!.recipients;

    // This would send an email
    this.logger.log(`Would send email notification to ${recipients.join(', ')} for alert: ${alert.id}`);
  }

  private async sendPagerDutyAlert(alert: Alert): Promise<void> {
    const config = this.notificationConfig.pagerduty!;

    const payload = {
      routing_key: config.integrationKey,
      event_action: 'trigger',
      dedup_key: alert.ruleId,
      payload: {
        summary: alert.message,
        severity: alert.severity,
        source: 'RestaurantHub API',
        component: 'monitoring',
        group: 'platform',
        class: 'performance',
        custom_details: {
          value: alert.value,
          threshold: alert.threshold,
          rule_id: alert.ruleId,
          alert_id: alert.id,
          metadata: alert.metadata,
        },
      },
    };

    // This would make an HTTP request to PagerDuty
    this.logger.log(`Would send PagerDuty alert for: ${alert.id}`);
  }

  private async sendWebhookNotification(alert: Alert): Promise<void> {
    const config = this.notificationConfig.webhook!;

    const payload = {
      event: 'alert_created',
      alert,
      timestamp: new Date().toISOString(),
    };

    // This would make an HTTP request to the webhook URL
    this.logger.log(`Would send webhook notification to ${config.url} for alert: ${alert.id}`);
  }

  private getSeverityColor(severity: string): string {
    const colors = {
      low: 'good',
      medium: 'warning',
      high: 'danger',
      critical: '#ff0000',
    };
    return colors[severity as keyof typeof colors] || 'good';
  }

  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        condition: 'system.cpu.usage',
        threshold: 80,
        operator: 'gt',
        severity: 'high',
        enabled: true,
        cooldown: 5,
        description: 'CPU usage exceeds 80%',
        tags: ['system', 'performance'],
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        condition: 'system.memory.usage',
        threshold: 85,
        operator: 'gt',
        severity: 'high',
        enabled: true,
        cooldown: 5,
        description: 'Memory usage exceeds 85%',
        tags: ['system', 'performance'],
      },
      {
        id: 'low_disk_space',
        name: 'Low Disk Space',
        condition: 'system.disk.usage',
        threshold: 90,
        operator: 'gt',
        severity: 'critical',
        enabled: true,
        cooldown: 30,
        description: 'Disk usage exceeds 90%',
        tags: ['system', 'storage'],
      },
      {
        id: 'high_response_time',
        name: 'High Response Time',
        condition: 'performance.averageResponseTime',
        threshold: 2000,
        operator: 'gt',
        severity: 'medium',
        enabled: true,
        cooldown: 10,
        description: 'Average response time exceeds 2 seconds',
        tags: ['performance', 'api'],
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: 'performance.errorRate',
        threshold: 5,
        operator: 'gt',
        severity: 'high',
        enabled: true,
        cooldown: 5,
        description: 'Error rate exceeds 5%',
        tags: ['performance', 'errors'],
      },
      {
        id: 'database_slow_queries',
        name: 'Database Slow Queries',
        condition: 'database.queries.slow',
        threshold: 10,
        operator: 'gt',
        severity: 'medium',
        enabled: true,
        cooldown: 15,
        description: 'Too many slow database queries',
        tags: ['database', 'performance'],
      },
    ];

    this.logger.log(`Initialized ${this.alertRules.length} default alert rules`);
  }

  private initializeNotificationConfig(): void {
    this.notificationConfig = {
      slack: {
        enabled: !!this.configService.get('SLACK_WEBHOOK_URL'),
        webhookUrl: this.configService.get('SLACK_WEBHOOK_URL') || '',
        channels: {
          low: '#alerts-low',
          medium: '#alerts-medium',
          high: '#alerts-high',
          critical: '#alerts-critical',
        },
      },
      email: {
        enabled: !!this.configService.get('ADMIN_EMAIL'),
        recipients: [this.configService.get('ADMIN_EMAIL')].filter(Boolean),
        smtpConfig: {}, // Would be configured based on environment
      },
      pagerduty: {
        enabled: !!this.configService.get('PAGERDUTY_INTEGRATION_KEY'),
        integrationKey: this.configService.get('PAGERDUTY_INTEGRATION_KEY') || '',
      },
      webhook: {
        enabled: !!this.configService.get('WEBHOOK_NOTIFICATION_URL'),
        url: this.configService.get('WEBHOOK_NOTIFICATION_URL') || '',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.configService.get('WEBHOOK_AUTH_TOKEN') || ''}`,
        },
      },
    };

    this.logger.log('Notification configuration initialized');
  }
}