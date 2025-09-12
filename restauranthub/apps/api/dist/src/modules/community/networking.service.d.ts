import { DatabaseService } from '../database/database.service';
import { ReputationService } from './reputation.service';
import { CommunityNotificationService } from './notifications.service';
type GroupType = 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
export declare class NetworkingService {
    private readonly databaseService;
    private readonly reputationService;
    private readonly notificationService;
    private readonly logger;
    constructor(databaseService: DatabaseService, reputationService: ReputationService, notificationService: CommunityNotificationService);
    followUser(followerId: string, followingId: string): Promise<{
        id: string;
        createdAt: Date;
        followerId: string;
        followingId: string;
    }>;
    unfollowUser(followerId: string, followingId: string): Promise<{
        message: string;
    }>;
    getUserFollowers(userId: string, params: {
        page?: number;
        limit?: number;
    }): Promise<{
        followers: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            avatar: string | null | undefined;
            verified: boolean;
            city: string | null | undefined;
            reputation: {
                level: number;
                totalPoints: number;
            };
            followedAt: Date;
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
    getUserFollowing(userId: string, params: {
        page?: number;
        limit?: number;
    }): Promise<{
        following: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            avatar: string | null | undefined;
            verified: boolean;
            city: string | null | undefined;
            reputation: {
                level: number;
                totalPoints: number;
            };
            followedAt: Date;
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
    createGroup(userId: string, groupData: {
        name: string;
        description?: string;
        type: GroupType;
        isPrivate: boolean;
        city?: string;
        category?: string;
        rules?: string[];
        maxMembers?: number;
        icon?: string;
        banner?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        slug: string;
        image: string | null;
        isPrivate: boolean;
        memberCount: number;
        postCount: number;
        createdBy: string;
    }>;
    joinGroup(userId: string, groupId: string): Promise<{
        id: string;
        userId: string;
        role: string;
        joinedAt: Date;
        groupId: string;
    }>;
    getGroups(params: {
        type?: GroupType;
        city?: string;
        category?: string;
        search?: string;
        isPrivate?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        groups: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            image: string | null;
            isPrivate: boolean;
            memberCount: number;
            postCount: number;
            createdAt: Date;
            creator: {
                id: string;
                name: string;
                avatar: string | null | undefined;
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
    getGroupDetails(groupId: string, userId?: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        image: string | null;
        isPrivate: boolean;
        memberCount: number;
        postCount: number;
        createdAt: Date;
        creator: {
            id: string;
            name: string;
            avatar: string | null | undefined;
        };
        recentMembers: {
            id: string;
            name: string;
            avatar: string | null | undefined;
            role: string;
            joinedAt: Date;
        }[];
        userStatus: {
            isMember: boolean;
            role: string;
            joinedAt: Date;
            hasJoinRequest?: undefined;
            requestedAt?: undefined;
        } | {
            isMember: boolean;
            hasJoinRequest: boolean;
            requestedAt: any;
            role?: undefined;
            joinedAt?: undefined;
        } | {
            isMember: boolean;
            hasJoinRequest: boolean;
            role?: undefined;
            joinedAt?: undefined;
            requestedAt?: undefined;
        };
    }>;
    getUserNetworkStats(userId: string): Promise<{
        followersCount: number;
        followingCount: number;
        groupsCount: number;
        mutualConnections: any;
    }>;
    getSuggestedConnections(userId: string, limit?: number): Promise<{
        id: any;
        name: string;
        role: any;
        avatar: any;
        verified: any;
        city: any;
        reputation: {
            level: any;
            totalPoints: any;
        };
        networkStats: {
            followersCount: any;
            followingCount: any;
        };
        reasonForSuggestion: string;
    }[]>;
    private getReasonForSuggestion;
}
export {};
