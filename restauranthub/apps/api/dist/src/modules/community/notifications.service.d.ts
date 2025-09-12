import { DatabaseService } from '../database/database.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { NotificationType, CommunityNotificationData } from './types';
export declare class CommunityNotificationService {
    private readonly databaseService;
    private readonly websocketGateway;
    private readonly logger;
    constructor(databaseService: DatabaseService, websocketGateway: WebsocketGateway);
    sendNotification(userId: string, notificationData: CommunityNotificationData): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        title: string;
        message: string;
        type: string;
        isRead: boolean;
        readAt: Date | null;
    } | null>;
    sendBulkNotifications(userIds: string[], notificationData: CommunityNotificationData): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        title: string;
        message: string;
        type: string;
        isRead: boolean;
        readAt: Date | null;
    }[]>;
    notifyPostEngagement(postId: string, engagementType: 'like' | 'comment' | 'share', engagerUserId: string): Promise<void>;
    notifyUserFollowed(followerId: string, followingId: string): Promise<void>;
    notifyGroupActivity(groupId: string, activityType: 'joined' | 'posted', actorUserId: string): Promise<void>;
    notifyReputationMilestone(userId: string, milestone: {
        type: 'LEVEL_UP' | NotificationType.BADGE_EARNED | 'POINTS_MILESTONE';
        level?: number;
        badgeName?: string;
        points?: number;
    }): Promise<void>;
    notifyContentReported(contentId: string, contentType: string, reporterId: string): Promise<void>;
    sendWeeklyDigest(userId: string): Promise<void>;
    getUserNotifications(userId: string, params: {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
        type?: string;
    }): Promise<{
        notifications: {
            id: string;
            userId: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            title: string;
            message: string;
            type: string;
            isRead: boolean;
            readAt: Date | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
        unreadCount: number;
    }>;
    markNotificationRead(userId: string, notificationId: string): Promise<{
        success: boolean;
    }>;
    markAllNotificationsRead(userId: string): Promise<{
        success: boolean;
    }>;
    updateNotificationPreferences(userId: string, preferences: {
        email?: boolean;
        push?: boolean;
        inApp?: boolean;
        types?: {
            [key: string]: boolean;
        };
    }): Promise<{
        success: boolean;
    }>;
    private getUserNotificationPreferences;
    private shouldSendNotification;
    private createNotification;
    private handleGroupableNotification;
    private getGroupedMessage;
    private sendRealTimeNotification;
    private sendExternalNotification;
}
