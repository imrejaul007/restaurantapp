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
var AdminCommunityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCommunityService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const client_1 = require("@prisma/client");
let AdminCommunityService = AdminCommunityService_1 = class AdminCommunityService {
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.logger = new common_1.Logger(AdminCommunityService_1.name);
    }
    async getCommunityDashboard(adminUserId) {
        try {
            await this.validateAdminAccess(adminUserId);
            const [totalUsers, activeUsers, totalPosts, totalComments, pendingReports, totalForums, totalGroups, recentActivity,] = await Promise.all([
                this.databaseService.user.count(),
                this.databaseService.user.count({
                    where: {
                        lastLoginAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                }),
                this.databaseService.forumPost.count({
                    where: { isDeleted: false },
                }),
                this.databaseService.postComment.count({
                    where: { isDeleted: false },
                }),
                this.databaseService.postReport.count({
                    where: { status: client_1.ReportStatus.PENDING },
                }),
                this.databaseService.forum.count({
                    where: { isActive: true },
                }),
                this.databaseService.communityGroup.count(),
                this.getRecentActivityStats(),
            ]);
            const topContributors = await this.databaseService.user.findMany({
                take: 10,
                orderBy: {
                    reputation: { totalPoints: 'desc' },
                },
                include: {
                    profile: true,
                    reputation: true,
                    _count: {
                        select: {
                            forumPosts: { where: { isDeleted: false } },
                            postComments: { where: { isDeleted: false } },
                        },
                    },
                },
            });
            const trendingForums = await this.databaseService.forum.findMany({
                take: 5,
                orderBy: [
                    { postCount: 'desc' },
                    { memberCount: 'desc' },
                ],
                where: { isActive: true },
            });
            return {
                overview: {
                    totalUsers,
                    activeUsers,
                    totalPosts,
                    totalComments,
                    pendingReports,
                    totalForums,
                    totalGroups,
                    userActivityRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
                },
                recentActivity,
                topContributors: topContributors.map((user) => ({
                    id: user.id,
                    name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown User',
                    role: user.role,
                    avatar: user.profile?.avatar,
                    reputation: {
                        level: user.reputation?.level || 1,
                        totalPoints: user.reputation?.totalPoints || 0,
                    },
                    stats: {
                        posts: user._count.forumPosts,
                        comments: user._count.postComments,
                    },
                })),
                trendingForums,
            };
        }
        catch (error) {
            this.logger.error('Failed to get community dashboard', error);
            throw error;
        }
    }
    async getCommunityAnalytics(adminUserId, params) {
        try {
            await this.validateAdminAccess(adminUserId);
            const { timeframe = 'month', granularity = 'day' } = params;
            const timeRange = this.getTimeRange(timeframe);
            const userGrowth = await this.getUserGrowthAnalytics(timeRange, granularity);
            const contentAnalytics = await this.getContentAnalytics(timeRange, granularity);
            const engagementAnalytics = await this.getEngagementAnalytics(timeRange, granularity);
            const moderationAnalytics = await this.getModerationAnalytics(timeRange, granularity);
            return {
                timeframe,
                granularity,
                period: {
                    start: timeRange,
                    end: new Date(),
                },
                userGrowth,
                contentAnalytics,
                engagementAnalytics,
                moderationAnalytics,
            };
        }
        catch (error) {
            this.logger.error('Failed to get community analytics', error);
            throw error;
        }
    }
    async getContentModerationQueue(adminUserId, params) {
        try {
            await this.validateAdminAccess(adminUserId);
            const { status, contentType, priority, page = 1, limit = 20 } = params;
            const skip = (page - 1) * limit;
            const whereClause = {
                ...(status && { status }),
            };
            const [reports, total] = await Promise.all([
                this.databaseService.postReport.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy: [
                        { createdAt: 'desc' },
                    ],
                    include: {
                        reporter: {
                            include: { profile: true },
                        },
                    },
                }),
                this.databaseService.postReport.count({ where: whereClause }),
            ]);
            const enrichedReports = await Promise.all(reports.map(async (report) => {
                const contentDetails = await this.getContentDetails(report.postId, 'post');
                return {
                    id: report.id,
                    contentId: report.postId,
                    contentType: 'post',
                    reason: report.reason,
                    description: report.description,
                    category: 'general',
                    status: report.status,
                    priority: 'medium',
                    createdAt: report.createdAt,
                    reporter: report.reporter ? {
                        id: report.reporter.id,
                        name: `${report.reporter.profile?.firstName || ''} ${report.reporter.profile?.lastName || ''}`.trim() || 'Unknown User',
                        avatar: report.reporter.profile?.avatar,
                    } : {
                        id: 'unknown',
                        name: 'Unknown User',
                        avatar: null,
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
                summary: {
                    total,
                    pending: await this.databaseService.postReport.count({
                        where: { status: client_1.ReportStatus.PENDING },
                    }),
                    resolved: await this.databaseService.postReport.count({
                        where: { status: client_1.ReportStatus.APPROVED },
                    }),
                    actioned: await this.databaseService.postReport.count({
                        where: { status: client_1.ReportStatus.UNDER_REVIEW },
                    }),
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get content moderation queue', error);
            throw error;
        }
    }
    async getUserManagement(adminUserId, params) {
        try {
            await this.validateAdminAccess(adminUserId);
            const { role, status, search, sortBy = 'recent', page = 1, limit = 20 } = params;
            const skip = (page - 1) * limit;
            const whereClause = {
                ...(role && { role }),
                ...(status === 'active' && { isActive: true }),
                ...(status === 'banned' && { isActive: false }),
                ...(search && {
                    profile: {
                        OR: [
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                            { businessName: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                }),
            };
            let orderBy = { createdAt: 'desc' };
            switch (sortBy) {
                case 'reputation':
                    orderBy = { reputation: { totalPoints: 'desc' } };
                    break;
                case 'posts':
                    orderBy = { forumPosts: { _count: 'desc' } };
                    break;
                case 'reports':
                    orderBy = { createdAt: 'desc' };
                    break;
            }
            const [users, total] = await Promise.all([
                this.databaseService.user.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy,
                    include: {
                        profile: true,
                        reputation: true,
                        _count: {
                            select: {
                                forumPosts: { where: { isDeleted: false } },
                                postComments: { where: { isDeleted: false } },
                                followers: true,
                                following: true,
                            },
                        },
                    },
                }),
                this.databaseService.user.count({ where: whereClause }),
            ]);
            const userIds = users.map((user) => user.id);
            const reportCounts = await this.databaseService.postReport.groupBy({
                by: ['reporterId'],
                where: {
                    reporterId: { in: userIds },
                },
                _count: { id: true },
            });
            const reportCountMap = reportCounts.reduce((map, item) => {
                map[item.reporterId] = item._count?.id || 0;
                return map;
            }, {});
            const enrichedUsers = users.map((user) => ({
                id: user.id,
                name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown User',
                email: user.email,
                role: user.role,
                avatar: user.profile?.avatar,
                isActive: user.isActive,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
                reputation: {
                    level: user.reputation?.level || 1,
                    totalPoints: user.reputation?.totalPoints || 0,
                    badgeCount: user.reputation?.badgeCount || 0,
                },
                stats: {
                    posts: user._count.forumPosts,
                    comments: user._count.postComments,
                    followers: user._count.followers,
                    following: user._count.following,
                    reports: reportCountMap[user.id] || 0,
                },
            }));
            return {
                users: enrichedUsers,
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
            this.logger.error('Failed to get user management data', error);
            throw error;
        }
    }
    async getForumManagement(adminUserId) {
        try {
            await this.validateAdminAccess(adminUserId);
            const forums = await this.databaseService.forum.findMany({
                orderBy: [
                    { displayOrder: 'asc' },
                    { postCount: 'desc' },
                ],
                include: {
                    _count: {
                        select: {
                            posts: { where: { isDeleted: false } },
                            subscriptions: true,
                        },
                    },
                },
            });
            const forumStats = await Promise.all(forums.map(async (forum) => {
                const [recentPosts, topPosters] = await Promise.all([
                    this.databaseService.forumPost.count({
                        where: {
                            forumId: forum.id,
                            isDeleted: false,
                            createdAt: {
                                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                            },
                        },
                    }),
                    this.databaseService.forumPost.groupBy({
                        by: ['userId'],
                        where: {
                            forumId: forum.id,
                            isDeleted: false,
                            createdAt: {
                                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                            },
                        },
                        _count: { id: true },
                        orderBy: { _count: { id: 'desc' } },
                        take: 3,
                    }),
                ]);
                return {
                    id: forum.id,
                    name: forum.name,
                    slug: forum.slug,
                    description: forum.description,
                    category: forum.category,
                    icon: forum.icon,
                    color: forum.color,
                    isActive: forum.isActive,
                    displayOrder: forum.displayOrder,
                    stats: {
                        totalPosts: forum._count.posts,
                        totalMembers: forum._count.subscriptions,
                        recentPosts,
                        topPostersCount: topPosters.length,
                    },
                    createdAt: forum.createdAt,
                };
            }));
            return {
                forums: forumStats,
                summary: {
                    totalForums: forums.length,
                    activeForums: forums.filter(f => f.isActive).length,
                    totalPosts: forumStats.reduce((sum, f) => sum + f.stats.totalPosts, 0),
                    totalMembers: forumStats.reduce((sum, f) => sum + f.stats.totalMembers, 0),
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get forum management data', error);
            throw error;
        }
    }
    async updateForumSettings(adminUserId, forumId, settings) {
        try {
            await this.validateAdminAccess(adminUserId);
            const updatedForum = await this.databaseService.forum.update({
                where: { id: forumId },
                data: settings,
            });
            this.logger.log(`Admin ${adminUserId} updated forum ${forumId} settings`);
            return updatedForum;
        }
        catch (error) {
            this.logger.error('Failed to update forum settings', error);
            throw error;
        }
    }
    async suspendUser(adminUserId, userId, params) {
        try {
            await this.validateAdminAccess(adminUserId);
            const { reason, durationDays, notifyUser = true } = params;
            const suspendUntil = durationDays
                ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
                : null;
            const updatedUser = await this.databaseService.user.update({
                where: { id: userId },
                data: {
                    status: 'SUSPENDED',
                },
            });
            if (notifyUser) {
                this.logger.log(`Should notify user ${userId} about suspension`);
            }
            this.logger.log(`Admin ${adminUserId} suspended user ${userId} for ${durationDays || 'indefinite'} days`);
            return updatedUser;
        }
        catch (error) {
            this.logger.error('Failed to suspend user', error);
            throw error;
        }
    }
    async validateAdminAccess(userId) {
        const user = await this.databaseService.user.findUnique({
            where: { id: userId },
        });
        if (!user || user.role !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Admin access required');
        }
    }
    async getRecentActivityStats() {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [newUsers, newPosts, newComments, newReports] = await Promise.all([
            this.databaseService.user.count({
                where: { createdAt: { gte: weekAgo } },
            }),
            this.databaseService.forumPost.count({
                where: { createdAt: { gte: weekAgo }, isDeleted: false },
            }),
            this.databaseService.postComment.count({
                where: { createdAt: { gte: weekAgo }, isDeleted: false },
            }),
            this.databaseService.postReport.count({
                where: { createdAt: { gte: weekAgo } },
            }),
        ]);
        return {
            period: '7 days',
            newUsers,
            newPosts,
            newComments,
            newReports,
        };
    }
    async getUserGrowthAnalytics(timeRange, granularity) {
        return {
            totalUsers: await this.databaseService.user.count(),
            newUsers: await this.databaseService.user.count({
                where: { createdAt: { gte: timeRange } },
            }),
        };
    }
    async getContentAnalytics(timeRange, granularity) {
        return {
            totalPosts: await this.databaseService.forumPost.count({
                where: { isDeleted: false },
            }),
            newPosts: await this.databaseService.forumPost.count({
                where: { createdAt: { gte: timeRange }, isDeleted: false },
            }),
            totalComments: await this.databaseService.postComment.count({
                where: { isDeleted: false },
            }),
            newComments: await this.databaseService.postComment.count({
                where: { createdAt: { gte: timeRange }, isDeleted: false },
            }),
        };
    }
    async getEngagementAnalytics(timeRange, granularity) {
        return {
            totalLikes: await this.databaseService.postLike.count(),
            newLikes: await this.databaseService.postLike.count({
                where: { createdAt: { gte: timeRange } },
            }),
            totalShares: await this.databaseService.postShare.count(),
            newShares: await this.databaseService.postShare.count({
                where: { createdAt: { gte: timeRange } },
            }),
        };
    }
    async getModerationAnalytics(timeRange, granularity) {
        return {
            totalReports: await this.databaseService.postReport.count(),
            newReports: await this.databaseService.postReport.count({
                where: { createdAt: { gte: timeRange } },
            }),
            resolvedReports: await this.databaseService.postReport.count({
                where: {
                    reviewedAt: { gte: timeRange },
                    status: client_1.ReportStatus.APPROVED,
                },
            }),
            pendingReports: await this.databaseService.postReport.count({
                where: { status: client_1.ReportStatus.PENDING },
            }),
        };
    }
    async getContentDetails(contentId, contentType) {
        switch (contentType) {
            case 'POST':
                const post = await this.databaseService.forumPost.findUnique({
                    where: { id: contentId },
                    include: {
                        author: { include: { profile: true } },
                        forum: true,
                    },
                });
                return post ? {
                    title: post.title,
                    content: post.content.substring(0, 200),
                    author: `${post.author.profile?.firstName || ''} ${post.author.profile?.lastName || ''}`.trim(),
                    forum: post.forum.name,
                } : null;
            case 'COMMENT':
                const comment = await this.databaseService.postComment.findUnique({
                    where: { id: contentId },
                    include: {
                        author: { include: { profile: true } },
                        post: { include: { forum: true } },
                    },
                });
                return comment ? {
                    content: comment.content.substring(0, 200),
                    author: `${comment.author.profile?.firstName || ''} ${comment.author.profile?.lastName || ''}`.trim(),
                    post: comment.post.title,
                    forum: comment.post.forum.name,
                } : null;
            case 'USER':
                const user = await this.databaseService.user.findUnique({
                    where: { id: contentId },
                    include: { profile: true },
                });
                return user ? {
                    name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
                    email: user.email,
                    role: user.role,
                } : null;
            default:
                return null;
        }
    }
    getTimeRange(timeframe) {
        const now = new Date();
        switch (timeframe) {
            case 'day':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case 'week':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case 'month':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case 'quarter':
                return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            case 'year':
                return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
    }
};
exports.AdminCommunityService = AdminCommunityService;
exports.AdminCommunityService = AdminCommunityService = AdminCommunityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AdminCommunityService);
//# sourceMappingURL=admin-community.service.js.map