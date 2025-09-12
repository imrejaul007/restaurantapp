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
var PostsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const client_1 = require("@prisma/client");
const reputation_service_1 = require("./reputation.service");
const notifications_service_1 = require("./notifications.service");
let PostsService = PostsService_1 = class PostsService {
    constructor(databaseService, reputationService, notificationService) {
        this.databaseService = databaseService;
        this.reputationService = reputationService;
        this.notificationService = notificationService;
        this.logger = new common_1.Logger(PostsService_1.name);
    }
    async createPost(userId, postData) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                include: {
                    profile: true,
                },
            });
            if (!user || !user.isActive) {
                throw new common_1.NotFoundException('User not found or inactive');
            }
            const forum = await this.databaseService.forum.findUnique({
                where: { id: postData.forumId },
            });
            if (!forum || !forum.isActive) {
                throw new common_1.NotFoundException('Forum not found or inactive');
            }
            const baseSlug = postData.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            let slug = baseSlug;
            let counter = 1;
            while (await this.databaseService.forumPost.findUnique({ where: { slug } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
            const post = await this.databaseService.forumPost.create({
                data: {
                    title: postData.title,
                    content: postData.content,
                    slug,
                    forumId: postData.forumId,
                    userId,
                    type: postData.type || client_1.PostType.DISCUSSION,
                    visibility: postData.visibility || client_1.PostVisibility.PUBLIC,
                    tags: postData.tags || [],
                    isPinned: postData.isPinned || false,
                    images: postData.images || [],
                    attachments: postData.attachments || [],
                },
                include: {
                    author: {
                        include: {
                            profile: true,
                        },
                    },
                    forum: true,
                },
            });
            await this.databaseService.forum.update({
                where: { id: postData.forumId },
                data: {
                    postCount: {
                        increment: 1,
                    },
                },
            });
            await this.updateUserReputation(userId, 'POST_CREATED', 5, `Created post: ${post.title}`, post.id);
            return {
                ...post,
                author: {
                    id: post.author.id,
                    name: `${post.author.profile?.firstName || ''} ${post.author.profile?.lastName || ''}`.trim() || 'Unknown User',
                    role: post.author.role,
                    avatar: post.author.profile?.avatar,
                    verified: post.author.isVerified,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to create post', error);
            throw error;
        }
    }
    async getPosts(params) {
        try {
            const { page = 1, limit = 20, sortBy = 'latest' } = params;
            const skip = (page - 1) * limit;
            const whereClause = {
                isDeleted: false,
                ...(params.forumId && { forumId: params.forumId }),
                ...(params.userId && { userId: params.userId }),
                ...(params.type && { type: params.type }),
                ...(params.visibility && { visibility: params.visibility }),
                ...(params.search && {
                    OR: [
                        { title: { contains: params.search, mode: 'insensitive' } },
                        { content: { contains: params.search, mode: 'insensitive' } },
                        { tags: { hasSome: [params.search] } },
                    ],
                }),
                ...(params.tags && params.tags.length > 0 && {
                    tags: { hasSome: params.tags },
                }),
            };
            let orderBy = [];
            switch (sortBy) {
                case 'popular':
                    orderBy = [{ likeCount: 'desc' }, { createdAt: 'desc' }];
                    break;
                case 'mostReplies':
                    orderBy = [{ commentCount: 'desc' }, { createdAt: 'desc' }];
                    break;
                case 'trending':
                    orderBy = [
                        { isPinned: 'desc' },
                        { isFeatured: 'desc' },
                        { likeCount: 'desc' },
                        { commentCount: 'desc' },
                        { createdAt: 'desc' }
                    ];
                    break;
                case 'latest':
                default:
                    orderBy = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
                    break;
            }
            const [posts, total] = await Promise.all([
                this.databaseService.forumPost.findMany({
                    where: whereClause,
                    orderBy,
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
            const totalPages = Math.ceil(total / limit);
            return {
                posts: posts.map(post => ({
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
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get posts', error);
            throw error;
        }
    }
    async getPost(postId, userId) {
        try {
            const post = await this.databaseService.forumPost.findUnique({
                where: {
                    id: postId,
                    isDeleted: false,
                },
                include: {
                    author: {
                        include: {
                            profile: true,
                        },
                    },
                    forum: true,
                    comments: {
                        where: { isDeleted: false },
                        include: {
                            author: {
                                include: {
                                    profile: true,
                                },
                            },
                            likes: userId ? {
                                where: { userId },
                            } : false,
                            _count: {
                                select: {
                                    likes: true,
                                    replies: true,
                                },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    },
                    likes: userId ? {
                        where: { userId },
                    } : false,
                    bookmarks: userId ? {
                        where: { userId },
                    } : false,
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                            shares: true,
                            bookmarks: true,
                        },
                    },
                },
            });
            if (!post) {
                throw new common_1.NotFoundException('Post not found');
            }
            if (userId && userId !== post.userId) {
                await this.databaseService.forumPost.update({
                    where: { id: postId },
                    data: {
                        viewCount: {
                            increment: 1,
                        },
                    },
                });
            }
            return {
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
                    bookmarks: post._count.bookmarks,
                    views: post.viewCount,
                    isLiked: post.likes?.length > 0,
                    isBookmarked: post.bookmarks?.length > 0,
                },
                comments: post.comments.map(comment => ({
                    ...comment,
                    author: {
                        id: comment.author.id,
                        name: `${comment.author.profile?.firstName || ''} ${comment.author.profile?.lastName || ''}`.trim() || 'Unknown User',
                        role: comment.author.role,
                        avatar: comment.author.profile?.avatar,
                        verified: comment.author.isVerified,
                    },
                    isLiked: comment.likes?.length > 0,
                    totalLikes: comment._count.likes,
                    totalReplies: comment._count.replies,
                })),
            };
        }
        catch (error) {
            this.logger.error('Failed to get post', error);
            throw error;
        }
    }
    async updatePost(userId, postId, updateData) {
        try {
            const post = await this.databaseService.forumPost.findUnique({
                where: { id: postId, isDeleted: false },
                include: { author: true },
            });
            if (!post) {
                throw new common_1.NotFoundException('Post not found');
            }
            if (post.userId !== userId) {
                throw new common_1.ForbiddenException('You can only update your own posts');
            }
            let slug = post.slug;
            if (updateData.title && updateData.title !== post.title) {
                const baseSlug = updateData.title
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim();
                slug = baseSlug;
                let counter = 1;
                while (await this.databaseService.forumPost.findFirst({
                    where: { slug, id: { not: postId } }
                })) {
                    slug = `${baseSlug}-${counter}`;
                    counter++;
                }
            }
            const updatedPost = await this.databaseService.forumPost.update({
                where: { id: postId },
                data: {
                    ...(updateData.title && { title: updateData.title, slug }),
                    ...(updateData.content && { content: updateData.content }),
                    ...(updateData.tags && { tags: updateData.tags }),
                    ...(updateData.attachments && { attachments: updateData.attachments }),
                    ...(updateData.images && { images: updateData.images }),
                },
                include: {
                    author: {
                        include: {
                            profile: true,
                        },
                    },
                    forum: true,
                },
            });
            return {
                ...updatedPost,
                author: {
                    id: updatedPost.author.id,
                    name: `${updatedPost.author.profile?.firstName || ''} ${updatedPost.author.profile?.lastName || ''}`.trim() || 'Unknown User',
                    role: updatedPost.author.role,
                    avatar: updatedPost.author.profile?.avatar,
                    verified: updatedPost.author.isVerified,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to update post', error);
            throw error;
        }
    }
    async deletePost(userId, postId) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const post = await this.databaseService.forumPost.findUnique({
                where: { id: postId, isDeleted: false },
            });
            if (!post) {
                throw new common_1.NotFoundException('Post not found');
            }
            if (post.userId !== userId && user.role !== client_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('You can only delete your own posts');
            }
            await this.databaseService.forumPost.update({
                where: { id: postId },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                },
            });
            await this.databaseService.forum.update({
                where: { id: post.forumId },
                data: {
                    postCount: {
                        decrement: 1,
                    },
                },
            });
            return { message: 'Post deleted successfully' };
        }
        catch (error) {
            this.logger.error('Failed to delete post', error);
            throw error;
        }
    }
    async likePost(userId, postId) {
        try {
            const post = await this.databaseService.forumPost.findUnique({
                where: { id: postId, isDeleted: false },
            });
            if (!post) {
                throw new common_1.NotFoundException('Post not found');
            }
            const existingLike = await this.databaseService.postLike.findUnique({
                where: { postId_userId: { postId, userId } },
            });
            if (existingLike) {
                throw new common_1.BadRequestException('Post already liked');
            }
            const like = await this.databaseService.postLike.create({
                data: { postId, userId },
            });
            await this.databaseService.forumPost.update({
                where: { id: postId },
                data: {
                    likeCount: {
                        increment: 1,
                    },
                },
            });
            if (post.userId !== userId) {
                await this.updateUserReputation(post.userId, 'LIKE_RECEIVED', 2, `Received like on post: ${post.title}`, postId);
                await this.notificationService.notifyPostEngagement(postId, 'like', userId);
            }
            return like;
        }
        catch (error) {
            this.logger.error('Failed to like post', error);
            throw error;
        }
    }
    async unlikePost(userId, postId) {
        try {
            const like = await this.databaseService.postLike.findUnique({
                where: { postId_userId: { postId, userId } },
            });
            if (!like) {
                return { message: 'Post was not liked' };
            }
            await this.databaseService.postLike.delete({
                where: { postId_userId: { postId, userId } },
            });
            await this.databaseService.forumPost.update({
                where: { id: postId },
                data: {
                    likeCount: {
                        decrement: 1,
                    },
                },
            });
            return { message: 'Post unliked successfully' };
        }
        catch (error) {
            this.logger.error('Failed to unlike post', error);
            throw error;
        }
    }
    async bookmarkPost(userId, postId) {
        try {
            const post = await this.databaseService.forumPost.findUnique({
                where: { id: postId, isDeleted: false },
            });
            if (!post) {
                throw new common_1.NotFoundException('Post not found');
            }
            const existingBookmark = await this.databaseService.postBookmark.findUnique({
                where: { postId_userId: { postId, userId } },
            });
            if (existingBookmark) {
                throw new common_1.BadRequestException('Post already bookmarked');
            }
            const bookmark = await this.databaseService.postBookmark.create({
                data: { postId, userId },
            });
            return bookmark;
        }
        catch (error) {
            this.logger.error('Failed to bookmark post', error);
            throw error;
        }
    }
    async unbookmarkPost(userId, postId) {
        try {
            const bookmark = await this.databaseService.postBookmark.findUnique({
                where: { postId_userId: { postId, userId } },
            });
            if (!bookmark) {
                return { message: 'Post was not bookmarked' };
            }
            await this.databaseService.postBookmark.delete({
                where: { postId_userId: { postId, userId } },
            });
            return { message: 'Post unbookmarked successfully' };
        }
        catch (error) {
            this.logger.error('Failed to unbookmark post', error);
            throw error;
        }
    }
    async sharePost(userId, postId, platform) {
        try {
            const post = await this.databaseService.forumPost.findUnique({
                where: { id: postId, isDeleted: false },
            });
            if (!post) {
                throw new common_1.NotFoundException('Post not found');
            }
            const share = await this.databaseService.postShare.create({
                data: {
                    postId,
                    userId,
                    platform: platform || null,
                },
            });
            await this.databaseService.forumPost.update({
                where: { id: postId },
                data: {
                    shareCount: {
                        increment: 1,
                    },
                },
            });
            if (post.userId !== userId) {
                await this.updateUserReputation(post.userId, 'POST_SHARED', 3, `Post shared: ${post.title}`, postId);
            }
            return share;
        }
        catch (error) {
            this.logger.error('Failed to share post', error);
            throw error;
        }
    }
    async createReply(userId, postId, replyData) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                include: { profile: true },
            });
            if (!user || !user.isActive) {
                throw new common_1.NotFoundException('User not found or inactive');
            }
            const post = await this.databaseService.forumPost.findUnique({
                where: { id: postId, isDeleted: false },
            });
            if (!post) {
                throw new common_1.NotFoundException('Post not found');
            }
            if (replyData.parentId) {
                const parentComment = await this.databaseService.postComment.findUnique({
                    where: { id: replyData.parentId, isDeleted: false },
                });
                if (!parentComment) {
                    throw new common_1.NotFoundException('Parent comment not found');
                }
            }
            const comment = await this.databaseService.postComment.create({
                data: {
                    content: replyData.content,
                    postId,
                    userId,
                    parentId: replyData.parentId,
                },
                include: {
                    author: {
                        include: {
                            profile: true,
                        },
                    },
                },
            });
            await this.databaseService.forumPost.update({
                where: { id: postId },
                data: {
                    commentCount: {
                        increment: 1,
                    },
                },
            });
            await this.updateUserReputation(userId, 'COMMENT_CREATED', 3, `Commented on post: ${post.title}`, comment.id);
            if (post.userId !== userId) {
                await this.notificationService.notifyPostEngagement(postId, 'comment', userId);
            }
            return {
                ...comment,
                author: {
                    id: comment.author.id,
                    name: `${comment.author.profile?.firstName || ''} ${comment.author.profile?.lastName || ''}`.trim() || 'Unknown User',
                    role: comment.author.role,
                    avatar: comment.author.profile?.avatar,
                    verified: comment.author.isVerified,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to create reply', error);
            throw error;
        }
    }
    async getReplies(postId, params) {
        try {
            const { page = 1, limit = 20, parentId } = params;
            const skip = (page - 1) * limit;
            const whereClause = {
                postId,
                isDeleted: false,
                parentId: parentId || null,
            };
            const [comments, total] = await Promise.all([
                this.databaseService.postComment.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'asc' },
                    skip,
                    take: limit,
                    include: {
                        author: {
                            include: {
                                profile: true,
                            },
                        },
                        _count: {
                            select: {
                                likes: true,
                                replies: true,
                            },
                        },
                    },
                }),
                this.databaseService.postComment.count({ where: whereClause }),
            ]);
            const totalPages = Math.ceil(total / limit);
            return {
                replies: comments.map(comment => ({
                    ...comment,
                    author: {
                        id: comment.author.id,
                        name: `${comment.author.profile?.firstName || ''} ${comment.author.profile?.lastName || ''}`.trim() || 'Unknown User',
                        role: comment.author.role,
                        avatar: comment.author.profile?.avatar,
                        verified: comment.author.isVerified,
                    },
                    totalLikes: comment._count.likes,
                    totalReplies: comment._count.replies,
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get replies', error);
            throw error;
        }
    }
    async reportPost(userId, postId, reason, description) {
        try {
            const post = await this.databaseService.forumPost.findUnique({
                where: { id: postId, isDeleted: false },
            });
            if (!post) {
                throw new common_1.NotFoundException('Post not found');
            }
            const existingReport = await this.databaseService.postReport.findFirst({
                where: { postId, reporterId: userId },
            });
            if (existingReport) {
                throw new common_1.BadRequestException('Post already reported');
            }
            const report = await this.databaseService.postReport.create({
                data: {
                    postId,
                    reporterId: userId,
                    reason,
                    description,
                },
            });
            return report;
        }
        catch (error) {
            this.logger.error('Failed to report post', error);
            throw error;
        }
    }
    async updateUserReputation(userId, action, points, description, relatedId) {
        try {
            await this.reputationService.addReputationPoints(userId, action, points, description, relatedId);
            await this.reputationService.checkActivityBadges(userId);
        }
        catch (error) {
            this.logger.error('Failed to update user reputation', error);
        }
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = PostsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => reputation_service_1.ReputationService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.CommunityNotificationService))),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        reputation_service_1.ReputationService,
        notifications_service_1.CommunityNotificationService])
], PostsService);
//# sourceMappingURL=posts.service.js.map