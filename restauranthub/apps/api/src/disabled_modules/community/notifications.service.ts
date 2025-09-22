import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { UserRole } from '@prisma/client';
import { NotificationType, NotificationPriority, CommunityNotificationData } from './types';

@Injectable()
export class CommunityNotificationService {
  private readonly logger = new Logger(CommunityNotificationService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async sendNotification(
    userId: string,
    notificationData: CommunityNotificationData
  ) {
    try {
      // Check user notification preferences
      const preferences = await this.getUserNotificationPreferences(userId);
      
      if (!this.shouldSendNotification(notificationData.type, preferences)) {
        return null;
      }

      // Check for existing groupable notifications
      let notification;
      if (notificationData.groupable) {
        notification = await this.handleGroupableNotification(userId, notificationData);
      } else {
        notification = await this.createNotification(userId, notificationData);
      }

      // Send real-time notification if user is online
      await this.sendRealTimeNotification(userId, notification);

      // Send push/email notification based on preferences
      await this.sendExternalNotification(userId, notification, preferences);

      return notification;
    } catch (error) {
      this.logger.error('Failed to send community notification', error);
      return null;
    }
  }

  async sendBulkNotifications(
    userIds: string[],
    notificationData: CommunityNotificationData
  ) {
    try {
      const notifications = await Promise.all(
        userIds.map(userId => this.sendNotification(userId, notificationData))
      );

      return notifications.filter(n => n !== null);
    } catch (error) {
      this.logger.error('Failed to send bulk community notifications', error);
      return [];
    }
  }

  async notifyPostEngagement(
    postId: string,
    engagementType: 'like' | 'comment' | 'share',
    engagerUserId: string
  ) {
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
        return; // Don't notify if user engages with their own post
      }

      const engager = await this.databaseService.user.findUnique({
        where: { id: engagerUserId },
        include: { profile: true },
      });

      if (!engager) return;

      const engagerName = `${engager.profile?.firstName || ''} ${engager.profile?.lastName || ''}`.trim() || 'Someone';
      
      let notificationData: CommunityNotificationData;
      
      switch (engagementType) {
        case 'like':
          notificationData = {
            type: NotificationType.POST_LIKED,
            title: 'Post Liked',
            message: `${engagerName} liked your post "${post.title}"`,
            actionUrl: `/community/posts/${postId}`,
            metadata: { postId, engagerUserId, forumId: post.forumId },
            priority: NotificationPriority.LOW,
            groupable: true,
          };
          break;

        case 'comment':
          notificationData = {
            type: NotificationType.POST_COMMENTED,
            title: 'New Comment',
            message: `${engagerName} commented on your post "${post.title}"`,
            actionUrl: `/community/posts/${postId}`,
            metadata: { postId, engagerUserId, forumId: post.forumId },
            priority: NotificationPriority.MEDIUM,
            groupable: false,
          };
          break;

        case 'share':
          notificationData = {
            type: NotificationType.POST_SHARED,
            title: 'Post Shared',
            message: `${engagerName} shared your post "${post.title}"`,
            actionUrl: `/community/posts/${postId}`,
            metadata: { postId, engagerUserId, forumId: post.forumId },
            priority: NotificationPriority.MEDIUM,
            groupable: true,
          };
          break;
      }

      await this.sendNotification(post.userId, notificationData);
    } catch (error) {
      this.logger.error('Failed to notify post engagement', error);
    }
  }

  async notifyUserFollowed(followerId: string, followingId: string) {
    try {
      const follower = await this.databaseService.user.findUnique({
        where: { id: followerId },
        include: { profile: true },
      });

      if (!follower) return;

      const followerName = `${follower.profile?.firstName || ''} ${follower.profile?.lastName || ''}`.trim() || 'Someone';

      const notificationData: CommunityNotificationData = {
        type: NotificationType.USER_FOLLOWED,
        title: 'New Follower',
        message: `${followerName} started following you`,
        actionUrl: `/community/users/${followerId}`,
        metadata: { followerId },
        priority: NotificationPriority.MEDIUM,
        groupable: true,
      };

      await this.sendNotification(followingId, notificationData);
    } catch (error) {
      this.logger.error('Failed to notify user followed', error);
    }
  }

  async notifyGroupActivity(groupId: string, activityType: 'joined' | 'posted', actorUserId: string) {
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

      if (!group || !actor) return;

      const actorName = `${actor.profile?.firstName || ''} ${actor.profile?.lastName || ''}`.trim() || 'Someone';
      const memberIds = group.members.map((member: any) => member.userId);

      let notificationData: CommunityNotificationData;

      switch (activityType) {
        case 'joined':
          notificationData = {
            type: NotificationType.GROUP_JOINED,
            title: 'Group Activity',
            message: `${actorName} joined ${group.name}`,
            actionUrl: `/community/groups/${groupId}`,
            metadata: { groupId, actorUserId },
            priority: NotificationPriority.LOW,
            groupable: true,
          };
          break;

        case 'posted':
          notificationData = {
            type: NotificationType.GROUP_POST,
            title: 'New Group Post',
            message: `${actorName} posted in ${group.name}`,
            actionUrl: `/community/groups/${groupId}`,
            metadata: { groupId, actorUserId },
            priority: NotificationPriority.MEDIUM,
            groupable: false,
          };
          break;
      }

      // Send to all group members except the actor
      await this.sendBulkNotifications(memberIds, notificationData);
    } catch (error) {
      this.logger.error('Failed to notify group activity', error);
    }
  }

  async notifyReputationMilestone(userId: string, milestone: {
    type: 'LEVEL_UP' | NotificationType.BADGE_EARNED | 'POINTS_MILESTONE';
    level?: number;
    badgeName?: string;
    points?: number;
  }) {
    try {
      let notificationData: CommunityNotificationData;

      switch (milestone.type) {
        case 'LEVEL_UP':
          notificationData = {
            type: NotificationType.REPUTATION_MILESTONE,
            title: 'Level Up!',
            message: `Congratulations! You reached level ${milestone.level}`,
            actionUrl: `/community/reputation/${userId}`,
            metadata: { level: milestone.level },
            priority: NotificationPriority.HIGH,
            groupable: false,
          };
          break;

        case NotificationType.BADGE_EARNED:
          notificationData = {
            type: NotificationType.BADGE_EARNED,
            title: 'Badge Earned!',
            message: `You earned the "${milestone.badgeName}" badge`,
            actionUrl: `/community/reputation/${userId}`,
            metadata: { badgeName: milestone.badgeName },
            priority: NotificationPriority.MEDIUM,
            groupable: false,
          };
          break;

        case 'POINTS_MILESTONE':
          notificationData = {
            type: NotificationType.REPUTATION_MILESTONE,
            title: 'Points Milestone!',
            message: `You reached ${milestone.points} reputation points`,
            actionUrl: `/community/reputation/${userId}`,
            metadata: { points: milestone.points },
            priority: NotificationPriority.MEDIUM,
            groupable: false,
          };
          break;
      }

      await this.sendNotification(userId, notificationData);
    } catch (error) {
      this.logger.error('Failed to notify reputation milestone', error);
    }
  }

  async notifyContentReported(contentId: string, contentType: string, reporterId: string) {
    try {
      // Notify moderators about new reports
      const moderators = await this.databaseService.user.findMany({
        where: {
          OR: [
            { role: UserRole.ADMIN },
            { role: 'MODERATOR' as any }, // If you have a MODERATOR role
          ],
        },
      });

      const reporter = await this.databaseService.user.findUnique({
        where: { id: reporterId },
        include: { profile: true },
      });

      if (!reporter) return;

      const reporterName = `${reporter.profile?.firstName || ''} ${reporter.profile?.lastName || ''}`.trim() || 'A user';

      const notificationData: CommunityNotificationData = {
        type: NotificationType.CONTENT_REPORTED,
        title: 'Content Reported',
        message: `${reporterName} reported ${contentType.toLowerCase()} content`,
        actionUrl: `/admin/moderation/reports`,
        metadata: { contentId, contentType, reporterId },
        priority: NotificationPriority.HIGH,
        groupable: true,
      };

      const moderatorIds = moderators.map((mod: any) => mod.id);
      await this.sendBulkNotifications(moderatorIds, notificationData);
    } catch (error) {
      this.logger.error('Failed to notify content reported', error);
    }
  }

  async sendWeeklyDigest(userId: string) {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get user's weekly activity summary
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
        return; // No activity to report
      }

      let summary = "Here's your weekly community summary:\n";
      if (newFollowers > 0) summary += `• ${newFollowers} new followers\n`;
      if (postsLiked > 0) summary += `• ${postsLiked} likes on your posts\n`;
      if (commentsReceived > 0) summary += `• ${commentsReceived} comments received\n`;
      if (reputationGained._sum?.points) summary += `• +${reputationGained._sum.points} reputation points\n`;

      const notificationData: CommunityNotificationData = {
        type: NotificationType.WEEKLY_DIGEST,
        title: 'Weekly Community Digest',
        message: summary,
        actionUrl: '/community/dashboard',
        metadata: { 
          newFollowers, 
          postsLiked, 
          commentsReceived, 
          reputationGained: reputationGained._sum?.points 
        },
        priority: NotificationPriority.LOW,
        groupable: false,
      };

      await this.sendNotification(userId, notificationData);
    } catch (error) {
      this.logger.error('Failed to send weekly digest', error);
    }
  }

  async getUserNotifications(userId: string, params: { 
    page?: number; 
    limit?: number; 
    unreadOnly?: boolean;
    type?: string;
  }) {
    try {
      const { page = 1, limit = 20, unreadOnly = false, type } = params;
      const skip = (page - 1) * limit;

      const whereClause: any = {
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
    } catch (error) {
      this.logger.error('Failed to get user notifications', error);
      throw error;
    }
  }

  async markNotificationRead(userId: string, notificationId: string) {
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
    } catch (error) {
      this.logger.error('Failed to mark notification as read', error);
      throw error;
    }
  }

  async markAllNotificationsRead(userId: string) {
    try {
      await this.databaseService.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to mark all notifications as read', error);
      throw error;
    }
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: {
      email?: boolean;
      push?: boolean;
      inApp?: boolean;
      types?: {
        [key: string]: boolean;
      };
    }
  ) {
    try {
      // Note: notificationPreference table doesn't exist in schema, using mock implementation
      // TODO: Add notificationPreference table to schema if needed
      this.logger.warn('Notification preferences not implemented - table missing from schema');
      return { success: true };
      
      /*
      await this.databaseService.notificationPreference.upsert({
        where: { userId },
        create: {
          userId,
          email: preferences.email ?? true,
          push: preferences.push ?? true,
          inApp: preferences.inApp ?? true,
          types: preferences.types ?? {},
        },
        update: {
          email: preferences.email,
          push: preferences.push,
          inApp: preferences.inApp,
          types: preferences.types,
        },
      });

      return { success: true };
      */
    } catch (error) {
      this.logger.error('Failed to update notification preferences', error);
      throw error;
    }
  }

  private async getUserNotificationPreferences(userId: string) {
    // Note: notificationPreference table doesn't exist in schema
    // TODO: Add notificationPreference table to schema if needed
    const preferences = null;
    /*
    const preferences = await this.databaseService.notificationPreference.findUnique({
      where: { userId },
    });
    */

    return preferences || {
      email: true,
      push: true,
      inApp: true,
      types: {},
    };
  }

  private shouldSendNotification(type: string, preferences: any): boolean {
    if (!preferences.inApp) return false;
    
    if (preferences.types && preferences.types[type] !== undefined) {
      return preferences.types[type];
    }

    return true; // Default to sending if not specified
  }

  private async createNotification(
    userId: string,
    data: CommunityNotificationData
  ) {
    return this.databaseService.notification.create({
      data: {
        userId,
        type: data.type as string, // Store as string since we use custom enum
        title: data.title,
        message: data.message,
        // actionUrl: data.actionUrl, // Field doesn't exist in Notification model
        data: data.metadata || {},
        // priority: data.priority || NotificationPriority.MEDIUM, // Field doesn't exist in Notification model
      },
    });
  }

  private async handleGroupableNotification(
    userId: string,
    data: CommunityNotificationData
  ) {
    const recentNotification = await this.databaseService.notification.findFirst({
      where: {
        userId,
        type: data.type as NotificationType,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
        readAt: null,
      },
    });

    if (recentNotification) {
      // Update existing notification with grouped content
      const count = (recentNotification.data as any)?.count || 1;
      return this.databaseService.notification.update({
        where: { id: recentNotification.id },
        data: {
          message: this.getGroupedMessage(data.type, count + 1),
          data: {
            ...(recentNotification.data as object || {}),
            count: count + 1,
            lastActor: data.metadata,
          },
        },
      });
    } else {
      return this.createNotification(userId, data);
    }
  }

  private getGroupedMessage(type: string, count: number): string {
    switch (type) {
      case 'POST_LIKED':
        return `${count} people liked your post`;
      case NotificationType.USER_FOLLOWED:
        return `${count} people started following you`;
      case NotificationType.GROUP_JOINED:
        return `${count} people joined your group`;
      default:
        return `${count} activities`;
    }
  }

  private async sendRealTimeNotification(userId: string, notification: any) {
    try {
      // Note: sendToUser method doesn't exist in WebsocketGateway
      // TODO: Implement sendToUser method or use alternative
      this.logger.log(`Real-time notification for user ${userId}: ${notification.title}`);
      // this.websocketGateway.sendToUser(userId, 'notification', notification);
    } catch (error) {
      this.logger.warn('Failed to send real-time notification', error);
    }
  }

  private async sendExternalNotification(
    userId: string,
    notification: any,
    preferences: any
  ) {
    try {
      // This would integrate with email/push notification services
      if (preferences.email && notification.priority === NotificationPriority.HIGH) {
        // Send email notification
        this.logger.log(`Email notification needed for user ${userId}: ${notification.title}`);
      }

      if (preferences.push) {
        // Send push notification
        this.logger.log(`Push notification needed for user ${userId}: ${notification.title}`);
      }
    } catch (error) {
      this.logger.warn('Failed to send external notification', error);
    }
  }
}