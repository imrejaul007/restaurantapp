import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommunityService } from './community.service';
// import * as sanitizeHtml from 'sanitize-html';

// XSS sanitization configuration
const SANITIZE_OPTIONS = {
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
  allowedSchemes: [],
};

@ApiTags('community')
@Controller('community')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get community overview' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Community overview retrieved successfully' })
  async getCommunityOverview(@Request() req: any) {
    const data = await this.communityService.getCommunityOverview(req.user.id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Community overview retrieved successfully',
      data,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search community content' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results retrieved successfully' })
  async searchCommunity(
    @Query('query') query?: string,
    @Query('type') type?: 'posts' | 'forums' | 'users',
    @Query('category') category?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const results = await this.communityService.searchCommunity({
      query,
      type,
      category,
      userId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Search results retrieved successfully',
      data: results,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get community statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Community statistics retrieved successfully' })
  async getCommunityStats(
    @Request() req: any,
    @Query('timeframe') timeframe?: 'day' | 'week' | 'month' | 'year',
  ) {
    const stats = await this.communityService.getCommunityStats(req.user.id, timeframe);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Community statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('users/:id/activity')
  @ApiOperation({ summary: 'Get user activity in community' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User activity retrieved successfully' })
  async getUserActivity(@Request() req: any, @Param('id') userId: string) {
    const activity = await this.communityService.getUserActivity(req.user.id, userId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'User activity retrieved successfully',
      data: activity,
    };
  }

  @Get('my-activity')
  @ApiOperation({ summary: 'Get my community activity' })
  @ApiResponse({ status: HttpStatus.OK, description: 'My activity retrieved successfully' })
  async getMyActivity(@Request() req: any) {
    const activity = await this.communityService.getUserActivity(req.user.id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'My activity retrieved successfully',
      data: activity,
    };
  }

  @Post('report')
  @ApiOperation({ summary: 'Report content' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Content reported successfully' })
  async reportContent(
    @Request() req: any,
    @Body('contentId') contentId: string,
    @Body('contentType') contentType: 'post' | 'comment' | 'message',
    @Body('reason') reason: string,
  ) {
    // Sanitize reason to prevent XSS (simplified for development)
    const sanitizedReason = reason.replace(/<[^>]*>/g, '');
    
    const report = await this.communityService.reportContent(req.user.id, contentId, contentType, sanitizedReason);
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Content reported successfully',
      data: report,
    };
  }
}