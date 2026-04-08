import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommunityService, CreateForumPostDto, UpdateForumPostDto, CreateCommentDto, PostFiltersDto } from './community.service';
import { SuggestionRating } from '@prisma/client';

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  // Forum endpoints
  @Get('forums')
  async getForums() {
    return this.communityService.getForums();
  }

  @Get('forums/:id')
  async getForum(@Param('id') id: string) {
    return this.communityService.getForum(id);
  }

  // Post endpoints
  @Get('posts')
  async getPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('forumId') forumId?: string,
    @Query('type') type?: string,
    @Query('visibility') visibility?: string,
    @Query('authorId') authorId?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ) {
    const filters: PostFiltersDto = {
      forumId,
      type: type as any,
      visibility: visibility as any,
      authorId,
      tags: tags ? tags.split(',') : undefined,
      search,
      sortBy: sortBy as any,
      sortOrder
    };
    return this.communityService.getPosts(filters, page, limit);
  }

  @Get('posts/:id')
  async getPost(@Param('id') id: string, @Request() req: any) {
    return this.communityService.getPost(id, req.user?.id);
  }

  @Post('posts')
  async createPost(@Body() data: CreateForumPostDto, @Request() req: any) {
    return this.communityService.createPost(req.user.id, data);
  }

  @Put('posts/:id')
  async updatePost(
    @Param('id') id: string,
    @Body() data: UpdateForumPostDto,
    @Request() req: any
  ) {
    return this.communityService.updatePost(id, req.user.id, data);
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string, @Request() req: any) {
    return this.communityService.deletePost(id, req.user.id);
  }

  // Comment endpoints
  @Post('posts/:postId/comments')
  async createComment(
    @Param('postId') postId: string,
    @Body() data: CreateCommentDto,
    @Request() req: any
  ) {
    return this.communityService.createComment(postId, req.user.id, data);
  }

  @Put('comments/:commentId')
  async updateComment(
    @Param('commentId') commentId: string,
    @Body('content') content: string,
    @Request() req: any
  ) {
    return this.communityService.updateComment(commentId, req.user.id, content);
  }

  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string, @Request() req: any) {
    return this.communityService.deleteComment(commentId, req.user.id);
  }

  // Like endpoints
  @Post('posts/:postId/like')
  async togglePostLike(@Param('postId') postId: string, @Request() req: any) {
    return this.communityService.togglePostLike(postId, req.user.id);
  }

  @Post('comments/:commentId/like')
  async toggleCommentLike(@Param('commentId') commentId: string, @Request() req: any) {
    return this.communityService.toggleCommentLike(commentId, req.user.id);
  }

  // Bookmark endpoints
  @Post('posts/:postId/bookmark')
  async togglePostBookmark(@Param('postId') postId: string, @Request() req: any) {
    return this.communityService.togglePostBookmark(postId, req.user.id);
  }

  // Share endpoints
  @Post('posts/:postId/share')
  async sharePost(
    @Param('postId') postId: string,
    @Body('platform') platform: string,
    @Request() req: any
  ) {
    return this.communityService.sharePost(postId, req.user.id, platform);
  }

  // Vendor suggestion endpoints
  @Post('posts/:postId/suggest-vendor')
  async suggestVendor(
    @Param('postId') postId: string,
    @Body('vendorId') vendorId: string,
    @Body('reason') reason: string,
    @Request() req: any
  ) {
    return this.communityService.suggestVendor(postId, req.user.id, vendorId, reason);
  }

  @Post('vendor-suggestions/:suggestionId/rate')
  async rateVendorSuggestion(
    @Param('suggestionId') suggestionId: string,
    @Body('rating') rating: SuggestionRating,
    @Request() req: any
  ) {
    return this.communityService.rateVendorSuggestion(suggestionId, req.user.id, rating);
  }

  // User stats endpoints
  @Get('users/:userId/stats')
  async getUserCommunityStats(@Param('userId') userId: string) {
    return this.communityService.getUserCommunityStats(userId);
  }

  @Get('my-stats')
  async getMyCommunityStats(@Request() req: any) {
    return this.communityService.getUserCommunityStats(req.user.id);
  }

  // Trending endpoints
  @Get('trending')
  async getTrendingPosts(
    @Query('period', new DefaultValuePipe('weekly')) period: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.communityService.getTrendingPosts(period, limit);
  }

  // Legacy endpoint for backward compatibility
  @Get('posts-legacy')
  async getCommunityPosts() {
    return this.communityService.getCommunityPosts();
  }
}