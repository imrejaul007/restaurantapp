"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsModule = void 0;
const common_1 = require("@nestjs/common");
const jobs_service_1 = require("./jobs.service");
const jobs_controller_1 = require("./jobs.controller");
const job_applications_service_1 = require("./job-applications.service");
const job_applications_controller_1 = require("./job-applications.controller");
const employee_availability_service_1 = require("./employee-availability.service");
const employee_availability_controller_1 = require("./employee-availability.controller");
const job_moderation_service_1 = require("./job-moderation.service");
const job_moderation_controller_1 = require("./job-moderation.controller");
const database_module_1 = require("../database/database.module");
const redis_module_1 = require("../../redis/redis.module");
let JobsModule = class JobsModule {
};
exports.JobsModule = JobsModule;
exports.JobsModule = JobsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, redis_module_1.RedisModule],
        providers: [jobs_service_1.JobsService, job_applications_service_1.JobApplicationsService, employee_availability_service_1.EmployeeAvailabilityService, job_moderation_service_1.JobModerationService],
        controllers: [jobs_controller_1.JobsController, job_applications_controller_1.JobApplicationsController, employee_availability_controller_1.EmployeeAvailabilityController, job_moderation_controller_1.JobModerationController],
        exports: [jobs_service_1.JobsService, job_applications_service_1.JobApplicationsService, employee_availability_service_1.EmployeeAvailabilityService, job_moderation_service_1.JobModerationService],
    })
], JobsModule);
//# sourceMappingURL=jobs.module.js.map