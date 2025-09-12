import { HttpStatus } from '@nestjs/common';
import { CommunityService } from './community.service';
export declare class CommunityController {
    private readonly communityService;
    constructor(communityService: CommunityService);
    getCommunityOverview(req: any): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
                forum: {
                    id: string;
                    slug: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    isActive: boolean;
                    description: string | null;
                    category: string;
                    icon: string | null;
                    color: string | null;
                    memberCount: number;
                    postCount: number;
                    displayOrder: number;
                };
                _count: {
                    comments: number;
                    likes: number;
                    shares: number;
                };
                id: string;
                forumId: string;
                userId: string;
                title: string;
                content: string;
                type: import(".prisma/client").$Enums.PostType;
                visibility: import(".prisma/client").$Enums.PostVisibility;
                slug: string;
                images: string[];
                attachments: string[];
                tags: string[];
                viewCount: number;
                likeCount: number;
                shareCount: number;
                commentCount: number;
                isPinned: boolean;
                isLocked: boolean;
                isFeatured: boolean;
                isDeleted: boolean;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            forums: {
                id: string;
                slug: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                description: string | null;
                category: string;
                icon: string | null;
                color: string | null;
                memberCount: number;
                postCount: number;
                displayOrder: number;
            }[];
            stats: {
                totalPosts: number;
                totalMembers: number;
                activeForums: number;
            };
        };
    }>;
    searchCommunity(query?: string, type?: 'posts' | 'forums' | 'users', category?: string, userId?: string, page?: string, limit?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            results: any[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
                hasNext: boolean;
                hasPrev: boolean;
            };
            type: "posts" | "forums" | "users";
        };
    }>;
    getCommunityStats(req: any, timeframe?: 'day' | 'week' | 'month' | 'year'): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    getUserActivity(req: any, userId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
                forum: {
                    id: string;
                    slug: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    isActive: boolean;
                    description: string | null;
                    category: string;
                    icon: string | null;
                    color: string | null;
                    memberCount: number;
                    postCount: number;
                    displayOrder: number;
                };
                _count: {
                    comments: number;
                    likes: number;
                    shares: number;
                };
                id: string;
                forumId: string;
                userId: string;
                title: string;
                content: string;
                type: import(".prisma/client").$Enums.PostType;
                visibility: import(".prisma/client").$Enums.PostVisibility;
                slug: string;
                images: string[];
                attachments: string[];
                tags: string[];
                viewCount: number;
                likeCount: number;
                shareCount: number;
                commentCount: number;
                isPinned: boolean;
                isLocked: boolean;
                isFeatured: boolean;
                isDeleted: boolean;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            comments: ({
                _count: {
                    likes: number;
                };
                post: {
                    forum: {
                        id: string;
                        slug: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        isActive: boolean;
                        description: string | null;
                        category: string;
                        icon: string | null;
                        color: string | null;
                        memberCount: number;
                        postCount: number;
                        displayOrder: number;
                    };
                } & {
                    id: string;
                    forumId: string;
                    userId: string;
                    title: string;
                    content: string;
                    type: import(".prisma/client").$Enums.PostType;
                    visibility: import(".prisma/client").$Enums.PostVisibility;
                    slug: string;
                    images: string[];
                    attachments: string[];
                    tags: string[];
                    viewCount: number;
                    likeCount: number;
                    shareCount: number;
                    commentCount: number;
                    isPinned: boolean;
                    isLocked: boolean;
                    isFeatured: boolean;
                    isDeleted: boolean;
                    deletedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                userId: string;
                content: string;
                likeCount: number;
                isDeleted: boolean;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                postId: string;
                parentId: string | null;
            })[];
            stats: {
                totalPosts: number;
                totalComments: number;
                totalLikesReceived: number;
                joinedForums: number;
            };
        };
    }>;
    getMyActivity(req: any): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
                forum: {
                    id: string;
                    slug: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    isActive: boolean;
                    description: string | null;
                    category: string;
                    icon: string | null;
                    color: string | null;
                    memberCount: number;
                    postCount: number;
                    displayOrder: number;
                };
                _count: {
                    comments: number;
                    likes: number;
                    shares: number;
                };
                id: string;
                forumId: string;
                userId: string;
                title: string;
                content: string;
                type: import(".prisma/client").$Enums.PostType;
                visibility: import(".prisma/client").$Enums.PostVisibility;
                slug: string;
                images: string[];
                attachments: string[];
                tags: string[];
                viewCount: number;
                likeCount: number;
                shareCount: number;
                commentCount: number;
                isPinned: boolean;
                isLocked: boolean;
                isFeatured: boolean;
                isDeleted: boolean;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            comments: ({
                _count: {
                    likes: number;
                };
                post: {
                    forum: {
                        id: string;
                        slug: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        isActive: boolean;
                        description: string | null;
                        category: string;
                        icon: string | null;
                        color: string | null;
                        memberCount: number;
                        postCount: number;
                        displayOrder: number;
                    };
                } & {
                    id: string;
                    forumId: string;
                    userId: string;
                    title: string;
                    content: string;
                    type: import(".prisma/client").$Enums.PostType;
                    visibility: import(".prisma/client").$Enums.PostVisibility;
                    slug: string;
                    images: string[];
                    attachments: string[];
                    tags: string[];
                    viewCount: number;
                    likeCount: number;
                    shareCount: number;
                    commentCount: number;
                    isPinned: boolean;
                    isLocked: boolean;
                    isFeatured: boolean;
                    isDeleted: boolean;
                    deletedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                userId: string;
                content: string;
                likeCount: number;
                isDeleted: boolean;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                postId: string;
                parentId: string | null;
            })[];
            stats: {
                totalPosts: number;
                totalComments: number;
                totalLikesReceived: number;
                joinedForums: number;
            };
        };
    }>;
    reportContent(req: any, contentId: string, contentType: 'post' | 'comment' | 'message', reason: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
            reason: string;
            reviewedAt: Date | null;
            reporterId: string;
            reviewedBy: string | null;
            commentId: string;
        };
    }>;
}
