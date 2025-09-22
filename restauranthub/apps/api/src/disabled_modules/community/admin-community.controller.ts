import { Controller, Get, Post, Put, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { AdminCommunityService } from './admin-community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ReportStatus } from '@prisma/client';

@Controller('admin/community')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCommunityController {
  constructor(private readonly adminCommunityService: AdminCommunityService) {}

  @Get('dashboard')
  async getCommunityDashboard(@Request() req: any) {
    return this.adminCommunityService.getCommunityDashboard(req.user.id);
  }

  @Get('analytics')
  async getCommunityAnalytics(
    @Request() req: any,
    @Query('timeframe') timeframe?: 'day' | 'week' | 'month' | 'quarter' | 'year',
    @Query('granularity') granularity?: 'hour' | 'day' | 'week' | 'month',
  ) {
    return this.adminCommunityService.getCommunityAnalytics(req.user.id, {
      timeframe,
      granularity,
    });
  }

  @Get('moderation-queue')
  async getContentModerationQueue(
    @Request() req: any,
    @Query('status') status?: ReportStatus,
    @Query('contentType') contentType?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminCommunityService.getContentModerationQueue(req.user.id, {
      status,
      contentType,
      priority,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('users')
  async getUserManagement(
    @Request() req: any,
    @Query('role') role?: UserRole,
    @Query('status') status?: 'active' | 'suspended' | 'banned',
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'recent' | 'reputation' | 'posts' | 'reports',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminCommunityService.getUserManagement(req.user.id, {
      role,
      status,
      search,
      sortBy,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('forums')
  async getForumManagement(@Request() req: any) {
    return this.adminCommunityService.getForumManagement(req.user.id);
  }

  @Put('forums/:forumId')
  async updateForumSettings(
    @Request() req: any,
    @Param('forumId') forumId: string,
    @Body() settings: {
      name?: string;
      description?: string;
      category?: string;
      icon?: string;
      color?: string;
      displayOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.adminCommunityService.updateForumSettings(
      req.user.id,
      forumId,
      settings,
    );
  }

  @Post('users/:userId/suspend')
  async suspendUser(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() body: {
      reason: string;
      durationDays?: number;
      notifyUser?: boolean;
    },
  ) {
    return this.adminCommunityService.suspendUser(req.user.id, userId, body);
  }

  @Post('users/:userId/unsuspend')
  async unsuspendUser(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
  ) {
    // This would be implemented in the admin service
    return {
      message: 'User unsuspension functionality to be implemented',
      userId,
      reason: body.reason,
    };
  }

  @Post('forums')
  async createForum(
    @Request() req: any,
    @Body() forumData: {
      name: string;
      slug?: string;
      description?: string;
      category: string;
      icon?: string;
      color?: string;
      displayOrder?: number;
    },
  ) {
    // This would use the existing ForumService.createForum method
    return {
      message: 'Forum creation via admin panel to be implemented',
      forumData,
    };
  }

  @Get('statistics')
  async getCommunityStatistics(
    @Request() req: any,
    @Query('period') period?: 'today' | 'week' | 'month' | 'year',
  ) {
    // Advanced statistics endpoint
    return {
      message: 'Advanced community statistics to be implemented',
      period: period || 'month',
    };
  }

  @Get('export')
  async exportCommunityData(
    @Request() req: any,
    @Query('type') type?: 'users' | 'posts' | 'reports' | 'all',
    @Query('format') format?: 'csv' | 'json' | 'excel',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    // Data export functionality
    return {
      message: 'Community data export functionality to be implemented',
      exportParams: {
        type: type || 'all',
        format: format || 'csv',
        dateFrom,
        dateTo,
      },
    };
  }

  @Post('bulk-actions')
  async performBulkAction(
    @Request() req: any,
    @Body() body: {
      action: 'delete' | 'suspend' | 'approve' | 'reject';
      targetType: 'users' | 'posts' | 'comments' | 'reports';
      targetIds: string[];
      reason?: string;
      durationDays?: number;
    },
  ) {
    // Bulk operations for admin efficiency
    return {
      message: 'Bulk action functionality to be implemented',
      action: body.action,
      targetType: body.targetType,
      affectedCount: body.targetIds.length,
    };
  }

  @Get('audit-log')
  async getAuditLog(
    @Request() req: any,
    @Query('moderatorId') moderatorId?: string,
    @Query('action') action?: string,
    @Query('contentType') contentType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Audit trail for all moderation actions
    return {
      message: 'Moderation audit log to be implemented',
      filters: {
        moderatorId,
        action,
        contentType,
        dateFrom,
        dateTo,
      },
      pagination: {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
      },
    };
  }
}