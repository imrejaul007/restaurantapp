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
exports.EmployeeAvailabilityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const employee_availability_service_1 = require("./employee-availability.service");
const employee_availability_dto_1 = require("./dto/employee-availability.dto");
const client_1 = require("@prisma/client");
let EmployeeAvailabilityController = class EmployeeAvailabilityController {
    constructor(employeeAvailabilityService) {
        this.employeeAvailabilityService = employeeAvailabilityService;
    }
    async updateAvailability(employeeId, availabilityData, req) {
        const { user } = req;
        return this.employeeAvailabilityService.updateAvailability(employeeId, availabilityData, user.id, user.role);
    }
    async getAvailability(employeeId, req) {
        const { user } = req;
        return this.employeeAvailabilityService.getAvailability(employeeId, user.id, user.role);
    }
    async deactivateAvailability(employeeId, req) {
        const { user } = req;
        return this.employeeAvailabilityService.deactivateAvailability(employeeId, user.id, user.role);
    }
    async getJobMatches(employeeId, req) {
        const { user } = req;
        return this.employeeAvailabilityService.matchJobsToEmployee(employeeId, user.id, user.role);
    }
    async getAvailableEmployees(filters) {
        return this.employeeAvailabilityService.getAvailableEmployees(filters);
    }
    async getAvailabilityStats(restaurantId, req) {
        const { user } = req;
        if (user.role === client_1.UserRole.RESTAURANT && !restaurantId) {
            const restaurant = await this.employeeAvailabilityService['prisma'].restaurant.findFirst({
                where: { userId: user.id },
            });
            restaurantId = restaurant?.id;
        }
        return this.employeeAvailabilityService.getAvailabilityStats(restaurantId);
    }
};
exports.EmployeeAvailabilityController = EmployeeAvailabilityController;
__decorate([
    (0, common_1.Post)(':employeeId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update employee availability preferences' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Availability updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, employee_availability_dto_1.EmployeeAvailabilityDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeAvailabilityController.prototype, "updateAvailability", null);
__decorate([
    (0, common_1.Get)(':employeeId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE, client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get employee availability preferences' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Availability retrieved successfully' }),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeAvailabilityController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Patch)(':employeeId/deactivate'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate employee availability' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Availability deactivated successfully' }),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeAvailabilityController.prototype, "deactivateAvailability", null);
__decorate([
    (0, common_1.Get)(':employeeId/matches'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get job matches for employee based on availability' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Job matches retrieved successfully' }),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeAvailabilityController.prototype, "getJobMatches", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of available employees' }),
    (0, swagger_1.ApiQuery)({ name: 'location', required: false, type: 'string' }),
    (0, swagger_1.ApiQuery)({ name: 'jobType', required: false, type: 'string' }),
    (0, swagger_1.ApiQuery)({ name: 'role', required: false, type: 'string' }),
    (0, swagger_1.ApiQuery)({ name: 'salaryMin', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'salaryMax', required: false, type: 'number' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Available employees retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeeAvailabilityController.prototype, "getAvailableEmployees", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get availability statistics' }),
    (0, swagger_1.ApiQuery)({ name: 'restaurantId', required: false, type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Availability statistics retrieved successfully' }),
    __param(0, (0, common_1.Query)('restaurantId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeAvailabilityController.prototype, "getAvailabilityStats", null);
exports.EmployeeAvailabilityController = EmployeeAvailabilityController = __decorate([
    (0, swagger_1.ApiTags)('employee-availability'),
    (0, common_1.Controller)('employee-availability'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [employee_availability_service_1.EmployeeAvailabilityService])
], EmployeeAvailabilityController);
//# sourceMappingURL=employee-availability.controller.js.map