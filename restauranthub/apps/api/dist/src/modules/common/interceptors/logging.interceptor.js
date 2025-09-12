"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggingInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let LoggingInterceptor = LoggingInterceptor_1 = class LoggingInterceptor {
    constructor() {
        this.logger = new common_1.Logger(LoggingInterceptor_1.name);
    }
    intercept(context, next) {
        const now = Date.now();
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const { method, originalUrl, ip, headers } = request;
        const userAgent = headers['user-agent'] || '';
        const userId = request.user?.id || 'anonymous';
        this.logger.log(`Incoming Request: ${method} ${originalUrl} - User: ${userId} - IP: ${ip} - ${userAgent}`);
        return next.handle().pipe((0, operators_1.tap)((data) => {
            const delay = Date.now() - now;
            this.logger.log(`Outgoing Response: ${method} ${originalUrl} - ${response.statusCode} - ${delay}ms`);
        }), (0, operators_1.catchError)((error) => {
            const delay = Date.now() - now;
            this.logger.error(`Error Response: ${method} ${originalUrl} - ${error.status || 500} - ${delay}ms - ${error.message}`, error.stack);
            throw error;
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = LoggingInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map