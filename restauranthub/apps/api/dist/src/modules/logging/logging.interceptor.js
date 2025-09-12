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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const logging_service_1 = require("./logging.service");
const crypto = __importStar(require("crypto"));
let LoggingInterceptor = class LoggingInterceptor {
    constructor(loggingService) {
        this.loggingService = loggingService;
    }
    intercept(context, next) {
        const now = Date.now();
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const requestId = crypto.randomUUID();
        request.id = requestId;
        this.loggingService.setCorrelationId(requestId);
        const { method, originalUrl, ip, headers } = request;
        const userAgent = headers['user-agent'] || '';
        const userId = request.user?.id;
        this.loggingService.debug('Incoming Request', {
            requestId,
            method,
            url: originalUrl,
            ip,
            userAgent,
            userId,
            headers: this.sanitizeHeaders(headers),
        });
        return next.handle().pipe((0, operators_1.tap)((data) => {
            const responseTime = Date.now() - now;
            this.loggingService.logHttpRequest(request, response, responseTime);
            if (responseTime > 2000) {
                this.loggingService.warn('Slow request detected', {
                    requestId,
                    method,
                    url: originalUrl,
                    responseTime,
                    userId,
                });
            }
            this.logBusinessEvents(request, response, data);
        }), (0, operators_1.catchError)((error) => {
            const responseTime = Date.now() - now;
            this.loggingService.error(`Request failed: ${method} ${originalUrl}`, error.stack, {
                requestId,
                method,
                url: originalUrl,
                statusCode: error.status || 500,
                responseTime,
                ip,
                userAgent,
                userId,
                errorName: error.name,
                errorMessage: error.message,
            });
            this.logSecurityEvents(request, error);
            throw error;
        }));
    }
    sanitizeHeaders(headers) {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
        const sanitized = { ...headers };
        sensitiveHeaders.forEach(header => {
            if (sanitized[header]) {
                sanitized[header] = '***';
            }
        });
        return sanitized;
    }
    logBusinessEvents(request, response, data) {
        const { method, originalUrl, user } = request;
        const userId = user?.id;
        if (originalUrl.includes('/orders')) {
            if (method === 'POST' && response.statusCode === 201) {
                this.loggingService.logOrderEvent('ORDER_CREATED', data?.id, data?.customerId || userId, data?.restaurantId, { userId, orderId: data?.id });
            }
            else if (method === 'PATCH' && originalUrl.includes('/status')) {
                this.loggingService.logOrderEvent('ORDER_STATUS_UPDATED', data?.id, data?.customerId, data?.restaurantId, { userId, orderId: data?.id, newStatus: data?.status });
            }
        }
        if (originalUrl.includes('/payments')) {
            if (method === 'POST' && response.statusCode === 201) {
                this.loggingService.logPaymentEvent('PAYMENT_INITIATED', data?.id, data?.amount, data?.currency, { userId, paymentMethod: data?.paymentMethod });
            }
        }
        if (originalUrl.includes('/auth')) {
            if (originalUrl.includes('/signin') && method === 'POST') {
                if (response.statusCode === 200) {
                    this.loggingService.logBusinessEvent('USER_SIGNED_IN', {
                        userId: data?.user?.id,
                        userRole: data?.user?.role,
                    });
                }
            }
            else if (originalUrl.includes('/signup') && method === 'POST') {
                if (response.statusCode === 201) {
                    this.loggingService.logBusinessEvent('USER_REGISTERED', {
                        userId: data?.user?.id,
                        userRole: data?.user?.role,
                        userEmail: data?.user?.email,
                    });
                }
            }
            else if (originalUrl.includes('/logout') && method === 'POST') {
                if (response.statusCode === 200) {
                    this.loggingService.logBusinessEvent('USER_LOGGED_OUT', {
                        userId,
                    });
                }
            }
        }
        if (originalUrl.includes('/files') && method === 'POST') {
            if (response.statusCode === 201) {
                this.loggingService.logFileOperation('FILE_UPLOADED', data?.filename || 'unknown', data?.size || 0, { userId });
            }
        }
        if (originalUrl.includes('/restaurants')) {
            if (originalUrl.includes('/menu') && method === 'POST') {
                if (response.statusCode === 201) {
                    this.loggingService.logBusinessEvent('MENU_ITEM_ADDED', {
                        menuItemId: data?.id,
                        restaurantId: data?.restaurantId,
                        itemName: data?.name,
                    }, { userId });
                }
            }
            else if (originalUrl.includes('/reviews') && method === 'POST') {
                if (response.statusCode === 201) {
                    this.loggingService.logBusinessEvent('REVIEW_SUBMITTED', {
                        reviewId: data?.id,
                        restaurantId: data?.restaurantId,
                        rating: data?.rating,
                    }, { userId });
                }
            }
        }
    }
    logSecurityEvents(request, error) {
        const ip = request.ip || request.connection?.remoteAddress || '';
        const userAgent = request.get('User-Agent') || '';
        const url = request.originalUrl || request.url;
        if (error.status === 401) {
            this.loggingService.logSecurityEvent({
                type: 'UNAUTHORIZED_ACCESS',
                severity: 'MEDIUM',
                ip,
                userAgent,
                details: {
                    endpoint: url,
                    method: request.method,
                    errorMessage: error.message,
                },
                timestamp: new Date(),
            });
        }
        if (error.status === 403) {
            this.loggingService.logSecurityEvent({
                type: 'UNAUTHORIZED_ACCESS',
                severity: 'HIGH',
                userId: request.user?.id,
                ip,
                userAgent,
                details: {
                    endpoint: url,
                    method: request.method,
                    userRole: request.user?.role,
                    errorMessage: error.message,
                },
                timestamp: new Date(),
            });
        }
        if (error.status === 429) {
            this.loggingService.logSecurityEvent({
                type: 'RATE_LIMIT',
                severity: 'MEDIUM',
                ip,
                userAgent,
                details: {
                    endpoint: url,
                    method: request.method,
                    errorMessage: error.message,
                },
                timestamp: new Date(),
            });
        }
        if (error.status >= 400 && error.status < 500) {
            this.loggingService.debug('Potential suspicious activity', {
                ip,
                userAgent,
                endpoint: url,
                errorStatus: error.status,
                errorMessage: error.message,
            });
        }
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logging_service_1.LoggingService])
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map