import { SearchService } from './search.service';
import { PostType, UserRole } from '@prisma/client';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    universalSearch(req: any, query?: string, type?: 'all' | 'posts' | 'users' | 'groups' | 'forums', category?: string, tags?: string, authorRole?: UserRole, postType?: PostType, city?: string, timeframe?: 'day' | 'week' | 'month' | 'year' | 'all', sortBy?: 'relevance' | 'recent' | 'popular' | 'trending', minReputation?: string, verified?: string, page?: string, limit?: string): Promise<any>;
    getTrendingContent(req: any, timeframe?: 'day' | 'week' | 'month', type?: 'posts' | 'users' | 'tags' | 'all', category?: string, limit?: string): Promise<any>;
    getPersonalizedFeed(req: any, page?: string, limit?: string): Promise<any>;
    getSearchSuggestions(query?: string, type?: 'tags' | 'users' | 'forums' | 'all'): Promise<{
        query: string | undefined;
        type: "tags" | "all" | "users" | "forums";
        suggestions: never[];
    }>;
}
