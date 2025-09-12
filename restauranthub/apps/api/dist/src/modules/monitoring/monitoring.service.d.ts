import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
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
    cooldown: number;
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
export declare class MonitoringService {
    private readonly configService;
    private readonly databaseService;
    private readonly logger;
    private alerts;
    private alertRules;
    private metricsBuffer;
    private readonly maxBufferSize;
    private readonly redisService;
    private readonly httpService;
    constructor(configService: ConfigService, databaseService: DatabaseService);
    getSystemMetrics(): Promise<SystemMetrics>;
    getDatabaseMetrics(): Promise<DatabaseMetrics>;
    getApplicationMetrics(): Promise<ApplicationMetrics>;
    getBusinessMetrics(): Promise<BusinessMetrics>;
    createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule>;
    updateAlertRule(id: string, updates: Partial<AlertRule>): Promise<AlertRule>;
    deleteAlertRule(id: string): Promise<void>;
    getAlerts(filter?: {
        severity?: string;
        acknowledged?: boolean;
        resolved?: boolean;
        limit?: number;
    }): Promise<Alert[]>;
    acknowledgeAlert(alertId: string, userId: string): Promise<void>;
    resolveAlert(alertId: string): Promise<void>;
    performHealthCheck(): Promise<void>;
    performDatabaseCheck(): Promise<void>;
    performBusinessMetricsCheck(): Promise<void>;
    cleanupOldMetrics(): Promise<void>;
    private getCpuUsage;
    private getDiskInfo;
    private getNetworkInfo;
    private storeMetrics;
    private checkAlerts;
    private shouldSkipAlert;
    private extractMetricValue;
    private evaluateCondition;
    private createAlert;
    private storeAlert;
    private storeAlertRule;
    private sendAlertNotification;
    private sendSlackNotification;
    private sendEmailNotification;
    private sendPagerDutyAlert;
    private initializeAlertRules;
}
