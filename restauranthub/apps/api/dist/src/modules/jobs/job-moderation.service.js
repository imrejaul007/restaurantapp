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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobModerationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const moderate_job_dto_1 = require("./dto/moderate-job.dto");
const client_1 = require("@prisma/client");
let JobModerationService = class JobModerationService {
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.moderationCache = new Map();
        this.flaggedJobs = new Map();
    }
    async moderateJob(jobId, moderationData, moderatorId) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                restaurant: {
                    include: {
                        user: {
                            include: {
                                profile: true,
                            },
                        },
                    },
                },
                applications: {
                    include: {
                        employee: {
                            include: {
                                user: {
                                    include: {
                                        profile: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        const moderationRecord = {
            id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            jobId,
            moderatorId,
            action: moderationData.action,
            moderatorNotes: moderationData.moderatorNotes,
            feedback: moderationData.feedback,
            priority: moderationData.priority || moderate_job_dto_1.ModerationPriority.MEDIUM,
            flagReasons: moderationData.flagReasons || [],
            createdAt: new Date(),
            requiresFollowUp: moderationData.requiresFollowUp || false,
        };
        const existing = this.moderationCache.get(jobId) || [];
        existing.push(moderationRecord);
        this.moderationCache.set(jobId, existing);
        let updatedJob;
        switch (moderationData.action) {
            case moderate_job_dto_1.ModerationAction.APPROVE:
                updatedJob = await this.prisma.job.update({
                    where: { id: jobId },
                    data: { status: client_1.JobStatus.OPEN },
                    include: { restaurant: { include: { user: { include: { profile: true } } } } },
                });
                await this.notifyModerationDecision(job, moderationRecord, 'approved');
                break;
            case moderate_job_dto_1.ModerationAction.REJECT:
                updatedJob = await this.prisma.job.update({
                    where: { id: jobId },
                    data: { status: client_1.JobStatus.CLOSED },
                    include: { restaurant: { include: { user: { include: { profile: true } } } } },
                });
                await this.notifyModerationDecision(job, moderationRecord, 'rejected');
                break;
            case moderate_job_dto_1.ModerationAction.REQUEST_CHANGES:
                updatedJob = job;
                await this.notifyModerationDecision(job, moderationRecord, 'changes_requested');
                break;
            case moderate_job_dto_1.ModerationAction.FLAG:
                this.flaggedJobs.set(jobId, {
                    job,
                    moderationRecord,
                    flaggedAt: new Date(),
                });
                updatedJob = job;
                await this.notifyModerationDecision(job, moderationRecord, 'flagged');
                break;
            case moderate_job_dto_1.ModerationAction.SUSPEND:
                updatedJob = await this.prisma.job.update({
                    where: { id: jobId },
                    data: { status: client_1.JobStatus.CLOSED },
                    include: { restaurant: { include: { user: { include: { profile: true } } } } },
                });
                await this.notifyModerationDecision(job, moderationRecord, 'suspended');
                break;
            default:
                updatedJob = job;
        }
        await this.redisService.publish(`job:${jobId}:moderation`, JSON.stringify({
            type: 'job:moderated',
            data: {
                jobId,
                action: moderationData.action,
                moderatorNotes: moderationData.moderatorNotes,
                newStatus: updatedJob.status,
                timestamp: new Date(),
            },
        }));
        return {
            job: updatedJob,
            moderationRecord,
            message: `Job ${moderationData.action.toLowerCase()} successfully`,
        };
    }
    async getJobsForModeration(filters) {
        const where = {};
        if (filters?.status) {
            where.status = filters.status;
        }
        else {
            where.status = { in: [client_1.JobStatus.OPEN, 'PENDING'] };
        }
        if (filters?.since) {
            where.createdAt = { gte: new Date(filters.since) };
        }
        const jobs = await this.prisma.job.findMany({
            where,
            include: {
                restaurant: {
                    include: {
                        user: {
                            include: {
                                profile: true,
                            },
                        },
                    },
                },
                applications: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        employee: {
                            include: {
                                user: {
                                    include: {
                                        profile: true,
                                    },
                                },
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        applications: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: filters?.limit || 50,
            skip: filters?.skip || 0,
        });
        const enhancedJobs = jobs.map(job => ({
            ...job,
            moderationHistory: this.moderationCache.get(job.id) || [],
            isFlagged: this.flaggedJobs.has(job.id),
            flagDetails: this.flaggedJobs.get(job.id) || null,
            moderationScore: this.calculateModerationScore(job),
        }));
        return {
            jobs: enhancedJobs,
            total: enhancedJobs.length,
            flaggedCount: this.flaggedJobs.size,
        };
    }
    async getModerationHistory(jobId) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                restaurant: {
                    include: {
                        user: {
                            include: {
                                profile: true,
                            },
                        },
                    },
                },
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        const history = this.moderationCache.get(jobId) || [];
        return {
            job,
            moderationHistory: history,
            totalModerations: history.length,
            lastModeration: history[history.length - 1] || null,
            isFlagged: this.flaggedJobs.has(jobId),
            flagDetails: this.flaggedJobs.get(jobId) || null,
        };
    }
    async getFlaggedJobs() {
        const flagged = Array.from(this.flaggedJobs.entries()).map(([jobId, data]) => ({
            jobId,
            ...data,
        }));
        return {
            flaggedJobs: flagged,
            total: flagged.length,
        };
    }
    async resolveFlaggedJob(jobId, resolution, moderatorId, notes) {
        if (!this.flaggedJobs.has(jobId)) {
            throw new common_1.NotFoundException('Flagged job not found');
        }
        const flaggedData = this.flaggedJobs.get(jobId);
        const resolutionRecord = {
            id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            jobId,
            moderatorId,
            action: resolution === 'approved' ? moderate_job_dto_1.ModerationAction.APPROVE : moderate_job_dto_1.ModerationAction.REJECT,
            moderatorNotes: `Flag resolved: ${notes}`,
            createdAt: new Date(),
            requiresFollowUp: resolution === 'escalated',
        };
        const existing = this.moderationCache.get(jobId) || [];
        existing.push(resolutionRecord);
        this.moderationCache.set(jobId, existing);
        if (resolution === 'approved') {
            await this.prisma.job.update({
                where: { id: jobId },
                data: { status: client_1.JobStatus.OPEN },
            });
        }
        else if (resolution === 'rejected') {
            await this.prisma.job.update({
                where: { id: jobId },
                data: { status: client_1.JobStatus.CLOSED },
            });
        }
        if (resolution !== 'escalated') {
            this.flaggedJobs.delete(jobId);
        }
        return {
            resolution,
            resolutionRecord,
            message: `Flagged job ${resolution} successfully`,
        };
    }
    async getModerationStats() {
        const totalJobs = await this.prisma.job.count();
        const activeJobs = await this.prisma.job.count({
            where: { status: client_1.JobStatus.OPEN },
        });
        const closedJobs = await this.prisma.job.count({
            where: { status: client_1.JobStatus.CLOSED },
        });
        let totalModerations = 0;
        let approvedCount = 0;
        let rejectedCount = 0;
        let flaggedCount = this.flaggedJobs.size;
        for (const [jobId, history] of this.moderationCache.entries()) {
            totalModerations += history.length;
            for (const record of history) {
                if (record.action === moderate_job_dto_1.ModerationAction.APPROVE)
                    approvedCount++;
                if (record.action === moderate_job_dto_1.ModerationAction.REJECT)
                    rejectedCount++;
            }
        }
        return {
            jobs: {
                total: totalJobs,
                active: activeJobs,
                closed: closedJobs,
                flagged: flaggedCount,
            },
            moderations: {
                total: totalModerations,
                approved: approvedCount,
                rejected: rejectedCount,
                pendingReview: flaggedCount,
            },
            moderationRate: totalJobs > 0 ? ((totalModerations / totalJobs) * 100).toFixed(1) : 0,
        };
    }
    calculateModerationScore(job) {
        let score = 100;
        if (!job.description || job.description.length < 50)
            score -= 20;
        if (!job.salaryMin && !job.salaryMax)
            score -= 15;
        if (!job.requirements || job.requirements.length === 0)
            score -= 10;
        if (!job.skills || job.skills.length === 0)
            score -= 10;
        if (job.title.includes('$$$') || job.title.includes('URGENT!!!'))
            score -= 25;
        if (job.description.includes('guaranteed') && job.description.includes('money'))
            score -= 30;
        if (job.validTill && new Date(job.validTill) > new Date())
            score += 5;
        if (job.requirements && job.requirements.length > 3)
            score += 5;
        if (job.skills && job.skills.length > 2)
            score += 5;
        return Math.max(0, Math.min(100, score));
    }
    async notifyModerationDecision(job, moderationRecord, decision) {
        await this.redisService.publish(`restaurant:${job.restaurantId}`, JSON.stringify({
            type: 'job:moderation_decision',
            data: {
                jobId: job.id,
                jobTitle: job.title,
                decision,
                moderatorNotes: moderationRecord.moderatorNotes,
                feedback: moderationRecord.feedback,
                timestamp: new Date(),
            },
        }));
        console.log(`Job ${job.id} (${job.title}) ${decision} by moderator ${moderationRecord.moderatorId}`);
    }
    async bulkModerateJobs(jobIds, action, notes, moderatorId) {
        const results = [];
        for (const jobId of jobIds) {
            try {
                const result = await this.moderateJob(jobId, {
                    action,
                    moderatorNotes: notes,
                }, moderatorId);
                results.push({ jobId, success: true, ...result });
            }
            catch (error) {
                results.push({ jobId, success: false, error: error.message });
            }
        }
        return {
            results,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
        };
    }
};
exports.JobModerationService = JobModerationService;
exports.JobModerationService = JobModerationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], JobModerationService);
//# sourceMappingURL=job-moderation.service.js.map