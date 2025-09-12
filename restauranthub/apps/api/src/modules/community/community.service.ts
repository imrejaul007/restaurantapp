import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getCommunityOverview(userId: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get recent posts
      const recentPosts = await this.databaseService.forumPost.findMany({
        where: {
          isDeleted: false,
          visibility: 'PUBLIC',
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          author: {
            include: {
              profile: true,
            },
          },
          forum: true,
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true,
            },
          },
        },
      });

      // Get active forums
      const forums = await this.databaseService.forum.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { postCount: 'desc' }],
        take: 10,
      });

      // Get community stats
      const [totalPosts, totalMembers, activeForums] = await Promise.all([
        this.databaseService.forumPost.count({
          where: { isDeleted: false },
        }),
        this.databaseService.user.count({
          where: { isActive: true },
        }),
        this.databaseService.forum.count({
          where: { isActive: true },
        }),
      ]);

      return {
        recentPosts: recentPosts.map(post => ({
          ...post,
          author: {
            id: post.author.id,
            name: `${post.author.profile?.firstName || ''} ${post.author.profile?.lastName || ''}`.trim() || 'Unknown User',
            role: post.author.role,
            avatar: post.author.profile?.avatar,
            verified: post.author.isVerified,
          },
          engagement: {
            likes: post._count.likes,
            comments: post._count.comments,
            shares: post._count.shares,
            views: post.viewCount,
          },
        })),
        forums,
        stats: {
          totalPosts,
          totalMembers,
          activeForums,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get community overview', error);
      throw error;
    }
  }

  async getUserActivity(userId: string, targetUserId?: string) {
    try {
      const actualUserId = targetUserId || userId;

      const user = await this.databaseService.user.findUnique({
        where: { id: actualUserId },
        include: {
          profile: true,
          reputation: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get user's posts
      const forumPosts = await this.databaseService.forumPost.findMany({
        where: {
          userId: actualUserId,
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          forum: true,
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true,
            },
          },
        },
      });

      // Get user's comments
      const comments = await this.databaseService.postComment.findMany({
        where: {
          userId: actualUserId,
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          post: {
            include: {
              forum: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
        },
      });

      // Get stats
      const [totalPosts, totalComments, totalLikesReceived, joinedForums] = await Promise.all([
        this.databaseService.forumPost.count({
          where: { userId: actualUserId, isDeleted: false },
        }),
        this.databaseService.postComment.count({
          where: { userId: actualUserId, isDeleted: false },
        }),
        this.databaseService.postLike.count({
          where: {
            post: { userId: actualUserId },
          },
        }),
        this.databaseService.forumSubscription.count({
          where: { userId: actualUserId },
        }),
      ]);

      return {
        user: {
          id: user.id,
          name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown User',
          role: user.role,
          avatar: user.profile?.avatar,
          verified: user.isVerified,
          joinedAt: user.createdAt,
          reputation: user.reputation || {
            totalPoints: 0,
            level: 1,
            badgeCount: 0,
          },
        },
        forumPosts: forumPosts.map(post => ({
          ...post,
          engagement: {
            likes: post._count.likes,
            comments: post._count.comments,
            shares: post._count.shares,
            views: post.viewCount,
          },
        })),
        comments,
        stats: {
          totalPosts,
          totalComments,
          totalLikesReceived,
          joinedForums,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get user activity', error);
      throw error;
    }
  }

  async searchCommunity(params: {
    query?: string;
    type?: 'posts' | 'forums' | 'users';
    category?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        query,
        type = 'posts',
        category,
        userId,
        page = 1,
        limit = 20,
      } = params;

      const skip = (page - 1) * limit;
      let results: any[] = [];
      let total = 0;

      switch (type) {
        case 'posts':
          const whereClause: Prisma.ForumPostWhereInput = {
            isDeleted: false,
            ...(query && {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
                { tags: { hasSome: [query] } },
              ],
            }),
            ...(category && { forum: { category } }),
            ...(userId && { userId }),
          };

          const [posts, postsTotal] = await Promise.all([
            this.databaseService.forumPost.findMany({
              where: whereClause,
              orderBy: { createdAt: 'desc' },
              skip,
              take: limit,
              include: {
                author: {
                  include: {
                    profile: true,
                  },
                },
                forum: true,
                _count: {
                  select: {
                    likes: true,
                    comments: true,
                    shares: true,
                  },
                },
              },
            }),
            this.databaseService.forumPost.count({ where: whereClause }),
          ]);

          results = posts.map(post => ({
            ...post,
            author: {
              id: post.author.id,
              name: `${post.author.profile?.firstName || ''} ${post.author.profile?.lastName || ''}`.trim() || 'Unknown User',
              role: post.author.role,
              avatar: post.author.profile?.avatar,
              verified: post.author.isVerified,
            },
            engagement: {
              likes: post._count.likes,
              comments: post._count.comments,
              shares: post._count.shares,
              views: post.viewCount,
            },
          }));
          total = postsTotal;
          break;

        case 'forums':
          const forumWhere: Prisma.ForumWhereInput = {
            isActive: true,
            ...(query && {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            }),
            ...(category && { category }),
          };

          const [forums, forumsTotal] = await Promise.all([
            this.databaseService.forum.findMany({
              where: forumWhere,
              orderBy: { postCount: 'desc' },
              skip,
              take: limit,
            }),
            this.databaseService.forum.count({ where: forumWhere }),
          ]);

          results = forums;
          total = forumsTotal;
          break;

        case 'users':
          const userWhere: Prisma.UserWhereInput = {
            isActive: true,
            ...(query && {
              profile: {
                OR: [
                  { firstName: { contains: query, mode: 'insensitive' } },
                  { lastName: { contains: query, mode: 'insensitive' } },
                ],
              },
            }),
          };

          const [users, usersTotal] = await Promise.all([
            this.databaseService.user.findMany({
              where: userWhere,
              orderBy: { createdAt: 'desc' },
              skip,
              take: limit,
              include: {
                profile: true,
                reputation: true,
                _count: {
                  select: {
                    forumPosts: true,
                    postComments: true,
                  },
                },
              },
            }),
            this.databaseService.user.count({ where: userWhere }),
          ]);

          results = users.map((user: any) => ({
            id: user.id,
            name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown User',
            role: user.role,
            avatar: user.profile?.avatar,
            verified: user.isVerified,
            joinedAt: user.createdAt,
            reputation: user.reputation || { totalPoints: 0, level: 1 },
            stats: {
              posts: user._count.forumPosts,
              comments: user._count.postComments,
            },
          }));
          total = usersTotal;
          break;
      }

      const totalPages = Math.ceil(total / limit);

      return {
        results,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        type,
      };
    } catch (error) {
      this.logger.error('Failed to search community', error);
      throw error;
    }
  }

  async getCommunityStats(userId: string, timeframe: 'day' | 'week' | 'month' | 'year' = 'week') {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

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
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      // Get stats for the period
      const [newPosts, newComments, newMembers, totalLikes, totalShares] = await Promise.all([
        this.databaseService.forumPost.count({
          where: {
            createdAt: { gte: startDate },
            isDeleted: false,
          },
        }),
        this.databaseService.postComment.count({
          where: {
            createdAt: { gte: startDate },
            isDeleted: false,
          },
        }),
        this.databaseService.user.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
        this.databaseService.postLike.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
        this.databaseService.postShare.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
      ]);

      // Get trending tags for the period
      const trendingTags = await this.databaseService.trendingTag.findMany({
        where: {
          period: timeframe,
          date: {
            gte: startDate,
          },
        },
        orderBy: { score: 'desc' },
        take: 10,
      });

      return {
        timeframe,
        period: {
          startDate,
          endDate: now,
        },
        stats: {
          newPosts,
          newComments,
          newMembers,
          totalEngagement: totalLikes + totalShares + newComments,
          totalLikes,
          totalShares,
        },
        trendingTags: trendingTags.map(tag => ({
          tag: tag.tag,
          score: tag.score,
          postCount: tag.postCount,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get community stats', error);
      throw error;
    }
  }

  async reportContent(userId: string, contentId: string, contentType: 'post' | 'comment' | 'message', reason: string, description?: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      let report;

      switch (contentType) {
        case 'post':
          // Check if post exists
          const post = await this.databaseService.forumPost.findUnique({
            where: { id: contentId, isDeleted: false },
          });

          if (!post) {
            throw new NotFoundException('Post not found');
          }

          // Check if already reported by this user
          const existingPostReport = await this.databaseService.postReport.findFirst({
            where: { postId: contentId, reporterId: userId },
          });

          if (existingPostReport) {
            throw new BadRequestException('Content already reported');
          }

          report = await this.databaseService.postReport.create({
            data: {
              postId: contentId,
              reporterId: userId,
              reason,
              description,
            },
          });
          break;

        case 'comment':
          // Check if comment exists
          const comment = await this.databaseService.postComment.findUnique({
            where: { id: contentId, isDeleted: false },
          });

          if (!comment) {
            throw new NotFoundException('Comment not found');
          }

          // Check if already reported by this user
          const existingCommentReport = await this.databaseService.commentReport.findFirst({
            where: { commentId: contentId, reporterId: userId },
          });

          if (existingCommentReport) {
            throw new BadRequestException('Content already reported');
          }

          report = await this.databaseService.commentReport.create({
            data: {
              commentId: contentId,
              reporterId: userId,
              reason,
              description,
            },
          });
          break;

        default:
          throw new BadRequestException('Invalid content type');
      }

      return report;
    } catch (error) {
      this.logger.error('Failed to report content', error);
      throw error;
    }
  }
}