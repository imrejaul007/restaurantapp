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
exports.JobApplicationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const job_applications_service_1 = require("./job-applications.service");
const create_job_application_dto_1 = require("./dto/create-job-application.dto");
const schedule_interview_dto_1 = require("./dto/schedule-interview.dto");
const hire_employee_dto_1 = require("./dto/hire-employee.dto");
const rate_employee_dto_1 = require("./dto/rate-employee.dto");
const client_1 = require("@prisma/client");
let JobApplicationsController = class JobApplicationsController {
    constructor(jobApplicationsService) {
        this.jobApplicationsService = jobApplicationsService;
    }
    async applyForJob(jobId, createApplicationDto, req) {
        const { user } = req;
        const employee = await this.jobApplicationsService.findEmployeeByUserId(user.id);
        return this.jobApplicationsService.create(jobId, employee.id, createApplicationDto);
    }
    async getMyApplications(filters, req) {
        const { user } = req;
        const { page = 1, limit = 20, ...otherFilters } = filters;
        const employee = await this.jobApplicationsService.findEmployeeByUserId(user.id);
        return this.jobApplicationsService.findByEmployee(employee.id, +page, +limit, otherFilters);
    }
    async getJobApplications(jobId, filters, req) {
        const { user } = req;
        const { page = 1, limit = 20, ...otherFilters } = filters;
        if (user.role === client_1.UserRole.RESTAURANT) {
            await this.jobApplicationsService.verifyJobOwnership(jobId, user.id);
        }
        return this.jobApplicationsService.findByJob(jobId, +page, +limit, otherFilters);
    }
    async getApplicationStats(req) {
        const { user } = req;
        if (user.role === client_1.UserRole.RESTAURANT) {
            const restaurant = await this.jobApplicationsService.findRestaurantByUserId(user.id);
            return this.jobApplicationsService.getApplicationStats(restaurant.id);
        }
        else if (user.role === client_1.UserRole.EMPLOYEE) {
            const employee = await this.jobApplicationsService.findEmployeeByUserId(user.id);
            return this.jobApplicationsService.getApplicationStats(undefined, employee.id);
        }
        else {
            return this.jobApplicationsService.getApplicationStats();
        }
    }
    async findOne(id, req) {
        const { user } = req;
        const application = await this.jobApplicationsService.findOne(id);
        if (user.role === client_1.UserRole.EMPLOYEE) {
            const employee = await this.jobApplicationsService.findEmployeeByUserId(user.id);
            if (application.employeeId !== employee.id) {
                throw new Error('Forbidden');
            }
        }
        else if (user.role === client_1.UserRole.RESTAURANT) {
            if (application.job.restaurant.userId !== user.id) {
                throw new Error('Forbidden');
            }
        }
        return application;
    }
    async updateStatus(id, status, reviewNotes, req) {
        const { user } = req;
        return this.jobApplicationsService.updateStatus(id, status, reviewNotes, user.id, user.role);
    }
    async withdraw(id, req) {
        const { user } = req;
        const employee = await this.jobApplicationsService.findEmployeeByUserId(user.id);
        return this.jobApplicationsService.withdraw(id, employee.id);
    }
    async scheduleInterview(id, interviewData, req) {
        const { user } = req;
        return this.jobApplicationsService.scheduleInterview(id, interviewData, user.id, user.role);
    }
    async hire(id, contractData, req) {
        const { user } = req;
        return this.jobApplicationsService.hire(id, contractData, user.id, user.role);
    }
    async getJobApplicationAnalytics(jobId, req) {
        const { user } = req;
        if (user.role === client_1.UserRole.RESTAURANT) {
            await this.jobApplicationsService.verifyJobOwnership(jobId, user.id);
        }
        return this.jobApplicationsService.getJobApplicationAnalytics(jobId);
    }
    async getEmploymentHistory(employeeId, req) {
        const { user } = req;
        return this.jobApplicationsService.getEmploymentHistory(employeeId, user.id, user.role);
    }
    async rateEmployee(employmentHistoryId, ratingData, req) {
        const { user } = req;
        return this.jobApplicationsService.rateEmployee(employmentHistoryId, ratingData, user.id, user.role);
    }
    async terminateEmployment(employmentHistoryId, terminationData, req) {
        const { user } = req;
        return this.jobApplicationsService.terminateEmployment(employmentHistoryId, terminationData, user.id, user.role);
    }
};
exports.JobApplicationsController = JobApplicationsController;
__decorate([
    (0, common_1.Post)(':jobId/apply'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Apply for a job' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Application submitted successfully' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CONFLICT, description: 'Already applied to this job' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Job is no longer accepting applications' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_job_application_dto_1.CreateJobApplicationDto, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationsController.prototype, "applyForJob", null);
__decorate([
    (0, common_1.Get)('my-applications'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get current employee applications' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.ApplicationStatus }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Applications retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationsController.prototype, "getMyApplications", null);
__decorate([
    (0, common_1.Get)('job/:jobId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get applications for a specific job' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.ApplicationStatus }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Job applications retrieved successfully' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationsController.prototype, "getJobApplications", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.EMPLOYEE, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get application statistics' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Statistics retrieved successfully' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JobApplicationsController.prototype, "getApplicationStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE, client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific application' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Application retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Application not found' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update application status' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Application status updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Application not found' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('reviewNotes')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id/withdraw'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Withdraw job application' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Application withdrawn successfully' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Application not found' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.FORBIDDEN, description: 'Cannot withdraw reviewed application' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationsController.prototype, "withdraw", null);
__decorate([
    (0, common_1.Post)(':id/interview'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Schedule interview for application' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Interview scheduled successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, schedule_interview_dto_1.ScheduleInterviewDto, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationsController.prototype, "scheduleInterview", null);
__decorate([
    (0, common_1.Post)(':id/hire'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Hire employee from application' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Employee hired successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, hire_employee_dto_1.HireEmployeeDto, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationsController.prototype, "hire", null);
__decorate([
    (0, common_1.Get)('job/:jobId/analytics'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get application analytics for a job' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Analytics retrieved successfully' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationsController.prototype, "getJobApplicationAnalytics", null);
__decorate([
    (0, common_1.Get)('employment-history/:employeeId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE, client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get employment history for an employee' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Employment history retrieved successfully' }),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationsController.prototype, "getEmploymentHistory", null);
__decorate([
    (0, common_1.Post)('employment/:employmentHistoryId/rate'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Rate an employee in employment history' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Employee rated successfully' }),
    __param(0, (0, common_1.Param)('employmentHistoryId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rate_employee_dto_1.RateEmployeeDto, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationsController.prototype, "rateEmployee", null);
__decorate([
    (0, common_1.Post)('employment/:employmentHistoryId/terminate'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Terminate employment' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Employment terminated successfully' }),
    __param(0, (0, common_1.Param)('employmentHistoryId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationsController.prototype, "terminateEmployment", null);
exports.JobApplicationsController = JobApplicationsController = __decorate([
    (0, swagger_1.ApiTags)('job-applications'),
    (0, common_1.Controller)('job-applications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [job_applications_service_1.JobApplicationsService])
], JobApplicationsController);
//# sourceMappingURL=job-applications.controller.js.map