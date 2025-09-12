import { DatabaseService } from '../database/database.service';
import { UserRole, ReportStatus } from '@prisma/client';
export declare class AdminCommunityService {
    private readonly databaseService;
    private readonly logger;
    constructor(databaseService: DatabaseService);
    getCommunityDashboard(adminUserId: string): Promise<{
        overview: {
            totalUsers: number;
            activeUsers: number;
            totalPosts: number;
            totalComments: number;
            pendingReports: number;
            totalForums: number;
            totalGroups: number;
            userActivityRate: number;
        };
        recentActivity: {
            period: string;
            newUsers: number;
            newPosts: number;
            newComments: number;
            newReports: number;
        };
        topContributors: {
            id: any;
            name: string;
            role: any;
            avatar: any;
            reputation: {
                level: any;
                totalPoints: any;
            };
            stats: {
                posts: any;
                comments: any;
            };
        }[];
        trendingForums: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            slug: string;
            memberCount: number;
            postCount: number;
            category: string;
            icon: string | null;
            color: string | null;
            displayOrder: number;
        }[];
    }>;
    getCommunityAnalytics(adminUserId: string, params: {
        timeframe?: 'day' | 'week' | 'month' | 'quarter' | 'year';
        granularity?: 'hour' | 'day' | 'week' | 'month';
    }): Promise<{
        timeframe: "day" | "week" | "month" | "quarter" | "year";
        granularity: "day" | "week" | "month" | "hour";
        period: {
            start: Date;
            end: Date;
        };
        userGrowth: {
            totalUsers: number;
            newUsers: number;
        };
        contentAnalytics: {
            totalPosts: number;
            newPosts: number;
            totalComments: number;
            newComments: number;
        };
        engagementAnalytics: {
            totalLikes: number;
            newLikes: number;
            totalShares: number;
            newShares: number;
        };
        moderationAnalytics: {
            totalReports: number;
            newReports: number;
            resolvedReports: number;
            pendingReports: number;
        };
    }>;
    getContentModerationQueue(adminUserId: string, params: {
        status?: ReportStatus;
        contentType?: string;
        priority?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        reports: {
            id: string;
            contentId: string;
            contentType: string;
            reason: string;
            description: string | null;
            category: string;
            status: import(".prisma/client").$Enums.ReportStatus;
            priority: string;
            createdAt: Date;
            reporter: {
                id: string;
                name: string;
                avatar: string | null | undefined;
            };
            contentDetails: {
                title: string;
                content: string;
                author: string;
                forum: string;
                post?: undefined;
                name?: undefined;
                email?: undefined;
                role?: undefined;
            } | {
                content: string;
                author: string;
                post: string;
                forum: string;
                title?: undefined;
                name?: undefined;
                email?: undefined;
                role?: undefined;
            } | {
                name: string;
                email: string;
                role: import(".prisma/client").$Enums.UserRole;
                title?: undefined;
                content?: undefined;
                author?: undefined;
                forum?: undefined;
                post?: undefined;
            } | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
        summary: {
            total: number;
            pending: number;
            resolved: number;
            actioned: number;
        };
    }>;
    getUserManagement(adminUserId: string, params: {
        role?: UserRole;
        status?: 'active' | 'suspended' | 'banned';
        search?: string;
        sortBy?: 'recent' | 'reputation' | 'posts' | 'reports';
        page?: number;
        limit?: number;
    }): Promise<{
        users: {
            id: any;
            name: string;
            email: any;
            role: any;
            avatar: any;
            isActive: any;
            isVerified: any;
            createdAt: any;
            lastLoginAt: any;
            reputation: {
                level: any;
                totalPoints: any;
                badgeCount: any;
            };
            stats: {
                posts: any;
                comments: any;
                followers: any;
                following: any;
                reports: any;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    getForumManagement(adminUserId: string): Promise<{
        forums: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            category: string;
            icon: string | null;
            color: string | null;
            isActive: boolean;
            displayOrder: number;
            stats: {
                totalPosts: number;
                totalMembers: number;
                recentPosts: number;
                topPostersCount: number;
            };
            createdAt: Date;
        }[];
        summary: {
            totalForums: number;
            activeForums: number;
            totalPosts: number;
            totalMembers: number;
        };
    }>;
    updateForumSettings(adminUserId: string, forumId: string, settings: {
        name?: string;
        description?: string;
        category?: string;
        icon?: string;
        color?: string;
        displayOrder?: number;
        isActive?: boolean;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        slug: string;
        memberCount: number;
        postCount: number;
        category: string;
        icon: string | null;
        color: string | null;
        displayOrder: number;
    }>;
    suspendUser(adminUserId: string, userId: string, params: {
        reason: string;
        durationDays?: number;
        notifyUser?: boolean;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        phone: string | null;
        passwordHash: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        isVerified: boolean;
        emailVerifiedAt: Date | null;
        isAadhaarVerified: boolean;
        aadhaarVerificationId: string | null;
        twoFactorEnabled: boolean;
        twoFactorSecret: string | null;
        lastLoginAt: Date | null;
        refreshToken: string | null;
        deletedAt: Date | null;
    }>;
    private validateAdminAccess;
    private getRecentActivityStats;
    private getUserGrowthAnalytics;
    private getContentAnalytics;
    private getEngagementAnalytics;
    private getModerationAnalytics;
    private getContentDetails;
    private getTimeRange;
}
