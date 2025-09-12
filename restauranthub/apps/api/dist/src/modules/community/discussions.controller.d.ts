import { HttpStatus } from '@nestjs/common';
import { DiscussionsService } from './discussions.service';
export declare class DiscussionsController {
    private readonly discussionsService;
    constructor(discussionsService: DiscussionsService);
    getDiscussions(req: any, type?: 'private' | 'group' | 'public', search?: string, status?: 'active' | 'archived', page?: string, limit?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: void;
    }>;
    getDiscussion(req: any, discussionId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: void;
    }>;
    createDiscussion(req: any, title: string, description?: string, type?: 'private' | 'group' | 'public', participantIds?: string[], maxParticipants?: number): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: void;
    }>;
    updateDiscussion(req: any, discussionId: string, title?: string, description?: string, maxParticipants?: number, isActive?: boolean): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: void;
    }>;
    deleteDiscussion(req: any, discussionId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    joinDiscussion(req: any, discussionId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: void;
    }>;
    leaveDiscussion(req: any, discussionId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    sendMessage(req: any, discussionId: string, content: string, type?: 'text' | 'image' | 'file', attachments?: any[]): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: void;
    }>;
    getMessages(req: any, discussionId: string, page?: string, limit?: string, before?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: void;
    }>;
}
