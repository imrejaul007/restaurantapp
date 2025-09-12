export declare enum NotificationType {
    POST_LIKED = "POST_LIKED",
    POST_COMMENTED = "POST_COMMENTED",
    POST_SHARED = "POST_SHARED",
    USER_FOLLOWED = "USER_FOLLOWED",
    GROUP_JOINED = "GROUP_JOINED",
    GROUP_POST = "GROUP_POST",
    REPUTATION_MILESTONE = "REPUTATION_MILESTONE",
    BADGE_EARNED = "BADGE_EARNED",
    FORUM_SUBSCRIBED = "FORUM_SUBSCRIBED",
    SUGGESTION_RATED = "SUGGESTION_RATED",
    CONTENT_REPORTED = "CONTENT_REPORTED",
    JOB_APPLICATION = "JOB_APPLICATION",
    PRODUCT_DISCUSSED = "PRODUCT_DISCUSSED",
    WEEKLY_DIGEST = "WEEKLY_DIGEST"
}
export declare enum NotificationPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}
export interface CommunityNotificationData {
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: any;
    priority?: NotificationPriority;
    groupable?: boolean;
}
