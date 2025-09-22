import { Controller, Get, Post, Query, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

@Controller('community/reputation')
@UseGuards(JwtAuthGuard)
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get('profile/:userId?')
  async getUserReputation(
    @Request() req: any,
    @Param('userId') targetUserId?: string,
  ) {
    const userId = targetUserId || req.user.id;
    return this.reputationService.getUserReputation(userId);
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Query('timeframe') timeframe?: 'day' | 'week' | 'month' | 'all',
    @Query('city') city?: string,
    @Query('role') role?: UserRole,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.reputationService.getLeaderboard({
      timeframe: timeframe || 'all',
      city,
      role,
      limit: limit ? parseInt(limit) : 20,
      page: page ? parseInt(page) : 1,
    });
  }

  @Get('trending')
  async getTrendingContributors(
    @Query('timeframe') timeframe?: 'day' | 'week' | 'month',
    @Query('limit') limit?: string,
  ) {
    return this.reputationService.getTrendingContributors(
      timeframe || 'week',
      limit ? parseInt(limit) : 10,
    );
  }

  @Post('refresh-badges/:userId?')
  async refreshBadges(
    @Request() req: any,
    @Param('userId') targetUserId?: string,
  ) {
    const userId = targetUserId || req.user.id;
    
    // Only allow users to refresh their own badges or admins to refresh anyone's
    if (targetUserId && targetUserId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden');
    }

    await this.reputationService.checkActivityBadges(userId);
    return { message: 'Badges refreshed successfully' };
  }
}