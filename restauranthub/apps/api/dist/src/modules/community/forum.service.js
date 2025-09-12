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
var ForumService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForumService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const client_1 = require("@prisma/client");
let ForumService = ForumService_1 = class ForumService {
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.logger = new common_1.Logger(ForumService_1.name);
    }
    async createForum(userId, forumData) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (!user || user.role !== client_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('Only admins can create forums');
            }
            let slug = forumData.slug || forumData.name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            let counter = 1;
            const baseSlug = slug;
            while (await this.databaseService.forum.findUnique({ where: { slug } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
            const forum = await this.databaseService.forum.create({
                data: {
                    name: forumData.name,
                    slug,
                    description: forumData.description,
                    category: forumData.category,
                    icon: forumData.icon,
                    color: forumData.color,
                    displayOrder: forumData.displayOrder || 0,
                },
            });
            return forum;
        }
        catch (error) {
            this.logger.error('Failed to create forum', error);
            throw error;
        }
    }
    async getForums() {
        try {
            const forums = await this.databaseService.forum.findMany({
                where: { isActive: true },
                orderBy: [{ displayOrder: 'asc' }, { postCount: 'desc' }],
                include: {
                    _count: {
                        select: {
                            posts: true,
                            subscriptions: true,
                        },
                    },
                },
            });
            return forums.map(forum => ({
                ...forum,
                stats: {
                    postCount: forum._count.posts,
                    memberCount: forum._count.subscriptions,
                },
            }));
        }
        catch (error) {
            this.logger.error('Failed to get forums', error);
            throw error;
        }
    }
    async getForum(forumId) {
        try {
            const forum = await this.databaseService.forum.findUnique({
                where: { id: forumId },
                include: {
                    _count: {
                        select: {
                            posts: true,
                            subscriptions: true,
                        },
                    },
                },
            });
            if (!forum) {
                throw new common_1.NotFoundException('Forum not found');
            }
            return {
                ...forum,
                stats: {
                    postCount: forum._count.posts,
                    memberCount: forum._count.subscriptions,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get forum', error);
            throw error;
        }
    }
    async subscribeForum(userId, forumId) {
        try {
            const forum = await this.databaseService.forum.findUnique({
                where: { id: forumId, isActive: true },
            });
            if (!forum) {
                throw new common_1.NotFoundException('Forum not found or inactive');
            }
            const existingSubscription = await this.databaseService.forumSubscription.findUnique({
                where: { userId_forumId: { userId, forumId } },
            });
            if (existingSubscription) {
                throw new common_1.BadRequestException('Already subscribed to this forum');
            }
            const subscription = await this.databaseService.forumSubscription.create({
                data: { userId, forumId },
            });
            await this.databaseService.forum.update({
                where: { id: forumId },
                data: {
                    memberCount: {
                        increment: 1,
                    },
                },
            });
            return subscription;
        }
        catch (error) {
            this.logger.error('Failed to subscribe to forum', error);
            throw error;
        }
    }
    async updateForum(userId, forumId, updateData) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (!user || user.role !== client_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('Only admins can update forums');
            }
            const forum = await this.databaseService.forum.findUnique({
                where: { id: forumId },
            });
            if (!forum) {
                throw new common_1.NotFoundException('Forum not found');
            }
            const updatedForum = await this.databaseService.forum.update({
                where: { id: forumId },
                data: updateData,
            });
            return updatedForum;
        }
        catch (error) {
            this.logger.error('Failed to update forum', error);
            throw error;
        }
    }
    async deleteForum(userId, forumId) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (!user || user.role !== client_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('Only admins can delete forums');
            }
            const forum = await this.databaseService.forum.findUnique({
                where: { id: forumId },
            });
            if (!forum) {
                throw new common_1.NotFoundException('Forum not found');
            }
            await this.databaseService.forum.update({
                where: { id: forumId },
                data: { isActive: false },
            });
            return { message: 'Forum deleted successfully' };
        }
        catch (error) {
            this.logger.error('Failed to delete forum', error);
            throw error;
        }
    }
    async joinForum(userId, forumId) {
        try {
            return await this.subscribeForum(userId, forumId);
        }
        catch (error) {
            this.logger.error('Failed to join forum', error);
            throw error;
        }
    }
    async leaveForum(userId, forumId) {
        try {
            const subscription = await this.databaseService.forumSubscription.findUnique({
                where: { userId_forumId: { userId, forumId } },
            });
            if (!subscription) {
                throw new common_1.NotFoundException('Not subscribed to this forum');
            }
            await this.databaseService.forumSubscription.delete({
                where: { userId_forumId: { userId, forumId } },
            });
            await this.databaseService.forum.update({
                where: { id: forumId },
                data: {
                    memberCount: {
                        decrement: 1,
                    },
                },
            });
            return { message: 'Successfully left forum' };
        }
        catch (error) {
            this.logger.error('Failed to leave forum', error);
            throw error;
        }
    }
    async getForumMembers(forumId, params = {}) {
        try {
            const { page = 1, limit = 20, search } = params;
            const skip = (page - 1) * limit;
            const forum = await this.databaseService.forum.findUnique({
                where: { id: forumId },
            });
            if (!forum) {
                throw new common_1.NotFoundException('Forum not found');
            }
            const whereClause = {
                forumId,
                ...(search && {
                    user: {
                        profile: {
                            OR: [
                                { firstName: { contains: search, mode: 'insensitive' } },
                                { lastName: { contains: search, mode: 'insensitive' } },
                            ],
                        },
                    },
                }),
            };
            const [subscriptions, total] = await Promise.all([
                this.databaseService.forumSubscription.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            include: {
                                profile: true,
                                reputation: true,
                            },
                        },
                    },
                }),
                this.databaseService.forumSubscription.count({ where: whereClause }),
            ]);
            const members = subscriptions.map(sub => ({
                id: sub.user.id,
                name: `${sub.user.profile?.firstName || ''} ${sub.user.profile?.lastName || ''}`.trim() || 'Unknown User',
                avatar: sub.user.profile?.avatar,
                role: sub.user.role,
                joinedAt: sub.createdAt,
                reputation: {
                    level: sub.user.reputation?.level || 1,
                    totalPoints: sub.user.reputation?.totalPoints || 0,
                },
            }));
            return {
                members,
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
            this.logger.error('Failed to get forum members', error);
            throw error;
        }
    }
    async addModerator(userId, forumId, targetUserId) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (!user || user.role !== client_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('Only admins can add moderators');
            }
            const forum = await this.databaseService.forum.findUnique({
                where: { id: forumId },
            });
            if (!forum) {
                throw new common_1.NotFoundException('Forum not found');
            }
            const targetUser = await this.databaseService.user.findUnique({
                where: { id: targetUserId },
            });
            if (!targetUser) {
                throw new common_1.NotFoundException('Target user not found');
            }
            const existingModerator = await this.databaseService.forumModerator.findUnique({
                where: { userId_forumId: { userId: targetUserId, forumId } },
            });
            if (existingModerator) {
                throw new common_1.BadRequestException('User is already a moderator');
            }
            const moderator = await this.databaseService.forumModerator.create({
                data: {
                    userId: targetUserId,
                    forumId,
                    addedBy: userId,
                },
            });
            return moderator;
        }
        catch (error) {
            this.logger.error('Failed to add moderator', error);
            throw error;
        }
    }
    async removeModerator(userId, forumId, targetUserId) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (!user || user.role !== client_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('Only admins can remove moderators');
            }
            const moderator = await this.databaseService.forumModerator.findUnique({
                where: { userId_forumId: { userId: targetUserId, forumId } },
            });
            if (!moderator) {
                throw new common_1.NotFoundException('Moderator not found');
            }
            await this.databaseService.forumModerator.delete({
                where: { userId_forumId: { userId: targetUserId, forumId } },
            });
            return { message: 'Moderator removed successfully' };
        }
        catch (error) {
            this.logger.error('Failed to remove moderator', error);
            throw error;
        }
    }
};
exports.ForumService = ForumService;
exports.ForumService = ForumService = ForumService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ForumService);
//# sourceMappingURL=forum.service.js.map