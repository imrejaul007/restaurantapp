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
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const client_1 = require("@prisma/client");
let SearchService = SearchService_1 = class SearchService {
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.logger = new common_1.Logger(SearchService_1.name);
    }
    async universalSearch(userId, filters) {
        try {
            const { query, type = 'all', category, tags, authorRole, postType, city, timeframe = 'all', sortBy = 'relevance', minReputation, verified, page = 1, limit = 20, } = filters;
            const skip = (page - 1) * limit;
            let results = {};
            const timeRange = this.getTimeRange(timeframe);
            switch (type) {
                case 'all':
                    const [posts, users, groups, forums] = await Promise.all([
                        this.searchPosts({ query, category, tags, authorRole, postType, city, timeRange, sortBy, minReputation, verified, page: 1, limit: 5 }),
                        this.searchUsers({ query, role: authorRole, city, minReputation, verified, page: 1, limit: 5 }),
                        this.searchGroups({ query, city, category, page: 1, limit: 5 }),
                        this.searchForums({ query, category, page: 1, limit: 5 }),
                    ]);
                    results = {
                        posts: posts.results,
                        users: users.results,
                        groups: groups.results,
                        forums: forums.results,
                        summary: {
                            postsTotal: posts.total,
                            usersTotal: users.total,
                            groupsTotal: groups.total,
                            forumsTotal: forums.total,
                        },
                    };
                    break;
                case 'posts':
                    results = await this.searchPosts({ query, category, tags, authorRole, postType, city, timeRange, sortBy, minReputation, verified, page, limit });
                    break;
                case 'users':
                    results = await this.searchUsers({ query, role: authorRole, city, minReputation, verified, page, limit });
                    break;
                case 'groups':
                    results = await this.searchGroups({ query, city, category, page, limit });
                    break;
                case 'forums':
                    results = await this.searchForums({ query, category, page, limit });
                    break;
            }
            if (query) {
                await this.logSearch(userId, query, type, results);
            }
            return {
                ...results,
                searchParams: filters,
                searchType: type,
            };
        }
        catch (error) {
            this.logger.error('Failed to perform universal search', error);
            throw error;
        }
    }
    async searchPosts(params) {
        const { query, category, tags, authorRole, postType, city, timeRange, sortBy, minReputation, verified, page, limit } = params;
        const skip = (page - 1) * limit;
        const whereClause = {
            isDeleted: false,
            visibility: client_1.PostVisibility.PUBLIC,
            ...(query && {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { content: { contains: query, mode: 'insensitive' } },
                    { tags: { hasSome: query.split(' ') } },
                ],
            }),
            ...(category && { forum: { category: { contains: category, mode: 'insensitive' } } }),
            ...(tags && { tags: { hasAny: tags } }),
            ...(postType && { type: postType }),
            ...(timeRange && { createdAt: { gte: timeRange } }),
            ...(authorRole && { author: { role: authorRole } }),
            ...(city && { author: { profile: { city: { contains: city, mode: 'insensitive' } } } }),
            ...(minReputation && { author: { reputation: { totalPoints: { gte: minReputation } } } }),
            ...(verified !== undefined && { author: { isVerified: verified } }),
        };
        let orderBy = { createdAt: 'desc' };
        switch (sortBy) {
            case 'popular':
                orderBy = [{ viewCount: 'desc' }, { likeCount: 'desc' }, { createdAt: 'desc' }];
                break;
            case 'trending':
                orderBy = [{
                        likes: { _count: 'desc' },
                    }, { createdAt: 'desc' }];
                break;
            case 'recent':
                orderBy = { createdAt: 'desc' };
                break;
            case 'relevance':
                orderBy = [{ createdAt: 'desc' }];
                break;
        }
        const [posts, total] = await Promise.all([
            this.databaseService.forumPost.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy,
                include: {
                    author: {
                        include: {
                            profile: true,
                            reputation: true,
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
        return {
            results: posts.map(post => ({
                id: post.id,
                title: post.title,
                content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
                type: post.type,
                tags: post.tags,
                createdAt: post.createdAt,
                viewCount: post.viewCount,
                author: {
                    id: post.author.id,
                    name: `${post.author.profile?.firstName || ''} ${post.author.profile?.lastName || ''}`.trim() || 'Unknown User',
                    role: post.author.role,
                    avatar: post.author.profile?.avatar,
                    verified: post.author.isVerified,
                    reputation: {
                        level: post.author.reputation?.level || 1,
                        totalPoints: post.author.reputation?.totalPoints || 0,
                    },
                },
                forum: {
                    id: post.forum.id,
                    name: post.forum.name,
                    slug: post.forum.slug,
                    category: post.forum.category,
                },
                engagement: {
                    likes: post._count.likes,
                    comments: post._count.comments,
                    shares: post._count.shares,
                    views: post.viewCount,
                },
                relevanceScore: query ? this.calculateRelevanceScore(post, query) : 0,
            })),
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    }
    async searchUsers(params) {
        const { query, role, city, minReputation, verified, page, limit } = params;
        const skip = (page - 1) * limit;
        const whereClause = {
            isActive: true,
            ...(query && {
                profile: {
                    OR: [
                        { firstName: { contains: query, mode: 'insensitive' } },
                        { lastName: { contains: query, mode: 'insensitive' } },
                        { bio: { contains: query, mode: 'insensitive' } },
                    ],
                },
            }),
            ...(role && { role }),
            ...(city && { profile: { city: { contains: city, mode: 'insensitive' } } }),
            ...(minReputation && { reputation: { totalPoints: { gte: minReputation } } }),
            ...(verified !== undefined && { isVerified: verified }),
        };
        const [users, total] = await Promise.all([
            this.databaseService.user.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: [
                    { reputation: { totalPoints: 'desc' } },
                    { createdAt: 'desc' },
                ],
                include: {
                    profile: true,
                    reputation: true,
                    _count: {
                        select: {
                            forumPosts: { where: { isDeleted: false } },
                            followers: true,
                            following: true,
                        },
                    },
                },
            }),
            this.databaseService.user.count({ where: whereClause }),
        ]);
        return {
            results: users.map((user) => ({
                id: user.id,
                name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown User',
                role: user.role,
                avatar: user.profile?.avatar,
                verified: user.isVerified,
                bio: user.profile?.bio,
                city: user.profile?.city,
                joinedAt: user.createdAt,
                reputation: {
                    level: user.reputation?.level || 1,
                    totalPoints: user.reputation?.totalPoints || 0,
                    badgeCount: user.reputation?.badgeCount || 0,
                },
                stats: {
                    postsCount: user._count.forumPosts,
                    followersCount: user._count.followers,
                    followingCount: user._count.following,
                },
            })),
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    }
    async searchGroups(params) {
        const { query, city, category, page, limit } = params;
        const skip = (page - 1) * limit;
        const whereClause = {
            isPrivate: false,
            ...(query && {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ],
            }),
        };
        const [groups, total] = await Promise.all([
            this.databaseService.communityGroup.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { memberCount: 'desc' },
                include: {
                    creator: {
                        include: { profile: true },
                    },
                    _count: {
                        select: { members: true, posts: true },
                    },
                },
            }),
            this.databaseService.communityGroup.count({ where: whereClause }),
        ]);
        return {
            results: groups.map(group => ({
                id: group.id,
                name: group.name,
                slug: group.slug,
                description: group.description,
                image: group.image,
                memberCount: group._count.members,
                postCount: group._count.posts,
                createdAt: group.createdAt,
                creator: {
                    id: group.creator.id,
                    name: `${group.creator.profile?.firstName || ''} ${group.creator.profile?.lastName || ''}`.trim() || 'Unknown User',
                    avatar: group.creator.profile?.avatar,
                },
            })),
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    }
    async searchForums(params) {
        const { query, category, page, limit } = params;
        const skip = (page - 1) * limit;
        const whereClause = {
            isActive: true,
            ...(query && {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ],
            }),
            ...(category && { category: { contains: category, mode: 'insensitive' } }),
        };
        const [forums, total] = await Promise.all([
            this.databaseService.forum.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { postCount: 'desc' },
                include: {
                    _count: {
                        select: { posts: true, subscriptions: true },
                    },
                },
            }),
            this.databaseService.forum.count({ where: whereClause }),
        ]);
        return {
            results: forums.map(forum => ({
                id: forum.id,
                name: forum.name,
                slug: forum.slug,
                description: forum.description,
                category: forum.category,
                icon: forum.icon,
                color: forum.color,
                postCount: forum._count.posts,
                memberCount: forum._count.subscriptions,
                displayOrder: forum.displayOrder,
            })),
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    }
    async getTrendingContent(userId, params) {
        try {
            const { timeframe = 'week', type = 'all', category, limit = 10 } = params;
            const timeRange = this.getTimeRange(timeframe);
            let results = {};
            switch (type) {
                case 'all':
                    const [posts, users, tags] = await Promise.all([
                        this.getTrendingPosts(timeRange, category, 5),
                        this.getTrendingUsers(timeRange, 5),
                        this.getTrendingTags(timeframe, category, 5),
                    ]);
                    results = { posts, users, tags };
                    break;
                case 'posts':
                    results.posts = await this.getTrendingPosts(timeRange, category, limit);
                    break;
                case 'users':
                    results.users = await this.getTrendingUsers(timeRange, limit);
                    break;
                case 'tags':
                    results.tags = await this.getTrendingTags(timeframe, category, limit);
                    break;
            }
            return {
                ...results,
                timeframe,
                type,
            };
        }
        catch (error) {
            this.logger.error('Failed to get trending content', error);
            throw error;
        }
    }
    async getTrendingPosts(timeRange, category, limit = 10) {
        const whereClause = {
            isDeleted: false,
            visibility: client_1.PostVisibility.PUBLIC,
            ...(timeRange && { createdAt: { gte: timeRange } }),
            ...(category && { forum: { category: { contains: category, mode: 'insensitive' } } }),
        };
        const posts = await this.databaseService.forumPost.findMany({
            where: whereClause,
            take: limit * 2,
            orderBy: [
                { likeCount: 'desc' },
                { commentCount: 'desc' },
                { shareCount: 'desc' },
                { viewCount: 'desc' },
            ],
            include: {
                author: {
                    include: {
                        profile: true,
                        reputation: true,
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
        const scoredPosts = posts.map(post => {
            const ageDays = Math.max(1, (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            const engagementScore = post._count.likes + (post._count.comments * 2) + (post._count.shares * 3) + (post.viewCount * 0.1);
            const trendingScore = engagementScore / Math.pow(ageDays, 0.8);
            return {
                ...post,
                trendingScore,
            };
        });
        const trendingPosts = scoredPosts
            .sort((a, b) => b.trendingScore - a.trendingScore)
            .slice(0, limit);
        return trendingPosts.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : ''),
            type: post.type,
            tags: post.tags,
            createdAt: post.createdAt,
            trendingScore: post.trendingScore,
            author: {
                id: post.author.id,
                name: `${post.author.profile?.firstName || ''} ${post.author.profile?.lastName || ''}`.trim() || 'Unknown User',
                avatar: post.author.profile?.avatar,
                verified: post.author.isVerified,
            },
            forum: {
                id: post.forum.id,
                name: post.forum.name,
                category: post.forum.category,
            },
            engagement: {
                likes: post._count.likes,
                comments: post._count.comments,
                shares: post._count.shares,
                views: post.viewCount,
            },
        }));
    }
    async getTrendingUsers(timeRange, limit = 10) {
        const users = await this.databaseService.$queryRaw `
      SELECT 
        u.id,
        u.role,
        u.isVerified,
        p.firstName,
        p.lastName,
        p.avatar,
        ur.level,
        ur.totalPoints,
        COUNT(DISTINCT fp.id) as recent_posts,
        COUNT(DISTINCT pc.id) as recent_comments,
        COUNT(DISTINCT pl.id) as recent_likes_received
      FROM "User" u
      JOIN "Profile" p ON u.id = p.userId
      LEFT JOIN "UserReputation" ur ON u.id = ur.userId
      LEFT JOIN "ForumPost" fp ON u.id = fp.userId 
        AND fp.createdAt >= ${timeRange}
        AND fp.isDeleted = false
      LEFT JOIN "PostComment" pc ON u.id = pc.userId 
        AND pc.createdAt >= ${timeRange}
        AND pc.isDeleted = false
      LEFT JOIN "PostLike" pl ON fp.id = pl.postId
      WHERE u.isActive = true
      GROUP BY u.id, u.role, u.isVerified, p.firstName, p.lastName, p.avatar, ur.level, ur.totalPoints
      HAVING COUNT(DISTINCT fp.id) > 0 OR COUNT(DISTINCT pc.id) > 0
      ORDER BY (COUNT(DISTINCT fp.id) * 3 + COUNT(DISTINCT pc.id) + COUNT(DISTINCT pl.id) * 0.5) DESC
      LIMIT ${limit}
    `;
        return users.map(user => ({
            id: user.id,
            name: `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Unknown User',
            role: user.role,
            avatar: user.avatar,
            verified: user.isverified,
            reputation: {
                level: user.level || 1,
                totalPoints: user.totalpoints || 0,
            },
            activity: {
                recentPosts: parseInt(user.recent_posts),
                recentComments: parseInt(user.recent_comments),
                recentLikesReceived: parseInt(user.recent_likes_received),
            },
        }));
    }
    async getTrendingTags(timeframe, category, limit = 10) {
        const timeRange = this.getTimeRange(timeframe);
        return this.databaseService.trendingTag.findMany({
            where: {
                period: timeframe,
                ...(timeRange && { date: { gte: timeRange } }),
                ...(category && {
                    posts: {
                        some: {
                            forum: {
                                category: { contains: category, mode: 'insensitive' },
                            },
                        },
                    },
                }),
            },
            take: limit,
            orderBy: { score: 'desc' },
        });
    }
    async getPersonalizedFeed(userId, params) {
        try {
            const { page = 1, limit = 20 } = params;
            const skip = (page - 1) * limit;
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                include: {
                    profile: true,
                    following: { select: { followingId: true } },
                    groupMemberships: { select: { groupId: true } },
                    forumSubscriptions: { select: { forumId: true } },
                },
            });
            if (!user) {
                return this.getTrendingContent(userId, { type: 'posts', limit });
            }
            const followingIds = user.following.map((f) => f.followingId);
            const groupIds = user.groupMemberships.map((gm) => gm.groupId);
            const forumIds = user.forumSubscriptions.map((fs) => fs.forumId);
            const whereClause = {
                isDeleted: false,
                visibility: client_1.PostVisibility.PUBLIC,
                OR: [
                    ...(followingIds.length > 0 ? [{ userId: { in: followingIds } }] : []),
                    ...(forumIds.length > 0 ? [{ forumId: { in: forumIds } }] : []),
                    ...(user.profile?.city ? [{
                            author: {
                                profile: {
                                    city: { equals: user.profile.city, mode: 'insensitive' },
                                },
                            },
                        }] : []),
                    {
                        AND: [
                            { viewCount: { gte: 50 } },
                            { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
                        ],
                    },
                ],
            };
            const [posts, total] = await Promise.all([
                this.databaseService.forumPost.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy: [
                        { likeCount: 'desc' },
                        { createdAt: 'desc' },
                    ],
                    include: {
                        author: {
                            include: {
                                profile: true,
                                reputation: true,
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
            return {
                results: posts.map(post => ({
                    id: post.id,
                    title: post.title,
                    content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
                    type: post.type,
                    tags: post.tags,
                    createdAt: post.createdAt,
                    author: {
                        id: post.author.id,
                        name: `${post.author.profile?.firstName || ''} ${post.author.profile?.lastName || ''}`.trim() || 'Unknown User',
                        role: post.author.role,
                        avatar: post.author.profile?.avatar,
                        verified: post.author.isVerified,
                    },
                    forum: {
                        id: post.forum.id,
                        name: post.forum.name,
                        category: post.forum.category,
                    },
                    engagement: {
                        likes: post._count.likes,
                        comments: post._count.comments,
                        shares: post._count.shares,
                        views: post.viewCount,
                    },
                    personalizedReason: this.getPersonalizationReason(post, user),
                })),
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
            this.logger.error('Failed to get personalized feed', error);
            throw error;
        }
    }
    getPersonalizationReason(post, user) {
        const followingIds = user.following.map((f) => f.followingId);
        if (followingIds.includes(post.userId)) {
            return 'Following author';
        }
        if (post.author.profile?.city === user.profile?.city) {
            return `Same city: ${user.profile.city}`;
        }
        if (post.forum && user.forumSubscriptions.some((fs) => fs.forumId === post.forum.id)) {
            return `Subscribed to ${post.forum.name}`;
        }
        return 'Popular in your network';
    }
    async logSearch(userId, query, type, results) {
        try {
            this.logger.debug(`Search logged: user=${userId}, query=${query}, type=${type}, results=${JSON.stringify(results.total || 0)}`);
        }
        catch (error) {
            this.logger.warn('Failed to log search', error);
        }
    }
    calculateRelevanceScore(post, query) {
        let score = 0;
        const queryLower = query.toLowerCase();
        if (post.title.toLowerCase().includes(queryLower)) {
            score += 10;
        }
        if (post.content.toLowerCase().includes(queryLower)) {
            score += 5;
        }
        if (post.tags.some((tag) => tag.toLowerCase().includes(queryLower))) {
            score += 7;
        }
        const daysSincePost = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePost < 7) {
            score += 2;
        }
        score += Math.min(post.viewCount * 0.01, 5);
        return score;
    }
    getTimeRange(timeframe) {
        if (timeframe === 'all')
            return null;
        const now = new Date();
        switch (timeframe) {
            case 'day':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case 'week':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case 'month':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case 'year':
                return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            default:
                return null;
        }
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SearchService);
//# sourceMappingURL=search.service.js.map