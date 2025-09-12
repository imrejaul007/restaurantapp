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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const admin_service_1 = require("./admin.service");
const client_1 = require("@prisma/client");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getDashboard() {
        const data = await this.adminService.getDashboardData();
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Dashboard data retrieved successfully',
            data,
        };
    }
    async getUsers(role, status, page, limit) {
        const users = await this.adminService.getUsers({
            role: role,
            status,
            page: page ? parseInt(page.toString()) : 1,
            limit: limit ? parseInt(limit.toString()) : 20,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Users retrieved successfully',
            data: users,
        };
    }
    async getUserById(userId) {
        const user = await this.adminService.getUserById(userId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'User retrieved successfully',
            data: user,
        };
    }
    async updateUserStatus(userId, status, reason) {
        await this.adminService.updateUserStatus(userId, status, reason);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'User status updated successfully',
        };
    }
    async getPendingRestaurants(page, limit) {
        const restaurants = await this.adminService.getPendingRestaurants({
            page: page ? parseInt(page.toString()) : 1,
            limit: limit ? parseInt(limit.toString()) : 20,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Pending restaurants retrieved successfully',
            data: restaurants,
        };
    }
    async approveRestaurant(restaurantId, notes) {
        await this.adminService.approveRestaurant(restaurantId, notes);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Restaurant approved successfully',
        };
    }
    async rejectRestaurant(restaurantId, reason) {
        await this.adminService.rejectRestaurant(restaurantId, reason);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Restaurant rejected successfully',
        };
    }
    async getPendingVendors(page, limit) {
        const vendors = await this.adminService.getPendingVendors({
            page: page ? parseInt(page.toString()) : 1,
            limit: limit ? parseInt(limit.toString()) : 20,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Pending vendors retrieved successfully',
            data: vendors,
        };
    }
    async approveVendor(vendorId, notes) {
        await this.adminService.approveVendor(vendorId, notes);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Vendor approved successfully',
        };
    }
    async rejectVendor(vendorId, reason) {
        await this.adminService.rejectVendor(vendorId, reason);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Vendor rejected successfully',
        };
    }
    async getAnalytics(startDate, endDate, type) {
        const analytics = await this.adminService.getAnalytics({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            type,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Analytics retrieved successfully',
            data: analytics,
        };
    }
    async getFlaggedReviews(page, limit) {
        const reviews = await this.adminService.getFlaggedReviews({
            page: page ? parseInt(page.toString()) : 1,
            limit: limit ? parseInt(limit.toString()) : 20,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Flagged reviews retrieved successfully',
            data: reviews,
        };
    }
    async reviewAction(reviewId, action, reason) {
        await this.adminService.reviewAction(reviewId, action, reason);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Review action completed successfully',
        };
    }
    async getSupportTickets(status, priority, page, limit) {
        const tickets = { tickets: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Support tickets retrieved successfully',
            data: tickets,
        };
    }
    async assignTicket(ticketId, assigneeId) {
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Ticket assigned successfully',
        };
    }
    async getAuditLogs(userId, action, resource, startDate, endDate, page, limit) {
        const logs = await this.adminService.getAuditLogs({
            userId,
            action,
            resource,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            page: page ? parseInt(page.toString()) : 1,
            limit: limit ? parseInt(limit.toString()) : 50,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Audit logs retrieved successfully',
            data: logs,
        };
    }
    async toggleMaintenance(enabled, message) {
        await this.adminService.toggleMaintenance(enabled, message);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Maintenance mode updated successfully',
        };
    }
    async getSystemConfig() {
        const config = await this.adminService.getSystemConfig();
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'System configuration retrieved successfully',
            data: config,
        };
    }
    async updateSystemConfig(config) {
        await this.adminService.updateSystemConfig(config);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'System configuration updated successfully',
        };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get admin dashboard data' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Dashboard data retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users with filters' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Users retrieved successfully' }),
    __param(0, (0, common_1.Query)('role')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user details by ID' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'User retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Put)('users/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user status' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'User status updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Get)('restaurants/pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending restaurant approvals' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Pending restaurants retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingRestaurants", null);
__decorate([
    (0, common_1.Post)('restaurants/:id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve restaurant' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Restaurant approved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveRestaurant", null);
__decorate([
    (0, common_1.Post)('restaurants/:id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject restaurant' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Restaurant rejected successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectRestaurant", null);
__decorate([
    (0, common_1.Get)('vendors/pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending vendor approvals' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Pending vendors retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingVendors", null);
__decorate([
    (0, common_1.Post)('vendors/:id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve vendor' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Vendor approved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveVendor", null);
__decorate([
    (0, common_1.Post)('vendors/:id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject vendor' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Vendor rejected successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectVendor", null);
__decorate([
    (0, common_1.Get)('reports/analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system analytics' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Analytics retrieved successfully' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('reports/reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'Get flagged reviews' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Flagged reviews retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFlaggedReviews", null);
__decorate([
    (0, common_1.Put)('reviews/:id/action'),
    (0, swagger_1.ApiOperation)({ summary: 'Take action on review' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Review action completed successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('action')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "reviewAction", null);
__decorate([
    (0, common_1.Get)('support-tickets'),
    (0, swagger_1.ApiOperation)({ summary: 'Get support tickets' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Support tickets retrieved successfully' }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('priority')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSupportTickets", null);
__decorate([
    (0, common_1.Put)('support-tickets/:id/assign'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign support ticket' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Ticket assigned successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('assigneeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assignTicket", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit logs' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Audit logs retrieved successfully' }),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('action')),
    __param(2, (0, common_1.Query)('resource')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Post)('system/maintenance'),
    (0, swagger_1.ApiOperation)({ summary: 'Enable/disable maintenance mode' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Maintenance mode updated successfully' }),
    __param(0, (0, common_1.Body)('enabled')),
    __param(1, (0, common_1.Body)('message')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "toggleMaintenance", null);
__decorate([
    (0, common_1.Get)('system/config'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system configuration' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'System configuration retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemConfig", null);
__decorate([
    (0, common_1.Put)('system/config'),
    (0, swagger_1.ApiOperation)({ summary: 'Update system configuration' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'System configuration updated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSystemConfig", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map