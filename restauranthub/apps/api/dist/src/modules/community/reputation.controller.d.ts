import { ReputationService } from './reputation.service';
import { UserRole } from '@prisma/client';
export declare class ReputationController {
    private readonly reputationService;
    constructor(reputationService: ReputationService);
    getUserReputation(req: any, targetUserId?: string): Promise<{
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
    getLeaderboard(timeframe?: 'day' | 'week' | 'month' | 'all', city?: string, role?: UserRole, limit?: string, page?: string): Promise<{
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
    getTrendingContributors(timeframe?: 'day' | 'week' | 'month', limit?: string): Promise<{
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
    refreshBadges(req: any, targetUserId?: string): Promise<{
        message: string;
    }>;
}
