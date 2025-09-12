import { Controller, Get, Query, UseGuards, Request, UseInterceptors, UsePipes } from '@nestjs/common';
import { SearchService, SearchFilters } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostType, UserRole } from '@prisma/client';
import { SearchLimit } from './decorators/rate-limit.decorator';
import { CacheSearchResults } from './decorators/cache.decorator';
import { SearchValidationPipe } from './pipes/validation.pipe';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';

@Controller('community/search')
@UseGuards(JwtAuthGuard)
@UseInterceptors(PerformanceInterceptor)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @SearchLimit()
  @CacheSearchResults(600)
  @UsePipes(SearchValidationPipe)
  async universalSearch(
    @Request() req: any,
    @Query('query') query?: string,
    @Query('type') type?: 'all' | 'posts' | 'users' | 'groups' | 'forums',
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('authorRole') authorRole?: UserRole,
    @Query('postType') postType?: PostType,
    @Query('city') city?: string,
    @Query('timeframe') timeframe?: 'day' | 'week' | 'month' | 'year' | 'all',
    @Query('sortBy') sortBy?: 'relevance' | 'recent' | 'popular' | 'trending',
    @Query('minReputation') minReputation?: string,
    @Query('verified') verified?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: SearchFilters = {
      query,
      type: type || 'all',
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
      authorRole,
      postType,
      city,
      timeframe: timeframe || 'all',
      sortBy: sortBy || 'relevance',
      minReputation: minReputation ? parseInt(minReputation) : undefined,
      verified: verified ? verified === 'true' : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    };

    return this.searchService.universalSearch(req.user.id, filters);
  }

  @Get('trending')
  async getTrendingContent(
    @Request() req: any,
    @Query('timeframe') timeframe?: 'day' | 'week' | 'month',
    @Query('type') type?: 'posts' | 'users' | 'tags' | 'all',
    @Query('category') category?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.getTrendingContent(req.user.id, {
      timeframe: timeframe || 'week',
      type: type || 'all',
      category,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get('feed')
  async getPersonalizedFeed(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.getPersonalizedFeed(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('suggestions')
  async getSearchSuggestions(
    @Query('query') query?: string,
    @Query('type') type?: 'tags' | 'users' | 'forums' | 'all',
  ) {
    // This would implement search auto-complete functionality
    // For now, return empty suggestions
    return {
      query,
      type: type || 'all',
      suggestions: [],
    };
  }
}