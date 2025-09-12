import { DatabaseService } from '../database/database.service';
export declare class ForumService {
    private readonly databaseService;
    private readonly logger;
    constructor(databaseService: DatabaseService);
    createForum(userId: string, forumData: {
        name: string;
        slug?: string;
        description?: string;
        category: string;
        icon?: string;
        color?: string;
        displayOrder?: number;
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
    getForums(): Promise<{
        stats: {
            postCount: number;
            memberCount: number;
        };
        _count: {
            posts: number;
            subscriptions: number;
        };
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
    }[]>;
    getForum(forumId: string): Promise<{
        stats: {
            postCount: number;
            memberCount: number;
        };
        _count: {
            posts: number;
            subscriptions: number;
        };
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
    subscribeForum(userId: string, forumId: string): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        forumId: string;
    }>;
    updateForum(userId: string, forumId: string, updateData: {
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
    deleteForum(userId: string, forumId: string): Promise<{
        message: string;
    }>;
    joinForum(userId: string, forumId: string): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        forumId: string;
    }>;
    leaveForum(userId: string, forumId: string): Promise<{
        message: string;
    }>;
    getForumMembers(forumId: string, params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        members: {
            id: string;
            name: string;
            avatar: string | null | undefined;
            role: import(".prisma/client").$Enums.UserRole;
            joinedAt: Date;
            reputation: {
                level: number;
                totalPoints: number;
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
    addModerator(userId: string, forumId: string, targetUserId: string): Promise<{
        id: string;
        userId: string;
        forumId: string;
        addedAt: Date;
        addedBy: string;
    }>;
    removeModerator(userId: string, forumId: string, targetUserId: string): Promise<{
        message: string;
    }>;
}
