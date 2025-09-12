import { MonitoringService, AlertRule, Alert } from './monitoring.service';
export declare class MonitoringController {
    private readonly monitoringService;
    constructor(monitoringService: MonitoringService);
    getSystemStatus(): Promise<{
        statusCode: number;
        message: string;
        data: {
            system: import("./monitoring.service").SystemMetrics;
            database: import("./monitoring.service").DatabaseMetrics;
            application: import("./monitoring.service").ApplicationMetrics;
            timestamp: string;
        };
    }>;
    getSystemMetrics(): Promise<{
        statusCode: number;
        message: string;
        data: import("./monitoring.service").SystemMetrics;
    }>;
    getDatabaseMetrics(): Promise<{
        statusCode: number;
        message: string;
        data: import("./monitoring.service").DatabaseMetrics;
    }>;
    getApplicationMetrics(): Promise<{
        statusCode: number;
        message: string;
        data: import("./monitoring.service").ApplicationMetrics;
    }>;
    getBusinessMetrics(): Promise<{
        statusCode: number;
        message: string;
        data: import("./monitoring.service").BusinessMetrics;
    }>;
    getAlerts(severity?: string, acknowledged?: boolean, resolved?: boolean, limit?: number): Promise<{
        statusCode: number;
        message: string;
        data: Alert[];
        meta: {
            total: number;
        };
    }>;
    getAlertsSummary(): Promise<{
        statusCode: number;
        message: string;
        data: {
            total: number;
            byStatus: {
                acknowledged: number;
                unacknowledged: number;
                resolved: number;
                active: number;
            };
            bySeverity: {
                critical: number;
                high: number;
                medium: number;
                low: number;
            };
        };
    }>;
    acknowledgeAlert(alertId: string, userId: string): Promise<{
        statusCode: number;
        message: string;
    }>;
    resolveAlert(alertId: string): Promise<{
        statusCode: number;
        message: string;
    }>;
    getAlertRules(): Promise<{
        statusCode: number;
        message: string;
        data: never[];
    }>;
    createAlertRule(alertRuleData: Omit<AlertRule, 'id'>): Promise<{
        statusCode: number;
        message: string;
        data: AlertRule;
    }>;
    updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<{
        statusCode: number;
        message: string;
        data: AlertRule;
    }>;
    deleteAlertRule(ruleId: string): Promise<{
        statusCode: number;
        message: string;
    }>;
    getHealthCheck(): Promise<{
        statusCode: number;
        message: string;
        data: {
            status: string;
            timestamp: string;
            checks: {
                system: string;
                database: string;
            };
            uptime: number;
            version: string;
            error?: undefined;
        };
    } | {
        statusCode: number;
        message: string;
        data: {
            status: string;
            timestamp: string;
            error: string;
            checks?: undefined;
            uptime?: undefined;
            version?: undefined;
        };
    }>;
    getDashboardData(): Promise<{
        statusCode: number;
        message: string;
        data: {
            metrics: {
                system: import("./monitoring.service").SystemMetrics;
                database: import("./monitoring.service").DatabaseMetrics;
                application: import("./monitoring.service").ApplicationMetrics;
                business: import("./monitoring.service").BusinessMetrics;
            };
            alerts: {
                total: number;
                active: number;
                critical: number;
                recent: Alert[];
            };
            status: {
                overall: string;
                uptime: number;
                timestamp: string;
            };
            error?: undefined;
        };
    } | {
        statusCode: number;
        message: string;
        data: {
            error: string;
            metrics?: undefined;
            alerts?: undefined;
            status?: undefined;
        };
    }>;
}
