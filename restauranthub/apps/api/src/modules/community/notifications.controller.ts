import { Controller, Get, Post, Put, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { CommunityNotificationService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('community/notifications')
@UseGuards(JwtAuthGuard)
export class CommunityNotificationController {
  constructor(
    private readonly notificationService: CommunityNotificationService,
  ) {}

  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('type') type?: string,
  ) {
    return this.notificationService.getUserNotifications(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      unreadOnly: unreadOnly === 'true',
      type,
    });
  }

  @Post('mark-read/:notificationId')
  async markNotificationRead(
    @Request() req: any,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.markNotificationRead(req.user.id, notificationId);
  }

  @Post('mark-all-read')
  async markAllNotificationsRead(@Request() req: any) {
    return this.notificationService.markAllNotificationsRead(req.user.id);
  }

  @Get('preferences')
  async getNotificationPreferences(@Request() req: any) {
    // This would get current preferences
    return {
      email: true,
      push: true,
      inApp: true,
      types: {
        POST_LIKED: true,
        POST_COMMENTED: true,
        USER_FOLLOWED: true,
        GROUP_ACTIVITY: true,
        REPUTATION_MILESTONE: true,
        WEEKLY_DIGEST: true,
      },
    };
  }

  @Put('preferences')
  async updateNotificationPreferences(
    @Request() req: any,
    @Body() preferences: {
      email?: boolean;
      push?: boolean;
      inApp?: boolean;
      types?: { [key: string]: boolean };
    },
  ) {
    return this.notificationService.updateNotificationPreferences(
      req.user.id,
      preferences,
    );
  }

  @Post('test/:type')
  async sendTestNotification(
    @Request() req: any,
    @Param('type') type: string,
  ) {
    // Only for testing purposes - would be removed in production
    const testNotifications: { [key: string]: any } = {
      like: {
        type: 'POST_LIKED',
        title: 'Test Notification',
        message: 'Someone liked your test post',
        actionUrl: '/community/posts/test',
        priority: 'LOW',
      },
      follow: {
        type: 'USER_FOLLOWED',
        title: 'Test Notification',
        message: 'Someone started following you',
        actionUrl: '/community/users/test',
        priority: 'MEDIUM',
      },
      milestone: {
        type: 'REPUTATION_MILESTONE',
        title: 'Test Notification',
        message: 'You reached a test milestone',
        actionUrl: '/community/reputation',
        priority: 'HIGH',
      },
    };

    const testData = testNotifications[type];
    if (!testData) {
      return { error: 'Invalid test type' };
    }

    return this.notificationService.sendNotification(req.user.id, testData);
  }
}