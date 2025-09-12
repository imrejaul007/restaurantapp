import { PostType, PostVisibility } from '@prisma/client';
export declare class CreatePostDto {
    title: string;
    content: string;
    forumId: string;
    type?: PostType;
    visibility?: PostVisibility;
    tags?: string[];
    isPinned?: boolean;
    attachments?: string[];
    images?: string[];
}
export declare class UpdatePostDto {
    title?: string;
    content?: string;
    tags?: string[];
    attachments?: any[];
}
export declare class CreateReplyDto {
    content: string;
    parentId?: string;
}
export declare class ReportPostDto {
    reason: string;
    description?: string;
}
