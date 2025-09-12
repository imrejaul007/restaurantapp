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
exports.JobModerationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const job_moderation_service_1 = require("./job-moderation.service");
const moderate_job_dto_1 = require("./dto/moderate-job.dto");
const client_1 = require("@prisma/client");
let JobModerationController = class JobModerationController {
    constructor(jobModerationService) {
        this.jobModerationService = jobModerationService;
    }
    async moderateJob(jobId, moderationData, req) {
        const { user } = req;
        return this.jobModerationService.moderateJob(jobId, moderationData, user.id);
    }
    async getModerationQueue(filters) {
        return this.jobModerationService.getJobsForModeration(filters);
    }
    async getFlaggedJobs() {
        return this.jobModerationService.getFlaggedJobs();
    }
    async resolveFlaggedJob(jobId, resolutionData, req) {
        const { user } = req;
        return this.jobModerationService.resolveFlaggedJob(jobId, resolutionData.resolution, user.id, resolutionData.notes);
    }
    async getModerationHistory(jobId) {
        return this.jobModerationService.getModerationHistory(jobId);
    }
    async getModerationStats() {
        return this.jobModerationService.getModerationStats();
    }
    async bulkModerate(bulkData, req) {
        const { user } = req;
        return this.jobModerationService.bulkModerateJobs(bulkData.jobIds, bulkData.action, bulkData.notes, user.id);
    }
    async getQualityReport(days = 7) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const jobs = await this.jobModerationService.getJobsForModeration({
            since: since.toISOString(),
            limit: 1000,
        });
        const qualityMetrics = {
            totalJobs: jobs.jobs.length,
            averageScore: jobs.jobs.reduce((sum, job) => sum + job.moderationScore, 0) / jobs.jobs.length,
            highQuality: jobs.jobs.filter(job => job.moderationScore >= 80).length,
            mediumQuality: jobs.jobs.filter(job => job.moderationScore >= 60 && job.moderationScore < 80).length,
            lowQuality: jobs.jobs.filter(job => job.moderationScore < 60).length,
            flaggedCount: jobs.flaggedCount,
            topIssues: this.analyzeCommonIssues(jobs.jobs),
            recommendations: this.generateRecommendations(jobs.jobs),
        };
        return {
            period: `Last ${days} days`,
            generatedAt: new Date(),
            metrics: qualityMetrics,
        };
    }
    async runAutoModeration(req) {
        const { user } = req;
        const jobs = await this.jobModerationService.getJobsForModeration({ limit: 100 });
        const autoModerationResults = [];
        for (const job of jobs.jobs) {
            if (job.moderationScore >= 90 && !job.isFlagged && job.moderationHistory.length === 0) {
                const result = await this.jobModerationService.moderateJob(job.id, {
                    action: moderate_job_dto_1.ModerationAction.APPROVE,
                    moderatorNotes: 'Auto-approved: High quality score and no previous issues',
                }, `auto-moderator-${user.id}`);
                autoModerationResults.push({ jobId: job.id, action: 'auto-approved', score: job.moderationScore });
            }
            else if (job.moderationScore <= 30 && !job.isFlagged) {
                const result = await this.jobModerationService.moderateJob(job.id, {
                    action: moderate_job_dto_1.ModerationAction.FLAG,
                    moderatorNotes: 'Auto-flagged: Low quality score detected',
                    flagReasons: ['low-quality-content', 'incomplete-information'],
                    priority: 'HIGH',
                }, `auto-moderator-${user.id}`);
                autoModerationResults.push({ jobId: job.id, action: 'auto-flagged', score: job.moderationScore });
            }
        }
        return {
            processed: jobs.jobs.length,
            autoModerated: autoModerationResults.length,
            results: autoModerationResults,
            summary: {
                approved: autoModerationResults.filter(r => r.action === 'auto-approved').length,
                flagged: autoModerationResults.filter(r => r.action === 'auto-flagged').length,
            },
        };
    }
    analyzeCommonIssues(jobs) {
        const issues = {
            'missing-salary': 0,
            'short-description': 0,
            'no-requirements': 0,
            'no-skills': 0,
            'suspicious-content': 0,
        };
        jobs.forEach(job => {
            if (!job.salaryMin && !job.salaryMax)
                issues['missing-salary']++;
            if (!job.description || job.description.length < 50)
                issues['short-description']++;
            if (!job.requirements || job.requirements.length === 0)
                issues['no-requirements']++;
            if (!job.skills || job.skills.length === 0)
                issues['no-skills']++;
            if (job.title.includes('$$$') || job.title.includes('URGENT!!!'))
                issues['suspicious-content']++;
        });
        return Object.entries(issues)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([issue, count]) => ({ issue, count }));
    }
    generateRecommendations(jobs) {
        const recommendations = [];
        const averageScore = jobs.reduce((sum, job) => sum + job.moderationScore, 0) / jobs.length;
        if (averageScore < 70) {
            recommendations.push('Consider implementing stricter job posting guidelines');
        }
        const flaggedRate = jobs.filter(job => job.isFlagged).length / jobs.length;
        if (flaggedRate > 0.1) {
            recommendations.push('High flag rate detected - review posting requirements');
        }
        const incompletePosts = jobs.filter(job => job.moderationScore < 60).length;
        if (incompletePosts > jobs.length * 0.3) {
            recommendations.push('Many incomplete posts - add validation checks');
        }
        return recommendations;
    }
};
exports.JobModerationController = JobModerationController;
__decorate([
    (0, common_1.Post)(':jobId/moderate'),
    (0, swagger_1.ApiOperation)({ summary: 'Moderate a job posting' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Job moderated successfully' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Job not found' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, moderate_job_dto_1.ModerateJobDto, Object]),
    __metadata("design:returntype", Promise)
], JobModerationController.prototype, "moderateJob", null);
__decorate([
    (0, common_1.Get)('queue'),
    (0, swagger_1.ApiOperation)({ summary: 'Get jobs pending moderation' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: 'string' }),
    (0, swagger_1.ApiQuery)({ name: 'since', required: false, type: 'string' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: 'number' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Moderation queue retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JobModerationController.prototype, "getModerationQueue", null);
__decorate([
    (0, common_1.Get)('flagged'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all flagged jobs' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Flagged jobs retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobModerationController.prototype, "getFlaggedJobs", null);
__decorate([
    (0, common_1.Post)('flagged/:jobId/resolve'),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve a flagged job' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Flagged job resolved successfully' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], JobModerationController.prototype, "resolveFlaggedJob", null);
__decorate([
    (0, common_1.Get)(':jobId/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get moderation history for a job' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Moderation history retrieved successfully' }),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobModerationController.prototype, "getModerationHistory", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get moderation statistics' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Moderation statistics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobModerationController.prototype, "getModerationStats", null);
__decorate([
    (0, common_1.Post)('bulk-moderate'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk moderate multiple jobs' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Bulk moderation completed' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], JobModerationController.prototype, "bulkModerate", null);
__decorate([
    (0, common_1.Get)('quality-report'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate job quality report' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, type: 'number' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Quality report generated successfully' }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JobModerationController.prototype, "getQualityReport", null);
__decorate([
    (0, common_1.Post)('auto-moderate'),
    (0, swagger_1.ApiOperation)({ summary: 'Run automated moderation checks' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Auto-moderation completed' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JobModerationController.prototype, "runAutoModeration", null);
exports.JobModerationController = JobModerationController = __decorate([
    (0, swagger_1.ApiTags)('job-moderation'),
    (0, common_1.Controller)('job-moderation'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [job_moderation_service_1.JobModerationService])
], JobModerationController);
//# sourceMappingURL=job-moderation.controller.js.map