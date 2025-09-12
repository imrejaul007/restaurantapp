import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prisma, PostType, PostVisibility, UserRole, ReputationAction } from '@prisma/client';
import { ReputationService } from './reputation.service';
import { CommunityNotificationService } from './notifications.service';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(forwardRef(() => ReputationService))
    private readonly reputationService: ReputationService,
    @Inject(forwardRef(() => CommunityNotificationService))
    private readonly notificationService: CommunityNotificationService,
  ) {}

  async createPost(userId: string, postData: {
    title: string;
    content: string;
    forumId: string;
    type?: PostType;
    visibility?: PostVisibility;
    tags?: string[];
    isPinned?: boolean;
    attachments?: string[];
    images?: string[];
  }) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
        },
      });

      if (!user || !user.isActive) {
        throw new NotFoundException('User not found or inactive');
      }

      // Check if forum exists
      const forum = await this.databaseService.forum.findUnique({
        where: { id: postData.forumId },
      });

      if (!forum || !forum.isActive) {
        throw new NotFoundException('Forum not found or inactive');
      }

      // Generate slug
      const baseSlug = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      let slug = baseSlug;
      let counter = 1;
      
      // Ensure unique slug
      while (await this.databaseService.forumPost.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const post = await this.databaseService.forumPost.create({
        data: {
          title: postData.title,
          content: postData.content,
          slug,
          forumId: postData.forumId,
          userId,
          type: postData.type || PostType.DISCUSSION,
          visibility: postData.visibility || PostVisibility.PUBLIC,
          tags: postData.tags || [],
          isPinned: postData.isPinned || false,
          images: postData.images || [],
          attachments: postData.attachments || [],
        },
        include: {
          author: {
            include: {
              profile: true,
            },
          },
          forum: true,
        },
      });

      // Update forum post count
      await this.databaseService.forum.update({
        where: { id: postData.forumId },
        data: {
          postCount: {
            increment: 1,
          },
        },
      });

      // Update user reputation
      await this.updateUserReputation(userId, 'POST_CREATED', 5, `Created post: ${post.title}`, post.id);

      return {
        ...post,
        author: {
          id: post.author.id,
          name: `${post.author.profile?.firstName || ''} ${post.author.profile?.lastName || ''}`.trim() || 'Unknown User',
          role: post.author.role,
          avatar: post.author.profile?.avatar,
          verified: post.author.isVerified,
        },
      };
    } catch (error) {
      this.logger.error('Failed to create post', error);
      throw error;
    }
  }

  async getPosts(params: {
    forumId?: string;
    userId?: string;
    search?: string;
    tags?: string[];
    type?: PostType;
    visibility?: PostVisibility;
    sortBy?: 'latest' | 'popular' | 'mostReplies' | 'trending';
    page?: number;
    limit?: number;
  }) {
    try {
      const { page = 1, limit = 20, sortBy = 'latest' } = params;
      const skip = (page - 1) * limit;

      const whereClause: Prisma.ForumPostWhereInput = {
        isDeleted: false,
        ...(params.forumId && { forumId: params.forumId }),
        ...(params.userId && { userId: params.userId }),
        ...(params.type && { type: params.type }),
        ...(params.visibility && { visibility: params.visibility }),
        ...(params.search && {
          OR: [
            { title: { contains: params.search, mode: 'insensitive' } },
            { content: { contains: params.search, mode: 'insensitive' } },
            { tags: { hasSome: [params.search] } },
          ],
        }),
        ...(params.tags && params.tags.length > 0 && {
          tags: { hasSome: params.tags },
        }),
      };

      let orderBy: Prisma.ForumPostOrderByWithRelationInput[] = [];
      
      switch (sortBy) {
        case 'popular':
          orderBy = [{ likeCount: 'desc' }, { createdAt: 'desc' }];
          break;
        case 'mostReplies':
          orderBy = [{ commentCount: 'desc' }, { createdAt: 'desc' }];
          break;
        case 'trending':
          // For trending, we'll prioritize recent posts with high engagement
          orderBy = [
            { isPinned: 'desc' },
            { isFeatured: 'desc' },
            { likeCount: 'desc' },
            { commentCount: 'desc' },
            { createdAt: 'desc' }
          ];
          break;
        case 'latest':
        default:
          orderBy = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
          break;
      }

      const [posts, total] = await Promise.all([
        this.databaseService.forumPost.findMany({
          where: whereClause,
          orderBy,
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

      const totalPages = Math.ceil(total / limit);

      return {
        posts: posts.map(post => ({
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
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get posts', error);
      throw error;
    }
  }

  async getPost(postId: string, userId?: string) {
    try {
      const post = await this.databaseService.forumPost.findUnique({
        where: { 
          id: postId,
          isDeleted: false,
        },
        include: {
          author: {
            include: {
              profile: true,
            },
          },
          forum: true,
          comments: {
            where: { isDeleted: false },
            include: {
              author: {
                include: {
                  profile: true,
                },
              },
              likes: userId ? {
                where: { userId },
              } : false,
              _count: {
                select: {
                  likes: true,
                  replies: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10, // Limit initial comments, use pagination for more
          },
          likes: userId ? {
            where: { userId },
          } : false,
          bookmarks: userId ? {
            where: { userId },
          } : false,
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true,
              bookmarks: true,
            },
          },
        },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Increment view count if user is different from author
      if (userId && userId !== post.userId) {
        await this.databaseService.forumPost.update({
          where: { id: postId },
          data: {
            viewCount: {
              increment: 1,
            },
          },
        });
      }

      return {
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
          bookmarks: post._count.bookmarks,
          views: post.viewCount,
          isLiked: post.likes?.length > 0,
          isBookmarked: post.bookmarks?.length > 0,
        },
        comments: post.comments.map(comment => ({
          ...comment,
          author: {
            id: comment.author.id,
            name: `${comment.author.profile?.firstName || ''} ${comment.author.profile?.lastName || ''}`.trim() || 'Unknown User',
            role: comment.author.role,
            avatar: comment.author.profile?.avatar,
            verified: comment.author.isVerified,
          },
          isLiked: comment.likes?.length > 0,
          totalLikes: comment._count.likes,
          totalReplies: comment._count.replies,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get post', error);
      throw error;
    }
  }

  async updatePost(userId: string, postId: string, updateData: {
    title?: string;
    content?: string;
    tags?: string[];
    attachments?: string[];
    images?: string[];
  }) {
    try {
      const post = await this.databaseService.forumPost.findUnique({
        where: { id: postId, isDeleted: false },
        include: { author: true },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (post.userId !== userId) {
        throw new ForbiddenException('You can only update your own posts');
      }

      let slug = post.slug;
      if (updateData.title && updateData.title !== post.title) {
        const baseSlug = updateData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        
        slug = baseSlug;
        let counter = 1;
        
        // Ensure unique slug (but allow keeping current slug)
        while (await this.databaseService.forumPost.findFirst({ 
          where: { slug, id: { not: postId } }
        })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      const updatedPost = await this.databaseService.forumPost.update({
        where: { id: postId },
        data: {
          ...(updateData.title && { title: updateData.title, slug }),
          ...(updateData.content && { content: updateData.content }),
          ...(updateData.tags && { tags: updateData.tags }),
          ...(updateData.attachments && { attachments: updateData.attachments }),
          ...(updateData.images && { images: updateData.images }),
        },
        include: {
          author: {
            include: {
              profile: true,
            },
          },
          forum: true,
        },
      });

      return {
        ...updatedPost,
        author: {
          id: updatedPost.author.id,
          name: `${updatedPost.author.profile?.firstName || ''} ${updatedPost.author.profile?.lastName || ''}`.trim() || 'Unknown User',
          role: updatedPost.author.role,
          avatar: updatedPost.author.profile?.avatar,
          verified: updatedPost.author.isVerified,
        },
      };
    } catch (error) {
      this.logger.error('Failed to update post', error);
      throw error;
    }
  }

  async deletePost(userId: string, postId: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const post = await this.databaseService.forumPost.findUnique({
        where: { id: postId, isDeleted: false },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Allow deletion if user is post author or admin
      if (post.userId !== userId && user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('You can only delete your own posts');
      }

      await this.databaseService.forumPost.update({
        where: { id: postId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // Update forum post count
      await this.databaseService.forum.update({
        where: { id: post.forumId },
        data: {
          postCount: {
            decrement: 1,
          },
        },
      });

      return { message: 'Post deleted successfully' };
    } catch (error) {
      this.logger.error('Failed to delete post', error);
      throw error;
    }
  }

  async likePost(userId: string, postId: string) {
    try {
      const post = await this.databaseService.forumPost.findUnique({
        where: { id: postId, isDeleted: false },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Check if already liked
      const existingLike = await this.databaseService.postLike.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      if (existingLike) {
        throw new BadRequestException('Post already liked');
      }

      const like = await this.databaseService.postLike.create({
        data: { postId, userId },
      });

      // Update post like count
      await this.databaseService.forumPost.update({
        where: { id: postId },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      });

      // Update post author reputation and send notification
      if (post.userId !== userId) {
        await this.updateUserReputation(
          post.userId, 
          'LIKE_RECEIVED', 
          2, 
          `Received like on post: ${post.title}`,
          postId
        );

        // Send notification to post author
        await this.notificationService.notifyPostEngagement(postId, 'like', userId);
      }

      return like;
    } catch (error) {
      this.logger.error('Failed to like post', error);
      throw error;
    }
  }

  async unlikePost(userId: string, postId: string) {
    try {
      const like = await this.databaseService.postLike.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      if (!like) {
        return { message: 'Post was not liked' };
      }

      await this.databaseService.postLike.delete({
        where: { postId_userId: { postId, userId } },
      });

      // Update post like count
      await this.databaseService.forumPost.update({
        where: { id: postId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      });

      return { message: 'Post unliked successfully' };
    } catch (error) {
      this.logger.error('Failed to unlike post', error);
      throw error;
    }
  }

  async bookmarkPost(userId: string, postId: string) {
    try {
      const post = await this.databaseService.forumPost.findUnique({
        where: { id: postId, isDeleted: false },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Check if already bookmarked
      const existingBookmark = await this.databaseService.postBookmark.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      if (existingBookmark) {
        throw new BadRequestException('Post already bookmarked');
      }

      const bookmark = await this.databaseService.postBookmark.create({
        data: { postId, userId },
      });

      return bookmark;
    } catch (error) {
      this.logger.error('Failed to bookmark post', error);
      throw error;
    }
  }

  async unbookmarkPost(userId: string, postId: string) {
    try {
      const bookmark = await this.databaseService.postBookmark.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      if (!bookmark) {
        return { message: 'Post was not bookmarked' };
      }

      await this.databaseService.postBookmark.delete({
        where: { postId_userId: { postId, userId } },
      });

      return { message: 'Post unbookmarked successfully' };
    } catch (error) {
      this.logger.error('Failed to unbookmark post', error);
      throw error;
    }
  }

  async sharePost(userId: string, postId: string, platform?: string) {
    try {
      const post = await this.databaseService.forumPost.findUnique({
        where: { id: postId, isDeleted: false },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const share = await this.databaseService.postShare.create({
        data: { 
          postId, 
          userId,
          platform: platform || null,
        },
      });

      // Update post share count
      await this.databaseService.forumPost.update({
        where: { id: postId },
        data: {
          shareCount: {
            increment: 1,
          },
        },
      });

      // Update post author reputation
      if (post.userId !== userId) {
        await this.updateUserReputation(
          post.userId, 
          'POST_SHARED', 
          3, 
          `Post shared: ${post.title}`,
          postId
        );
      }

      return share;
    } catch (error) {
      this.logger.error('Failed to share post', error);
      throw error;
    }
  }

  async createReply(userId: string, postId: string, replyData: {
    content: string;
    parentId?: string;
  }) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      if (!user || !user.isActive) {
        throw new NotFoundException('User not found or inactive');
      }

      const post = await this.databaseService.forumPost.findUnique({
        where: { id: postId, isDeleted: false },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // If replying to a comment, check if parent exists
      if (replyData.parentId) {
        const parentComment = await this.databaseService.postComment.findUnique({
          where: { id: replyData.parentId, isDeleted: false },
        });

        if (!parentComment) {
          throw new NotFoundException('Parent comment not found');
        }
      }

      const comment = await this.databaseService.postComment.create({
        data: {
          content: replyData.content,
          postId,
          userId,
          parentId: replyData.parentId,
        },
        include: {
          author: {
            include: {
              profile: true,
            },
          },
        },
      });

      // Update post comment count
      await this.databaseService.forumPost.update({
        where: { id: postId },
        data: {
          commentCount: {
            increment: 1,
          },
        },
      });

      // Update user reputation
      await this.updateUserReputation(userId, 'COMMENT_CREATED', 3, `Commented on post: ${post.title}`, comment.id);

      // Send notification to post author (if different from commenter)
      if (post.userId !== userId) {
        await this.notificationService.notifyPostEngagement(postId, 'comment', userId);
      }

      return {
        ...comment,
        author: {
          id: comment.author.id,
          name: `${comment.author.profile?.firstName || ''} ${comment.author.profile?.lastName || ''}`.trim() || 'Unknown User',
          role: comment.author.role,
          avatar: comment.author.profile?.avatar,
          verified: comment.author.isVerified,
        },
      };
    } catch (error) {
      this.logger.error('Failed to create reply', error);
      throw error;
    }
  }

  async getReplies(postId: string, params: {
    parentId?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const { page = 1, limit = 20, parentId } = params;
      const skip = (page - 1) * limit;

      const whereClause: Prisma.PostCommentWhereInput = {
        postId,
        isDeleted: false,
        parentId: parentId || null,
      };

      const [comments, total] = await Promise.all([
        this.databaseService.postComment.findMany({
          where: whereClause,
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit,
          include: {
            author: {
              include: {
                profile: true,
              },
            },
            _count: {
              select: {
                likes: true,
                replies: true,
              },
            },
          },
        }),
        this.databaseService.postComment.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        replies: comments.map(comment => ({
          ...comment,
          author: {
            id: comment.author.id,
            name: `${comment.author.profile?.firstName || ''} ${comment.author.profile?.lastName || ''}`.trim() || 'Unknown User',
            role: comment.author.role,
            avatar: comment.author.profile?.avatar,
            verified: comment.author.isVerified,
          },
          totalLikes: comment._count.likes,
          totalReplies: comment._count.replies,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get replies', error);
      throw error;
    }
  }

  async reportPost(userId: string, postId: string, reason: string, description?: string) {
    try {
      const post = await this.databaseService.forumPost.findUnique({
        where: { id: postId, isDeleted: false },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Check if already reported by this user
      const existingReport = await this.databaseService.postReport.findFirst({
        where: { postId, reporterId: userId },
      });

      if (existingReport) {
        throw new BadRequestException('Post already reported');
      }

      const report = await this.databaseService.postReport.create({
        data: {
          postId,
          reporterId: userId,
          reason,
          description,
        },
      });

      return report;
    } catch (error) {
      this.logger.error('Failed to report post', error);
      throw error;
    }
  }

  // Helper method to update user reputation
  private async updateUserReputation(
    userId: string, 
    action: ReputationAction, 
    points: number, 
    description: string,
    relatedId?: string
  ) {
    try {
      await this.reputationService.addReputationPoints(userId, action, points, description, relatedId);
      await this.reputationService.checkActivityBadges(userId);
    } catch (error) {
      this.logger.error('Failed to update user reputation', error);
      // Don't throw error as this is a supporting feature
    }
  }
}