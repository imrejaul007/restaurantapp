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
var MarketplaceIntegrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceIntegrationService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const reputation_service_1 = require("./reputation.service");
const client_1 = require("@prisma/client");
let MarketplaceIntegrationService = MarketplaceIntegrationService_1 = class MarketplaceIntegrationService {
    constructor(databaseService, reputationService) {
        this.databaseService = databaseService;
        this.reputationService = reputationService;
        this.logger = new common_1.Logger(MarketplaceIntegrationService_1.name);
    }
    async createProductDiscussion(userId, productId, discussionData) {
        try {
            const product = await this.databaseService.product.findUnique({
                where: { id: productId },
                include: { vendor: true },
            });
            if (!product) {
                throw new common_1.NotFoundException('Product not found');
            }
            let forum = await this.databaseService.forum.findFirst({
                where: { category: 'Marketplace' },
            });
            if (!forum) {
                forum = await this.databaseService.forum.create({
                    data: {
                        name: 'Marketplace Discussions',
                        slug: 'marketplace-discussions',
                        description: 'Discuss products, vendors, and marketplace topics',
                        category: 'Marketplace',
                        icon: '🛍️',
                        color: '#10B981',
                        displayOrder: 5,
                    },
                });
            }
            const slug = discussionData.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            const post = await this.databaseService.forumPost.create({
                data: {
                    title: discussionData.title,
                    content: discussionData.content,
                    userId,
                    forumId: discussionData.forumId || forum.id,
                    type: client_1.PostType.DISCUSSION,
                    slug: `${slug}-${Date.now()}`,
                    tags: [...(discussionData.tags || []), 'product', product.name.toLowerCase()],
                },
                include: {
                    author: { include: { profile: true } },
                    forum: true,
                },
            });
            await this.reputationService.addReputationPoints(userId, client_1.ReputationAction.POST_CREATED, 8, `Started product discussion: ${product.name}`, post.id);
            if (product.vendor?.userId) {
                await this.createMarketplaceNotification(product.vendor.userId, 'PRODUCT_DISCUSSED', `New discussion about your product: ${product.name}`, { postId: post.id, productId });
            }
            return post;
        }
        catch (error) {
            this.logger.error('Failed to create product discussion', error);
            throw error;
        }
    }
    async createJobPosting(userId, postingData) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                include: { reputation: true },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const canPostJobs = user.isVerified ||
                user.role === client_1.UserRole.RESTAURANT ||
                user.role === client_1.UserRole.VENDOR ||
                user.role === client_1.UserRole.ADMIN ||
                (user.reputation?.level || 0) >= 5;
            if (!canPostJobs) {
                throw new Error('Insufficient permissions to post jobs. Must be verified or level 5+');
            }
            let forum = await this.databaseService.forum.findFirst({
                where: { category: 'Jobs' },
            });
            if (!forum) {
                forum = await this.databaseService.forum.create({
                    data: {
                        name: 'Job Opportunities',
                        slug: 'job-opportunities',
                        description: 'Restaurant industry job postings and career discussions',
                        category: 'Jobs',
                        icon: '💼',
                        color: '#3B82F6',
                        displayOrder: 3,
                    },
                });
            }
            const slug = postingData.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            const post = await this.databaseService.forumPost.create({
                data: {
                    title: postingData.title,
                    content: this.formatJobDescription(postingData),
                    userId,
                    forumId: forum.id,
                    type: client_1.PostType.JOB_REQUEST,
                    slug: `${slug}-${Date.now()}`,
                    tags: ['job', 'hiring', postingData.jobType.toLowerCase(), postingData.location.toLowerCase()],
                    isPinned: user.role === client_1.UserRole.ADMIN,
                },
                include: {
                    author: { include: { profile: true } },
                    forum: true,
                },
            });
            const job = await this.databaseService.job.create({
                data: {
                    restaurantId: postingData.restaurantId,
                    title: postingData.title,
                    description: postingData.description,
                    location: postingData.location,
                    jobType: postingData.jobType,
                    requirements: postingData.requirements || [],
                    skills: postingData.skills || [],
                    salaryMin: postingData.salaryMin,
                    salaryMax: postingData.salaryMax,
                    validTill: postingData.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });
            await this.reputationService.addReputationPoints(userId, client_1.ReputationAction.POST_CREATED, 15, `Posted job: ${postingData.title}`, post.id);
            return { post, job };
        }
        catch (error) {
            this.logger.error('Failed to create job posting', error);
            throw error;
        }
    }
    async getMarketplaceInsights(params) {
        try {
            const { type, id, timeframe = 'month' } = params;
            const timeRange = this.getTimeRange(timeframe);
            let insights = {};
            switch (type) {
                case 'product':
                    if (!id)
                        throw new Error('Product ID required');
                    insights = await this.getProductInsights(id, timeRange);
                    break;
                case 'vendor':
                    if (!id)
                        throw new Error('Vendor ID required');
                    insights = await this.getVendorInsights(id, timeRange);
                    break;
                case 'category':
                    insights = await this.getCategoryInsights(id, timeRange);
                    break;
            }
            return {
                type,
                id,
                timeframe,
                insights,
            };
        }
        catch (error) {
            this.logger.error('Failed to get marketplace insights', error);
            throw error;
        }
    }
    async getJobMarketAnalytics(params) {
        try {
            const { location, jobType, timeframe = 'month' } = params;
            const timeRange = this.getTimeRange(timeframe);
            const whereClause = {
                createdAt: { gte: timeRange },
                ...(location && { location: { contains: location, mode: 'insensitive' } }),
                ...(jobType && { jobType }),
            };
            const [totalJobs, jobsByType, jobsByLocation, averageSalary] = await Promise.all([
                this.databaseService.job.count({ where: whereClause }),
                this.databaseService.job.groupBy({
                    by: ['jobType'],
                    where: whereClause,
                    _count: { id: true },
                }),
                this.databaseService.job.groupBy({
                    by: ['location'],
                    where: whereClause,
                    _count: { id: true },
                    take: 10,
                    orderBy: { _count: { id: 'desc' } },
                }),
                this.databaseService.job.count({
                    where: { ...whereClause, salaryMin: { not: null } },
                }),
            ]);
            const jobs = await this.databaseService.job.findMany({
                where: whereClause,
                select: { requirements: true },
            });
            const skillCounts = {};
            jobs.forEach((job) => {
                job.requirements.forEach((req) => {
                    const skill = req.toLowerCase().trim();
                    skillCounts[skill] = (skillCounts[skill] || 0) + 1;
                });
            });
            const trendingSkills = Object.entries(skillCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([skill, count]) => ({ skill, demand: count }));
            return {
                timeframe,
                summary: {
                    totalJobs,
                    jobsWithSalary: averageSalary,
                },
                distribution: {
                    byType: jobsByType,
                    byLocation: jobsByLocation,
                },
                trends: {
                    skills: trendingSkills,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get job market analytics', error);
            throw error;
        }
    }
    async getRecommendedProducts(userId, limit = 10) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                include: {
                    profile: true,
                    forumPosts: {
                        where: { isDeleted: false },
                        select: { tags: true },
                        take: 50,
                    },
                    postComments: {
                        where: { isDeleted: false },
                        include: { post: { select: { tags: true } } },
                        take: 50,
                    },
                },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const interestTags = new Set();
            user.forumPosts.forEach((post) => {
                post.tags.forEach((tag) => interestTags.add(tag.toLowerCase()));
            });
            user.postComments.forEach((comment) => {
                comment.post.tags.forEach((tag) => interestTags.add(tag.toLowerCase()));
            });
            const products = await this.databaseService.product.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { tags: { hasSome: Array.from(interestTags) } },
                    ],
                },
                take: limit * 2,
                include: {
                    vendor: {
                        include: {
                            user: {
                                include: { profile: true }
                            }
                        },
                    },
                    _count: {
                        select: { reviews: true },
                    },
                },
                orderBy: [
                    { rating: 'desc' },
                    { totalReviews: 'desc' },
                ],
            });
            const scoredProducts = products.map((product) => {
                let relevanceScore = 0;
                const matchingTags = product.tags.filter((tag) => interestTags.has(tag.toLowerCase())).length;
                relevanceScore += matchingTags * 3;
                if (user.profile?.city &&
                    product.vendor?.address?.toLowerCase().includes(user.profile.city.toLowerCase())) {
                    relevanceScore += 2;
                }
                relevanceScore += (product.rating || 0) * 0.5;
                relevanceScore += Math.min(product._count.reviews * 0.1, 2);
                return { ...product, relevanceScore };
            });
            const recommendations = scoredProducts
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, limit)
                .map((product) => ({
                id: product.id,
                name: product.name,
                description: product.description?.substring(0, 150),
                price: product.price,
                rating: product.rating,
                reviewCount: product._count.reviews,
                vendor: {
                    id: product.vendor.id,
                    name: product.vendor.businessName,
                    avatar: product.vendor.profile?.avatar,
                },
                relevanceScore: product.relevanceScore,
                matchingInterests: product.tags.filter((tag) => interestTags.has(tag.toLowerCase())),
            }));
            return {
                recommendations,
                userInterests: Array.from(interestTags).slice(0, 10),
            };
        }
        catch (error) {
            this.logger.error('Failed to get recommended products', error);
            throw error;
        }
    }
    async getRecommendedJobs(userId, limit = 10) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                include: {
                    profile: true,
                    forumPosts: {
                        where: { type: client_1.PostType.JOB_SEEKING },
                        select: { content: true, tags: true },
                        take: 10,
                    },
                },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const skills = new Set();
            const preferences = new Set();
            user.forumPosts.forEach((post) => {
                post.tags.forEach((tag) => {
                    if (tag.includes('skill') || tag.includes('experience')) {
                        skills.add(tag);
                    }
                    else {
                        preferences.add(tag);
                    }
                });
            });
            const jobs = await this.databaseService.job.findMany({
                where: {
                    status: 'OPEN',
                    validTill: { gt: new Date() },
                    OR: [
                        { requirements: { hasSome: Array.from(skills) } },
                    ],
                },
                take: limit * 2,
                include: {
                    restaurant: {
                        include: {
                            user: {
                                include: { profile: true }
                            }
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            const scoredJobs = jobs.map((job) => {
                let relevanceScore = 0;
                const matchingSkills = job.requirements.filter((req) => Array.from(skills).some(skill => req.toLowerCase().includes(skill.toLowerCase()))).length;
                relevanceScore += matchingSkills * 5;
                if (user.profile?.city &&
                    job.location.toLowerCase().includes(user.profile.city.toLowerCase())) {
                    relevanceScore += 3;
                }
                const daysSincePosted = Math.floor((Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24));
                relevanceScore += Math.max(0, 7 - daysSincePosted);
                return { ...job, relevanceScore };
            });
            const recommendations = scoredJobs
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, limit)
                .map((job) => ({
                id: job.id,
                title: job.title,
                description: job.description.substring(0, 200),
                location: job.location,
                jobType: job.jobType,
                salaryMin: job.salaryMin,
                salaryMax: job.salaryMax,
                postedAt: job.createdAt,
                expiresAt: job.validTill,
                relevanceScore: job.relevanceScore,
                restaurant: {
                    id: job.restaurant.id,
                    name: job.restaurant.name || job.restaurant.businessName,
                    avatar: job.restaurant.user?.profile?.avatar,
                },
            }));
            return {
                recommendations,
                userSkills: Array.from(skills).slice(0, 10),
            };
        }
        catch (error) {
            this.logger.error('Failed to get recommended jobs', error);
            throw error;
        }
    }
    formatJobDescription(postingData) {
        let description = `Hiring for **${postingData.title}**\n\n`;
        description += `📍 **Location:** ${postingData.location}\n`;
        description += `💼 **Type:** ${postingData.jobType.replace('_', ' ')}\n`;
        if (postingData.salaryMin || postingData.salaryMax) {
            const salaryRange = [postingData.salaryMin, postingData.salaryMax].filter(Boolean).join(' - ');
            description += `💰 **Salary:** ${salaryRange}\n`;
        }
        description += `\n**Description:**\n${postingData.description}\n\n`;
        if (postingData.requirements.length > 0) {
            description += `**Requirements:**\n${postingData.requirements.map((req) => `• ${req}`).join('\n')}\n\n`;
        }
        if (postingData.benefits && postingData.benefits.length > 0) {
            description += `**Benefits:**\n${postingData.benefits.map((benefit) => `• ${benefit}`).join('\n')}\n\n`;
        }
        if (postingData.applicationUrl) {
            description += `**Apply:** ${postingData.applicationUrl}`;
        }
        return description;
    }
    async getProductInsights(productId, timeRange) {
        const product = await this.databaseService.product.findUnique({
            where: { id: productId },
            select: { name: true },
        });
        const [discussions, suggestions, mentions] = await Promise.all([
            this.databaseService.forumPost.count({
                where: {
                    type: client_1.PostType.DISCUSSION,
                    tags: { has: product?.name.toLowerCase() },
                    createdAt: { gte: timeRange },
                },
            }),
            this.databaseService.productSuggestion.count({
                where: {
                    productId,
                    createdAt: { gte: timeRange },
                },
            }),
            this.databaseService.forumPost.count({
                where: {
                    content: { contains: productId, mode: 'insensitive' },
                    createdAt: { gte: timeRange },
                },
            }),
        ]);
        return { discussions, suggestions, mentions };
    }
    async getVendorInsights(vendorId, timeRange) {
        return { discussions: 0, reviews: 0, recommendations: 0 };
    }
    async getCategoryInsights(category, timeRange) {
        return { totalDiscussions: 0, topProducts: [], activeVendors: 0 };
    }
    async createMarketplaceNotification(userId, type, message, metadata) {
        this.logger.log(`Notification: ${userId} - ${type}: ${message}`);
    }
    getTimeRange(timeframe) {
        const now = new Date();
        switch (timeframe) {
            case 'week':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case 'month':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case 'quarter':
                return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
    }
};
exports.MarketplaceIntegrationService = MarketplaceIntegrationService;
exports.MarketplaceIntegrationService = MarketplaceIntegrationService = MarketplaceIntegrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => reputation_service_1.ReputationService))),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        reputation_service_1.ReputationService])
], MarketplaceIntegrationService);
//# sourceMappingURL=marketplace-integration.service.js.map