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
var HealthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const os = __importStar(require("os"));
const process = __importStar(require("process"));
let HealthService = HealthService_1 = class HealthService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(HealthService_1.name);
    }
    async checkDatabaseConnections() {
        try {
            const startTime = Date.now();
            await this.prisma.$queryRaw `SELECT 1`;
            const responseTime = Date.now() - startTime;
            const userCount = await this.prisma.user.count();
            const activeSessionsCount = await this.prisma.session.count({
                where: {
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            });
            return {
                database_connection: {
                    status: 'up',
                    responseTime: `${responseTime}ms`,
                    userCount,
                    activeSessions: activeSessionsCount,
                    lastChecked: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            this.logger.error('Database connection check failed:', error);
            return {
                database_connection: {
                    status: 'down',
                    error: error.message,
                    lastChecked: new Date().toISOString(),
                },
            };
        }
    }
    async checkCriticalServices() {
        try {
            const checks = await Promise.allSettled([
                this.checkAuthenticationService(),
                this.checkNotificationService(),
                this.checkPaymentService(),
                this.checkFileUploadService(),
            ]);
            const results = checks.map((check, index) => {
                const serviceNames = ['auth', 'notifications', 'payments', 'file_upload'];
                return {
                    service: serviceNames[index],
                    status: check.status === 'fulfilled' ? 'up' : 'down',
                    details: check.status === 'fulfilled' ? check.value : check.reason.message,
                };
            });
            const allHealthy = results.every(result => result.status === 'up');
            return {
                critical_services: {
                    status: (allHealthy ? 'up' : 'degraded'),
                    services: results,
                    lastChecked: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            return {
                critical_services: {
                    status: 'down',
                    error: error.message,
                    lastChecked: new Date().toISOString(),
                },
            };
        }
    }
    async getSystemMetrics() {
        const systemInfo = {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: this.configService.get('environment'),
            node: {
                version: process.version,
                platform: process.platform,
                arch: process.arch,
            },
            memory: {
                used: process.memoryUsage(),
                system: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%',
                },
            },
            cpu: {
                cores: os.cpus().length,
                loadAverage: os.loadavg(),
                architecture: os.arch(),
                model: os.cpus()[0]?.model || 'Unknown',
            },
            system: {
                hostname: os.hostname(),
                platform: os.platform(),
                release: os.release(),
                type: os.type(),
            },
        };
        try {
            const dbMetrics = await this.getDatabaseMetrics();
            return {
                ...systemInfo,
                database: dbMetrics,
            };
        }
        catch (error) {
            this.logger.error('Failed to get database metrics:', error);
            return {
                ...systemInfo,
                database: {
                    error: 'Failed to retrieve database metrics',
                },
            };
        }
    }
    async getServiceStatus() {
        const services = [
            { name: 'API Server', status: 'running', port: this.configService.get('port') },
            { name: 'Database', status: await this.getDatabaseStatus() },
            { name: 'Redis', status: await this.getRedisStatus() },
            { name: 'Email Service', status: await this.getEmailServiceStatus() },
            { name: 'File Storage', status: await this.getFileStorageStatus() },
            { name: 'Authentication', status: await this.getAuthServiceStatus() },
            { name: 'Notifications', status: await this.getNotificationServiceStatus() },
            { name: 'Payment Gateway', status: await this.getPaymentServiceStatus() },
        ];
        const healthyServices = services.filter(s => s.status === 'running' || s.status === 'connected').length;
        const totalServices = services.length;
        return {
            timestamp: new Date().toISOString(),
            overall: healthyServices === totalServices ? 'healthy' : 'degraded',
            healthyServices,
            totalServices,
            services,
        };
    }
    async checkAuthenticationService() {
        try {
            const jwtSecret = this.configService.get('jwt.secret');
            if (!jwtSecret || jwtSecret.includes('your-') || jwtSecret.length < 32) {
                throw new Error('JWT secret not properly configured');
            }
            const activeSessionsCount = await this.prisma.session.count({
                where: {
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            });
            return {
                jwtConfigured: true,
                activeSessions: activeSessionsCount,
            };
        }
        catch (error) {
            throw new Error(`Auth service check failed: ${error.message}`);
        }
    }
    async checkNotificationService() {
        try {
            const recentNotifications = await this.prisma.notification.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                },
            });
            return {
                recentNotifications,
                configured: true,
            };
        }
        catch (error) {
            throw new Error(`Notification service check failed: ${error.message}`);
        }
    }
    async checkPaymentService() {
        try {
            const razorpayKeyId = this.configService.get('razorpay.keyId');
            const recentPayments = await this.prisma.payment.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                },
            });
            return {
                configured: !!razorpayKeyId,
                recentPayments,
            };
        }
        catch (error) {
            throw new Error(`Payment service check failed: ${error.message}`);
        }
    }
    async checkFileUploadService() {
        try {
            const s3BucketName = this.configService.get('aws.s3.bucketName');
            return {
                configured: !!s3BucketName,
                bucket: s3BucketName,
            };
        }
        catch (error) {
            throw new Error(`File upload service check failed: ${error.message}`);
        }
    }
    async getDatabaseMetrics() {
        const [totalUsers, totalRestaurants, totalVendors, totalEmployees, totalOrders, totalProducts, recentActivity,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.restaurant.count(),
            this.prisma.vendor.count(),
            this.prisma.employee.count(),
            this.prisma.order.count(),
            this.prisma.product.count(),
            this.prisma.auditLog.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        return {
            counts: {
                users: totalUsers,
                restaurants: totalRestaurants,
                vendors: totalVendors,
                employees: totalEmployees,
                orders: totalOrders,
                products: totalProducts,
            },
            recentActivity,
            lastUpdated: new Date().toISOString(),
        };
    }
    async getDatabaseStatus() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return 'connected';
        }
        catch {
            return 'disconnected';
        }
    }
    async getRedisStatus() {
        const redisUrl = this.configService.get('redis.url');
        return redisUrl ? 'configured' : 'not_configured';
    }
    async getEmailServiceStatus() {
        const smtpHost = this.configService.get('email.smtp.host');
        return smtpHost ? 'configured' : 'not_configured';
    }
    async getFileStorageStatus() {
        const s3BucketName = this.configService.get('aws.s3.bucketName');
        return s3BucketName ? 'configured' : 'not_configured';
    }
    async getAuthServiceStatus() {
        try {
            const jwtSecret = this.configService.get('jwt.secret');
            return jwtSecret && !jwtSecret.includes('your-') ? 'running' : 'misconfigured';
        }
        catch {
            return 'error';
        }
    }
    async getNotificationServiceStatus() {
        try {
            const notificationCount = await this.prisma.notification.count();
            return notificationCount >= 0 ? 'running' : 'error';
        }
        catch {
            return 'error';
        }
    }
    async getPaymentServiceStatus() {
        const razorpayKeyId = this.configService.get('razorpay.keyId');
        return razorpayKeyId ? 'configured' : 'not_configured';
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = HealthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], HealthService);
//# sourceMappingURL=health.service.js.map