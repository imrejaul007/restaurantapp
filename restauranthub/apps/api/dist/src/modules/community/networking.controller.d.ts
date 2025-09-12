import { NetworkingService } from './networking.service';
type GroupType = 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
export declare class NetworkingController {
    private readonly networkingService;
    constructor(networkingService: NetworkingService);
    followUser(req: any, userId: string): Promise<{
        id: string;
        createdAt: Date;
        followerId: string;
        followingId: string;
    }>;
    unfollowUser(req: any, userId: string): Promise<{
        message: string;
    }>;
    getUserFollowers(req: any, targetUserId?: string, page?: string, limit?: string): Promise<{
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
    getUserFollowing(req: any, targetUserId?: string, page?: string, limit?: string): Promise<{
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
    getUserNetworkStats(req: any, targetUserId?: string): Promise<{
        followersCount: number;
        followingCount: number;
        groupsCount: number;
        mutualConnections: any;
    }>;
    getSuggestedConnections(req: any, limit?: string): Promise<{
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
    createGroup(req: any, body: {
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
    getGroups(type?: GroupType, city?: string, category?: string, search?: string, isPrivate?: string, page?: string, limit?: string): Promise<{
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
    getGroupDetails(req: any, groupId: string): Promise<{
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
    joinGroup(req: any, groupId: string): Promise<{
        id: string;
        userId: string;
        role: string;
        joinedAt: Date;
        groupId: string;
    }>;
}
export {};
