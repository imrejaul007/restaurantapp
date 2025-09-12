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
var CommunityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let CommunityService = CommunityService_1 = class CommunityService {
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.logger = new common_1.Logger(CommunityService_1.name);
    }
    async getCommunityOverview(userId) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                select: { id: true, role: true },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const recentPosts = await this.databaseService.forumPost.findMany({
                where: {
                    isDeleted: false,
                    visibility: 'PUBLIC',
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    author: {
                        include: {
                            profile: true,
                        },
                    },
                    forum: true,
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                            shares: true,
                        },
                    },
                },
            });
            const forums = await this.databaseService.forum.findMany({
                where: { isActive: true },
                orderBy: [{ displayOrder: 'asc' }, { postCount: 'desc' }],
                take: 10,
            });
            const [totalPosts, totalMembers, activeForums] = await Promise.all([
                this.databaseService.forumPost.count({
                    where: { isDeleted: false },
                }),
                this.databaseService.user.count({
                    where: { isActive: true },
                }),
                this.databaseService.forum.count({
                    where: { isActive: true },
                }),
            ]);
            return {
                recentPosts: recentPosts.map(post => ({
                    ...post,
                    author: {
                        id: post.author.id,
                        name: `${post.author.profile?.firstName || ''} ${post.author.profile?.lastName || ''}`.trim() || 'Unknown User',
                        role: post.author.role,
                        avatar: post.author.profile?.avatar,
                        verified: post.author.isVerified,
                    },
                    engagement: {
                        likes: post._count.likes,
                        comments: post._count.comments,
                        shares: post._count.shares,
                        views: post.viewCount,
                    },
                })),
                forums,
                stats: {
                    totalPosts,
                    totalMembers,
                    activeForums,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get community overview', error);
            throw error;
        }
    }
    async getUserActivity(userId, targetUserId) {
        try {
            const actualUserId = targetUserId || userId;
            const user = await this.databaseService.user.findUnique({
                where: { id: actualUserId },
                include: {
                    profile: true,
                    reputation: true,
                },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const forumPosts = await this.databaseService.forumPost.findMany({
                where: {
                    userId: actualUserId,
                    isDeleted: false,
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    forum: true,
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                            shares: true,
                        },
                    },
                },
            });
            const comments = await this.databaseService.postComment.findMany({
                where: {
                    userId: actualUserId,
                    isDeleted: false,
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    post: {
                        include: {
                            forum: true,
                        },
                    },
                    _count: {
                        select: {
                            likes: true,
                        },
                    },
                },
            });
            const [totalPosts, totalComments, totalLikesReceived, joinedForums] = await Promise.all([
                this.databaseService.forumPost.count({
                    where: { userId: actualUserId, isDeleted: false },
                }),
                this.databaseService.postComment.count({
                    where: { userId: actualUserId, isDeleted: false },
                }),
                this.databaseService.postLike.count({
                    where: {
                        post: { userId: actualUserId },
                    },
                }),
                this.databaseService.forumSubscription.count({
                    where: { userId: actualUserId },
                }),
            ]);
            return {
                user: {
                    id: user.id,
                    name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown User',
                    role: user.role,
                    avatar: user.profile?.avatar,
                    verified: user.isVerified,
                    joinedAt: user.createdAt,
                    reputation: user.reputation || {
                        totalPoints: 0,
                        level: 1,
                        badgeCount: 0,
                    },
                },
                forumPosts: forumPosts.map(post => ({
                    ...post,
                    engagement: {
                        likes: post._count.likes,
                        comments: post._count.comments,
                        shares: post._count.shares,
                        views: post.viewCount,
                    },
                })),
                comments,
                stats: {
                    totalPosts,
                    totalComments,
                    totalLikesReceived,
                    joinedForums,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get user activity', error);
            throw error;
        }
    }
    async searchCommunity(params) {
        try {
            const { query, type = 'posts', category, userId, page = 1, limit = 20, } = params;
            const skip = (page - 1) * limit;
            let results = [];
            let total = 0;
            switch (type) {
                case 'posts':
                    const whereClause = {
                        isDeleted: false,
                        ...(query && {
                            OR: [
                                { title: { contains: query, mode: 'insensitive' } },
                                { content: { contains: query, mode: 'insensitive' } },
                                { tags: { hasSome: [query] } },
                            ],
                        }),
                        ...(category && { forum: { category } }),
                        ...(userId && { userId }),
                    };
                    const [posts, postsTotal] = await Promise.all([
                        this.databaseService.forumPost.findMany({
                            where: whereClause,
                            orderBy: { createdAt: 'desc' },
                            skip,
                            take: limit,
                            include: {
                                author: {
                                    include: {
                                        profile: true,
                                    },
                                },
                                forum: true,
                                _count: {
                                    select: {
                                        likes: true,
                                        comments: true,
                                        shares: true,
                                    },
                                },
                            },
                        }),
                        this.databaseService.forumPost.count({ where: whereClause }),
                    ]);
                    results = posts.map(post => ({
                        ...post,
                        author: {
                            id: post.author.id,
                            name: `${post.author.profile?.firstName || ''} ${post.author.profile?.lastName || ''}`.trim() || 'Unknown User',
                            role: post.author.role,
                            avatar: post.author.profile?.avatar,
                            verified: post.author.isVerified,
                        },
                        engagement: {
                            likes: post._count.likes,
                            comments: post._count.comments,
                            shares: post._count.shares,
                            views: post.viewCount,
                        },
                    }));
                    total = postsTotal;
                    break;
                case 'forums':
                    const forumWhere = {
                        isActive: true,
                        ...(query && {
                            OR: [
                                { name: { contains: query, mode: 'insensitive' } },
                                { description: { contains: query, mode: 'insensitive' } },
                            ],
                        }),
                        ...(category && { category }),
                    };
                    const [forums, forumsTotal] = await Promise.all([
                        this.databaseService.forum.findMany({
                            where: forumWhere,
                            orderBy: { postCount: 'desc' },
                            skip,
                            take: limit,
                        }),
                        this.databaseService.forum.count({ where: forumWhere }),
                    ]);
                    results = forums;
                    total = forumsTotal;
                    break;
                case 'users':
                    const userWhere = {
                        isActive: true,
                        ...(query && {
                            profile: {
                                OR: [
                                    { firstName: { contains: query, mode: 'insensitive' } },
                                    { lastName: { contains: query, mode: 'insensitive' } },
                                ],
                            },
                        }),
                    };
                    const [users, usersTotal] = await Promise.all([
                        this.databaseService.user.findMany({
                            where: userWhere,
                            orderBy: { createdAt: 'desc' },
                            skip,
                            take: limit,
                            include: {
                                profile: true,
                                reputation: true,
                                _count: {
                                    select: {
                                        forumPosts: true,
                                        postComments: true,
                                    },
                                },
                            },
                        }),
                        this.databaseService.user.count({ where: userWhere }),
                    ]);
                    results = users.map((user) => ({
                        id: user.id,
                        name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown User',
                        role: user.role,
                        avatar: user.profile?.avatar,
                        verified: user.isVerified,
                        joinedAt: user.createdAt,
                        reputation: user.reputation || { totalPoints: 0, level: 1 },
                        stats: {
                            posts: user._count.forumPosts,
                            comments: user._count.postComments,
                        },
                    }));
                    total = usersTotal;
                    break;
            }
            const totalPages = Math.ceil(total / limit);
            return {
                results,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
                type,
            };
        }
        catch (error) {
            this.logger.error('Failed to search community', error);
            throw error;
        }
    }
    async getCommunityStats(userId, timeframe = 'week') {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const now = new Date();
            let startDate;
            switch (timeframe) {
                case 'day':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case 'year':
                    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
            }
            const [newPosts, newComments, newMembers, totalLikes, totalShares] = await Promise.all([
                this.databaseService.forumPost.count({
                    where: {
                        createdAt: { gte: startDate },
                        isDeleted: false,
                    },
                }),
                this.databaseService.postComment.count({
                    where: {
                        createdAt: { gte: startDate },
                        isDeleted: false,
                    },
                }),
                this.databaseService.user.count({
                    where: {
                        createdAt: { gte: startDate },
                    },
                }),
                this.databaseService.postLike.count({
                    where: {
                        createdAt: { gte: startDate },
                    },
                }),
                this.databaseService.postShare.count({
                    where: {
                        createdAt: { gte: startDate },
                    },
                }),
            ]);
            const trendingTags = await this.databaseService.trendingTag.findMany({
                where: {
                    period: timeframe,
                    date: {
                        gte: startDate,
                    },
                },
                orderBy: { score: 'desc' },
                take: 10,
            });
            return {
                timeframe,
                period: {
                    startDate,
                    endDate: now,
                },
                stats: {
                    newPosts,
                    newComments,
                    newMembers,
                    totalEngagement: totalLikes + totalShares + newComments,
                    totalLikes,
                    totalShares,
                },
                trendingTags: trendingTags.map(tag => ({
                    tag: tag.tag,
                    score: tag.score,
                    postCount: tag.postCount,
                })),
            };
        }
        catch (error) {
            this.logger.error('Failed to get community stats', error);
            throw error;
        }
    }
    async reportContent(userId, contentId, contentType, reason, description) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                select: { id: true },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            let report;
            switch (contentType) {
                case 'post':
                    const post = await this.databaseService.forumPost.findUnique({
                        where: { id: contentId, isDeleted: false },
                    });
                    if (!post) {
                        throw new common_1.NotFoundException('Post not found');
                    }
                    const existingPostReport = await this.databaseService.postReport.findFirst({
                        where: { postId: contentId, reporterId: userId },
                    });
                    if (existingPostReport) {
                        throw new common_1.BadRequestException('Content already reported');
                    }
                    report = await this.databaseService.postReport.create({
                        data: {
                            postId: contentId,
                            reporterId: userId,
                            reason,
                            description,
                        },
                    });
                    break;
                case 'comment':
                    const comment = await this.databaseService.postComment.findUnique({
                        where: { id: contentId, isDeleted: false },
                    });
                    if (!comment) {
                        throw new common_1.NotFoundException('Comment not found');
                    }
                    const existingCommentReport = await this.databaseService.commentReport.findFirst({
                        where: { commentId: contentId, reporterId: userId },
                    });
                    if (existingCommentReport) {
                        throw new common_1.BadRequestException('Content already reported');
                    }
                    report = await this.databaseService.commentReport.create({
                        data: {
                            commentId: contentId,
                            reporterId: userId,
                            reason,
                            description,
                        },
                    });
                    break;
                default:
                    throw new common_1.BadRequestException('Invalid content type');
            }
            return report;
        }
        catch (error) {
            this.logger.error('Failed to report content', error);
            throw error;
        }
    }
};
exports.CommunityService = CommunityService;
exports.CommunityService = CommunityService = CommunityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], CommunityService);
//# sourceMappingURL=community.service.js.map