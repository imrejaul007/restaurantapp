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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const terminus_1 = require("@nestjs/terminus");
const public_decorator_1 = require("../common/decorators/public.decorator");
const health_service_1 = require("./health.service");
let HealthController = class HealthController {
    constructor(health, healthService) {
        this.health = health;
        this.healthService = healthService;
    }
    check() {
        return this.health.check([
            () => this.healthService.isHealthy('application'),
        ]);
    }
    async detailedCheck() {
        return this.healthService.getDetailedHealth();
    }
    liveness() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }
    readiness() {
        return this.health.check([
            () => this.healthService.isHealthy('readiness'),
        ]);
    }
    async metrics() {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        return {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                rss: memoryUsage.rss,
                external: memoryUsage.external,
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system,
            },
            eventLoop: {
                lag: 0,
            },
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, terminus_1.HealthCheck)(),
    (0, swagger_1.ApiOperation)({ summary: 'Basic health check' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is healthy' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'Service is unhealthy' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('detailed'),
    (0, swagger_1.ApiOperation)({ summary: 'Detailed health check with system information' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Detailed health information' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "detailedCheck", null);
__decorate([
    (0, common_1.Get)('live'),
    (0, swagger_1.ApiOperation)({ summary: 'Liveness probe for Kubernetes' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is alive' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "liveness", null);
__decorate([
    (0, common_1.Get)('ready'),
    (0, terminus_1.HealthCheck)(),
    (0, swagger_1.ApiOperation)({ summary: 'Readiness probe for Kubernetes' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is ready' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'Service is not ready' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "readiness", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Basic metrics for monitoring' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service metrics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "metrics", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('health'),
    (0, public_decorator_1.Public)(),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        health_service_1.HealthService])
], HealthController);
//# sourceMappingURL=health.controller.js.map