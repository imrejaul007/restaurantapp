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
exports.MonitoringController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const monitoring_service_1 = require("./monitoring.service");
const client_1 = require("@prisma/client");
let MonitoringController = class MonitoringController {
    constructor(monitoringService) {
        this.monitoringService = monitoringService;
    }
    async getSystemStatus() {
        const [systemMetrics, databaseMetrics, applicationMetrics] = await Promise.all([
            this.monitoringService.getSystemMetrics(),
            this.monitoringService.getDatabaseMetrics(),
            this.monitoringService.getApplicationMetrics(),
        ]);
        return {
            statusCode: 200,
            message: 'System status retrieved successfully',
            data: {
                system: systemMetrics,
                database: databaseMetrics,
                application: applicationMetrics,
                timestamp: new Date().toISOString(),
            },
        };
    }
    async getSystemMetrics() {
        const metrics = await this.monitoringService.getSystemMetrics();
        return {
            statusCode: 200,
            message: 'System metrics retrieved successfully',
            data: metrics,
        };
    }
    async getDatabaseMetrics() {
        const metrics = await this.monitoringService.getDatabaseMetrics();
        return {
            statusCode: 200,
            message: 'Database metrics retrieved successfully',
            data: metrics,
        };
    }
    async getApplicationMetrics() {
        const metrics = await this.monitoringService.getApplicationMetrics();
        return {
            statusCode: 200,
            message: 'Application metrics retrieved successfully',
            data: metrics,
        };
    }
    async getBusinessMetrics() {
        const metrics = await this.monitoringService.getBusinessMetrics();
        return {
            statusCode: 200,
            message: 'Business metrics retrieved successfully',
            data: metrics,
        };
    }
    async getAlerts(severity, acknowledged, resolved, limit) {
        const alerts = await this.monitoringService.getAlerts({
            severity,
            acknowledged,
            resolved,
            limit: limit ? parseInt(limit.toString()) : undefined,
        });
        return {
            statusCode: 200,
            message: 'Alerts retrieved successfully',
            data: alerts,
            meta: {
                total: alerts.length,
            },
        };
    }
    async getAlertsSummary() {
        const allAlerts = await this.monitoringService.getAlerts();
        const summary = {
            total: allAlerts.length,
            byStatus: {
                acknowledged: allAlerts.filter(a => a.acknowledged).length,
                unacknowledged: allAlerts.filter(a => !a.acknowledged).length,
                resolved: allAlerts.filter(a => a.resolved).length,
                active: allAlerts.filter(a => !a.resolved).length,
            },
            bySeverity: {
                critical: allAlerts.filter(a => a.severity === 'critical').length,
                high: allAlerts.filter(a => a.severity === 'high').length,
                medium: allAlerts.filter(a => a.severity === 'medium').length,
                low: allAlerts.filter(a => a.severity === 'low').length,
            },
        };
        return {
            statusCode: 200,
            message: 'Alerts summary retrieved successfully',
            data: summary,
        };
    }
    async acknowledgeAlert(alertId, userId) {
        await this.monitoringService.acknowledgeAlert(alertId, userId);
        return {
            statusCode: 200,
            message: 'Alert acknowledged successfully',
        };
    }
    async resolveAlert(alertId) {
        await this.monitoringService.resolveAlert(alertId);
        return {
            statusCode: 200,
            message: 'Alert resolved successfully',
        };
    }
    async getAlertRules() {
        return {
            statusCode: 200,
            message: 'Alert rules retrieved successfully',
            data: [],
        };
    }
    async createAlertRule(alertRuleData) {
        const rule = await this.monitoringService.createAlertRule(alertRuleData);
        return {
            statusCode: 201,
            message: 'Alert rule created successfully',
            data: rule,
        };
    }
    async updateAlertRule(ruleId, updates) {
        const rule = await this.monitoringService.updateAlertRule(ruleId, updates);
        return {
            statusCode: 200,
            message: 'Alert rule updated successfully',
            data: rule,
        };
    }
    async deleteAlertRule(ruleId) {
        await this.monitoringService.deleteAlertRule(ruleId);
        return {
            statusCode: 200,
            message: 'Alert rule deleted successfully',
        };
    }
    async getHealthCheck() {
        try {
            const [systemMetrics, databaseMetrics] = await Promise.all([
                this.monitoringService.getSystemMetrics().catch(() => null),
                this.monitoringService.getDatabaseMetrics().catch(() => null),
            ]);
            const isHealthy = systemMetrics && databaseMetrics;
            const status = isHealthy ? 'healthy' : 'unhealthy';
            return {
                statusCode: isHealthy ? 200 : 503,
                message: `System is ${status}`,
                data: {
                    status,
                    timestamp: new Date().toISOString(),
                    checks: {
                        system: systemMetrics ? 'healthy' : 'unhealthy',
                        database: databaseMetrics ? 'healthy' : 'unhealthy',
                    },
                    uptime: process.uptime(),
                    version: process.env.npm_package_version || '1.0.0',
                },
            };
        }
        catch (error) {
            return {
                statusCode: 503,
                message: 'Health check failed',
                data: {
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    error: error.message,
                },
            };
        }
    }
    async getDashboardData() {
        try {
            const [systemMetrics, databaseMetrics, applicationMetrics, businessMetrics, alerts,] = await Promise.all([
                this.monitoringService.getSystemMetrics(),
                this.monitoringService.getDatabaseMetrics(),
                this.monitoringService.getApplicationMetrics(),
                this.monitoringService.getBusinessMetrics(),
                this.monitoringService.getAlerts({ limit: 10 }),
            ]);
            const activeAlerts = alerts.filter(alert => !alert.resolved);
            const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && !alert.resolved);
            return {
                statusCode: 200,
                message: 'Dashboard data retrieved successfully',
                data: {
                    metrics: {
                        system: systemMetrics,
                        database: databaseMetrics,
                        application: applicationMetrics,
                        business: businessMetrics,
                    },
                    alerts: {
                        total: alerts.length,
                        active: activeAlerts.length,
                        critical: criticalAlerts.length,
                        recent: alerts.slice(0, 5),
                    },
                    status: {
                        overall: criticalAlerts.length === 0 ? 'healthy' : 'critical',
                        uptime: process.uptime(),
                        timestamp: new Date().toISOString(),
                    },
                },
            };
        }
        catch (error) {
            return {
                statusCode: 500,
                message: 'Failed to retrieve dashboard data',
                data: { error: error.message },
            };
        }
    }
};
exports.MonitoringController = MonitoringController;
__decorate([
    (0, common_1.Get)('system/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system status overview' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System status retrieved successfully' }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getSystemStatus", null);
__decorate([
    (0, common_1.Get)('system/metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed system metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System metrics retrieved successfully' }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getSystemMetrics", null);
__decorate([
    (0, common_1.Get)('database/metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get database metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Database metrics retrieved successfully' }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getDatabaseMetrics", null);
__decorate([
    (0, common_1.Get)('application/metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get application metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Application metrics retrieved successfully' }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getApplicationMetrics", null);
__decorate([
    (0, common_1.Get)('business/metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get business metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Business metrics retrieved successfully' }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getBusinessMetrics", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get alerts with optional filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Alerts retrieved successfully' }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Query)('severity')),
    __param(1, (0, common_1.Query)('acknowledged')),
    __param(2, (0, common_1.Query)('resolved')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Boolean, Number]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Get)('alerts/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get alerts summary' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Alerts summary retrieved successfully' }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getAlertsSummary", null);
__decorate([
    (0, common_1.Post)('alerts/:id/acknowledge'),
    (0, swagger_1.ApiOperation)({ summary: 'Acknowledge an alert' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Alert acknowledged successfully' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "acknowledgeAlert", null);
__decorate([
    (0, common_1.Post)('alerts/:id/resolve'),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve an alert' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Alert resolved successfully' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "resolveAlert", null);
__decorate([
    (0, common_1.Get)('alert-rules'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all alert rules' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Alert rules retrieved successfully' }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getAlertRules", null);
__decorate([
    (0, common_1.Post)('alert-rules'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new alert rule' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Alert rule created successfully' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "createAlertRule", null);
__decorate([
    (0, common_1.Put)('alert-rules/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an alert rule' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Alert rule updated successfully' }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "updateAlertRule", null);
__decorate([
    (0, common_1.Delete)('alert-rules/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an alert rule' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Alert rule deleted successfully' }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "deleteAlertRule", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Get comprehensive health check' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Health status retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getHealthCheck", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get monitoring dashboard data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard data retrieved successfully' }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getDashboardData", null);
exports.MonitoringController = MonitoringController = __decorate([
    (0, swagger_1.ApiTags)('monitoring'),
    (0, common_1.Controller)('monitoring'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [monitoring_service_1.MonitoringService])
], MonitoringController);
//# sourceMappingURL=monitoring.controller.js.map