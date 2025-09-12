import { CommunityNotificationService } from './notifications.service';
export declare class CommunityNotificationController {
    private readonly notificationService;
    constructor(notificationService: CommunityNotificationService);
    getNotifications(req: any, page?: string, limit?: string, unreadOnly?: string, type?: string): Promise<{
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
    markNotificationRead(req: any, notificationId: string): Promise<{
        success: boolean;
    }>;
    markAllNotificationsRead(req: any): Promise<{
        success: boolean;
    }>;
    getNotificationPreferences(req: any): Promise<{
        email: boolean;
        push: boolean;
        inApp: boolean;
        types: {
            POST_LIKED: boolean;
            POST_COMMENTED: boolean;
            USER_FOLLOWED: boolean;
            GROUP_ACTIVITY: boolean;
            REPUTATION_MILESTONE: boolean;
            WEEKLY_DIGEST: boolean;
        };
    }>;
    updateNotificationPreferences(req: any, preferences: {
        email?: boolean;
        push?: boolean;
        inApp?: boolean;
        types?: {
            [key: string]: boolean;
        };
    }): Promise<{
        success: boolean;
    }>;
    sendTestNotification(req: any, type: string): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        title: string;
        message: string;
        type: string;
        isRead: boolean;
        readAt: Date | null;
    } | {
        error: string;
    } | null>;
}
