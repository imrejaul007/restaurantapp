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
var ModerationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const client_1 = require("@prisma/client");
var ModerationAction;
(function (ModerationAction) {
    ModerationAction["APPROVE"] = "APPROVE";
    ModerationAction["REMOVE"] = "REMOVE";
    ModerationAction["WARN"] = "WARN";
    ModerationAction["SUSPEND"] = "SUSPEND";
    ModerationAction["BAN"] = "BAN";
})(ModerationAction || (ModerationAction = {}));
let ModerationService = ModerationService_1 = class ModerationService {
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.logger = new common_1.Logger(ModerationService_1.name);
        this.spamPatterns = [
            /(\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)\b/g,
            /\b(?:buy\s+now|click\s+here|free\s+money|make\s+\$\d+|viagra|casino)\b/gi,
            /(.)\1{4,}/g,
            /[^\w\s]{3,}/g,
        ];
        this.profanityList = [];
    }
    async reportContent(reporterId, contentId, contentType, reason, description, category) {
        try {
            const existingReport = await this.databaseService.postReport.findFirst({
                where: {
                    reporterId,
                    postId: contentId,
                },
            });
            if (existingReport) {
                throw new common_1.BadRequestException('You have already reported this content');
            }
            await this.verifyContentExists(contentId, contentType);
            const report = await this.databaseService.postReport.create({
                data: {
                    reporterId,
                    postId: contentId,
                    reason,
                    description,
                    status: client_1.ReportStatus.PENDING,
                },
            });
            await this.checkAutoModeration(contentId, contentType, reason, category);
            await this.updateContentSafetyScore(contentId, contentType);
            this.logger.log(`Content reported: ${contentType} ${contentId} by user ${reporterId}`);
            return report;
        }
        catch (error) {
            this.logger.error('Failed to report content', error);
            throw error;
        }
    }
    async getReports(params) {
        try {
            const { status, page = 1, limit = 20, } = params;
            const skip = (page - 1) * limit;
            const whereClause = {
                ...(status && { status }),
            };
            const [reports, total] = await Promise.all([
                this.databaseService.postReport.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        reporter: {
                            include: { profile: true },
                        },
                    },
                }),
                this.databaseService.postReport.count({ where: whereClause }),
            ]);
            const enrichedReports = await Promise.all(reports.map(async (report) => {
                const contentDetails = await this.getContentDetails(report.postId, 'POST');
                return {
                    ...report,
                    reporter: {
                        id: report.reporter.id,
                        name: `${report.reporter.profile?.firstName || ''} ${report.reporter.profile?.lastName || ''}`.trim() || 'Unknown User',
                        avatar: report.reporter.profile?.avatar,
                    },
                    contentDetails,
                };
            }));
            return {
                reports: enrichedReports,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get reports', error);
            throw error;
        }
    }
    async moderateContent(moderatorId, reportId, action, reason, durationDays) {
        try {
            const moderator = await this.databaseService.user.findUnique({
                where: { id: moderatorId },
            });
            if (!moderator || (moderator.role !== client_1.UserRole.ADMIN && moderator.role !== 'MODERATOR')) {
                throw new common_1.ForbiddenException('Insufficient permissions for moderation');
            }
            const report = await this.databaseService.postReport.findUnique({
                where: { id: reportId },
            });
            if (!report) {
                throw new common_1.NotFoundException('Report not found');
            }
            const updatedReport = await this.databaseService.postReport.update({
                where: { id: reportId },
                data: {
                    status: action === 'APPROVE' ? client_1.ReportStatus.APPROVED : client_1.ReportStatus.REJECTED,
                    reviewedBy: moderatorId,
                    reviewedAt: new Date(),
                },
            });
            await this.applyModerationAction(report.postId, 'POST', action, moderatorId, reason, durationDays);
            this.logger.log(`Moderation action logged: ${action} on POST ${report.postId} by ${moderatorId}`);
            if (action !== 'APPROVE') {
                await this.notifyContentAuthor(report.postId, 'POST', action, reason);
            }
            this.logger.log(`Moderation action taken: ${action} on POST ${report.postId} by ${moderatorId}`);
            return updatedReport;
        }
        catch (error) {
            this.logger.error('Failed to moderate content', error);
            throw error;
        }
    }
    async detectSpam(content, metadata) {
        try {
            let spamScore = 0;
            const reasons = [];
            for (const pattern of this.spamPatterns) {
                const matches = content.match(pattern);
                if (matches) {
                    spamScore += matches.length * 2;
                    reasons.push(`Contains spam pattern: ${pattern.source}`);
                }
            }
            if (content.length < 10) {
                spamScore += 3;
                reasons.push('Content too short');
            }
            if (content.length > 5000) {
                spamScore += 2;
                reasons.push('Content unusually long');
            }
            const words = content.toLowerCase().split(/\s+/);
            const wordFreq = words.reduce((freq, word) => {
                freq[word] = (freq[word] || 0) + 1;
                return freq;
            }, {});
            const repeatedWords = Object.entries(wordFreq).filter(([word, count]) => count > 5 && word.length > 3);
            if (repeatedWords.length > 0) {
                spamScore += repeatedWords.length * 2;
                reasons.push('Contains repetitive words');
            }
            if (metadata) {
                if (metadata.authorReputation !== undefined && metadata.authorReputation < 10) {
                    spamScore += 3;
                    reasons.push('Low reputation author');
                }
                if (metadata.authorAge !== undefined && metadata.authorAge < 7) {
                    spamScore += 2;
                    reasons.push('New account');
                }
                if (metadata.postFrequency !== undefined && metadata.postFrequency > 10) {
                    spamScore += 4;
                    reasons.push('High posting frequency');
                }
            }
            const maxScore = 20;
            const confidence = Math.min(spamScore / maxScore, 1);
            const isSpam = confidence > 0.6;
            return { isSpam, confidence, reasons };
        }
        catch (error) {
            this.logger.error('Failed to detect spam', error);
            return { isSpam: false, confidence: 0, reasons: ['Error in spam detection'] };
        }
    }
    async checkContentSafety(content) {
        try {
            const issues = [];
            let safetyScore = 100;
            const contentLower = content.toLowerCase();
            for (const profanity of this.profanityList) {
                if (contentLower.includes(profanity)) {
                    issues.push('Contains inappropriate language');
                    safetyScore -= 20;
                    break;
                }
            }
            const personalInfoPatterns = [
                /\b\d{3}-\d{2}-\d{4}\b/,
                /\b\d{16}\b/,
                /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
                /\b\d{10}\b/,
            ];
            for (const pattern of personalInfoPatterns) {
                if (pattern.test(content)) {
                    issues.push('May contain personal information');
                    safetyScore -= 15;
                    break;
                }
            }
            const threatPatterns = [
                /\b(kill|hurt|harm|attack|threat|violence)\b/gi,
                /\b(hate|stupid|idiot|loser)\b/gi,
            ];
            for (const pattern of threatPatterns) {
                if (pattern.test(content)) {
                    issues.push('May contain threatening or harassing language');
                    safetyScore -= 25;
                    break;
                }
            }
            const spamResult = await this.detectSpam(content);
            if (spamResult.isSpam) {
                issues.push('Detected as potential spam');
                safetyScore -= 30;
            }
            const isSafe = safetyScore >= 70;
            return { isSafe, issues, safetyScore };
        }
        catch (error) {
            this.logger.error('Failed to check content safety', error);
            return { isSafe: true, issues: [], safetyScore: 100 };
        }
    }
    async getUserSafetyProfile(userId) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                include: {
                    profile: true,
                    reputation: true,
                },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const [reportsBy, reportsAgainst, moderationHistory] = await Promise.all([
                this.databaseService.postReport.count({
                    where: { reporterId: userId },
                }),
                this.databaseService.postReport.count({
                    where: {
                        post: {
                            author: {
                                id: userId,
                            },
                        },
                    },
                }),
                Promise.resolve([]),
            ]);
            let safetyScore = 100;
            safetyScore -= Math.min(reportsAgainst * 5, 30);
            safetyScore -= Math.min(moderationHistory.length * 10, 40);
            const accountAgeDays = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            if (accountAgeDays < 30) {
                safetyScore -= 20;
            }
            else if (accountAgeDays < 90) {
                safetyScore -= 10;
            }
            const userLevel = user.reputation?.level || 1;
            if (userLevel > 5) {
                safetyScore += 10;
            }
            if (user.isVerified) {
                safetyScore += 15;
            }
            safetyScore = Math.max(0, Math.min(100, safetyScore));
            return {
                user: {
                    id: user.id,
                    name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown User',
                    role: user.role,
                    verified: user.isVerified,
                    joinedAt: user.createdAt,
                },
                safetyProfile: {
                    safetyScore,
                    reportsSubmitted: reportsBy,
                    reportsReceived: reportsAgainst,
                    moderationActions: moderationHistory.length,
                    accountAge: accountAgeDays,
                    riskLevel: this.calculateRiskLevel(safetyScore),
                },
                recentModerationActions: moderationHistory.map((action) => ({
                    action: action.action,
                    reason: action.reason,
                    date: action.createdAt,
                })),
            };
        }
        catch (error) {
            this.logger.error('Failed to get user safety profile', error);
            throw error;
        }
    }
    async blockUser(blockerId, blockedId, reason) {
        try {
            if (blockerId === blockedId) {
                throw new common_1.BadRequestException('Cannot block yourself');
            }
            this.logger.log(`User ${blockerId} blocked user ${blockedId}: ${reason}`);
            await Promise.all([
                this.databaseService.userFollow.deleteMany({
                    where: {
                        OR: [
                            { followerId: blockerId, followingId: blockedId },
                            { followerId: blockedId, followingId: blockerId },
                        ],
                    },
                }),
            ]);
            const block = { id: 'blocked', blockerId, blockedId, reason };
            this.logger.log(`User ${blockerId} blocked user ${blockedId}`);
            return block;
        }
        catch (error) {
            this.logger.error('Failed to block user', error);
            throw error;
        }
    }
    async verifyContentExists(contentId, contentType) {
        let exists = false;
        switch (contentType) {
            case 'POST':
                exists = !!(await this.databaseService.forumPost.findUnique({
                    where: { id: contentId },
                }));
                break;
            case 'COMMENT':
                exists = !!(await this.databaseService.postComment.findUnique({
                    where: { id: contentId },
                }));
                break;
            case 'USER':
                exists = !!(await this.databaseService.user.findUnique({
                    where: { id: contentId },
                }));
                break;
            case 'GROUP':
                exists = !!(await this.databaseService.communityGroup.findUnique({
                    where: { id: contentId },
                }));
                break;
        }
        if (!exists) {
            throw new common_1.NotFoundException(`${contentType} not found`);
        }
    }
    async checkAutoModeration(contentId, contentType, reason, category) {
        const recentReports = await this.databaseService.postReport.count({
            where: {
                postId: contentId,
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            },
        });
        if (recentReports >= 3) {
            await this.applyModerationAction(contentId, 'POST', ModerationAction.REMOVE, 'system', 'Auto-moderation: Multiple reports received');
        }
    }
    async updateContentSafetyScore(contentId, contentType) {
    }
    async getContentDetails(contentId, contentType) {
        switch (contentType) {
            case 'POST':
                const post = await this.databaseService.forumPost.findUnique({
                    where: { id: contentId },
                    include: { author: { include: { profile: true } } },
                });
                return post ? {
                    title: post.title,
                    content: post.content.substring(0, 100),
                    author: `${post.author.profile?.firstName || ''} ${post.author.profile?.lastName || ''}`.trim(),
                } : null;
            case 'COMMENT':
                const comment = await this.databaseService.postComment.findUnique({
                    where: { id: contentId },
                    include: { author: { include: { profile: true } } },
                });
                return comment ? {
                    content: comment.content.substring(0, 100),
                    author: `${comment.author.profile?.firstName || ''} ${comment.author.profile?.lastName || ''}`.trim(),
                } : null;
            case 'USER':
                const user = await this.databaseService.user.findUnique({
                    where: { id: contentId },
                    include: { profile: true },
                });
                return user ? {
                    name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
                    role: user.role,
                } : null;
            default:
                return null;
        }
    }
    async applyModerationAction(contentId, contentType, action, moderatorId, reason, durationDays) {
        switch (contentType) {
            case 'POST':
                if (action === ModerationAction.REMOVE) {
                    await this.databaseService.forumPost.update({
                        where: { id: contentId },
                        data: { isDeleted: true, deletedAt: new Date() },
                    });
                }
                break;
            case 'COMMENT':
                if (action === ModerationAction.REMOVE) {
                    await this.databaseService.postComment.update({
                        where: { id: contentId },
                        data: { isDeleted: true, deletedAt: new Date() },
                    });
                }
                break;
            case 'USER':
                if (action === ModerationAction.SUSPEND || action === ModerationAction.BAN) {
                    this.logger.log(`User ${contentId} suspended/banned: ${reason}`);
                }
                break;
        }
    }
    async notifyContentAuthor(contentId, contentType, action, reason) {
        this.logger.log(`Notification needed: ${contentType} ${contentId} - ${action}: ${reason}`);
    }
    calculateRiskLevel(safetyScore) {
        if (safetyScore >= 80)
            return 'LOW';
        if (safetyScore >= 60)
            return 'MEDIUM';
        if (safetyScore >= 30)
            return 'HIGH';
        return 'CRITICAL';
    }
};
exports.ModerationService = ModerationService;
exports.ModerationService = ModerationService = ModerationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ModerationService);
//# sourceMappingURL=moderation.service.js.map