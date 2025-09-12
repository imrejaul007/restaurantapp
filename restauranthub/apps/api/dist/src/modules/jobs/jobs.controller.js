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
exports.JobsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jobs_service_1 = require("./jobs.service");
const create_job_dto_1 = require("./dto/create-job.dto");
const update_job_dto_1 = require("./dto/update-job.dto");
const client_1 = require("@prisma/client");
let JobsController = class JobsController {
    constructor(jobsService) {
        this.jobsService = jobsService;
    }
    async create(createJobDto, req) {
        const { user } = req;
        let restaurantId;
        if (user.role === client_1.UserRole.RESTAURANT) {
            const restaurant = await this.jobsService.findRestaurantByUserId(user.id);
            restaurantId = restaurant.id;
        }
        else {
            throw new Error('Restaurant ID required for admin users');
        }
        return this.jobsService.create(restaurantId, user.id, createJobDto);
    }
    async findAll(filters) {
        const { page = 1, limit = 20, ...otherFilters } = filters;
        return this.jobsService.findAll(+page, +limit, otherFilters);
    }
    async search(query, filters) {
        return this.jobsService.searchJobs(query, filters);
    }
    async getMyJobs(filters, req) {
        const { user } = req;
        const { page = 1, limit = 20, ...otherFilters } = filters;
        const restaurant = await this.jobsService.findRestaurantByUserId(user.id);
        return this.jobsService.findByRestaurant(restaurant.id, +page, +limit, otherFilters);
    }
    async getRecommendedJobs(employeeId, req) {
        const { user } = req;
        if (user.role !== client_1.UserRole.ADMIN) {
            const employee = await this.jobsService.findEmployeeByUserId(user.id);
            if (employee.id !== employeeId) {
                throw new Error('Forbidden');
            }
        }
        return this.jobsService.getRecommendedJobs(employeeId);
    }
    async getJobStats(restaurantId, req) {
        const { user } = req;
        if (user.role === client_1.UserRole.RESTAURANT) {
            const restaurant = await this.jobsService.findRestaurantByUserId(user.id);
            if (restaurant.id !== restaurantId) {
                throw new Error('Forbidden');
            }
        }
        return this.jobsService.getJobStats(restaurantId);
    }
    async findOne(id) {
        return this.jobsService.findOne(id);
    }
    async update(id, updateJobDto, req) {
        const { user } = req;
        return this.jobsService.update(id, user.id, user.role, updateJobDto);
    }
    async updateStatus(id, status, req) {
        const { user } = req;
        return this.jobsService.updateStatus(id, status, user.id, user.role);
    }
    async remove(id, req) {
        const { user } = req;
        return this.jobsService.updateStatus(id, client_1.JobStatus.CLOSED, user.id, user.role);
    }
};
exports.JobsController = JobsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new job posting' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Job posting created successfully' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.UNAUTHORIZED, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Forbidden' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_job_dto_1.CreateJobDto, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all job postings' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'location', required: false, type: 'string' }),
    (0, swagger_1.ApiQuery)({ name: 'jobType', required: false, type: 'string' }),
    (0, swagger_1.ApiQuery)({ name: 'skills', required: false, type: 'string' }),
    (0, swagger_1.ApiQuery)({ name: 'experienceMin', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'salaryMin', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'salaryMax', required: false, type: 'number' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Jobs retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search job postings' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, type: 'string' }),
    (0, swagger_1.ApiQuery)({ name: 'location', required: false, type: 'string' }),
    (0, swagger_1.ApiQuery)({ name: 'jobType', required: false, type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Search results retrieved successfully' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('my-jobs'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Get jobs posted by current restaurant' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.JobStatus }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Restaurant jobs retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "getMyJobs", null);
__decorate([
    (0, common_1.Get)('recommended/:employeeId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get recommended jobs for an employee' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Recommended jobs retrieved successfully' }),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "getRecommendedJobs", null);
__decorate([
    (0, common_1.Get)('stats/:restaurantId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get job statistics for a restaurant' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Job statistics retrieved successfully' }),
    __param(0, (0, common_1.Param)('restaurantId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "getJobStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific job posting' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Job posting retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Job posting not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update a job posting' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Job posting updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Job posting not found' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_job_dto_1.UpdateJobDto, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update job posting status' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Job status updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Job posting not found' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a job posting' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NO_CONTENT, description: 'Job posting deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Job posting not found' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "remove", null);
exports.JobsController = JobsController = __decorate([
    (0, swagger_1.ApiTags)('jobs'),
    (0, common_1.Controller)('jobs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [jobs_service_1.JobsService])
], JobsController);
//# sourceMappingURL=jobs.controller.js.map