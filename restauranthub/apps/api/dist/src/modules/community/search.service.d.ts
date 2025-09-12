import { DatabaseService } from '../database/database.service';
import { PostType, UserRole } from '@prisma/client';
export interface SearchFilters {
    query?: string;
    type?: 'all' | 'posts' | 'users' | 'groups' | 'forums';
    category?: string;
    tags?: string[];
    authorRole?: UserRole;
    postType?: PostType;
    city?: string;
    timeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
    sortBy?: 'relevance' | 'recent' | 'popular' | 'trending';
    minReputation?: number;
    verified?: boolean;
    page?: number;
    limit?: number;
}
export declare class SearchService {
    private readonly databaseService;
    private readonly logger;
    constructor(databaseService: DatabaseService);
    universalSearch(userId: string, filters: SearchFilters): Promise<any>;
    private searchPosts;
    private searchUsers;
    private searchGroups;
    private searchForums;
    getTrendingContent(userId: string, params: {
        timeframe?: 'day' | 'week' | 'month';
        type?: 'posts' | 'users' | 'tags' | 'all';
        category?: string;
        limit?: number;
    }): Promise<any>;
    private getTrendingPosts;
    private getTrendingUsers;
    private getTrendingTags;
    getPersonalizedFeed(userId: string, params: {
        page?: number;
        limit?: number;
    }): Promise<any>;
    private getPersonalizationReason;
    private logSearch;
    private calculateRelevanceScore;
    private getTimeRange;
}
