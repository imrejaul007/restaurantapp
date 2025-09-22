import { Injectable, Logger, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BadgeType, ReputationAction, UserRole } from '@prisma/client';
import { CommunityNotificationService } from './notifications.service';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(forwardRef(() => CommunityNotificationService))
    private readonly notificationService?: CommunityNotificationService,
  ) {}

  async addReputationPoints(userId: string, action: ReputationAction, amount: number, description?: string, relatedId?: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: { reputation: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Create or update reputation record
      const currentPoints = user.reputation?.totalPoints || 0;
      const newPoints = Math.max(0, currentPoints + amount); // Prevent negative points
      const newLevel = this.calculateLevel(newPoints);

      await this.databaseService.userReputation.upsert({
        where: { userId },
        create: {
          userId,
          totalPoints: newPoints,
          level: newLevel,
          badgeCount: user.reputation?.badgeCount || 0,
        },
        update: {
          totalPoints: newPoints,
          level: newLevel,
        },
      });

      // Create reputation history entry
      await this.databaseService.reputationHistory.create({
        data: {
          userId,
          action,
          points: amount,
          description: description || `${action.toLowerCase().replace('_', ' ')}`,
          relatedId,
        },
      });

      // Check for level-up badges
      const oldLevel = user.reputation?.level || 1;
      await this.checkLevelUpBadges(userId, oldLevel, newLevel);

      // Check for milestone badges
      await this.checkMilestoneBadges(userId, newPoints);

      // Send notifications for level up
      if (newLevel > oldLevel && this.notificationService) {
        await this.notificationService.notifyReputationMilestone(userId, {
          type: 'LEVEL_UP',
          level: newLevel,
        });
      }

      this.logger.log(`User ${userId} earned ${amount} points for ${action}`);

      return { newPoints, newLevel, pointsEarned: amount };
    } catch (error) {
      this.logger.error('Failed to add reputation points', error);
      throw error;
    }
  }

  async assignBadge(userId: string, type: BadgeType, name: string, description: string, icon?: string) {
    try {
      // Check if user already has this badge
      const existingBadge = await this.databaseService.userBadge.findFirst({
        where: { userId, badgeType: type, title: name },
      });

      if (existingBadge) {
        return existingBadge;
      }

      const badge = await this.databaseService.userBadge.create({
        data: {
          userId,
          badgeType: type,
          title: name,
          description,
          icon,
        },
      });

      // Update badge count in reputation
      await this.databaseService.userReputation.update({
        where: { userId },
        data: {
          badgeCount: { increment: 1 },
        },
      });

      // Award points for earning badge
      await this.addReputationPoints(userId, ReputationAction.BADGE_EARNED, 50, `Earned ${name} badge`, badge.id);

      this.logger.log(`User ${userId} earned badge: ${name}`);

      return badge;
    } catch (error) {
      this.logger.error('Failed to assign badge', error);
      throw error;
    }
  }

  async getUserReputation(userId: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: {
          reputation: true,
          badges: {
            orderBy: { earnedAt: 'desc' },
          },
          profile: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const reputationHistory = await this.databaseService.reputationHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const currentLevel = user.reputation?.level || 1;
      const currentPoints = user.reputation?.totalPoints || 0;
      const nextLevel = currentLevel + 1;
      const pointsForNext = this.getPointsForLevel(nextLevel);
      const pointsNeeded = pointsForNext - currentPoints;

      return {
        user: {
          id: user.id,
          name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown User',
          role: user.role,
          avatar: user.profile?.avatar,
          verified: user.isVerified,
        },
        reputation: {
          totalPoints: currentPoints,
          level: currentLevel,
          badgeCount: user.reputation?.badgeCount || 0,
          nextLevel,
          pointsNeeded: Math.max(0, pointsNeeded),
          progress: pointsNeeded > 0 ? ((currentPoints - this.getPointsForLevel(currentLevel)) / (pointsForNext - this.getPointsForLevel(currentLevel))) * 100 : 100,
        },
        badges: user.badges.map((badge: any) => ({
          id: badge.id,
          type: badge.badgeType,
          name: badge.title,
          description: badge.description,
          icon: badge.icon,
          earnedAt: badge.earnedAt,
        })),
        recentActivity: reputationHistory.map(entry => ({
          action: entry.action,
          pointsEarned: entry.points,
          description: entry.description,
          createdAt: entry.createdAt,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get user reputation', error);
      throw error;
    }
  }

  async getLeaderboard(params: {
    timeframe?: 'day' | 'week' | 'month' | 'all';
    city?: string;
    role?: UserRole;
    limit?: number;
    page?: number;
  }) {
    try {
      const { timeframe = 'all', city, role, limit = 20, page = 1 } = params;
      const skip = (page - 1) * limit;

      let startDate: Date | undefined;
      if (timeframe !== 'all') {
        const now = new Date();
        switch (timeframe) {
          case 'day':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      const whereClause: any = {
        user: {
          isActive: true,
          ...(role && { role }),
          ...(city && {
            profile: {
              city: { contains: city, mode: 'insensitive' },
            },
          }),
        },
      };

      let users;
      if (timeframe === 'all') {
        users = await this.databaseService.userReputation.findMany({
          where: whereClause,
          orderBy: { totalPoints: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        });
      } else {
        // For time-based leaderboards, calculate points from history
        const usersWithPoints = await this.databaseService.$queryRaw`
          SELECT 
            ur.userId,
            ur.level,
            ur.badgeCount,
            COALESCE(SUM(rh.points), 0) as periodPoints,
            u.role,
            u.isVerified,
            p.firstName,
            p.lastName,
            p.avatar,
            p.city
          FROM "UserReputation" ur
          JOIN "User" u ON ur.userId = u.id
          LEFT JOIN "Profile" p ON u.id = p.userId
          LEFT JOIN "ReputationHistory" rh ON ur.userId = rh.userId 
            AND rh.createdAt >= ${startDate}
          WHERE u.isActive = true
            ${role ? `AND u.role = '${role}'` : ''}
            ${city ? `AND p.city ILIKE '%${city}%'` : ''}
          GROUP BY ur.userId, ur.level, ur.badgeCount, u.role, u.isVerified, p.firstName, p.lastName, p.avatar, p.city
          ORDER BY periodPoints DESC
          LIMIT ${limit} OFFSET ${skip}
        ` as any[];

        users = usersWithPoints.map(user => ({
          userId: user.userid,
          totalPoints: parseInt(user.periodpoints),
          level: user.level,
          badgeCount: user.badgecount,
          user: {
            id: user.userid,
            role: user.role,
            isVerified: user.isverified,
            profile: {
              firstName: user.firstname,
              lastName: user.lastname,
              avatar: user.avatar,
              city: user.city,
            },
          },
        }));
      }

      const leaderboard = users.map((entry, index) => ({
        rank: skip + index + 1,
        user: {
          id: entry.user.id,
          name: `${entry.user.profile?.firstName || ''} ${entry.user.profile?.lastName || ''}`.trim() || 'Unknown User',
          role: entry.user.role,
          avatar: entry.user.profile?.avatar,
          verified: entry.user.isVerified,
          city: entry.user.profile?.city,
        },
        reputation: {
          points: entry.totalPoints || 0,
          level: entry.level || 1,
          badgeCount: entry.badgeCount || 0,
        },
      }));

      return {
        leaderboard,
        pagination: {
          page,
          limit,
          hasNext: users.length === limit,
          hasPrev: page > 1,
        },
        filters: {
          timeframe,
          city,
          role,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get leaderboard', error);
      throw error;
    }
  }

  async getTrendingContributors(timeframe: 'day' | 'week' | 'month' = 'week', limit = 10) {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const contributors = await this.databaseService.$queryRaw`
        SELECT 
          u.id,
          u.role,
          u.isVerified,
          p.firstName,
          p.lastName,
          p.avatar,
          ur.level,
          ur.badgeCount,
          SUM(rh.points) as pointsEarned,
          COUNT(rh.id) as activities
        FROM "User" u
        JOIN "Profile" p ON u.id = p.userId
        JOIN "UserReputation" ur ON u.id = ur.userId
        JOIN "ReputationHistory" rh ON u.id = rh.userId
        WHERE u.isActive = true
          AND rh.createdAt >= ${startDate}
          AND rh.points > 0
        GROUP BY u.id, u.role, u.isVerified, p.firstName, p.lastName, p.avatar, ur.level, ur.badgeCount
        ORDER BY pointsEarned DESC, activities DESC
        LIMIT ${limit}
      ` as any[];

      return contributors.map(contributor => ({
        user: {
          id: contributor.id,
          name: `${contributor.firstname || ''} ${contributor.lastname || ''}`.trim() || 'Unknown User',
          role: contributor.role,
          avatar: contributor.avatar,
          verified: contributor.isverified,
        },
        reputation: {
          level: contributor.level,
          badgeCount: contributor.badgecount,
        },
        trending: {
          pointsEarned: parseInt(contributor.pointsearned),
          activities: parseInt(contributor.activities),
          timeframe,
        },
      }));
    } catch (error) {
      this.logger.error('Failed to get trending contributors', error);
      throw error;
    }
  }

  private calculateLevel(points: number): number {
    if (points < 100) return 1;
    if (points < 250) return 2;
    if (points < 500) return 3;
    if (points < 1000) return 4;
    if (points < 2000) return 5;
    if (points < 3500) return 6;
    if (points < 5000) return 7;
    if (points < 7500) return 8;
    if (points < 10000) return 9;
    return Math.floor(10 + (points - 10000) / 2500);
  }

  private getPointsForLevel(level: number): number {
    if (level <= 1) return 0;
    if (level === 2) return 100;
    if (level === 3) return 250;
    if (level === 4) return 500;
    if (level === 5) return 1000;
    if (level === 6) return 2000;
    if (level === 7) return 3500;
    if (level === 8) return 5000;
    if (level === 9) return 7500;
    if (level === 10) return 10000;
    return 10000 + (level - 10) * 2500;
  }

  private async checkLevelUpBadges(userId: string, oldLevel: number, newLevel: number) {
    if (newLevel <= oldLevel) return;

    const levelBadges = [
      { level: 5, name: 'Rising Star', description: 'Reached level 5' },
      { level: 10, name: 'Community Leader', description: 'Reached level 10' },
      { level: 15, name: 'Expert Contributor', description: 'Reached level 15' },
      { level: 20, name: 'Community Champion', description: 'Reached level 20' },
      { level: 25, name: 'Restaurant Guru', description: 'Reached level 25' },
    ];

    for (const badge of levelBadges) {
      if (newLevel >= badge.level && oldLevel < badge.level) {
        await this.assignBadge(userId, BadgeType.ACHIEVEMENT, badge.name, badge.description, '🏆');
      }
    }
  }

  private async checkMilestoneBadges(userId: string, totalPoints: number) {
    const milestones = [
      { points: 500, name: 'First Steps', description: 'Earned first 500 points' },
      { points: 1000, name: 'Getting Started', description: 'Earned 1,000 points' },
      { points: 2500, name: 'Active Member', description: 'Earned 2,500 points' },
      { points: 5000, name: 'Dedicated Contributor', description: 'Earned 5,000 points' },
      { points: 10000, name: 'Community Veteran', description: 'Earned 10,000 points' },
    ];

    for (const milestone of milestones) {
      if (totalPoints >= milestone.points) {
        const existingBadge = await this.databaseService.userBadge.findFirst({
          where: { userId, title: milestone.name },
        });

        if (!existingBadge) {
          await this.assignBadge(userId, BadgeType.MILESTONE, milestone.name, milestone.description, '⭐');
        }
      }
    }
  }

  async checkActivityBadges(userId: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              forumPosts: { where: { isDeleted: false } },
              postComments: { where: { isDeleted: false } },
              postLikes: true,
              vendorSuggestions: true,
              productSuggestions: true,
            },
          },
        },
      });

      if (!user) return;

      const counts = user._count;

      // Post-related badges
      const postBadges = [
        { count: 1, name: 'First Post', description: 'Created first post' },
        { count: 10, name: 'Regular Poster', description: 'Created 10 posts' },
        { count: 50, name: 'Prolific Writer', description: 'Created 50 posts' },
        { count: 100, name: 'Content Creator', description: 'Created 100 posts' },
      ];

      for (const badge of postBadges) {
        if (counts.forumPosts >= badge.count) {
          const existingBadge = await this.databaseService.userBadge.findFirst({
            where: { userId, title: badge.name },
          });

          if (!existingBadge) {
            await this.assignBadge(userId, BadgeType.ACTIVITY, badge.name, badge.description, '📝');
          }
        }
      }

      // Engagement badges
      const likeBadges = [
        { count: 50, name: 'Supporter', description: 'Liked 50 posts' },
        { count: 200, name: 'Community Cheerleader', description: 'Liked 200 posts' },
        { count: 500, name: 'Super Fan', description: 'Liked 500 posts' },
      ];

      for (const badge of likeBadges) {
        if (counts.postLikes >= badge.count) {
          const existingBadge = await this.databaseService.userBadge.findFirst({
            where: { userId, title: badge.name },
          });

          if (!existingBadge) {
            await this.assignBadge(userId, BadgeType.ENGAGEMENT, badge.name, badge.description, '👍');
          }
        }
      }

      // Helper badges
      const totalSuggestions = counts.vendorSuggestions + counts.productSuggestions;
      const suggestionBadges = [
        { count: 5, name: 'Helpful Member', description: 'Made 5 suggestions' },
        { count: 25, name: 'Community Helper', description: 'Made 25 suggestions' },
        { count: 100, name: 'Expert Advisor', description: 'Made 100 suggestions' },
      ];

      for (const badge of suggestionBadges) {
        if (totalSuggestions >= badge.count) {
          const existingBadge = await this.databaseService.userBadge.findFirst({
            where: { userId, title: badge.name },
          });

          if (!existingBadge) {
            await this.assignBadge(userId, BadgeType.SPECIAL, badge.name, badge.description, '💡');
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to check activity badges', error);
    }
  }
}