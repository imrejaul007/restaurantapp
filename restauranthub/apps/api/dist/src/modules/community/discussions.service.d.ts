import { DatabaseService } from '../database/database.service';
import { WebsocketService } from '../websocket/websocket.service';
export declare class DiscussionsService {
    private readonly databaseService;
    private readonly websocketService;
    private readonly logger;
    constructor(databaseService: DatabaseService, websocketService: WebsocketService);
    createDiscussion(userId: string, discussionData: any): Promise<void>;
    getAllDiscussions(filters?: any, pagination?: any): Promise<void>;
    getDiscussionById(discussionId: string): Promise<void>;
    joinDiscussion(userId: string, discussionId: string): Promise<void>;
    leaveDiscussion(userId: string, discussionId: string): Promise<{
        message: string;
    }>;
    updateDiscussion(userId: string, discussionId: string, updateData: any): Promise<void>;
    deleteDiscussion(userId: string, discussionId: string): Promise<{
        message: string;
    }>;
    sendMessage(userId: string, discussionId: string, messageData: any): Promise<void>;
    getMessages(discussionId: string, filters?: any, pagination?: any): Promise<void>;
    closeDiscussion(userId: string, discussionId: string): Promise<void>;
    archiveDiscussion(userId: string, discussionId: string): Promise<void>;
}
