import { HttpStatus } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, CreateReplyDto, ReportPostDto } from './dto/create-post.dto';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    getPosts(forumId?: string, userId?: string, search?: string, tags?: string, sortBy?: 'latest' | 'popular' | 'mostReplies', page?: string, limit?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    getPost(req: any, postId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    createPost(req: any, createPostDto: CreatePostDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    updatePost(req: any, postId: string, updatePostDto: UpdatePostDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    deletePost(req: any, postId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    likePost(req: any, postId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: string;
            userId: string;
            createdAt: Date;
            postId: string;
        };
    }>;
    unlikePost(req: any, postId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    bookmarkPost(req: any, postId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: string;
            userId: string;
            createdAt: Date;
            postId: string;
        };
    }>;
    unbookmarkPost(req: any, postId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    sharePost(req: any, postId: string, platform?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: string;
            userId: string;
            createdAt: Date;
            postId: string;
            platform: string | null;
        };
    }>;
    reportPost(req: any, postId: string, reportPostDto: ReportPostDto): Promise<{
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
        };
    }>;
    createReply(req: any, postId: string, createReplyDto: CreateReplyDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    getReplies(postId: string, page?: string, limit?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
}
