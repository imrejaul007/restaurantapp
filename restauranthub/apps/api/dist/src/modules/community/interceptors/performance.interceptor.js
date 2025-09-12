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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const core_1 = require("@nestjs/core");
const security_performance_service_1 = require("../security-performance.service");
const rate_limit_decorator_1 = require("../decorators/rate-limit.decorator");
const cache_decorator_1 = require("../decorators/cache.decorator");
let PerformanceInterceptor = class PerformanceInterceptor {
    constructor(reflector, securityPerformanceService) {
        this.reflector = reflector;
        this.securityPerformanceService = securityPerformanceService;
    }
    intercept(context, next) {
        const startTime = Date.now();
        const request = context.switchToHttp().getRequest();
        const handler = context.getHandler();
        const controller = context.getClass();
        const operationName = `${controller.name}.${handler.name}`;
        this.checkRateLimit(context, request);
        const cacheResult = this.checkCache(context, request);
        if (cacheResult) {
            return new rxjs_1.Observable(subscriber => {
                subscriber.next(cacheResult);
                subscriber.complete();
            });
        }
        return next.handle().pipe((0, operators_1.tap)(async (response) => {
            const duration = Date.now() - startTime;
            await this.securityPerformanceService.logPerformanceMetric(operationName, duration, {
                method: request.method,
                url: request.url,
                userId: request.user?.id,
                responseSize: JSON.stringify(response).length,
            });
            await this.cacheResponse(context, request, response);
        }));
    }
    async checkRateLimit(context, request) {
        const rateLimitConfig = this.reflector.get(rate_limit_decorator_1.RATE_LIMIT_KEY, context.getHandler());
        if (!rateLimitConfig || !request.user?.id) {
            return;
        }
        if (rateLimitConfig.skipIf && rateLimitConfig.skipIf(request)) {
            return;
        }
        await this.securityPerformanceService.checkRateLimit(request.user.id, rateLimitConfig.action);
    }
    async checkCache(context, request) {
        const cacheConfig = this.reflector.get(cache_decorator_1.CACHE_KEY, context.getHandler());
        if (!cacheConfig) {
            return null;
        }
        const cacheKey = this.generateCacheKey(cacheConfig, request, context);
        return await this.securityPerformanceService.getCachedData(cacheKey);
    }
    async cacheResponse(context, request, response) {
        const cacheConfig = this.reflector.get(cache_decorator_1.CACHE_KEY, context.getHandler());
        if (!cacheConfig) {
            return;
        }
        if (cacheConfig.skipIf && cacheConfig.skipIf(request, response)) {
            return;
        }
        const cacheKey = this.generateCacheKey(cacheConfig, request, context);
        await this.securityPerformanceService.setCachedData(cacheKey, response, cacheConfig.ttl, cacheConfig.tags);
    }
    generateCacheKey(config, request, context) {
        if (config.keyGenerator) {
            const args = [request.params, request.query, request.body].filter(Boolean);
            return config.keyGenerator(...args);
        }
        const controller = context.getClass().name;
        const handler = context.getHandler().name;
        const params = JSON.stringify({
            params: request.params,
            query: request.query,
            userId: request.user?.id,
        });
        return `${controller}:${handler}:${params}`;
    }
};
exports.PerformanceInterceptor = PerformanceInterceptor;
exports.PerformanceInterceptor = PerformanceInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        security_performance_service_1.SecurityPerformanceService])
], PerformanceInterceptor);
//# sourceMappingURL=performance.interceptor.js.map