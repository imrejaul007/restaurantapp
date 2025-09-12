import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
export interface JobNotification {
    id: string;
    type: JobNotificationType;
    title: string;
    message: string;
    data: any;
    recipients: string[];
    priority: NotificationPriority;
    createdAt: Date;
    readBy: string[];
    actionRequired?: boolean;
    actionUrl?: string;
    expiresAt?: Date;
}
export declare enum JobNotificationType {
    JOB_POSTED = "JOB_POSTED",
    JOB_UPDATED = "JOB_UPDATED",
    JOB_EXPIRED = "JOB_EXPIRED",
    JOB_FILLED = "JOB_FILLED",
    JOB_CLOSED = "JOB_CLOSED",
    APPLICATION_RECEIVED = "APPLICATION_RECEIVED",
    APPLICATION_STATUS_CHANGED = "APPLICATION_STATUS_CHANGED",
    APPLICATION_REVIEWED = "APPLICATION_REVIEWED",
    APPLICATION_SHORTLISTED = "APPLICATION_SHORTLISTED",
    APPLICATION_REJECTED = "APPLICATION_REJECTED",
    APPLICATION_ACCEPTED = "APPLICATION_ACCEPTED",
    INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED",
    INTERVIEW_REMINDER = "INTERVIEW_REMINDER",
    INTERVIEW_COMPLETED = "INTERVIEW_COMPLETED",
    EMPLOYMENT_OFFER = "EMPLOYMENT_OFFER",
    EMPLOYMENT_STARTED = "EMPLOYMENT_STARTED",
    EMPLOYMENT_TERMINATED = "EMPLOYMENT_TERMINATED",
    JOB_MATCH_FOUND = "JOB_MATCH_FOUND",
    EMPLOYEE_MATCH_FOUND = "EMPLOYEE_MATCH_FOUND",
    AVAILABILITY_UPDATED = "AVAILABILITY_UPDATED",
    JOB_MODERATION_DECISION = "JOB_MODERATION_DECISION",
    JOB_FLAGGED = "JOB_FLAGGED",
    JOB_APPROVED = "JOB_APPROVED",
    URGENT_ALERT = "URGENT_ALERT",
    DEADLINE_REMINDER = "DEADLINE_REMINDER",
    SYSTEM_UPDATE = "SYSTEM_UPDATE"
}
export declare enum NotificationPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare class JobNotificationsService implements OnModuleInit {
    private prisma;
    private redisService;
    private websocketGateway;
    private notifications;
    private globalNotifications;
    constructor(prisma: PrismaService, redisService: RedisService, websocketGateway: WebsocketGateway);
    onModuleInit(): Promise<void>;
    private subscribeToJobEvents;
    notifyJobPosted(job: any, restaurantId: string): Promise<void>;
    notifyJobUpdated(job: any, restaurantId: string): Promise<void>;
    notifyApplicationReceived(application: any): Promise<void>;
    notifyApplicationStatusChanged(application: any, newStatus: string): Promise<void>;
    notifyInterviewScheduled(application: any, interviewDetails: any): Promise<void>;
    notifyEmploymentOffer(application: any, contractDetails: any): Promise<void>;
    notifyJobMatches(employeeId: string, matches: any[]): Promise<void>;
    notifyEmployeeMatches(restaurantId: string, availableEmployees: any[]): Promise<void>;
    notifyModerationDecision(job: any, decision: string, moderatorNotes: string, feedback?: string): Promise<void>;
    sendJobExpiryReminders(): Promise<void>;
    private sendNotification;
    getUserNotifications(userId: string, page?: number, limit?: number): Promise<{
        notifications: JobNotification[];
        total: number;
        unread: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    markNotificationRead(userId: string, notificationId: string): Promise<{
        success: boolean;
        unreadCount: number;
    }>;
    markAllNotificationsRead(userId: string): Promise<{
        success: boolean;
        unreadCount: number;
    }>;
    deleteNotification(userId: string, notificationId: string): Promise<{
        success: boolean;
    }>;
    private getUnreadCount;
    updateNotificationPreferences(userId: string, preferences: any): Promise<{
        success: boolean;
        preferences: any;
    }>;
    getNotificationStats(userId?: string): Promise<{
        total: number;
        unread: number;
        byType: Record<string, number>;
        totalUsers?: undefined;
        totalNotifications?: undefined;
        averagePerUser?: undefined;
    } | {
        totalUsers: number;
        totalNotifications: number;
        averagePerUser: string | number;
        byType: Record<string, number>;
        total?: undefined;
        unread?: undefined;
    }>;
    private groupNotificationsByType;
    private notifyMatchedEmployees;
    cleanupExpiredNotifications(): Promise<{
        cleanedCount: number;
    }>;
}
