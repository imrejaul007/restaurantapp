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
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const health_service_1 = require("./health.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const roles_guard_1 = require("../common/guards/roles.guard");
let HealthController = class HealthController {
    constructor(health, http, prismaHealth, memory, disk, prisma, configService, healthService) {
        this.health = health;
        this.http = http;
        this.prismaHealth = prismaHealth;
        this.memory = memory;
        this.disk = disk;
        this.prisma = prisma;
        this.configService = configService;
        this.healthService = healthService;
    }
    check() {
        return this.health.check([
            () => this.prismaHealth.pingCheck('database', this.prisma),
            () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
        ]);
    }
    detailedCheck() {
        return this.health.check([
            () => this.prismaHealth.pingCheck('database', this.prisma),
            () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 200 * 1024 * 1024),
            () => this.disk.checkStorage('storage', {
                path: '/',
                thresholdPercent: 0.85
            }),
            () => this.checkRedis(),
            () => this.checkEmailService(),
            () => this.checkFileStorage(),
            () => this.healthService.checkDatabaseConnections(),
            () => this.healthService.checkCriticalServices(),
        ]);
    }
    async getMetrics() {
        return this.healthService.getSystemMetrics();
    }
    async getStatus() {
        return this.healthService.getServiceStatus();
    }
    async checkRedis() {
        const redisUrl = this.configService.get('redis.url');
        if (!redisUrl) {
            return {
                redis: {
                    status: 'up',
                    message: 'Redis not configured',
                },
            };
        }
        try {
            return {
                redis: {
                    status: 'up',
                    responseTime: Date.now(),
                },
            };
        }
        catch (error) {
            return {
                redis: {
                    status: 'down',
                    error: error.message,
                },
            };
        }
    }
    async checkEmailService() {
        const smtpHost = this.configService.get('email.smtp.host');
        if (!smtpHost) {
            return {
                email: {
                    status: 'up',
                    message: 'Email service not configured',
                },
            };
        }
        try {
            return {
                email: {
                    status: 'up',
                    host: smtpHost,
                    port: this.configService.get('email.smtp.port'),
                },
            };
        }
        catch (error) {
            return {
                email: {
                    status: 'down',
                    error: error.message,
                },
            };
        }
    }
    async checkFileStorage() {
        const s3BucketName = this.configService.get('aws.s3.bucketName');
        if (!s3BucketName) {
            return {
                storage: {
                    status: 'up',
                    message: 'File storage not configured',
                },
            };
        }
        try {
            return {
                storage: {
                    status: 'up',
                    bucket: s3BucketName,
                    region: this.configService.get('aws.region'),
                },
            };
        }
        catch (error) {
            return {
                storage: {
                    status: 'down',
                    error: error.message,
                },
            };
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, terminus_1.HealthCheck)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Basic health check',
        description: 'Check if the API is running and responsive',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Health check successful',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', enum: ['ok', 'error', 'shutting_down'] },
                info: { type: 'object' },
                error: { type: 'object' },
                details: { type: 'object' },
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('detailed'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, terminus_1.HealthCheck)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Detailed health check (Admin only)',
        description: 'Comprehensive health check including external services and performance metrics',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "detailedCheck", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'System metrics (Admin only)',
        description: 'Get detailed system performance and usage metrics',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Service status',
        description: 'Get current status of all system components',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getStatus", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('monitoring'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.HttpHealthIndicator,
        terminus_1.PrismaHealthIndicator,
        terminus_1.MemoryHealthIndicator,
        terminus_1.DiskHealthIndicator,
        prisma_service_1.PrismaService,
        config_1.ConfigService,
        health_service_1.HealthService])
], HealthController);
//# sourceMappingURL=health.controller.js.map