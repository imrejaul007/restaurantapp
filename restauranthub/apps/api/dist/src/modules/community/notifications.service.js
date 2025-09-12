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
var CommunityNotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityNotificationService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const client_1 = require("@prisma/client");
const types_1 = require("./types");
let CommunityNotificationService = CommunityNotificationService_1 = class CommunityNotificationService {
    constructor(databaseService, websocketGateway) {
        this.databaseService = databaseService;
        this.websocketGateway = websocketGateway;
        this.logger = new common_1.Logger(CommunityNotificationService_1.name);
    }
    async sendNotification(userId, notificationData) {
        try {
            const preferences = await this.getUserNotificationPreferences(userId);
            if (!this.shouldSendNotification(notificationData.type, preferences)) {
                return null;
            }
            let notification;
            if (notificationData.groupable) {
                notification = await this.handleGroupableNotification(userId, notificationData);
            }
            else {
                notification = await this.createNotification(userId, notificationData);
            }
            await this.sendRealTimeNotification(userId, notification);
            await this.sendExternalNotification(userId, notification, preferences);
            return notification;
        }
        catch (error) {
            this.logger.error('Failed to send community notification', error);
            return null;
        }
    }
    async sendBulkNotifications(userIds, notificationData) {
        try {
            const notifications = await Promise.all(userIds.map(userId => this.sendNotification(userId, notificationData)));
            return notifications.filter(n => n !== null);
        }
        catch (error) {
            this.logger.error('Failed to send bulk community notifications', error);
            return [];
        }
    }
    async notifyPostEngagement(postId, engagementType, engagerUserId) {
        try {
            const post = await this.databaseService.forumPost.findUnique({
                where: { id: postId },
                include: {
                    author: {
                        include: { profile: true },
                    },
                    forum: true,
                },
            });
            if (!post || post.userId === engagerUserId) {
                return;
            }
            const engager = await this.databaseService.user.findUnique({
                where: { id: engagerUserId },
                include: { profile: true },
            });
            if (!engager)
                return;
            const engagerName = `${engager.profile?.firstName || ''} ${engager.profile?.lastName || ''}`.trim() || 'Someone';
            let notificationData;
            switch (engagementType) {
                case 'like':
                    notificationData = {
                        type: types_1.NotificationType.POST_LIKED,
                        title: 'Post Liked',
                        message: `${engagerName} liked your post "${post.title}"`,
                        actionUrl: `/community/posts/${postId}`,
                        metadata: { postId, engagerUserId, forumId: post.forumId },
                        priority: types_1.NotificationPriority.LOW,
                        groupable: true,
                    };
                    break;
                case 'comment':
                    notificationData = {
                        type: types_1.NotificationType.POST_COMMENTED,
                        title: 'New Comment',
                        message: `${engagerName} commented on your post "${post.title}"`,
                        actionUrl: `/community/posts/${postId}`,
                        metadata: { postId, engagerUserId, forumId: post.forumId },
                        priority: types_1.NotificationPriority.MEDIUM,
                        groupable: false,
                    };
                    break;
                case 'share':
                    notificationData = {
                        type: types_1.NotificationType.POST_SHARED,
                        title: 'Post Shared',
                        message: `${engagerName} shared your post "${post.title}"`,
                        actionUrl: `/community/posts/${postId}`,
                        metadata: { postId, engagerUserId, forumId: post.forumId },
                        priority: types_1.NotificationPriority.MEDIUM,
                        groupable: true,
                    };
                    break;
            }
            await this.sendNotification(post.userId, notificationData);
        }
        catch (error) {
            this.logger.error('Failed to notify post engagement', error);
        }
    }
    async notifyUserFollowed(followerId, followingId) {
        try {
            const follower = await this.databaseService.user.findUnique({
                where: { id: followerId },
                include: { profile: true },
            });
            if (!follower)
                return;
            const followerName = `${follower.profile?.firstName || ''} ${follower.profile?.lastName || ''}`.trim() || 'Someone';
            const notificationData = {
                type: types_1.NotificationType.USER_FOLLOWED,
                title: 'New Follower',
                message: `${followerName} started following you`,
                actionUrl: `/community/users/${followerId}`,
                metadata: { followerId },
                priority: types_1.NotificationPriority.MEDIUM,
                groupable: true,
            };
            await this.sendNotification(followingId, notificationData);
        }
        catch (error) {
            this.logger.error('Failed to notify user followed', error);
        }
    }
    async notifyGroupActivity(groupId, activityType, actorUserId) {
        try {
            const [group, actor] = await Promise.all([
                this.databaseService.communityGroup.findUnique({
                    where: { id: groupId },
                    include: {
                        members: {
                            where: { userId: { not: actorUserId } },
                            include: { user: true },
                        },
                    },
                }),
                this.databaseService.user.findUnique({
                    where: { id: actorUserId },
                    include: { profile: true },
                }),
            ]);
            if (!group || !actor)
                return;
            const actorName = `${actor.profile?.firstName || ''} ${actor.profile?.lastName || ''}`.trim() || 'Someone';
            const memberIds = group.members.map((member) => member.userId);
            let notificationData;
            switch (activityType) {
                case 'joined':
                    notificationData = {
                        type: types_1.NotificationType.GROUP_JOINED,
                        title: 'Group Activity',
                        message: `${actorName} joined ${group.name}`,
                        actionUrl: `/community/groups/${groupId}`,
                        metadata: { groupId, actorUserId },
                        priority: types_1.NotificationPriority.LOW,
                        groupable: true,
                    };
                    break;
                case 'posted':
                    notificationData = {
                        type: types_1.NotificationType.GROUP_POST,
                        title: 'New Group Post',
                        message: `${actorName} posted in ${group.name}`,
                        actionUrl: `/community/groups/${groupId}`,
                        metadata: { groupId, actorUserId },
                        priority: types_1.NotificationPriority.MEDIUM,
                        groupable: false,
                    };
                    break;
            }
            await this.sendBulkNotifications(memberIds, notificationData);
        }
        catch (error) {
            this.logger.error('Failed to notify group activity', error);
        }
    }
    async notifyReputationMilestone(userId, milestone) {
        try {
            let notificationData;
            switch (milestone.type) {
                case 'LEVEL_UP':
                    notificationData = {
                        type: types_1.NotificationType.REPUTATION_MILESTONE,
                        title: 'Level Up!',
                        message: `Congratulations! You reached level ${milestone.level}`,
                        actionUrl: `/community/reputation/${userId}`,
                        metadata: { level: milestone.level },
                        priority: types_1.NotificationPriority.HIGH,
                        groupable: false,
                    };
                    break;
                case types_1.NotificationType.BADGE_EARNED:
                    notificationData = {
                        type: types_1.NotificationType.BADGE_EARNED,
                        title: 'Badge Earned!',
                        message: `You earned the "${milestone.badgeName}" badge`,
                        actionUrl: `/community/reputation/${userId}`,
                        metadata: { badgeName: milestone.badgeName },
                        priority: types_1.NotificationPriority.MEDIUM,
                        groupable: false,
                    };
                    break;
                case 'POINTS_MILESTONE':
                    notificationData = {
                        type: types_1.NotificationType.REPUTATION_MILESTONE,
                        title: 'Points Milestone!',
                        message: `You reached ${milestone.points} reputation points`,
                        actionUrl: `/community/reputation/${userId}`,
                        metadata: { points: milestone.points },
                        priority: types_1.NotificationPriority.MEDIUM,
                        groupable: false,
                    };
                    break;
            }
            await this.sendNotification(userId, notificationData);
        }
        catch (error) {
            this.logger.error('Failed to notify reputation milestone', error);
        }
    }
    async notifyContentReported(contentId, contentType, reporterId) {
        try {
            const moderators = await this.databaseService.user.findMany({
                where: {
                    OR: [
                        { role: client_1.UserRole.ADMIN },
                        { role: 'MODERATOR' },
                    ],
                },
            });
            const reporter = await this.databaseService.user.findUnique({
                where: { id: reporterId },
                include: { profile: true },
            });
            if (!reporter)
                return;
            const reporterName = `${reporter.profile?.firstName || ''} ${reporter.profile?.lastName || ''}`.trim() || 'A user';
            const notificationData = {
                type: types_1.NotificationType.CONTENT_REPORTED,
                title: 'Content Reported',
                message: `${reporterName} reported ${contentType.toLowerCase()} content`,
                actionUrl: `/admin/moderation/reports`,
                metadata: { contentId, contentType, reporterId },
                priority: types_1.NotificationPriority.HIGH,
                groupable: true,
            };
            const moderatorIds = moderators.map((mod) => mod.id);
            await this.sendBulkNotifications(moderatorIds, notificationData);
        }
        catch (error) {
            this.logger.error('Failed to notify content reported', error);
        }
    }
    async sendWeeklyDigest(userId) {
        try {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const [newFollowers, postsLiked, commentsReceived, reputationGained] = await Promise.all([
                this.databaseService.userFollow.count({
                    where: { followingId: userId, createdAt: { gte: weekAgo } },
                }),
                this.databaseService.postLike.count({
                    where: {
                        post: { userId },
                        createdAt: { gte: weekAgo },
                    },
                }),
                this.databaseService.postComment.count({
                    where: {
                        post: { userId },
                        createdAt: { gte: weekAgo },
                    },
                }),
                this.databaseService.reputationHistory.aggregate({
                    where: { userId, createdAt: { gte: weekAgo } },
                    _sum: { points: true },
                }),
            ]);
            if (newFollowers === 0 && postsLiked === 0 && commentsReceived === 0 && !reputationGained._sum?.points) {
                return;
            }
            let summary = "Here's your weekly community summary:\n";
            if (newFollowers > 0)
                summary += `• ${newFollowers} new followers\n`;
            if (postsLiked > 0)
                summary += `• ${postsLiked} likes on your posts\n`;
            if (commentsReceived > 0)
                summary += `• ${commentsReceived} comments received\n`;
            if (reputationGained._sum?.points)
                summary += `• +${reputationGained._sum.points} reputation points\n`;
            const notificationData = {
                type: types_1.NotificationType.WEEKLY_DIGEST,
                title: 'Weekly Community Digest',
                message: summary,
                actionUrl: '/community/dashboard',
                metadata: {
                    newFollowers,
                    postsLiked,
                    commentsReceived,
                    reputationGained: reputationGained._sum?.points
                },
                priority: types_1.NotificationPriority.LOW,
                groupable: false,
            };
            await this.sendNotification(userId, notificationData);
        }
        catch (error) {
            this.logger.error('Failed to send weekly digest', error);
        }
    }
    async getUserNotifications(userId, params) {
        try {
            const { page = 1, limit = 20, unreadOnly = false, type } = params;
            const skip = (page - 1) * limit;
            const whereClause = {
                userId,
                ...(unreadOnly && { readAt: null }),
                ...(type && { type }),
            };
            const [notifications, total, unreadCount] = await Promise.all([
                this.databaseService.notification.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                this.databaseService.notification.count({ where: whereClause }),
                this.databaseService.notification.count({
                    where: { userId, readAt: null },
                }),
            ]);
            return {
                notifications,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1,
                },
                unreadCount,
            };
        }
        catch (error) {
            this.logger.error('Failed to get user notifications', error);
            throw error;
        }
    }
    async markNotificationRead(userId, notificationId) {
        try {
            const notification = await this.databaseService.notification.findFirst({
                where: { id: notificationId, userId },
            });
            if (!notification) {
                throw new Error('Notification not found');
            }
            await this.databaseService.notification.update({
                where: { id: notificationId },
                data: { readAt: new Date() },
            });
            return { success: true };
        }
        catch (error) {
            this.logger.error('Failed to mark notification as read', error);
            throw error;
        }
    }
    async markAllNotificationsRead(userId) {
        try {
            await this.databaseService.notification.updateMany({
                where: { userId, readAt: null },
                data: { readAt: new Date() },
            });
            return { success: true };
        }
        catch (error) {
            this.logger.error('Failed to mark all notifications as read', error);
            throw error;
        }
    }
    async updateNotificationPreferences(userId, preferences) {
        try {
            this.logger.warn('Notification preferences not implemented - table missing from schema');
            return { success: true };
        }
        catch (error) {
            this.logger.error('Failed to update notification preferences', error);
            throw error;
        }
    }
    async getUserNotificationPreferences(userId) {
        const preferences = null;
        return preferences || {
            email: true,
            push: true,
            inApp: true,
            types: {},
        };
    }
    shouldSendNotification(type, preferences) {
        if (!preferences.inApp)
            return false;
        if (preferences.types && preferences.types[type] !== undefined) {
            return preferences.types[type];
        }
        return true;
    }
    async createNotification(userId, data) {
        return this.databaseService.notification.create({
            data: {
                userId,
                type: data.type,
                title: data.title,
                message: data.message,
                data: data.metadata || {},
            },
        });
    }
    async handleGroupableNotification(userId, data) {
        const recentNotification = await this.databaseService.notification.findFirst({
            where: {
                userId,
                type: data.type,
                createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
                readAt: null,
            },
        });
        if (recentNotification) {
            const count = recentNotification.data?.count || 1;
            return this.databaseService.notification.update({
                where: { id: recentNotification.id },
                data: {
                    message: this.getGroupedMessage(data.type, count + 1),
                    data: {
                        ...(recentNotification.data || {}),
                        count: count + 1,
                        lastActor: data.metadata,
                    },
                },
            });
        }
        else {
            return this.createNotification(userId, data);
        }
    }
    getGroupedMessage(type, count) {
        switch (type) {
            case 'POST_LIKED':
                return `${count} people liked your post`;
            case types_1.NotificationType.USER_FOLLOWED:
                return `${count} people started following you`;
            case types_1.NotificationType.GROUP_JOINED:
                return `${count} people joined your group`;
            default:
                return `${count} activities`;
        }
    }
    async sendRealTimeNotification(userId, notification) {
        try {
            this.logger.log(`Real-time notification for user ${userId}: ${notification.title}`);
        }
        catch (error) {
            this.logger.warn('Failed to send real-time notification', error);
        }
    }
    async sendExternalNotification(userId, notification, preferences) {
        try {
            if (preferences.email && notification.priority === types_1.NotificationPriority.HIGH) {
                this.logger.log(`Email notification needed for user ${userId}: ${notification.title}`);
            }
            if (preferences.push) {
                this.logger.log(`Push notification needed for user ${userId}: ${notification.title}`);
            }
        }
        catch (error) {
            this.logger.warn('Failed to send external notification', error);
        }
    }
};
exports.CommunityNotificationService = CommunityNotificationService;
exports.CommunityNotificationService = CommunityNotificationService = CommunityNotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        websocket_gateway_1.WebsocketGateway])
], CommunityNotificationService);
//# sourceMappingURL=notifications.service.js.map