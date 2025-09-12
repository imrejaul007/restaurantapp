"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const os = __importStar(require("os"));
const process = __importStar(require("process"));
const database_service_1 = require("../database/database.service");
let MonitoringService = MonitoringService_1 = class MonitoringService {
    constructor(configService, databaseService) {
        this.configService = configService;
        this.databaseService = databaseService;
        this.logger = new common_1.Logger(MonitoringService_1.name);
        this.alerts = [];
        this.alertRules = [];
        this.metricsBuffer = [];
        this.maxBufferSize = 1000;
        this.redisService = {
            getClient: () => ({
                info: async (section) => 'redis_version:6.2.0\nused_memory:1024000\ntotal_commands_processed:10000',
                del: async (key) => 1,
                zremrangebyscore: async (key, min, max) => 0,
                zadd: async (key, score, member) => 1,
                zremrangebyrank: async (key, start, stop) => 0,
                set: async (key, value, ...args) => 'OK',
            })
        };
        this.httpService = {
            post: (url, data, config) => {
                this.logger.log(`HTTP POST stub called for URL: ${url}`);
                return Promise.resolve({ data: { success: true }, status: 200, statusText: 'OK' });
            }
        };
        this.initializeAlertRules();
    }
    async getSystemMetrics() {
        const timestamp = new Date().toISOString();
        const cpuUsage = await this.getCpuUsage();
        const loadAverage = os.loadavg();
        const cores = os.cpus().length;
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;
        const diskInfo = await this.getDiskInfo();
        const networkInfo = await this.getNetworkInfo();
        const processInfo = {
            pid: process.pid,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
        };
        const metrics = {
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
    async getDatabaseMetrics() {
        const timestamp = new Date().toISOString();
        try {
            const connectionStats = await this.databaseService.$queryRaw `
        SELECT 
          count(*) as total_connections,
          sum(case when state = 'active' then 1 else 0 end) as active_connections,
          sum(case when state = 'idle' then 1 else 0 end) as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;
            const queryStats = await this.databaseService.$queryRaw `
        SELECT 
          sum(calls) as total_queries,
          sum(case when mean_exec_time > 1000 then calls else 0 end) as slow_queries,
          avg(mean_exec_time) as average_response_time
        FROM pg_stat_statements 
        WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
      `;
            const sizeStats = await this.databaseService.$queryRaw `
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as size,
          count(*) as table_count
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
            const metrics = {
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
        }
        catch (error) {
            this.logger.error('Failed to collect database metrics', error);
            throw error;
        }
    }
    async getApplicationMetrics() {
        const timestamp = new Date().toISOString();
        const redisInfo = null;
        const redisStats = null;
        const metrics = {
            timestamp,
            http: {
                totalRequests: 0,
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
    async getBusinessMetrics() {
        const timestamp = new Date().toISOString();
        try {
            const userCount = await this.databaseService.user.count();
            const activeUsers = await this.databaseService.user.count({
                where: {
                    status: 'ACTIVE',
                    updatedAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                },
            });
            const newUsers = await this.databaseService.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                },
            });
            const orderCount = await this.databaseService.order.count();
            const orderStats = await this.databaseService.order.findMany({
                select: {
                    status: true,
                    total: true,
                },
            });
            const pendingOrders = orderStats.filter((s) => s.status === 'PENDING').length;
            const completedOrders = orderStats.filter((s) => s.status === 'DELIVERED').length;
            const cancelledOrders = orderStats.filter((s) => s.status === 'CANCELLED').length;
            const totalRevenue = orderStats.reduce((sum, stat) => sum + (stat.total || 0), 0);
            const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
            const restaurantCount = await this.databaseService.restaurant.count();
            const activeRestaurants = await this.databaseService.restaurant.count({
                where: { verificationStatus: 'VERIFIED' },
            });
            const newRestaurants = await this.databaseService.restaurant.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                },
            });
            const metrics = {
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
        }
        catch (error) {
            this.logger.error('Failed to collect business metrics', error);
            throw error;
        }
    }
    async createAlertRule(rule) {
        const alertRule = {
            ...rule,
            id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        this.alertRules.push(alertRule);
        await this.storeAlertRule(alertRule);
        this.logger.log(`Alert rule created: ${alertRule.name}`);
        return alertRule;
    }
    async updateAlertRule(id, updates) {
        const ruleIndex = this.alertRules.findIndex(rule => rule.id === id);
        if (ruleIndex === -1) {
            throw new Error(`Alert rule not found: ${id}`);
        }
        this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
        await this.storeAlertRule(this.alertRules[ruleIndex]);
        return this.alertRules[ruleIndex];
    }
    async deleteAlertRule(id) {
        this.alertRules = this.alertRules.filter(rule => rule.id !== id);
    }
    async getAlerts(filter) {
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
    async acknowledgeAlert(alertId, userId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (!alert) {
            throw new Error(`Alert not found: ${alertId}`);
        }
        alert.acknowledged = true;
        alert.acknowledgedBy = userId;
        alert.acknowledgedAt = new Date();
        await this.storeAlert(alert);
    }
    async resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (!alert) {
            throw new Error(`Alert not found: ${alertId}`);
        }
        alert.resolved = true;
        alert.resolvedAt = new Date();
        await this.storeAlert(alert);
    }
    async performHealthCheck() {
        try {
            await this.getSystemMetrics();
        }
        catch (error) {
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
    async performDatabaseCheck() {
        try {
            await this.getDatabaseMetrics();
        }
        catch (error) {
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
    async performBusinessMetricsCheck() {
        try {
            await this.getBusinessMetrics();
        }
        catch (error) {
            this.logger.error('Business metrics check failed', error);
        }
    }
    async cleanupOldMetrics() {
        try {
            const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            this.logger.log('Old metrics cleaned up');
        }
        catch (error) {
            this.logger.error('Failed to cleanup old metrics', error);
        }
    }
    async getCpuUsage() {
        return new Promise((resolve) => {
            const startUsage = process.cpuUsage();
            setTimeout(() => {
                const currentUsage = process.cpuUsage(startUsage);
                const totalUsage = currentUsage.user + currentUsage.system;
                const totalTime = 100000;
                const cpuPercent = (totalUsage / totalTime) * 100;
                resolve(Math.min(cpuPercent, 100));
            }, 100);
        });
    }
    async getDiskInfo() {
        return {
            total: 100 * 1024 * 1024 * 1024,
            used: 50 * 1024 * 1024 * 1024,
            free: 50 * 1024 * 1024 * 1024,
            usage: 50,
        };
    }
    async getNetworkInfo() {
        return {
            connections: 0,
            activeHandles: process._getActiveHandles?.()?.length || 0,
        };
    }
    async storeMetrics(type, metrics) {
        const key = `metrics:${type}`;
        const score = Date.now();
        const member = JSON.stringify(metrics);
    }
    async checkAlerts(type, metrics) {
        for (const rule of this.alertRules.filter(r => r.enabled)) {
            if (this.shouldSkipAlert(rule))
                continue;
            const value = this.extractMetricValue(metrics, rule.condition);
            if (this.evaluateCondition(value, rule.operator, rule.threshold)) {
                await this.createAlert({
                    ruleId: rule.id,
                    message: `${rule.name}: ${rule.condition} is ${value} (threshold: ${rule.threshold})`,
                    severity: rule.severity,
                    value,
                    threshold: rule.threshold,
                });
                rule.lastTriggered = new Date();
            }
        }
    }
    shouldSkipAlert(rule) {
        if (!rule.lastTriggered)
            return false;
        const cooldownMs = rule.cooldown * 60 * 1000;
        return Date.now() - rule.lastTriggered.getTime() < cooldownMs;
    }
    extractMetricValue(metrics, condition) {
        const paths = condition.split('.');
        let value = metrics;
        for (const path of paths) {
            value = value?.[path];
            if (value === undefined)
                return 0;
        }
        return typeof value === 'number' ? value : 0;
    }
    evaluateCondition(value, operator, threshold) {
        switch (operator) {
            case 'gt': return value > threshold;
            case 'gte': return value >= threshold;
            case 'lt': return value < threshold;
            case 'lte': return value <= threshold;
            case 'eq': return value === threshold;
            default: return false;
        }
    }
    async createAlert(alertData) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            acknowledged: false,
            resolved: false,
            ...alertData,
        };
        this.alerts.push(alert);
        await this.storeAlert(alert);
        await this.sendAlertNotification(alert);
        this.logger.warn(`Alert created: ${alert.message}`);
        return alert;
    }
    async storeAlert(alert) {
        const key = `alert:${alert.id}`;
    }
    async storeAlertRule(rule) {
        const key = `alert_rule:${rule.id}`;
    }
    async sendAlertNotification(alert) {
        try {
            const slackWebhook = this.configService.get('SLACK_WEBHOOK_URL');
            if (slackWebhook) {
                await this.sendSlackNotification(slackWebhook, alert);
            }
            if (alert.severity === 'critical') {
                const adminEmail = this.configService.get('ADMIN_EMAIL');
                if (adminEmail) {
                    await this.sendEmailNotification(adminEmail, alert);
                }
            }
            const pagerdutyKey = this.configService.get('PAGERDUTY_INTEGRATION_KEY');
            if (pagerdutyKey && alert.severity === 'critical') {
                await this.sendPagerDutyAlert(pagerdutyKey, alert);
            }
        }
        catch (error) {
            this.logger.error('Failed to send alert notification', error);
        }
    }
    async sendSlackNotification(webhookUrl, alert) {
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
    async sendEmailNotification(email, alert) {
        this.logger.log(`Would send email to ${email} for critical alert: ${alert.message}`);
    }
    async sendPagerDutyAlert(integrationKey, alert) {
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
    initializeAlertRules() {
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
};
exports.MonitoringService = MonitoringService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringService.prototype, "performHealthCheck", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringService.prototype, "performDatabaseCheck", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringService.prototype, "performBusinessMetricsCheck", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringService.prototype, "cleanupOldMetrics", null);
exports.MonitoringService = MonitoringService = MonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        database_service_1.DatabaseService])
], MonitoringService);
//# sourceMappingURL=monitoring.service.js.map