import { DatabaseService } from '../database/database.service';
import { BadgeType, ReputationAction, UserRole } from '@prisma/client';
import { CommunityNotificationService } from './notifications.service';
export declare class ReputationService {
    private readonly databaseService;
    private readonly notificationService?;
    private readonly logger;
    constructor(databaseService: DatabaseService, notificationService?: CommunityNotificationService | undefined);
    addReputationPoints(userId: string, action: ReputationAction, amount: number, description?: string, relatedId?: string): Promise<{
        newPoints: number;
        newLevel: number;
        pointsEarned: number;
    }>;
    assignBadge(userId: string, type: BadgeType, name: string, description: string, icon?: string): Promise<{
        id: string;
        userId: string;
        description: string;
        title: string;
        icon: string | null;
        badgeType: import(".prisma/client").$Enums.BadgeType;
        earnedAt: Date;
        isVisible: boolean;
    }>;
    getUserReputation(userId: string): Promise<{
        user: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            avatar: string | null | undefined;
            verified: boolean;
        };
        reputation: {
            totalPoints: number;
            level: number;
            badgeCount: number;
            nextLevel: number;
            pointsNeeded: number;
            progress: number;
        };
        badges: {
            id: any;
            type: any;
            name: any;
            description: any;
            icon: any;
            earnedAt: any;
        }[];
        recentActivity: {
            action: import(".prisma/client").$Enums.ReputationAction;
            pointsEarned: number;
            description: string | null;
            createdAt: Date;
        }[];
    }>;
    getLeaderboard(params: {
        timeframe?: 'day' | 'week' | 'month' | 'all';
        city?: string;
        role?: UserRole;
        limit?: number;
        page?: number;
    }): Promise<{
        leaderboard: {
            rank: number;
            user: {
                id: any;
                name: string;
                role: any;
                avatar: any;
                verified: any;
                city: any;
            };
            reputation: {
                points: number;
                level: any;
                badgeCount: any;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
        filters: {
            timeframe: "day" | "week" | "month" | "all";
            city: string | undefined;
            role: import(".prisma/client").$Enums.UserRole | undefined;
        };
    }>;
    getTrendingContributors(timeframe?: 'day' | 'week' | 'month', limit?: number): Promise<{
        user: {
            id: any;
            name: string;
            role: any;
            avatar: any;
            verified: any;
        };
        reputation: {
            level: any;
            badgeCount: any;
        };
        trending: {
            pointsEarned: number;
            activities: number;
            timeframe: "day" | "week" | "month";
        };
    }[]>;
    private calculateLevel;
    private getPointsForLevel;
    private checkLevelUpBadges;
    private checkMilestoneBadges;
    checkActivityBadges(userId: string): Promise<void>;
}
