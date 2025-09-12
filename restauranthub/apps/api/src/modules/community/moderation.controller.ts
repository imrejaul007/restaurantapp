import { Controller, Get, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ReportStatus, UserRole } from '@prisma/client';

@Controller('community/moderation')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('report')
  async reportContent(
    @Request() req: any,
    @Body() body: {
      contentId: string;
      contentType: 'POST' | 'COMMENT' | 'USER' | 'GROUP';
      reason: string;
      description?: string;
      category?: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'MISINFORMATION' | 'COPYRIGHT' | 'OTHER';
    },
  ) {
    return this.moderationService.reportContent(
      req.user.id,
      body.contentId,
      body.contentType,
      body.reason,
      body.description,
      body.category,
    );
  }

  @Get('reports')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getReports(
    @Query('status') status?: ReportStatus,
    @Query('contentType') contentType?: 'POST' | 'COMMENT' | 'USER' | 'GROUP',
    @Query('category') category?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.moderationService.getReports({
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Post('moderate/:reportId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async moderateContent(
    @Request() req: any,
    @Param('reportId') reportId: string,
    @Body() body: {
      action: 'APPROVE' | 'REMOVE' | 'WARN' | 'SUSPEND' | 'BAN';
      reason?: string;
      durationDays?: number;
    },
  ) {
    return this.moderationService.moderateContent(
      req.user.id,
      reportId,
      body.action,
      body.reason,
      body.durationDays,
    );
  }

  @Post('check-spam')
  async checkSpam(
    @Body() body: {
      content: string;
      metadata?: {
        authorId?: string;
        authorReputation?: number;
        authorAge?: number;
        postFrequency?: number;
      };
    },
  ) {
    return this.moderationService.detectSpam(body.content, body.metadata);
  }

  @Post('check-safety')
  async checkSafety(@Body() body: { content: string }) {
    return this.moderationService.checkContentSafety(body.content);
  }

  @Get('safety-profile/:userId?')
  async getSafetyProfile(
    @Request() req: any,
    @Param('userId') targetUserId?: string,
  ) {
    // Users can view their own profile, admins can view any profile
    const userId = targetUserId || req.user.id;
    
    if (targetUserId && targetUserId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden');
    }

    return this.moderationService.getUserSafetyProfile(userId);
  }

  @Post('block/:userId')
  async blockUser(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.moderationService.blockUser(req.user.id, userId, body.reason);
  }

  @Get('my-reports')
  async getMyReports(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Get reports submitted by the current user
    return this.moderationService.getReports({
      // This would need to be modified to filter by reporter
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }
}