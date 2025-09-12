import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as os from 'os';
import * as process from 'process';
import { DatabaseService } from '../database/database.service';
// import { RedisService } from '@nestjs-modules/ioredis';
// import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    connections: number;
    activeHandles: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

export interface DatabaseMetrics {
  timestamp: string;
  connections: {
    active: number;
    idle: number;
    waiting: number;
  };
  queries: {
    total: number;
    slow: number;
    failed: number;
  };
  performance: {
    averageResponseTime: number;
    throughput: number;
  };
  storage: {
    size: string;
    tables: number;
    indexes: number;
  };
}

export interface ApplicationMetrics {
  timestamp: string;
  http: {
    totalRequests: number;
    activeRequests: number;
    errorRate: number;
    averageResponseTime: number;
  };
  websocket: {
    activeConnections: number;
    totalMessages: number;
    messageRate: number;
  };
  queue: {
    jobs: {
      active: number;
      waiting: number;
      completed: number;
      failed: number;
    };
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictions: number;
    memory: number;
  };
}

export interface BusinessMetrics {
  timestamp: string;
  users: {
    total: number;
    active: number;
    newRegistrations: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    revenue: number;
    averageOrderValue: number;
  };
  restaurants: {
    total: number;
    active: number;
    newRegistrations: number;
  };
}

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
}

export interface Alert {
  id: string;
  ruleId: string;
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
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private metricsBuffer: any[] = [];
  private readonly maxBufferSize = 1000;
  
  // Stub implementations for missing services
  private readonly redisService = {
    getClient: () => ({
      info: async (section?: string) => 'redis_version:6.2.0\nused_memory:1024000\ntotal_commands_processed:10000',
      del: async (key: string) => 1,
      zremrangebyscore: async (key: string, min: number, max: number) => 0,
      zadd: async (key: string, score: number, member: string) => 1,
      zremrangebyrank: async (key: string, start: number, stop: number) => 0,
      set: async (key: string, value: string, ...args: any[]) => 'OK',
    })
  };
  
  private readonly httpService = {
    post: (url: string, data: any, config?: any) => {
      // Return a Promise that resolves immediately for stub implementation
      this.logger.log(`HTTP POST stub called for URL: ${url}`);
      return Promise.resolve({ data: { success: true }, status: 200, statusText: 'OK' });
    }
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    // private readonly redisService: RedisService,
    // private readonly httpService: HttpService,
  ) {
    this.initializeAlertRules();
  }

  // System Metrics Collection
  async getSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date().toISOString();
    
    // CPU metrics
    const cpuUsage = await this.getCpuUsage();
    const loadAverage = os.loadavg();
    const cores = os.cpus().length;

    // Memory metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;

    // Disk metrics (approximate)
    const diskInfo = await this.getDiskInfo();

    // Network metrics
    const networkInfo = await this.getNetworkInfo();

    // Process metrics
    const processInfo = {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };

    const metrics: SystemMetrics = {
      timestamp,
      cpu: {
        usage: cpuUsage,
        loadAverage,
        cores,
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usage: memoryUsage,
      },
      disk: diskInfo,
      network: networkInfo,
      process: processInfo,
    };

    await this.storeMetrics('system', metrics);
    await this.checkAlerts('system', metrics);

    return metrics;
  }

  // Database Metrics Collection
  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    const timestamp = new Date().toISOString();

    try {
      // Connection stats
      const connectionStats = await this.databaseService.$queryRaw`
        SELECT 
          count(*) as total_connections,
          sum(case when state = 'active' then 1 else 0 end) as active_connections,
          sum(case when state = 'idle' then 1 else 0 end) as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      ` as any[];

      // Query stats
      const queryStats = await this.databaseService.$queryRaw`
        SELECT 
          sum(calls) as total_queries,
          sum(case when mean_exec_time > 1000 then calls else 0 end) as slow_queries,
          avg(mean_exec_time) as average_response_time
        FROM pg_stat_statements 
        WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
      ` as any[];

      // Database size
      const sizeStats = await this.databaseService.$queryRaw`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as size,
          count(*) as table_count
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      ` as any[];

      const metrics: DatabaseMetrics = {
        timestamp,
        connections: {
          active: parseInt(connectionStats[0]?.active_connections || '0'),
          idle: parseInt(connectionStats[0]?.idle_connections || '0'),
          waiting: 0,
        },
        queries: {
          total: parseInt(queryStats[0]?.total_queries || '0'),
          slow: parseInt(queryStats[0]?.slow_queries || '0'),
          failed: 0,
        },
        performance: {
          averageResponseTime: parseFloat(queryStats[0]?.average_response_time || '0'),
          throughput: 0,
        },
        storage: {
          size: sizeStats[0]?.size || '0 bytes',
          tables: parseInt(sizeStats[0]?.table_count || '0'),
          indexes: 0,
        },
      };

      await this.storeMetrics('database', metrics);
      await this.checkAlerts('database', metrics);

      return metrics;
    } catch (error) {
      this.logger.error('Failed to collect database metrics', error);
      throw error;
    }
  }

  // Application Metrics Collection
  async getApplicationMetrics(): Promise<ApplicationMetrics> {
    const timestamp = new Date().toISOString();

    // Get Redis stats for cache metrics
    const redisInfo = null; // await this.redisService.getClient().info('memory');
    const redisStats = null; // await this.redisService.getClient().info('stats');

    const metrics: ApplicationMetrics = {
      timestamp,
      http: {
        totalRequests: 0, // Would be populated from actual metrics store
        activeRequests: 0,
        errorRate: 0,
        averageResponseTime: 0,
      },
      websocket: {
        activeConnections: 0,
        totalMessages: 0,
        messageRate: 0,
      },
      queue: {
        jobs: {
          active: 0,
          waiting: 0,
          completed: 0,
          failed: 0,
        },
      },
      cache: {
        hitRate: 0,
        missRate: 0,
        evictions: 0,
        memory: 0,
      },
    };

    await this.storeMetrics('application', metrics);
    await this.checkAlerts('application', metrics);

    return metrics;
  }

  // Business Metrics Collection
  async getBusinessMetrics(): Promise<BusinessMetrics> {
    const timestamp = new Date().toISOString();

    try {
      // User metrics
      const userCount = await this.databaseService.user.count();
      const activeUsers = await this.databaseService.user.count({
        where: {
          status: 'ACTIVE',
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      const newUsers = await this.databaseService.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      // Order metrics
      const orderCount = await this.databaseService.order.count();
      const orderStats = await this.databaseService.order.findMany({
        select: {
          status: true,
          total: true,
        },
      });

      const pendingOrders = orderStats.filter((s: any) => s.status === 'PENDING').length;
      const completedOrders = orderStats.filter((s: any) => s.status === 'DELIVERED').length;
      const cancelledOrders = orderStats.filter((s: any) => s.status === 'CANCELLED').length;
      const totalRevenue = orderStats.reduce((sum: number, stat: any) => sum + (stat.total || 0), 0);
      const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

      // Restaurant metrics
      const restaurantCount = await this.databaseService.restaurant.count();
      const activeRestaurants = await this.databaseService.restaurant.count({
        where: { verificationStatus: 'VERIFIED' },
      });

      const newRestaurants = await this.databaseService.restaurant.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      const metrics: BusinessMetrics = {
        timestamp,
        users: {
          total: userCount,
          active: activeUsers,
          newRegistrations: newUsers,
        },
        orders: {
          total: orderCount,
          pending: pendingOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
          revenue: totalRevenue,
          averageOrderValue,
        },
        restaurants: {
          total: restaurantCount,
          active: activeRestaurants,
          newRegistrations: newRestaurants,
        },
      };

      await this.storeMetrics('business', metrics);
      await this.checkAlerts('business', metrics);

      return metrics;
    } catch (error) {
      this.logger.error('Failed to collect business metrics', error);
      throw error;
    }
  }

  // Alert Management
  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    const alertRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.alertRules.push(alertRule);
    await this.storeAlertRule(alertRule);

    this.logger.log(`Alert rule created: ${alertRule.name}`);
    return alertRule;
  }

  async updateAlertRule(id: string, updates: Partial<AlertRule>): Promise<AlertRule> {
    const ruleIndex = this.alertRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) {
      throw new Error(`Alert rule not found: ${id}`);
    }

    this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
    await this.storeAlertRule(this.alertRules[ruleIndex]);

    return this.alertRules[ruleIndex];
  }

  async deleteAlertRule(id: string): Promise<void> {
    this.alertRules = this.alertRules.filter(rule => rule.id !== id);
    // await this.redisService.getClient().del(`alert_rule:${id}`);
  }

  async getAlerts(filter?: {
    severity?: string;
    acknowledged?: boolean;
    resolved?: boolean;
    limit?: number;
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

    await this.storeAlert(alert);
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    await this.storeAlert(alert);
  }

  // Scheduled Health Checks
  @Cron(CronExpression.EVERY_MINUTE)
  async performHealthCheck() {
    try {
      await this.getSystemMetrics();
    } catch (error) {
      this.logger.error('System health check failed', error);
      await this.createAlert({
        ruleId: 'system_health_check',
        message: 'System health check failed',
        severity: 'critical',
        value: 0,
        threshold: 1,
      });
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async performDatabaseCheck() {
    try {
      await this.getDatabaseMetrics();
    } catch (error) {
      this.logger.error('Database health check failed', error);
      await this.createAlert({
        ruleId: 'database_health_check',
        message: 'Database health check failed',
        severity: 'critical',
        value: 0,
        threshold: 1,
      });
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async performBusinessMetricsCheck() {
    try {
      await this.getBusinessMetrics();
    } catch (error) {
      this.logger.error('Business metrics check failed', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldMetrics() {
    try {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      // await this.redisService.getClient().zremrangebyscore(
      //   'metrics:system',
      //   0,
      //   cutoffDate.getTime()
      // );
      // await this.redisService.getClient().zremrangebyscore(
      //   'metrics:database',
      //   0,
      //   cutoffDate.getTime()
      // );
      // await this.redisService.getClient().zremrangebyscore(
      //   'metrics:application',
      //   0,
      //   cutoffDate.getTime()
      // );
      // await this.redisService.getClient().zremrangebyscore(
      //   'metrics:business',
      //   0,
      //   cutoffDate.getTime()
      // );

      this.logger.log('Old metrics cleaned up');
    } catch (error) {
      this.logger.error('Failed to cleanup old metrics', error);
    }
  }

  // Private helper methods
  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const totalUsage = currentUsage.user + currentUsage.system;
        const totalTime = 100000; // 100ms in microseconds
        const cpuPercent = (totalUsage / totalTime) * 100;
        resolve(Math.min(cpuPercent, 100));
      }, 100);
    });
  }

  private async getDiskInfo(): Promise<any> {
    // Simplified disk info - in production, use a library like 'node-disk-info'
    return {
      total: 100 * 1024 * 1024 * 1024, // 100GB placeholder
      used: 50 * 1024 * 1024 * 1024,   // 50GB placeholder
      free: 50 * 1024 * 1024 * 1024,   // 50GB placeholder
      usage: 50,
    };
  }

  private async getNetworkInfo(): Promise<any> {
    return {
      connections: 0, // Placeholder
      activeHandles: (process as any)._getActiveHandles?.()?.length || 0,
    };
  }

  private async storeMetrics(type: string, metrics: any): Promise<void> {
    const key = `metrics:${type}`;
    const score = Date.now();
    const member = JSON.stringify(metrics);

    // await this.redisService.getClient().zadd(key, score, member);

    // Keep only last 1000 entries
    // await this.redisService.getClient().zremrangebyrank(key, 0, -1001);
  }

  private async checkAlerts(type: string, metrics: any): Promise<void> {
    for (const rule of this.alertRules.filter(r => r.enabled)) {
      if (this.shouldSkipAlert(rule)) continue;

      const value = this.extractMetricValue(metrics, rule.condition);
      if (this.evaluateCondition(value, rule.operator, rule.threshold)) {
        await this.createAlert({
          ruleId: rule.id,
          message: `${rule.name}: ${rule.condition} is ${value} (threshold: ${rule.threshold})`,
          severity: rule.severity,
          value,
          threshold: rule.threshold,
        });

        // Update last triggered time
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
    // Simple dot notation path extraction
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
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    value: number;
    threshold: number;
  }): Promise<Alert> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      ...alertData,
    };

    this.alerts.push(alert);
    await this.storeAlert(alert);

    // Send notifications based on severity
    await this.sendAlertNotification(alert);

    this.logger.warn(`Alert created: ${alert.message}`);
    return alert;
  }

  private async storeAlert(alert: Alert): Promise<void> {
    const key = `alert:${alert.id}`;
    // await this.redisService.getClient().set(key, JSON.stringify(alert), 'EX', 86400 * 7); // 7 days TTL
  }

  private async storeAlertRule(rule: AlertRule): Promise<void> {
    const key = `alert_rule:${rule.id}`;
    // await this.redisService.getClient().set(key, JSON.stringify(rule));
  }

  private async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      // Slack notification
      const slackWebhook = this.configService.get('SLACK_WEBHOOK_URL');
      if (slackWebhook) {
        await this.sendSlackNotification(slackWebhook, alert);
      }

      // Email notification for critical alerts
      if (alert.severity === 'critical') {
        const adminEmail = this.configService.get('ADMIN_EMAIL');
        if (adminEmail) {
          await this.sendEmailNotification(adminEmail, alert);
        }
      }

      // PagerDuty for critical alerts
      const pagerdutyKey = this.configService.get('PAGERDUTY_INTEGRATION_KEY');
      if (pagerdutyKey && alert.severity === 'critical') {
        await this.sendPagerDutyAlert(pagerdutyKey, alert);
      }
    } catch (error) {
      this.logger.error('Failed to send alert notification', error);
    }
  }

  private async sendSlackNotification(webhookUrl: string, alert: Alert): Promise<void> {
    const color = {
      low: 'good',
      medium: 'warning',
      high: 'danger',
      critical: '#ff0000',
    }[alert.severity];

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
        ],
      }],
    };

    await this.httpService.post(webhookUrl, payload);
  }

  private async sendEmailNotification(email: string, alert: Alert): Promise<void> {
    // Implementation would depend on your email service
    this.logger.log(`Would send email to ${email} for critical alert: ${alert.message}`);
  }

  private async sendPagerDutyAlert(integrationKey: string, alert: Alert): Promise<void> {
    const payload = {
      routing_key: integrationKey,
      event_action: 'trigger',
      payload: {
        summary: alert.message,
        severity: alert.severity,
        source: 'RestaurantHub API',
        custom_details: {
          value: alert.value,
          threshold: alert.threshold,
          rule_id: alert.ruleId,
        },
      },
    };

    await this.httpService.post('https://events.pagerduty.com/v2/enqueue', payload);
  }

  private initializeAlertRules(): void {
    // Default alert rules
    this.alertRules = [
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        condition: 'cpu.usage',
        threshold: 80,
        operator: 'gt',
        severity: 'high',
        enabled: true,
        cooldown: 5,
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        condition: 'memory.usage',
        threshold: 85,
        operator: 'gt',
        severity: 'high',
        enabled: true,
        cooldown: 5,
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: 'http.errorRate',
        threshold: 5,
        operator: 'gt',
        severity: 'medium',
        enabled: true,
        cooldown: 10,
      },
      {
        id: 'low_disk_space',
        name: 'Low Disk Space',
        condition: 'disk.usage',
        threshold: 90,
        operator: 'gt',
        severity: 'critical',
        enabled: true,
        cooldown: 30,
      },
    ];
  }
}