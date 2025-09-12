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
exports.EmployeesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const employees_service_1 = require("./employees.service");
const create_employee_dto_1 = require("./dto/create-employee.dto");
const update_employee_dto_1 = require("./dto/update-employee.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let EmployeesController = class EmployeesController {
    constructor(employeesService) {
        this.employeesService = employeesService;
    }
    async create(req, createEmployeeDto) {
        const result = await this.employeesService.create(req.user.restaurant?.id, createEmployeeDto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Employee created successfully',
            data: result,
        };
    }
    async findAll(req, page, limit, filters) {
        const result = await this.employeesService.findByRestaurant(req.user.restaurant?.id, page, limit, filters);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Employees retrieved successfully',
            data: result,
        };
    }
    async findOne(id) {
        const result = await this.employeesService.findOne(id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Employee retrieved successfully',
            data: result,
        };
    }
    async update(id, updateEmployeeDto) {
        const result = await this.employeesService.update(id, updateEmployeeDto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Employee updated successfully',
            data: result,
        };
    }
    async remove(id) {
        const result = await this.employeesService.remove(id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Employee deleted successfully',
        };
    }
    async getProfile(id) {
        const result = await this.employeesService.getProfile(id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Employee profile retrieved successfully',
            data: result,
        };
    }
    async getPerformance(id) {
        const result = await this.employeesService.getPerformanceReport(id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Performance report retrieved successfully',
            data: result,
        };
    }
    async getAttendance(id) {
        const result = await this.employeesService.getAttendance(id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Attendance records retrieved successfully',
            data: result,
        };
    }
    async markAttendance(id, attendanceData) {
        const result = await this.employeesService.markAttendance(id, attendanceData);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Attendance marked successfully',
            data: result,
        };
    }
};
exports.EmployeesController = EmployeesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create employee' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Employee created successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_employee_dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all employees' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Employees retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get employee by ID' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Employee retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update employee' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Employee updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_employee_dto_1.UpdateEmployeeDto]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete employee' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Employee deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get employee profile' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Employee profile retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(':id/performance'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get employee performance report' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Performance report retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "getPerformance", null);
__decorate([
    (0, common_1.Get)(':id/attendance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get employee attendance' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Attendance records retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "getAttendance", null);
__decorate([
    (0, common_1.Post)(':id/attendance'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Mark employee attendance' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Attendance marked successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "markAttendance", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, swagger_1.ApiTags)('employees'),
    (0, common_1.Controller)('employees'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService])
], EmployeesController);
//# sourceMappingURL=employees.controller.js.map