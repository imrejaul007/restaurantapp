"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingService = void 0;
const common_1 = require("@nestjs/common");
const nest_winston_1 = require("nest-winston");
const winston_1 = require("winston");
let LoggingService = class LoggingService {
    constructor(logger) {
        this.logger = logger;
    }
    log(message, context) {
        this.info(message, context);
    }
    error(message, trace, context) {
        const meta = this.buildMeta(context);
        if (trace) {
            meta.trace = trace;
        }
        this.logger.error(message, meta);
    }
    warn(message, context) {
        const meta = this.buildMeta(context);
        this.logger.warn(message, meta);
    }
    debug(message, context) {
        const meta = this.buildMeta(context);
        this.logger.debug(message, meta);
    }
    verbose(message, context) {
        const meta = this.buildMeta(context);
        this.logger.verbose(message, meta);
    }
    info(message, context) {
        const meta = this.buildMeta(context);
        this.logger.info(message, meta);
    }
    logHttpRequest(req, res, responseTime) {
        const context = {
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode: res.statusCode,
            responseTime,
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            requestId: req.id,
            contentLength: res.get('Content-Length'),
            referer: req.get('Referer'),
        };
        const message = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${responseTime}ms`;
        this.logger.http(message, context);
    }
    logSecurityEvent(event) {
        const message = `Security Event: ${event.type} - ${event.severity}`;
        this.logger.log({
            level: this.getSecurityLogLevel(event.severity),
            message,
            ...event,
            category: 'security',
        });
        if (event.severity === 'CRITICAL') {
            this.error(`CRITICAL SECURITY EVENT: ${event.type}`, JSON.stringify(event.details));
        }
    }
    logDatabaseQuery(query, params, executionTime, context) {
        const meta = {
            ...this.buildMeta(context),
            query: this.sanitizeQuery(query),
            paramCount: params.length,
            executionTime,
            category: 'database',
        };
        if (executionTime > 1000) {
            this.warn(`Slow database query detected (${executionTime}ms)`, meta);
        }
        else {
            this.debug(`Database query executed`, meta);
        }
    }
    logBusinessEvent(event, data, context) {
        const meta = {
            ...this.buildMeta(context),
            eventData: data,
            category: 'business',
        };
        this.info(`Business Event: ${event}`, meta);
    }
    logPaymentEvent(event, paymentId, amount, currency, context) {
        const meta = {
            ...this.buildMeta(context),
            paymentId,
            amount,
            currency,
            category: 'payment',
        };
        this.info(`Payment Event: ${event}`, meta);
    }
    logOrderEvent(event, orderId, customerId, restaurantId, context) {
        const meta = {
            ...this.buildMeta(context),
            orderId,
            customerId,
            restaurantId,
            category: 'order',
        };
        this.info(`Order Event: ${event}`, meta);
    }
    logFileOperation(operation, filename, size, context) {
        const meta = {
            ...this.buildMeta(context),
            operation,
            filename,
            size,
            category: 'file',
        };
        this.info(`File Operation: ${operation}`, meta);
    }
    logEmailEvent(event, recipient, template, context) {
        const meta = {
            ...this.buildMeta(context),
            recipient: this.maskEmail(recipient),
            template,
            category: 'email',
        };
        this.info(`Email Event: ${event}`, meta);
    }
    logPerformanceMetric(metric, value, unit, context) {
        const meta = {
            ...this.buildMeta(context),
            metric,
            value,
            unit,
            category: 'performance',
        };
        this.info(`Performance Metric: ${metric}`, meta);
    }
    logRateLimitEvent(ip, endpoint, limit, current, context) {
        const meta = {
            ...this.buildMeta(context),
            ip,
            endpoint,
            limit,
            current,
            category: 'ratelimit',
        };
        if (current >= limit) {
            this.warn(`Rate limit exceeded for ${ip} on ${endpoint}`, meta);
            if (current > limit * 2) {
                this.logSecurityEvent({
                    type: 'RATE_LIMIT',
                    severity: 'MEDIUM',
                    ip,
                    details: { endpoint, limit, current },
                    timestamp: new Date(),
                });
            }
        }
        else {
            this.debug(`Rate limit check for ${ip} on ${endpoint}`, meta);
        }
    }
    buildMeta(context) {
        if (typeof context === 'string') {
            return { context };
        }
        if (typeof context === 'object') {
            return { ...context };
        }
        return {};
    }
    getSecurityLogLevel(severity) {
        switch (severity) {
            case 'CRITICAL':
                return 'error';
            case 'HIGH':
                return 'warn';
            case 'MEDIUM':
                return 'info';
            case 'LOW':
            default:
                return 'debug';
        }
    }
    sanitizeQuery(query) {
        return query
            .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
            .replace(/email\s*=\s*'[^']*'/gi, "email='***@***.***'")
            .replace(/token\s*=\s*'[^']*'/gi, "token='***'");
    }
    maskEmail(email) {
        if (!email || !email.includes('@')) {
            return '***';
        }
        const [localPart, domain] = email.split('@');
        const maskedLocal = localPart.length > 2
            ? `${localPart[0]}***${localPart[localPart.length - 1]}`
            : '***';
        return `${maskedLocal}@${domain}`;
    }
    async queryLogs(filters) {
        return {
            logs: [],
            total: 0,
            filters,
            message: 'Log querying would be implemented with a log aggregation service',
        };
    }
    async checkHealth() {
        try {
            this.debug('Logging health check', { timestamp: new Date() });
            return {
                status: 'healthy',
                details: {
                    transports: this.logger.transports?.length || 0,
                    level: this.logger.level,
                },
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: error.message,
                },
            };
        }
    }
    createMetricLog(name, value, tags = {}) {
        this.info('METRIC', {
            metric: {
                name,
                value,
                tags,
                timestamp: Date.now(),
            },
            category: 'metric',
        });
    }
    setCorrelationId(correlationId) {
        this.logger.defaultMeta = {
            ...this.logger.defaultMeta,
            correlationId,
        };
    }
};
exports.LoggingService = LoggingService;
exports.LoggingService = LoggingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [winston_1.Logger])
], LoggingService);
//# sourceMappingURL=logging.service.js.map