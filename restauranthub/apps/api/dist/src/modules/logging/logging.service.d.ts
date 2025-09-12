import { LoggerService } from '@nestjs/common';
import { Logger } from 'winston';
export interface LogContext {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    responseTime?: number;
    [key: string]: any;
}
export interface SecurityEvent {
    type: 'AUTH_FAILURE' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY' | 'UNAUTHORIZED_ACCESS' | 'DATA_BREACH';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    userId?: string;
    ip: string;
    userAgent?: string;
    details: any;
    timestamp: Date;
}
export declare class LoggingService implements LoggerService {
    private readonly logger;
    constructor(logger: Logger);
    log(message: string, context?: string | LogContext): void;
    error(message: string, trace?: string, context?: string | LogContext): void;
    warn(message: string, context?: string | LogContext): void;
    debug(message: string, context?: string | LogContext): void;
    verbose(message: string, context?: string | LogContext): void;
    info(message: string, context?: string | LogContext): void;
    logHttpRequest(req: any, res: any, responseTime: number): void;
    logSecurityEvent(event: SecurityEvent): void;
    logDatabaseQuery(query: string, params: any[], executionTime: number, context?: LogContext): void;
    logBusinessEvent(event: string, data: any, context?: LogContext): void;
    logPaymentEvent(event: string, paymentId: string, amount: number, currency: string, context?: LogContext): void;
    logOrderEvent(event: string, orderId: string, customerId: string, restaurantId: string, context?: LogContext): void;
    logFileOperation(operation: string, filename: string, size: number, context?: LogContext): void;
    logEmailEvent(event: string, recipient: string, template?: string, context?: LogContext): void;
    logPerformanceMetric(metric: string, value: number, unit: string, context?: LogContext): void;
    logRateLimitEvent(ip: string, endpoint: string, limit: number, current: number, context?: LogContext): void;
    private buildMeta;
    private getSecurityLogLevel;
    private sanitizeQuery;
    private maskEmail;
    queryLogs(filters: {
        level?: string;
        category?: string;
        startDate?: Date;
        endDate?: Date;
        userId?: string;
        limit?: number;
    }): Promise<{
        logs: never[];
        total: number;
        filters: {
            level?: string;
            category?: string;
            startDate?: Date;
            endDate?: Date;
            userId?: string;
            limit?: number;
        };
        message: string;
    }>;
    checkHealth(): Promise<{
        status: string;
        details?: any;
    }>;
    createMetricLog(name: string, value: number, tags?: Record<string, string>): void;
    setCorrelationId(correlationId: string): void;
}
