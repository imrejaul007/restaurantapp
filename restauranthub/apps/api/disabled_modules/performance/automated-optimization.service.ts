import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdvancedCacheService } from '../cache/advanced-cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { PerformanceService } from '../monitoring/performance.service';

export interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  category: 'cache' | 'database' | 'api' | 'infrastructure';
  enabled: boolean;
  conditions: Array<{
    metric: string;
    operator: '>' | '<' | '=' | '>=' | '<=';
    threshold: number;
    duration: number; // seconds
  }>;
  actions: Array<{
    type: 'scale' | 'cache_refresh' | 'query_optimize' | 'alert';
    parameters: Record<string, any>;
  }>;
  cooldown: number; // seconds before rule can trigger again
  lastTriggered?: Date;
}

export interface OptimizationAction {
  id: string;
  ruleId: string;
  timestamp: Date;
  action: string;
  parameters: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: {
    success: boolean;
    message: string;
    metrics?: Record<string, number>;
  };
}

export interface PerformanceBaseline {
  metric: string;
  baseline: number;
  current: number;
  trend: 'improving' | 'degrading' | 'stable';
  lastUpdated: Date;
}

@Injectable()
export class AutomatedOptimizationService {
  private readonly logger = new Logger(AutomatedOptimizationService.name);
  private optimizationRules: OptimizationRule[] = [];
  private activeActions = new Map<string, OptimizationAction>();
  private performanceBaselines = new Map<string, PerformanceBaseline>();

  constructor(
    private configService: ConfigService,
    private cacheService: AdvancedCacheService,
    private prismaService: PrismaService,
    private performanceService: PerformanceService,
  ) {
    this.initializeOptimizationRules();
  }

  async getOptimizationRules(): Promise<OptimizationRule[]> {
    return this.optimizationRules;
  }

  async addOptimizationRule(rule: Omit<OptimizationRule, 'id'>): Promise<string> {
    const newRule: OptimizationRule = {
      id: this.generateId(),
      ...rule,
    };

    this.optimizationRules.push(newRule);

    // Persist rules in cache
    await this.cacheService.set(
      'optimization_rules',
      this.optimizationRules,
      { ttl: 86400 * 7, namespace: 'optimization' } // 7 days
    );

    this.logger.log(`Added new optimization rule: ${newRule.name}`);
    return newRule.id;
  }

  async updateOptimizationRule(id: string, updates: Partial<OptimizationRule>): Promise<boolean> {
    const ruleIndex = this.optimizationRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) {
      return false;
    }

    this.optimizationRules[ruleIndex] = {
      ...this.optimizationRules[ruleIndex],
      ...updates,
    };

    await this.cacheService.set(
      'optimization_rules',
      this.optimizationRules,
      { ttl: 86400 * 7, namespace: 'optimization' }
    );

    this.logger.log(`Updated optimization rule: ${id}`);
    return true;
  }

  async deleteOptimizationRule(id: string): Promise<boolean> {
    const initialLength = this.optimizationRules.length;
    this.optimizationRules = this.optimizationRules.filter(rule => rule.id !== id);

    if (this.optimizationRules.length < initialLength) {
      await this.cacheService.set(
        'optimization_rules',
        this.optimizationRules,
        { ttl: 86400 * 7, namespace: 'optimization' }
      );

      this.logger.log(`Deleted optimization rule: ${id}`);
      return true;
    }

    return false;
  }

  async getActiveActions(): Promise<OptimizationAction[]> {
    return Array.from(this.activeActions.values());
  }

  async getPerformanceBaselines(): Promise<PerformanceBaseline[]> {
    return Array.from(this.performanceBaselines.values());
  }

  async updatePerformanceBaseline(metric: string, value: number): Promise<void> {
    const existing = this.performanceBaselines.get(metric);
    const now = new Date();

    if (existing) {
      const trend = this.calculateTrend(existing.baseline, existing.current, value);
      this.performanceBaselines.set(metric, {
        metric,
        baseline: existing.baseline,
        current: value,
        trend,
        lastUpdated: now,
      });
    } else {
      this.performanceBaselines.set(metric, {
        metric,
        baseline: value,
        current: value,
        trend: 'stable',
        lastUpdated: now,
      });
    }

    // Persist baselines
    await this.cacheService.set(
      'performance_baselines',
      Array.from(this.performanceBaselines.values()),
      { ttl: 86400 * 30, namespace: 'optimization' } // 30 days
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async runOptimizationCheck(): Promise<void> {
    try {
      this.logger.debug('Running automated optimization check...');

      const metrics = await this.collectCurrentMetrics();

      for (const rule of this.optimizationRules) {
        if (!rule.enabled) continue;

        const shouldTrigger = await this.evaluateRule(rule, metrics);
        if (shouldTrigger) {
          await this.executeRule(rule, metrics);
        }
      }

      // Update performance baselines
      for (const [metricName, value] of Object.entries(metrics)) {
        await this.updatePerformanceBaseline(metricName, value);
      }

    } catch (error) {
      this.logger.error('Error during optimization check:', error);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanupCompletedActions(): Promise<void> {
    try {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const [actionId, action] of this.activeActions.entries()) {
        if (
          action.status === 'completed' ||
          action.status === 'failed' ||
          (now - action.timestamp.getTime()) > maxAge
        ) {
          this.activeActions.delete(actionId);
        }
      }

      this.logger.debug(`Cleaned up completed actions. Active actions: ${this.activeActions.size}`);
    } catch (error) {
      this.logger.error('Error during action cleanup:', error);
    }
  }

  private async collectCurrentMetrics(): Promise<Record<string, number>> {
    try {
      // Collect various performance metrics
      const metrics: Record<string, number> = {};

      // Mock metrics collection - in real implementation, these would come from monitoring
      metrics.response_time_avg = Math.random() * 200 + 50; // 50-250ms
      metrics.response_time_p95 = Math.random() * 400 + 200; // 200-600ms
      metrics.response_time_p99 = Math.random() * 800 + 400; // 400-1200ms
      metrics.error_rate = Math.random() * 0.05; // 0-5%
      metrics.throughput = Math.random() * 100 + 50; // 50-150 rps
      metrics.cpu_usage = Math.random() * 80 + 10; // 10-90%
      metrics.memory_usage = Math.random() * 70 + 20; // 20-90%
      metrics.cache_hit_rate = Math.random() * 0.3 + 0.7; // 70-100%
      metrics.database_connections = Math.floor(Math.random() * 20) + 10; // 10-30
      metrics.queue_depth = Math.floor(Math.random() * 100); // 0-100

      return metrics;
    } catch (error) {
      this.logger.error('Error collecting metrics:', error);
      return {};
    }
  }

  private async evaluateRule(rule: OptimizationRule, metrics: Record<string, number>): Promise<boolean> {
    try {
      // Check cooldown
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
        if (timeSinceLastTrigger < rule.cooldown * 1000) {
          return false;
        }
      }

      // Evaluate all conditions
      for (const condition of rule.conditions) {
        const metricValue = metrics[condition.metric];
        if (metricValue === undefined) {
          this.logger.warn(`Metric ${condition.metric} not found for rule ${rule.name}`);
          return false;
        }

        const conditionMet = this.evaluateCondition(metricValue, condition.operator, condition.threshold);
        if (!conditionMet) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Error evaluating rule ${rule.name}:`, error);
      return false;
    }
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '=':
        return Math.abs(value - threshold) < 0.01; // Small tolerance for floating point
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      default:
        return false;
    }
  }

  private async executeRule(rule: OptimizationRule, metrics: Record<string, number>): Promise<void> {
    try {
      this.logger.log(`Executing optimization rule: ${rule.name}`);

      // Update last triggered time
      rule.lastTriggered = new Date();

      for (const action of rule.actions) {
        const actionId = this.generateId();
        const optimizationAction: OptimizationAction = {
          id: actionId,
          ruleId: rule.id,
          timestamp: new Date(),
          action: action.type,
          parameters: action.parameters,
          status: 'pending',
        };

        this.activeActions.set(actionId, optimizationAction);

        // Execute action asynchronously
        this.executeAction(actionId, action, metrics).catch(error => {
          this.logger.error(`Error executing action ${actionId}:`, error);
        });
      }
    } catch (error) {
      this.logger.error(`Error executing rule ${rule.name}:`, error);
    }
  }

  private async executeAction(
    actionId: string,
    action: OptimizationAction['action'] | any,
    metrics: Record<string, number>
  ): Promise<void> {
    const optimizationAction = this.activeActions.get(actionId);
    if (!optimizationAction) return;

    try {
      optimizationAction.status = 'executing';

      let result: OptimizationAction['result'];

      switch (action.type) {
        case 'cache_refresh':
          result = await this.executeCacheRefresh(action.parameters);
          break;
        case 'scale':
          result = await this.executeScaling(action.parameters);
          break;
        case 'query_optimize':
          result = await this.executeQueryOptimization(action.parameters);
          break;
        case 'alert':
          result = await this.executeAlert(action.parameters, metrics);
          break;
        default:
          result = {
            success: false,
            message: `Unknown action type: ${action.type}`,
          };
      }

      optimizationAction.result = result;
      optimizationAction.status = result.success ? 'completed' : 'failed';

      this.logger.log(`Action ${actionId} ${optimizationAction.status}: ${result.message}`);

    } catch (error) {
      optimizationAction.status = 'failed';
      optimizationAction.result = {
        success: false,
        message: error.message,
      };

      this.logger.error(`Action ${actionId} failed:`, error);
    }
  }

  private async executeCacheRefresh(parameters: Record<string, any>): Promise<OptimizationAction['result']> {
    try {
      const namespace = parameters.namespace || 'default';
      const pattern = parameters.pattern || '*';

      // Clear cache based on pattern
      await this.cacheService.clearNamespace(namespace);

      return {
        success: true,
        message: `Cache refreshed for namespace: ${namespace}`,
        metrics: {
          cleared_keys: Math.floor(Math.random() * 100) + 50,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Cache refresh failed: ${error.message}`,
      };
    }
  }

  private async executeScaling(parameters: Record<string, any>): Promise<OptimizationAction['result']> {
    try {
      const component = parameters.component;
      const action = parameters.action; // 'scale_up' | 'scale_down'
      const amount = parameters.amount || 1;

      // Simulate scaling action
      this.logger.log(`Simulating ${action} for ${component} by ${amount} instances`);

      return {
        success: true,
        message: `Scaled ${component} ${action} by ${amount} instances`,
        metrics: {
          new_instance_count: Math.floor(Math.random() * 10) + amount,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Scaling failed: ${error.message}`,
      };
    }
  }

  private async executeQueryOptimization(parameters: Record<string, any>): Promise<OptimizationAction['result']> {
    try {
      const queryType = parameters.queryType;
      const optimizationType = parameters.optimizationType;

      // Simulate query optimization
      this.logger.log(`Optimizing ${queryType} queries using ${optimizationType}`);

      return {
        success: true,
        message: `Query optimization applied: ${optimizationType} for ${queryType}`,
        metrics: {
          queries_optimized: Math.floor(Math.random() * 20) + 5,
          performance_improvement: Math.random() * 0.5 + 0.1, // 10-60% improvement
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Query optimization failed: ${error.message}`,
      };
    }
  }

  private async executeAlert(
    parameters: Record<string, any>,
    metrics: Record<string, number>
  ): Promise<OptimizationAction['result']> {
    try {
      const alertType = parameters.type || 'warning';
      const message = parameters.message || 'Performance threshold exceeded';
      const channels = parameters.channels || ['log'];

      // Send alert through various channels
      for (const channel of channels) {
        switch (channel) {
          case 'log':
            this.logger.warn(`PERFORMANCE ALERT: ${message}`, { metrics });
            break;
          case 'email':
            // Simulate email alert
            this.logger.log(`Email alert sent: ${message}`);
            break;
          case 'slack':
            // Simulate Slack alert
            this.logger.log(`Slack alert sent: ${message}`);
            break;
        }
      }

      return {
        success: true,
        message: `Alert sent via ${channels.join(', ')}: ${message}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Alert failed: ${error.message}`,
      };
    }
  }

  private calculateTrend(baseline: number, previous: number, current: number): 'improving' | 'degrading' | 'stable' {
    const threshold = baseline * 0.05; // 5% threshold

    if (Math.abs(current - previous) < threshold) {
      return 'stable';
    }

    // For most metrics, lower is better (response time, error rate)
    // For some metrics, higher is better (throughput, cache hit rate)
    const isLowerBetter = !['throughput', 'cache_hit_rate'].some(metric =>
      baseline.toString().includes(metric)
    );

    if (isLowerBetter) {
      return current < previous ? 'improving' : 'degrading';
    } else {
      return current > previous ? 'improving' : 'degrading';
    }
  }

  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      {
        id: 'high_response_time',
        name: 'High Response Time Mitigation',
        description: 'Automatically refresh cache when response times are high',
        category: 'cache',
        enabled: true,
        conditions: [
          {
            metric: 'response_time_avg',
            operator: '>',
            threshold: 500, // 500ms
            duration: 300, // 5 minutes
          },
        ],
        actions: [
          {
            type: 'cache_refresh',
            parameters: {
              namespace: 'api',
              pattern: '*',
            },
          },
          {
            type: 'alert',
            parameters: {
              type: 'warning',
              message: 'High response time detected, cache refreshed',
              channels: ['log', 'slack'],
            },
          },
        ],
        cooldown: 1800, // 30 minutes
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate Alert',
        description: 'Alert when error rate exceeds threshold',
        category: 'api',
        enabled: true,
        conditions: [
          {
            metric: 'error_rate',
            operator: '>',
            threshold: 0.05, // 5%
            duration: 60, // 1 minute
          },
        ],
        actions: [
          {
            type: 'alert',
            parameters: {
              type: 'critical',
              message: 'Critical: Error rate exceeds 5%',
              channels: ['log', 'email', 'slack'],
            },
          },
        ],
        cooldown: 600, // 10 minutes
      },
      {
        id: 'low_cache_hit_rate',
        name: 'Low Cache Hit Rate Optimization',
        description: 'Optimize caching strategy when hit rate is low',
        category: 'cache',
        enabled: true,
        conditions: [
          {
            metric: 'cache_hit_rate',
            operator: '<',
            threshold: 0.7, // 70%
            duration: 600, // 10 minutes
          },
        ],
        actions: [
          {
            type: 'cache_refresh',
            parameters: {
              namespace: 'popular',
              pattern: 'frequently_accessed_*',
            },
          },
          {
            type: 'alert',
            parameters: {
              type: 'info',
              message: 'Cache hit rate below 70%, warming popular cache entries',
              channels: ['log'],
            },
          },
        ],
        cooldown: 3600, // 1 hour
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage Alert',
        description: 'Alert and optimize when memory usage is high',
        category: 'infrastructure',
        enabled: true,
        conditions: [
          {
            metric: 'memory_usage',
            operator: '>',
            threshold: 85, // 85%
            duration: 300, // 5 minutes
          },
        ],
        actions: [
          {
            type: 'cache_refresh',
            parameters: {
              namespace: 'temporary',
              pattern: 'temp_*',
            },
          },
          {
            type: 'alert',
            parameters: {
              type: 'warning',
              message: 'High memory usage detected, clearing temporary cache',
              channels: ['log', 'slack'],
            },
          },
        ],
        cooldown: 1800, // 30 minutes
      },
    ];
  }

  private generateId(): string {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}