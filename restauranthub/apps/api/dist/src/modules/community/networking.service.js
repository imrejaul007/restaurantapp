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
var NetworkingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkingService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const reputation_service_1 = require("./reputation.service");
const notifications_service_1 = require("./notifications.service");
const client_1 = require("@prisma/client");
let NetworkingService = NetworkingService_1 = class NetworkingService {
    constructor(databaseService, reputationService, notificationService) {
        this.databaseService = databaseService;
        this.reputationService = reputationService;
        this.notificationService = notificationService;
        this.logger = new common_1.Logger(NetworkingService_1.name);
    }
    async followUser(followerId, followingId) {
        try {
            if (followerId === followingId) {
                throw new common_1.BadRequestException('Cannot follow yourself');
            }
            const [follower, following] = await Promise.all([
                this.databaseService.user.findUnique({ where: { id: followerId } }),
                this.databaseService.user.findUnique({ where: { id: followingId } }),
            ]);
            if (!follower || !following) {
                throw new common_1.NotFoundException('User not found');
            }
            const existingFollow = await this.databaseService.userFollow.findUnique({
                where: { followerId_followingId: { followerId, followingId } },
            });
            if (existingFollow) {
                throw new common_1.BadRequestException('Already following this user');
            }
            const follow = await this.databaseService.userFollow.create({
                data: { followerId, followingId },
            });
            await this.reputationService.addReputationPoints(followingId, client_1.ReputationAction.FOLLOWED_BY_USER, 2, 'Gained a new follower', followerId);
            await this.notificationService.notifyUserFollowed(followerId, followingId);
            return follow;
        }
        catch (error) {
            this.logger.error('Failed to follow user', error);
            throw error;
        }
    }
    async unfollowUser(followerId, followingId) {
        try {
            const follow = await this.databaseService.userFollow.findUnique({
                where: { followerId_followingId: { followerId, followingId } },
            });
            if (!follow) {
                throw new common_1.NotFoundException('Follow relationship not found');
            }
            await this.databaseService.userFollow.delete({
                where: { followerId_followingId: { followerId, followingId } },
            });
            await Promise.all([
                Promise.resolve(),
                Promise.resolve(),
            ]);
            return { message: 'Unfollowed successfully' };
        }
        catch (error) {
            this.logger.error('Failed to unfollow user', error);
            throw error;
        }
    }
    async getUserFollowers(userId, params) {
        try {
            const { page = 1, limit = 20 } = params;
            const skip = (page - 1) * limit;
            const [followers, total] = await Promise.all([
                this.databaseService.userFollow.findMany({
                    where: { followingId: userId },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        follower: {
                            include: {
                                profile: true,
                                reputation: true,
                            },
                        },
                    },
                }),
                this.databaseService.userFollow.count({
                    where: { followingId: userId },
                }),
            ]);
            return {
                followers: followers.map(follow => ({
                    id: follow.follower.id,
                    name: `${follow.follower.profile?.firstName || ''} ${follow.follower.profile?.lastName || ''}`.trim() || 'Unknown User',
                    role: follow.follower.role,
                    avatar: follow.follower.profile?.avatar,
                    verified: follow.follower.isVerified,
                    city: follow.follower.profile?.city,
                    reputation: {
                        level: follow.follower.reputation?.level || 1,
                        totalPoints: follow.follower.reputation?.totalPoints || 0,
                    },
                    followedAt: follow.createdAt,
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
            this.logger.error('Failed to get user followers', error);
            throw error;
        }
    }
    async getUserFollowing(userId, params) {
        try {
            const { page = 1, limit = 20 } = params;
            const skip = (page - 1) * limit;
            const [following, total] = await Promise.all([
                this.databaseService.userFollow.findMany({
                    where: { followerId: userId },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        following: {
                            include: {
                                profile: true,
                                reputation: true,
                            },
                        },
                    },
                }),
                this.databaseService.userFollow.count({
                    where: { followerId: userId },
                }),
            ]);
            return {
                following: following.map(follow => ({
                    id: follow.following.id,
                    name: `${follow.following.profile?.firstName || ''} ${follow.following.profile?.lastName || ''}`.trim() || 'Unknown User',
                    role: follow.following.role,
                    avatar: follow.following.profile?.avatar,
                    verified: follow.following.isVerified,
                    city: follow.following.profile?.city,
                    reputation: {
                        level: follow.following.reputation?.level || 1,
                        totalPoints: follow.following.reputation?.totalPoints || 0,
                    },
                    followedAt: follow.createdAt,
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
            this.logger.error('Failed to get user following', error);
            throw error;
        }
    }
    async createGroup(userId, groupData) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                include: { reputation: true },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            if (!user.isVerified && user.role !== client_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('Only verified users can create groups');
            }
            const userLevel = user.reputation?.level || 1;
            if (userLevel < 3 && user.role !== client_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('Must be at least level 3 to create groups');
            }
            const baseSlug = groupData.name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            let slug = baseSlug;
            let counter = 1;
            while (await this.databaseService.communityGroup.findUnique({ where: { slug } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
            const group = await this.databaseService.communityGroup.create({
                data: {
                    name: groupData.name,
                    slug,
                    description: groupData.description,
                    image: groupData.icon || groupData.banner,
                    isPrivate: groupData.isPrivate || false,
                    createdBy: userId,
                },
            });
            await this.databaseService.groupMember.create({
                data: {
                    userId,
                    groupId: group.id,
                    role: 'ADMIN',
                    joinedAt: new Date(),
                },
            });
            await this.databaseService.communityGroup.update({
                where: { id: group.id },
                data: { memberCount: 1 },
            });
            await this.reputationService.addReputationPoints(userId, client_1.ReputationAction.GROUP_CREATED, 25, `Created group: ${group.name}`, group.id);
            return group;
        }
        catch (error) {
            this.logger.error('Failed to create group', error);
            throw error;
        }
    }
    async joinGroup(userId, groupId) {
        try {
            const group = await this.databaseService.communityGroup.findUnique({
                where: { id: groupId },
                include: {
                    _count: { select: { members: true } },
                },
            });
            if (!group) {
                throw new common_1.NotFoundException('Group not found');
            }
            const existingMember = await this.databaseService.groupMember.findUnique({
                where: { groupId_userId: { groupId, userId } },
            });
            if (existingMember) {
                throw new common_1.BadRequestException('Already a member of this group');
            }
            if (group.isPrivate) {
                throw new common_1.ForbiddenException('This is a private group. An invitation is required to join.');
            }
            const membership = await this.databaseService.groupMember.create({
                data: {
                    userId,
                    groupId,
                    role: 'MEMBER',
                    joinedAt: new Date(),
                },
            });
            await this.databaseService.communityGroup.update({
                where: { id: groupId },
                data: { memberCount: { increment: 1 } },
            });
            return membership;
        }
        catch (error) {
            this.logger.error('Failed to join group', error);
            throw error;
        }
    }
    async getGroups(params) {
        try {
            const { type, city, category, search, isPrivate, page = 1, limit = 20, } = params;
            const skip = (page - 1) * limit;
            const whereClause = {
                ...(isPrivate !== undefined && { isPrivate }),
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
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
                groups: groups.map(group => ({
                    id: group.id,
                    name: group.name,
                    slug: group.slug,
                    description: group.description,
                    image: group.image,
                    isPrivate: group.isPrivate,
                    memberCount: group._count.members,
                    postCount: group._count.posts,
                    createdAt: group.createdAt,
                    creator: {
                        id: group.creator.id,
                        name: `${group.creator.profile?.firstName || ''} ${group.creator.profile?.lastName || ''}`.trim() || 'Unknown User',
                        avatar: group.creator.profile?.avatar,
                    },
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
            this.logger.error('Failed to get groups', error);
            throw error;
        }
    }
    async getGroupDetails(groupId, userId) {
        try {
            const group = await this.databaseService.communityGroup.findUnique({
                where: { id: groupId },
                include: {
                    creator: {
                        include: { profile: true },
                    },
                    members: {
                        take: 10,
                        orderBy: { joinedAt: 'desc' },
                        include: {
                            user: {
                                include: { profile: true },
                            },
                        },
                    },
                    _count: {
                        select: { members: true, posts: true },
                    },
                },
            });
            if (!group) {
                throw new common_1.NotFoundException('Group not found');
            }
            let userMembership = null;
            let userJoinRequest = null;
            if (userId) {
                userMembership = await this.databaseService.groupMember.findUnique({
                    where: { groupId_userId: { groupId, userId } },
                });
            }
            return {
                id: group.id,
                name: group.name,
                slug: group.slug,
                description: group.description,
                image: group.image,
                isPrivate: group.isPrivate,
                memberCount: group._count.members,
                postCount: group._count.posts,
                createdAt: group.createdAt,
                creator: {
                    id: group.creator.id,
                    name: `${group.creator.profile?.firstName || ''} ${group.creator.profile?.lastName || ''}`.trim() || 'Unknown User',
                    avatar: group.creator.profile?.avatar,
                },
                recentMembers: group.members.map(member => ({
                    id: member.user.id,
                    name: `${member.user.profile?.firstName || ''} ${member.user.profile?.lastName || ''}`.trim() || 'Unknown User',
                    avatar: member.user.profile?.avatar,
                    role: member.role,
                    joinedAt: member.joinedAt,
                })),
                userStatus: userMembership ? {
                    isMember: true,
                    role: userMembership.role,
                    joinedAt: userMembership.joinedAt,
                } : userJoinRequest ? {
                    isMember: false,
                    hasJoinRequest: true,
                    requestedAt: userJoinRequest?.createdAt,
                } : {
                    isMember: false,
                    hasJoinRequest: false,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get group details', error);
            throw error;
        }
    }
    async getUserNetworkStats(userId) {
        try {
            const [followersCount, followingCount, groupsCount, mutualConnections] = await Promise.all([
                this.databaseService.userFollow.count({
                    where: { followingId: userId },
                }),
                this.databaseService.userFollow.count({
                    where: { followerId: userId },
                }),
                this.databaseService.groupMember.count({
                    where: { userId },
                }),
                this.databaseService.$queryRaw `
          SELECT COUNT(*)::int as count
          FROM "UserFollow" uf1
          JOIN "UserFollow" uf2 ON uf1.followerId = uf2.followingId AND uf1.followingId = uf2.followerId
          WHERE uf1.followerId = ${userId}
        `,
            ]);
            const mutualCount = Array.isArray(mutualConnections) && mutualConnections.length > 0
                ? mutualConnections[0].count
                : 0;
            return {
                followersCount,
                followingCount,
                groupsCount,
                mutualConnections: mutualCount,
            };
        }
        catch (error) {
            this.logger.error('Failed to get user network stats', error);
            throw error;
        }
    }
    async getSuggestedConnections(userId, limit = 10) {
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
            const followedUsers = await this.databaseService.userFollow.findMany({
                where: { followerId: userId },
                select: { followingId: true },
            });
            const followedIds = followedUsers.map(f => f.followingId);
            const suggestions = await this.databaseService.user.findMany({
                where: {
                    id: { not: userId, notIn: followedIds },
                    isActive: true,
                    OR: [
                        { profile: { city: user.profile?.city } },
                        { role: user.role },
                        {
                            groupMemberships: {
                                some: {
                                    group: {
                                        members: {
                                            some: { userId },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
                take: limit * 2,
                include: {
                    profile: true,
                    reputation: true,
                    _count: {
                        select: {
                            followers: true,
                            following: true,
                        },
                    },
                },
                orderBy: [
                    { isVerified: 'desc' },
                    { reputation: { totalPoints: 'desc' } },
                ],
            });
            const scoredSuggestions = suggestions.map((suggestion) => {
                let score = 0;
                if (suggestion.profile?.city === user.profile?.city)
                    score += 3;
                if (suggestion.role === user.role)
                    score += 2;
                if (suggestion.isVerified)
                    score += 2;
                const userLevel = user.reputation?.level || 1;
                const suggestionLevel = suggestion.reputation?.level || 1;
                if (Math.abs(userLevel - suggestionLevel) <= 2)
                    score += 1;
                return {
                    ...suggestion,
                    suggestionScore: score,
                };
            });
            const topSuggestions = scoredSuggestions
                .sort((a, b) => b.suggestionScore - a.suggestionScore)
                .slice(0, limit);
            return topSuggestions.map((suggestion) => ({
                id: suggestion.id,
                name: `${suggestion.profile?.firstName || ''} ${suggestion.profile?.lastName || ''}`.trim() || 'Unknown User',
                role: suggestion.role,
                avatar: suggestion.profile?.avatar,
                verified: suggestion.isVerified,
                city: suggestion.profile?.city,
                reputation: {
                    level: suggestion.reputation?.level || 1,
                    totalPoints: suggestion.reputation?.totalPoints || 0,
                },
                networkStats: {
                    followersCount: suggestion._count.followers,
                    followingCount: suggestion._count.following,
                },
                reasonForSuggestion: this.getReasonForSuggestion(user, suggestion),
            }));
        }
        catch (error) {
            this.logger.error('Failed to get suggested connections', error);
            throw error;
        }
    }
    getReasonForSuggestion(user, suggestion) {
        if (suggestion.profile?.city === user.profile?.city && suggestion.role === user.role) {
            return `Same ${user.role.toLowerCase()} in ${user.profile.city}`;
        }
        if (suggestion.profile?.city === user.profile?.city) {
            return `Same city: ${user.profile.city}`;
        }
        if (suggestion.role === user.role) {
            return `Same role: ${user.role.toLowerCase()}`;
        }
        if (suggestion.isVerified) {
            return 'Verified user';
        }
        return 'Suggested for you';
    }
};
exports.NetworkingService = NetworkingService;
exports.NetworkingService = NetworkingService = NetworkingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => reputation_service_1.ReputationService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.CommunityNotificationService))),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        reputation_service_1.ReputationService,
        notifications_service_1.CommunityNotificationService])
], NetworkingService);
//# sourceMappingURL=networking.service.js.map