import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class ForumService {
  private readonly logger = new Logger(ForumService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async createForum(userId: string, forumData: {
    name: string;
    slug?: string;
    description?: string;
    category: string;
    icon?: string;
    color?: string;
    displayOrder?: number;
  }) {
    try {
      // Check if user is admin
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only admins can create forums');
      }

      // Generate slug if not provided
      let slug = forumData.slug || forumData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      let counter = 1;
      const baseSlug = slug;

      // Ensure unique slug
      while (await this.databaseService.forum.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const forum = await this.databaseService.forum.create({
        data: {
          name: forumData.name,
          slug,
          description: forumData.description,
          category: forumData.category,
          icon: forumData.icon,
          color: forumData.color,
          displayOrder: forumData.displayOrder || 0,
        },
      });

      return forum;
    } catch (error) {
      this.logger.error('Failed to create forum', error);
      throw error;
    }
  }

  async getForums() {
    try {
      const forums = await this.databaseService.forum.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { postCount: 'desc' }],
        include: {
          _count: {
            select: {
              posts: true,
              subscriptions: true,
            },
          },
        },
      });

      return forums.map(forum => ({
        ...forum,
        stats: {
          postCount: forum._count.posts,
          memberCount: forum._count.subscriptions,
        },
      }));
    } catch (error) {
      this.logger.error('Failed to get forums', error);
      throw error;
    }
  }

  async getForum(forumId: string) {
    try {
      const forum = await this.databaseService.forum.findUnique({
        where: { id: forumId },
        include: {
          _count: {
            select: {
              posts: true,
              subscriptions: true,
            },
          },
        },
      });

      if (!forum) {
        throw new NotFoundException('Forum not found');
      }

      return {
        ...forum,
        stats: {
          postCount: forum._count.posts,
          memberCount: forum._count.subscriptions,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get forum', error);
      throw error;
    }
  }

  async subscribeForum(userId: string, forumId: string) {
    try {
      const forum = await this.databaseService.forum.findUnique({
        where: { id: forumId, isActive: true },
      });

      if (!forum) {
        throw new NotFoundException('Forum not found or inactive');
      }

      // Check if already subscribed
      const existingSubscription = await this.databaseService.forumSubscription.findUnique({
        where: { userId_forumId: { userId, forumId } },
      });

      if (existingSubscription) {
        throw new BadRequestException('Already subscribed to this forum');
      }

      const subscription = await this.databaseService.forumSubscription.create({
        data: { userId, forumId },
      });

      // Update forum member count
      await this.databaseService.forum.update({
        where: { id: forumId },
        data: {
          memberCount: {
            increment: 1,
          },
        },
      });

      return subscription;
    } catch (error) {
      this.logger.error('Failed to subscribe to forum', error);
      throw error;
    }
  }

  // TODO: Implement these methods properly
  async updateForum(userId: string, forumId: string, updateData: {
    name?: string;
    description?: string;
    category?: string;
    icon?: string;
    color?: string;
    displayOrder?: number;
    isActive?: boolean;
  }) {
    try {
      // Check if user is admin
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only admins can update forums');
      }

      const forum = await this.databaseService.forum.findUnique({
        where: { id: forumId },
      });

      if (!forum) {
        throw new NotFoundException('Forum not found');
      }

      const updatedForum = await this.databaseService.forum.update({
        where: { id: forumId },
        data: updateData,
      });

      return updatedForum;
    } catch (error) {
      this.logger.error('Failed to update forum', error);
      throw error;
    }
  }

  async deleteForum(userId: string, forumId: string) {
    try {
      // Check if user is admin
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only admins can delete forums');
      }

      const forum = await this.databaseService.forum.findUnique({
        where: { id: forumId },
      });

      if (!forum) {
        throw new NotFoundException('Forum not found');
      }

      // Soft delete by setting isActive to false
      await this.databaseService.forum.update({
        where: { id: forumId },
        data: { isActive: false },
      });

      return { message: 'Forum deleted successfully' };
    } catch (error) {
      this.logger.error('Failed to delete forum', error);
      throw error;
    }
  }

  async joinForum(userId: string, forumId: string) {
    try {
      // This is the same as subscribeForum
      return await this.subscribeForum(userId, forumId);
    } catch (error) {
      this.logger.error('Failed to join forum', error);
      throw error;
    }
  }

  async leaveForum(userId: string, forumId: string) {
    try {
      const subscription = await this.databaseService.forumSubscription.findUnique({
        where: { userId_forumId: { userId, forumId } },
      });

      if (!subscription) {
        throw new NotFoundException('Not subscribed to this forum');
      }

      await this.databaseService.forumSubscription.delete({
        where: { userId_forumId: { userId, forumId } },
      });

      // Update forum member count
      await this.databaseService.forum.update({
        where: { id: forumId },
        data: {
          memberCount: {
            decrement: 1,
          },
        },
      });

      return { message: 'Successfully left forum' };
    } catch (error) {
      this.logger.error('Failed to leave forum', error);
      throw error;
    }
  }

  async getForumMembers(forumId: string, params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    try {
      const { page = 1, limit = 20, search } = params;
      const skip = (page - 1) * limit;

      const forum = await this.databaseService.forum.findUnique({
        where: { id: forumId },
      });

      if (!forum) {
        throw new NotFoundException('Forum not found');
      }

      const whereClause: any = {
        forumId,
        ...(search && {
          user: {
            profile: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        }),
      };

      const [subscriptions, total] = await Promise.all([
        this.databaseService.forumSubscription.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              include: {
                profile: true,
                reputation: true,
              },
            },
          },
        }),
        this.databaseService.forumSubscription.count({ where: whereClause }),
      ]);

      const members = subscriptions.map(sub => ({
        id: sub.user.id,
        name: `${sub.user.profile?.firstName || ''} ${sub.user.profile?.lastName || ''}`.trim() || 'Unknown User',
        avatar: sub.user.profile?.avatar,
        role: sub.user.role,
        joinedAt: sub.createdAt,
        reputation: {
          level: sub.user.reputation?.level || 1,
          totalPoints: sub.user.reputation?.totalPoints || 0,
        },
      }));

      return {
        members,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get forum members', error);
      throw error;
    }
  }

  async addModerator(userId: string, forumId: string, targetUserId: string) {
    try {
      // Check if user is admin
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only admins can add moderators');
      }

      const forum = await this.databaseService.forum.findUnique({
        where: { id: forumId },
      });

      if (!forum) {
        throw new NotFoundException('Forum not found');
      }

      const targetUser = await this.databaseService.user.findUnique({
        where: { id: targetUserId },
      });

      if (!targetUser) {
        throw new NotFoundException('Target user not found');
      }

      // Check if already a moderator
      const existingModerator = await this.databaseService.forumModerator.findUnique({
        where: { userId_forumId: { userId: targetUserId, forumId } },
      });

      if (existingModerator) {
        throw new BadRequestException('User is already a moderator');
      }

      const moderator = await this.databaseService.forumModerator.create({
        data: {
          userId: targetUserId,
          forumId,
          addedBy: userId,
        },
      });

      return moderator;
    } catch (error) {
      this.logger.error('Failed to add moderator', error);
      throw error;
    }
  }

  async removeModerator(userId: string, forumId: string, targetUserId: string) {
    try {
      // Check if user is admin
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only admins can remove moderators');
      }

      const moderator = await this.databaseService.forumModerator.findUnique({
        where: { userId_forumId: { userId: targetUserId, forumId } },
      });

      if (!moderator) {
        throw new NotFoundException('Moderator not found');
      }

      await this.databaseService.forumModerator.delete({
        where: { userId_forumId: { userId: targetUserId, forumId } },
      });

      return { message: 'Moderator removed successfully' };
    } catch (error) {
      this.logger.error('Failed to remove moderator', error);
      throw error;
    }
  }
}