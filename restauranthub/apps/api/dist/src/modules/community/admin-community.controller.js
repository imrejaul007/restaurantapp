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
exports.AdminCommunityController = void 0;
const common_1 = require("@nestjs/common");
const admin_community_service_1 = require("./admin-community.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let AdminCommunityController = class AdminCommunityController {
    constructor(adminCommunityService) {
        this.adminCommunityService = adminCommunityService;
    }
    async getCommunityDashboard(req) {
        return this.adminCommunityService.getCommunityDashboard(req.user.id);
    }
    async getCommunityAnalytics(req, timeframe, granularity) {
        return this.adminCommunityService.getCommunityAnalytics(req.user.id, {
            timeframe,
            granularity,
        });
    }
    async getContentModerationQueue(req, status, contentType, priority, page, limit) {
        return this.adminCommunityService.getContentModerationQueue(req.user.id, {
            status,
            contentType,
            priority,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }
    async getUserManagement(req, role, status, search, sortBy, page, limit) {
        return this.adminCommunityService.getUserManagement(req.user.id, {
            role,
            status,
            search,
            sortBy,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }
    async getForumManagement(req) {
        return this.adminCommunityService.getForumManagement(req.user.id);
    }
    async updateForumSettings(req, forumId, settings) {
        return this.adminCommunityService.updateForumSettings(req.user.id, forumId, settings);
    }
    async suspendUser(req, userId, body) {
        return this.adminCommunityService.suspendUser(req.user.id, userId, body);
    }
    async unsuspendUser(req, userId, body) {
        return {
            message: 'User unsuspension functionality to be implemented',
            userId,
            reason: body.reason,
        };
    }
    async createForum(req, forumData) {
        return {
            message: 'Forum creation via admin panel to be implemented',
            forumData,
        };
    }
    async getCommunityStatistics(req, period) {
        return {
            message: 'Advanced community statistics to be implemented',
            period: period || 'month',
        };
    }
    async exportCommunityData(req, type, format, dateFrom, dateTo) {
        return {
            message: 'Community data export functionality to be implemented',
            exportParams: {
                type: type || 'all',
                format: format || 'csv',
                dateFrom,
                dateTo,
            },
        };
    }
    async performBulkAction(req, body) {
        return {
            message: 'Bulk action functionality to be implemented',
            action: body.action,
            targetType: body.targetType,
            affectedCount: body.targetIds.length,
        };
    }
    async getAuditLog(req, moderatorId, action, contentType, dateFrom, dateTo, page, limit) {
        return {
            message: 'Moderation audit log to be implemented',
            filters: {
                moderatorId,
                action,
                contentType,
                dateFrom,
                dateTo,
            },
            pagination: {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 50,
            },
        };
    }
};
exports.AdminCommunityController = AdminCommunityController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "getCommunityDashboard", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('timeframe')),
    __param(2, (0, common_1.Query)('granularity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "getCommunityAnalytics", null);
__decorate([
    (0, common_1.Get)('moderation-queue'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('contentType')),
    __param(3, (0, common_1.Query)('priority')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "getContentModerationQueue", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('role')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('sortBy')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "getUserManagement", null);
__decorate([
    (0, common_1.Get)('forums'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "getForumManagement", null);
__decorate([
    (0, common_1.Put)('forums/:forumId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('forumId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "updateForumSettings", null);
__decorate([
    (0, common_1.Post)('users/:userId/suspend'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "suspendUser", null);
__decorate([
    (0, common_1.Post)('users/:userId/unsuspend'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "unsuspendUser", null);
__decorate([
    (0, common_1.Post)('forums'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "createForum", null);
__decorate([
    (0, common_1.Get)('statistics'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "getCommunityStatistics", null);
__decorate([
    (0, common_1.Get)('export'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('format')),
    __param(3, (0, common_1.Query)('dateFrom')),
    __param(4, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "exportCommunityData", null);
__decorate([
    (0, common_1.Post)('bulk-actions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "performBulkAction", null);
__decorate([
    (0, common_1.Get)('audit-log'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('moderatorId')),
    __param(2, (0, common_1.Query)('action')),
    __param(3, (0, common_1.Query)('contentType')),
    __param(4, (0, common_1.Query)('dateFrom')),
    __param(5, (0, common_1.Query)('dateTo')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminCommunityController.prototype, "getAuditLog", null);
exports.AdminCommunityController = AdminCommunityController = __decorate([
    (0, common_1.Controller)('admin/community'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [admin_community_service_1.AdminCommunityService])
], AdminCommunityController);
//# sourceMappingURL=admin-community.controller.js.map