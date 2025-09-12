import { DatabaseService } from '../database/database.service';
import { PostType, PostVisibility } from '@prisma/client';
import { ReputationService } from './reputation.service';
import { CommunityNotificationService } from './notifications.service';
export declare class PostsService {
    private readonly databaseService;
    private readonly reputationService;
    private readonly notificationService;
    private readonly logger;
    constructor(databaseService: DatabaseService, reputationService: ReputationService, notificationService: CommunityNotificationService);
    createPost(userId: string, postData: {
        title: string;
        content: string;
        forumId: string;
        type?: PostType;
        visibility?: PostVisibility;
        tags?: string[];
        isPinned?: boolean;
        attachments?: string[];
        images?: string[];
    }): Promise<{
        author: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            avatar: string | null | undefined;
            verified: boolean;
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
    }>;
    getPosts(params: {
        forumId?: string;
        userId?: string;
        search?: string;
        tags?: string[];
        type?: PostType;
        visibility?: PostVisibility;
        sortBy?: 'latest' | 'popular' | 'mostReplies' | 'trending';
        page?: number;
        limit?: number;
    }): Promise<{
        posts: {
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
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    getPost(postId: string, userId?: string): Promise<{
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
            bookmarks: number;
            views: number;
            isLiked: boolean;
            isBookmarked: boolean;
        };
        comments: {
            author: {
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.UserRole;
                avatar: string | null | undefined;
                verified: boolean;
            };
            isLiked: boolean;
            totalLikes: number;
            totalReplies: number;
            _count: {
                likes: number;
                replies: number;
            };
            likes: {
                id: string;
                userId: string;
                createdAt: Date;
                commentId: string;
            }[];
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
        }[];
        _count: {
            comments: number;
            likes: number;
            bookmarks: number;
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
        likes: {
            id: string;
            userId: string;
            createdAt: Date;
            postId: string;
        }[];
        bookmarks: {
            id: string;
            userId: string;
            createdAt: Date;
            postId: string;
        }[];
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
    }>;
    updatePost(userId: string, postId: string, updateData: {
        title?: string;
        content?: string;
        tags?: string[];
        attachments?: string[];
        images?: string[];
    }): Promise<{
        author: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            avatar: string | null | undefined;
            verified: boolean;
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
    }>;
    deletePost(userId: string, postId: string): Promise<{
        message: string;
    }>;
    likePost(userId: string, postId: string): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        postId: string;
    }>;
    unlikePost(userId: string, postId: string): Promise<{
        message: string;
    }>;
    bookmarkPost(userId: string, postId: string): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        postId: string;
    }>;
    unbookmarkPost(userId: string, postId: string): Promise<{
        message: string;
    }>;
    sharePost(userId: string, postId: string, platform?: string): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        postId: string;
        platform: string | null;
    }>;
    createReply(userId: string, postId: string, replyData: {
        content: string;
        parentId?: string;
    }): Promise<{
        author: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            avatar: string | null | undefined;
            verified: boolean;
        };
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
    }>;
    getReplies(postId: string, params: {
        parentId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        replies: {
            author: {
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.UserRole;
                avatar: string | null | undefined;
                verified: boolean;
            };
            totalLikes: number;
            totalReplies: number;
            _count: {
                likes: number;
                replies: number;
            };
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
    reportPost(userId: string, postId: string, reason: string, description?: string): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.ReportStatus;
        description: string | null;
        postId: string;
        reason: string;
        reviewedAt: Date | null;
        reporterId: string;
        reviewedBy: string | null;
    }>;
    private updateUserReputation;
}
