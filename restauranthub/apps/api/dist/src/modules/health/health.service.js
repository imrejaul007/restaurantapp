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
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const prisma_service_1 = require("../../prisma/prisma.service");
let HealthService = class HealthService extends terminus_1.HealthIndicator {
    constructor(prismaService) {
        super();
        this.prismaService = prismaService;
    }
    async isHealthy(key) {
        const checks = await Promise.allSettled([
            this.checkDatabase(),
            this.checkRedis(),
            this.checkMemoryUsage(),
            this.checkDiskSpace(),
        ]);
        const results = {
            database: this.getCheckResult(checks[0]),
            redis: this.getCheckResult(checks[1]),
            memory: this.getCheckResult(checks[2]),
            disk: this.getCheckResult(checks[3]),
        };
        const isHealthy = Object.values(results).every(result => result.status === 'up');
        if (isHealthy) {
            return this.getStatus(key, true, results);
        }
        throw new terminus_1.HealthCheckError('Health check failed', results);
    }
    async checkDatabase() {
        try {
            const start = Date.now();
            await this.prismaService.$queryRaw `SELECT 1`;
            const responseTime = Date.now() - start;
            return {
                status: 'up',
                responseTime,
            };
        }
        catch (error) {
            return {
                status: 'down',
                error: error.message,
            };
        }
    }
    async checkRedis() {
        try {
            const start = Date.now();
            const value = null;
            const responseTime = Date.now() - start;
            if (value === 'ok') {
                return {
                    status: 'up',
                    responseTime,
                };
            }
            return {
                status: 'down',
                error: 'Redis check value mismatch',
            };
        }
        catch (error) {
            return {
                status: 'down',
                error: error.message,
            };
        }
    }
    async checkMemoryUsage() {
        try {
            const memoryUsage = process.memoryUsage();
            const totalMemory = memoryUsage.heapTotal;
            const usedMemory = memoryUsage.heapUsed;
            const memoryUsagePercent = (usedMemory / totalMemory) * 100;
            return {
                status: memoryUsagePercent < 90 ? 'up' : 'down',
                usage: {
                    heapUsed: `${Math.round(usedMemory / 1024 / 1024)}MB`,
                    heapTotal: `${Math.round(totalMemory / 1024 / 1024)}MB`,
                    usagePercent: `${memoryUsagePercent.toFixed(2)}%`,
                    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                    external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
                },
            };
        }
        catch (error) {
            return {
                status: 'down',
                error: error.message,
            };
        }
    }
    async checkDiskSpace() {
        try {
            const { execSync } = require('child_process');
            const diskUsage = execSync('df -h /', { encoding: 'utf8' });
            const lines = diskUsage.split('\n');
            const dataLine = lines[1];
            const columns = dataLine.split(/\s+/);
            const usagePercent = parseInt(columns[4].replace('%', ''));
            return {
                status: usagePercent < 90 ? 'up' : 'down',
                usage: {
                    total: columns[1],
                    used: columns[2],
                    available: columns[3],
                    usagePercent: `${usagePercent}%`,
                },
            };
        }
        catch (error) {
            return {
                status: 'up',
                error: 'Could not check disk space: ' + error.message,
            };
        }
    }
    getCheckResult(settledResult) {
        if (settledResult.status === 'fulfilled') {
            return settledResult.value;
        }
        return {
            status: 'down',
            error: settledResult.reason?.message || 'Unknown error',
        };
    }
    async getSystemInfo() {
        return {
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch,
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            pid: process.pid,
        };
    }
    async getDependenciesHealth() {
        const dependencies = [];
        return {
            total: dependencies.length,
            healthy: dependencies.filter(d => d.status === 'up').length,
            dependencies,
        };
    }
    async getDetailedHealth() {
        const [systemInfo, dependenciesHealth, mainHealth] = await Promise.all([
            this.getSystemInfo(),
            this.getDependenciesHealth(),
            this.isHealthy('application').catch(error => error.causes || error),
        ]);
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            system: systemInfo,
            dependencies: dependenciesHealth,
            checks: mainHealth,
        };
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthService);
//# sourceMappingURL=health.service.js.map