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
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PostsService } from './posts.service';
import { PostCreationLimit, LikeActionLimit, CommentLimit } from './decorators/rate-limit.decorator';
import { CachePostsList } from './decorators/cache.decorator';
import { PostValidationPipe, CommentValidationPipe } from './pipes/validation.pipe';
import { UseInterceptors, UsePipes } from '@nestjs/common';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { CreatePostDto, UpdatePostDto, CreateReplyDto, ReportPostDto } from './dto/create-post.dto';

@ApiTags('posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@UseInterceptors(PerformanceInterceptor)
@ApiBearerAuth()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @CachePostsList(300) // Cache for 5 minutes
  @ApiOperation({ summary: 'Get posts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Posts retrieved successfully' })
  async getPosts(
    @Query('forumId') forumId?: string,
    @Query('userId') userId?: string,
    @Query('search') search?: string,
    @Query('tags') tags?: string,
    @Query('sortBy') sortBy?: 'latest' | 'popular' | 'mostReplies',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const posts = await this.postsService.getPosts({
      forumId,
      userId,
      search,
      tags: tags ? tags.split(',') : undefined,
      sortBy,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Posts retrieved successfully',
      data: posts,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post retrieved successfully' })
  async getPost(@Request() req: any, @Param('id') postId: string) {
    const post = await this.postsService.getPost(postId, req.user?.id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Post retrieved successfully',
      data: post,
    };
  }

  @Post()
  @PostCreationLimit()
  @UsePipes(PostValidationPipe)
  @ApiOperation({ summary: 'Create new post' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Post created successfully' })
  async createPost(
    @Request() req: any,
    @Body() createPostDto: CreatePostDto,
  ) {
    const post = await this.postsService.createPost(req.user.id, createPostDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Post created successfully',
      data: post,
    };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Update post' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post updated successfully' })
  async updatePost(
    @Request() req: any,
    @Param('id') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    const post = await this.postsService.updatePost(req.user.id, postId, updatePostDto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Post updated successfully',
      data: post,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Delete post' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post deleted successfully' })
  async deletePost(@Request() req: any, @Param('id') postId: string) {
    const result = await this.postsService.deletePost(req.user.id, postId);
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Post(':id/like')
  @LikeActionLimit()
  @ApiOperation({ summary: 'Like post' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post liked successfully' })
  async likePost(@Request() req: any, @Param('id') postId: string) {
    const like = await this.postsService.likePost(req.user.id, postId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Post liked successfully',
      data: like,
    };
  }

  @Delete(':id/like')
  @LikeActionLimit()
  @ApiOperation({ summary: 'Unlike post' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post unliked successfully' })
  async unlikePost(@Request() req: any, @Param('id') postId: string) {
    const result = await this.postsService.unlikePost(req.user.id, postId);
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Post(':id/bookmark')
  @ApiOperation({ summary: 'Bookmark post' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post bookmarked successfully' })
  async bookmarkPost(@Request() req: any, @Param('id') postId: string) {
    const bookmark = await this.postsService.bookmarkPost(req.user.id, postId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Post bookmarked successfully',
      data: bookmark,
    };
  }

  @Delete(':id/bookmark')
  @ApiOperation({ summary: 'Unbookmark post' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post unbookmarked successfully' })
  async unbookmarkPost(@Request() req: any, @Param('id') postId: string) {
    const result = await this.postsService.unbookmarkPost(req.user.id, postId);
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share post' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post shared successfully' })
  async sharePost(
    @Request() req: any, 
    @Param('id') postId: string,
    @Body('platform') platform?: string,
  ) {
    const share = await this.postsService.sharePost(req.user.id, postId, platform);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Post shared successfully',
      data: share,
    };
  }

  @Post(':id/report')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Report post' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Post reported successfully' })
  async reportPost(
    @Request() req: any,
    @Param('id') postId: string,
    @Body() reportPostDto: ReportPostDto,
  ) {
    const report = await this.postsService.reportPost(req.user.id, postId, reportPostDto.reason, reportPostDto.description);
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Post reported successfully',
      data: report,
    };
  }

  @Post(':id/replies')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create reply to post' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Reply created successfully' })
  async createReply(
    @Request() req: any,
    @Param('id') postId: string,
    @Body() createReplyDto: CreateReplyDto,
  ) {
    const reply = await this.postsService.createReply(req.user.id, postId, createReplyDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Reply created successfully',
      data: reply,
    };
  }

  @Get(':id/replies')
  @ApiOperation({ summary: 'Get post replies' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Replies retrieved successfully' })
  async getReplies(
    @Param('id') postId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const replies = await this.postsService.getReplies(postId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Replies retrieved successfully',
      data: replies,
    };
  }
}