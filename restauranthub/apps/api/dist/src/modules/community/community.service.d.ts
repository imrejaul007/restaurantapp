import { DatabaseService } from '../database/database.service';
export declare class CommunityService {
    private readonly databaseService;
    private readonly logger;
    constructor(databaseService: DatabaseService);
    getCommunityOverview(userId: string): Promise<{
        recentPosts: {
            author: {
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.UserRole;
                avatar: string | null | undefined;
                verified: boolean;
            };
            engagement: {
                likes: number;
                comments: number;
                shares: number;
                views: number;
            };
            _count: {
                comments: number;
                likes: number;
                shares: number;
            };
            forum: {
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
            };
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            tags: string[];
            deletedAt: Date | null;
            title: string;
            type: import(".prisma/client").$Enums.PostType;
            slug: string;
            content: string;
            visibility: import(".prisma/client").$Enums.PostVisibility;
            images: string[];
            attachments: string[];
            viewCount: number;
            likeCount: number;
            shareCount: number;
            commentCount: number;
            isPinned: boolean;
            isLocked: boolean;
            isFeatured: boolean;
            isDeleted: boolean;
            forumId: string;
        }[];
        forums: {
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
        stats: {
            totalPosts: number;
            totalMembers: number;
            activeForums: number;
        };
    }>;
    getUserActivity(userId: string, targetUserId?: string): Promise<{
        user: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            avatar: string | null | undefined;
            verified: boolean;
            joinedAt: Date;
            reputation: {
                id: string;
                userId: string;
                updatedAt: Date;
                totalPoints: number;
                level: number;
                postsCreated: number;
                commentsCreated: number;
                likesReceived: number;
                sharesReceived: number;
                helpfulSuggestions: number;
                bestSuggestions: number;
                badgeCount: number;
            } | {
                totalPoints: number;
                level: number;
                badgeCount: number;
            };
        };
        forumPosts: {
            engagement: {
                likes: number;
                comments: number;
                shares: number;
                views: number;
            };
            _count: {
                comments: number;
                likes: number;
                shares: number;
            };
            forum: {
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
            };
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            tags: string[];
            deletedAt: Date | null;
            title: string;
            type: import(".prisma/client").$Enums.PostType;
            slug: string;
            content: string;
            visibility: import(".prisma/client").$Enums.PostVisibility;
            images: string[];
            attachments: string[];
            viewCount: number;
            likeCount: number;
            shareCount: number;
            commentCount: number;
            isPinned: boolean;
            isLocked: boolean;
            isFeatured: boolean;
            isDeleted: boolean;
            forumId: string;
        }[];
        comments: ({
            _count: {
                likes: number;
            };
            post: {
                forum: {
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
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                tags: string[];
                deletedAt: Date | null;
                title: string;
                type: import(".prisma/client").$Enums.PostType;
                slug: string;
                content: string;
                visibility: import(".prisma/client").$Enums.PostVisibility;
                images: string[];
                attachments: string[];
                viewCount: number;
                likeCount: number;
                shareCount: number;
                commentCount: number;
                isPinned: boolean;
                isLocked: boolean;
                isFeatured: boolean;
                isDeleted: boolean;
                forumId: string;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            content: string;
            likeCount: number;
            isDeleted: boolean;
            postId: string;
            parentId: string | null;
        })[];
        stats: {
            totalPosts: number;
            totalComments: number;
            totalLikesReceived: number;
            joinedForums: number;
        };
    }>;
    searchCommunity(params: {
        query?: string;
        type?: 'posts' | 'forums' | 'users';
        category?: string;
        userId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        results: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
        type: "posts" | "users" | "forums";
    }>;
    getCommunityStats(userId: string, timeframe?: 'day' | 'week' | 'month' | 'year'): Promise<{
        timeframe: "day" | "week" | "month" | "year";
        period: {
            startDate: Date;
            endDate: Date;
        };
        stats: {
            newPosts: number;
            newComments: number;
            newMembers: number;
            totalEngagement: number;
            totalLikes: number;
            totalShares: number;
        };
        trendingTags: {
            tag: string;
            score: number;
            postCount: number;
        }[];
    }>;
    reportContent(userId: string, contentId: string, contentType: 'post' | 'comment' | 'message', reason: string, description?: string): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.ReportStatus;
        description: string | null;
        postId: string;
        reason: string;
        reviewedAt: Date | null;
        reporterId: string;
        reviewedBy: string | null;
    } | {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.ReportStatus;
        description: string | null;
        commentId: string;
        reason: string;
        reviewedAt: Date | null;
        reporterId: string;
        reviewedBy: string | null;
    }>;
}
