import { HttpStatus } from '@nestjs/common';
import { ForumService } from './forum.service';
import { CreateForumDto, UpdateForumDto } from './dto/create-forum.dto';
export declare class ForumController {
    private readonly forumService;
    constructor(forumService: ForumService);
    getForums(category?: string, search?: string, page?: string, limit?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        }[];
    }>;
    getForum(req: any, forumId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    createForum(req: any, createForumDto: CreateForumDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
    }>;
    updateForum(req: any, forumId: string, updateForumDto: UpdateForumDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
    }>;
    deleteForum(req: any, forumId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    joinForum(req: any, forumId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: string;
            userId: string;
            createdAt: Date;
            forumId: string;
        };
    }>;
    leaveForum(req: any, forumId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    getForumMembers(forumId: string, page?: string, limit?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    addModerator(req: any, forumId: string, userId: string, permissions: string[]): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: string;
            userId: string;
            forumId: string;
            addedAt: Date;
            addedBy: string;
        };
    }>;
    removeModerator(req: any, forumId: string, userId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
}
