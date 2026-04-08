import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostType, PostVisibility, SuggestionRating } from '@prisma/client';

export interface CreateForumPostDto {
  forumId: string;
  title: string;
  content: string;
  type?: PostType;
  visibility?: PostVisibility;
  tags?: string[];
  images?: string[];
  attachments?: string[];
}

export interface UpdateForumPostDto {
  title?: string;
  content?: string;
  type?: PostType;
  visibility?: PostVisibility;
  tags?: string[];
  images?: string[];
  attachments?: string[];
}

export interface CreateCommentDto {
  content: string;
  parentId?: string;
}

export interface PostFiltersDto {
  forumId?: string;
  type?: PostType;
  visibility?: PostVisibility;
  authorId?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'createdAt' | 'likeCount' | 'viewCount' | 'commentCount';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  // Forum Management
  async getForums() {
    return this.prisma.forum.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: {
            posts: { where: { isDeleted: false } },
            subscriptions: true
          }
        }
      }
    });
  }

  async getForum(id: string) {
    const forum = await this.prisma.forum.findFirst({
      where: { id, isActive: true },
      include: {
        moderators: {
          include: {
            user: {
              select: {
                id: true,
                profile: { select: { firstName: true, lastName: true, avatar: true } }
              }
            }
          }
        },
        _count: {
          select: {
            posts: { where: { isDeleted: false } },
            subscriptions: true
          }
        }
      }
    });

    if (!forum) {
      throw new NotFoundException('Forum not found');
    }

    return forum;
  }

  // Post Management
  async getPosts(filters: PostFiltersDto = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const {
      forumId,
      type,
      visibility = 'PUBLIC',
      authorId,
      tags,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const where: any = {
      isDeleted: false,
      ...(forumId && { forumId }),
      ...(type && { type }),
      ...(visibility && { visibility }),
      ...(authorId && { userId: authorId }),
      ...(tags && tags.length > 0 && {
        tags: { hasSome: tags }
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } }
        ]
      })
    };

    const [posts, total] = await Promise.all([
      this.prisma.forumPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            }
          },
          forum: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              comments: { where: { isDeleted: false } },
              likes: true,
              bookmarks: true,
              shares: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      this.prisma.forumPost.count({ where })
    ]);

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getPost(id: string, userId?: string) {
    const post = await this.prisma.forumPost.findFirst({
      where: {
        id,
        isDeleted: false
      },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
                bio: true
              }
            },
            reputation: {
              select: {
                totalPoints: true,
                level: true
              }
            }
          }
        },
        forum: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        comments: {
          where: { isDeleted: false, parentId: null },
          include: {
            author: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                }
              }
            },
            replies: {
              where: { isDeleted: false },
              include: {
                author: {
                  select: {
                    id: true,
                    profile: {
                      select: {
                        firstName: true,
                        lastName: true,
                        avatar: true
                      }
                    }
                  }
                },
                _count: { select: { likes: true } }
              },
              orderBy: { createdAt: 'asc' }
            },
            _count: { select: { likes: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        vendorSuggestions: {
          include: {
            suggester: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                }
              }
            },
            vendor: {
              select: {
                id: true,
                companyName: true,
                rating: true,
                businessType: true
              }
            }
          }
        },
        productSuggestions: {
          include: {
            suggester: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                }
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                rating: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: { where: { isDeleted: false } },
            likes: true,
            bookmarks: true,
            shares: true
          }
        }
      }
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Increment view count
    await this.prisma.forumPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    // Check if user has liked/bookmarked the post
    let isLiked = false;
    let isBookmarked = false;

    if (userId) {
      const [like, bookmark] = await Promise.all([
        this.prisma.postLike.findFirst({
          where: { postId: id, userId }
        }),
        this.prisma.postBookmark.findFirst({
          where: { postId: id, userId }
        })
      ]);

      isLiked = !!like;
      isBookmarked = !!bookmark;
    }

    return {
      ...post,
      isLiked,
      isBookmarked
    };
  }

  async createPost(userId: string, data: CreateForumPostDto) {
    // Verify forum exists
    const forum = await this.prisma.forum.findFirst({
      where: { id: data.forumId, isActive: true }
    });

    if (!forum) {
      throw new NotFoundException('Forum not found');
    }

    // Generate unique slug
    const baseSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.forumPost.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const post = await this.prisma.forumPost.create({
      data: {
        ...data,
        userId,
        slug,
        type: data.type || 'DISCUSSION',
        visibility: data.visibility || 'PUBLIC',
        tags: data.tags || [],
        images: data.images || [],
        attachments: data.attachments || []
      },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        forum: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            bookmarks: true,
            shares: true
          }
        }
      }
    });

    // Update forum post count
    await this.prisma.forum.update({
      where: { id: data.forumId },
      data: { postCount: { increment: 1 } }
    });

    // Add reputation points for creating a post
    await this.updateUserReputation(userId, 'POST_CREATED', 5, post.id, 'post');

    return post;
  }

  async updatePost(postId: string, userId: string, data: UpdateForumPostDto) {
    const post = await this.prisma.forumPost.findFirst({
      where: { id: postId, isDeleted: false }
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    return this.prisma.forumPost.update({
      where: { id: postId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        forum: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            bookmarks: true,
            shares: true
          }
        }
      }
    });
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.forumPost.findFirst({
      where: { id: postId, isDeleted: false }
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.forumPost.update({
      where: { id: postId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    // Update forum post count
    await this.prisma.forum.update({
      where: { id: post.forumId },
      data: { postCount: { decrement: 1 } }
    });

    return { message: 'Post deleted successfully' };
  }

  // Comment Management
  async createComment(postId: string, userId: string, data: CreateCommentDto) {
    const post = await this.prisma.forumPost.findFirst({
      where: { id: postId, isDeleted: false }
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Verify parent comment exists if provided
    if (data.parentId) {
      const parentComment = await this.prisma.postComment.findFirst({
        where: { id: data.parentId, postId, isDeleted: false }
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.prisma.postComment.create({
      data: {
        postId,
        userId,
        content: data.content,
        parentId: data.parentId
      },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        _count: { select: { likes: true } }
      }
    });

    // Update post comment count
    await this.prisma.forumPost.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } }
    });

    // Add reputation points for creating a comment
    await this.updateUserReputation(userId, 'COMMENT_CREATED', 2, comment.id, 'comment');

    return comment;
  }

  async updateComment(commentId: string, userId: string, content: string) {
    const comment = await this.prisma.postComment.findFirst({
      where: { id: commentId, isDeleted: false }
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.postComment.update({
      where: { id: commentId },
      data: {
        content,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        _count: { select: { likes: true } }
      }
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.postComment.findFirst({
      where: { id: commentId, isDeleted: false }
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.postComment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    // Update post comment count
    await this.prisma.forumPost.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } }
    });

    return { message: 'Comment deleted successfully' };
  }

  // Like Management
  async togglePostLike(postId: string, userId: string) {
    const existingLike = await this.prisma.postLike.findFirst({
      where: { postId, userId }
    });

    if (existingLike) {
      // Remove like
      await this.prisma.postLike.delete({
        where: { id: existingLike.id }
      });

      await this.prisma.forumPost.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } }
      });

      return { liked: false, message: 'Like removed' };
    } else {
      // Add like
      await this.prisma.postLike.create({
        data: { postId, userId }
      });

      const post = await this.prisma.forumPost.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } }
      });

      // Add reputation points to post author for receiving a like
      if (post.userId !== userId) {
        await this.updateUserReputation(post.userId, 'LIKE_RECEIVED', 1, postId, 'post');
      }

      return { liked: true, message: 'Post liked' };
    }
  }

  async toggleCommentLike(commentId: string, userId: string) {
    const existingLike = await this.prisma.commentLike.findFirst({
      where: { commentId, userId }
    });

    if (existingLike) {
      // Remove like
      await this.prisma.commentLike.delete({
        where: { id: existingLike.id }
      });

      await this.prisma.postComment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } }
      });

      return { liked: false, message: 'Like removed' };
    } else {
      // Add like
      await this.prisma.commentLike.create({
        data: { commentId, userId }
      });

      const comment = await this.prisma.postComment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } }
      });

      // Add reputation points to comment author for receiving a like
      if (comment.userId !== userId) {
        await this.updateUserReputation(comment.userId, 'LIKE_RECEIVED', 1, commentId, 'comment');
      }

      return { liked: true, message: 'Comment liked' };
    }
  }

  // Bookmark Management
  async togglePostBookmark(postId: string, userId: string) {
    const existingBookmark = await this.prisma.postBookmark.findFirst({
      where: { postId, userId }
    });

    if (existingBookmark) {
      await this.prisma.postBookmark.delete({
        where: { id: existingBookmark.id }
      });

      return { bookmarked: false, message: 'Bookmark removed' };
    } else {
      await this.prisma.postBookmark.create({
        data: { postId, userId }
      });

      return { bookmarked: true, message: 'Post bookmarked' };
    }
  }

  // Share Management
  async sharePost(postId: string, userId: string, platform?: string) {
    const post = await this.prisma.forumPost.findFirst({
      where: { id: postId, isDeleted: false }
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.prisma.postShare.create({
      data: {
        postId,
        userId,
        platform
      }
    });

    await this.prisma.forumPost.update({
      where: { id: postId },
      data: { shareCount: { increment: 1 } }
    });

    // Add reputation points to post author for receiving a share
    if (post.userId !== userId) {
      await this.updateUserReputation(post.userId, 'POST_SHARED', 3, postId, 'post');
    }

    return { message: 'Post shared successfully' };
  }

  // Vendor Suggestions
  async suggestVendor(
    postId: string,
    userId: string,
    vendorId: string,
    reason: string
  ) {
    // Check if suggestion already exists
    const existingSuggestion = await this.prisma.vendorSuggestion.findFirst({
      where: { postId, suggestedBy: userId, vendorId }
    });

    if (existingSuggestion) {
      throw new BadRequestException('You have already suggested this vendor for this post');
    }

    const suggestion = await this.prisma.vendorSuggestion.create({
      data: {
        postId,
        suggestedBy: userId,
        vendorId,
        reason
      },
      include: {
        suggester: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
            rating: true,
            businessType: true
          }
        }
      }
    });

    // Add reputation points for making a helpful suggestion
    await this.updateUserReputation(userId, 'VENDOR_TAGGED', 3, suggestion.id, 'vendor_suggestion');

    return suggestion;
  }

  async rateVendorSuggestion(
    suggestionId: string,
    userId: string,
    rating: SuggestionRating
  ) {
    const suggestion = await this.prisma.vendorSuggestion.findUnique({
      where: { id: suggestionId },
      include: { post: true }
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    // Only post author can rate suggestions
    if (suggestion.post.userId !== userId) {
      throw new ForbiddenException('Only the post author can rate suggestions');
    }

    await this.prisma.vendorSuggestion.update({
      where: { id: suggestionId },
      data: {
        rating,
        ratedBy: userId,
        ratedAt: new Date()
      }
    });

    // Add reputation points to suggester based on rating
    let points = 0;
    switch (rating) {
      case 'VERY_HELPFUL':
        points = 10;
        break;
      case 'HELPFUL':
        points = 5;
        break;
      case 'SOMEWHAT_HELPFUL':
        points = 2;
        break;
      case 'NOT_HELPFUL':
        points = -1;
        break;
    }

    if (points > 0) {
      await this.updateUserReputation(
        suggestion.suggestedBy,
        'SUGGESTION_HELPFUL',
        points,
        suggestionId,
        'vendor_suggestion'
      );
    }

    return { message: 'Suggestion rated successfully' };
  }

  // User Reputation Management
  private async updateUserReputation(
    userId: string,
    action: any,
    points: number,
    relatedId: string,
    relatedType: string
  ) {
    // Upsert user reputation
    const reputation = await this.prisma.userReputation.upsert({
      where: { userId },
      update: {
        totalPoints: { increment: points },
        ...(action === 'POST_CREATED' && { postsCreated: { increment: 1 } }),
        ...(action === 'COMMENT_CREATED' && { commentsCreated: { increment: 1 } }),
        ...(action === 'LIKE_RECEIVED' && { likesReceived: { increment: 1 } }),
        ...(action === 'POST_SHARED' && { sharesReceived: { increment: 1 } }),
        ...(action === 'SUGGESTION_HELPFUL' && { helpfulSuggestions: { increment: 1 } }),
      },
      create: {
        userId,
        totalPoints: points,
        postsCreated: action === 'POST_CREATED' ? 1 : 0,
        commentsCreated: action === 'COMMENT_CREATED' ? 1 : 0,
        likesReceived: action === 'LIKE_RECEIVED' ? 1 : 0,
        sharesReceived: action === 'POST_SHARED' ? 1 : 0,
        helpfulSuggestions: action === 'SUGGESTION_HELPFUL' ? 1 : 0,
      }
    });

    // Calculate level based on points
    const newLevel = Math.floor(reputation.totalPoints / 100) + 1;
    if (newLevel !== reputation.level) {
      await this.prisma.userReputation.update({
        where: { userId },
        data: { level: newLevel }
      });
    }

    // Record reputation history
    await this.prisma.reputationHistory.create({
      data: {
        userId,
        action,
        points,
        description: `${action.replace('_', ' ').toLowerCase()} - ${points} points`,
        relatedId,
        relatedType
      }
    });
  }

  // Get user's community activity
  async getUserCommunityStats(userId: string) {
    const [reputation, posts, comments, suggestions] = await Promise.all([
      this.prisma.userReputation.findUnique({
        where: { userId }
      }),
      this.prisma.forumPost.count({
        where: { userId, isDeleted: false }
      }),
      this.prisma.postComment.count({
        where: { userId, isDeleted: false }
      }),
      this.prisma.vendorSuggestion.count({
        where: { suggestedBy: userId }
      })
    ]);

    return {
      reputation: reputation || {
        totalPoints: 0,
        level: 1,
        postsCreated: 0,
        commentsCreated: 0,
        likesReceived: 0,
        sharesReceived: 0,
        helpfulSuggestions: 0
      },
      stats: {
        posts,
        comments,
        suggestions
      }
    };
  }

  // Get trending posts
  async getTrendingPosts(period = 'weekly', limit = 10) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return this.prisma.forumPost.findMany({
      where: {
        isDeleted: false,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        forum: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            comments: { where: { isDeleted: false } },
            likes: true,
            shares: true
          }
        }
      },
      orderBy: [
        { likeCount: 'desc' },
        { commentCount: 'desc' },
        { viewCount: 'desc' },
        { shareCount: 'desc' }
      ],
      take: limit
    });
  }

  // Legacy method for backward compatibility
  async getCommunityPosts() {
    const result = await this.getPosts();
    return result.data;
  }
}