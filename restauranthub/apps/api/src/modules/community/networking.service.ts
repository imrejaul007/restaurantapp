import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, forwardRef, Inject } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ReputationService } from './reputation.service';
import { CommunityNotificationService } from './notifications.service';
import { UserRole, ReputationAction } from '@prisma/client';

type GroupType = 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';

@Injectable()
export class NetworkingService {
  private readonly logger = new Logger(NetworkingService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(forwardRef(() => ReputationService))
    private readonly reputationService: ReputationService,
    @Inject(forwardRef(() => CommunityNotificationService))
    private readonly notificationService: CommunityNotificationService,
  ) {}

  async followUser(followerId: string, followingId: string) {
    try {
      if (followerId === followingId) {
        throw new BadRequestException('Cannot follow yourself');
      }

      // Check if users exist
      const [follower, following] = await Promise.all([
        this.databaseService.user.findUnique({ where: { id: followerId } }),
        this.databaseService.user.findUnique({ where: { id: followingId } }),
      ]);

      if (!follower || !following) {
        throw new NotFoundException('User not found');
      }

      // Check if already following
      const existingFollow = await this.databaseService.userFollow.findUnique({
        where: { followerId_followingId: { followerId, followingId } },
      });

      if (existingFollow) {
        throw new BadRequestException('Already following this user');
      }

      const follow = await this.databaseService.userFollow.create({
        data: { followerId, followingId },
      });

      // Follow counts are calculated dynamically from UserFollow table

      // Award reputation for being followed
      await this.reputationService.addReputationPoints(
        followingId,
        ReputationAction.FOLLOWED_BY_USER,
        2,
        'Gained a new follower',
        followerId,
      );

      // Send notification to the user who was followed
      await this.notificationService.notifyUserFollowed(followerId, followingId);

      return follow;
    } catch (error) {
      this.logger.error('Failed to follow user', error);
      throw error;
    }
  }

  async unfollowUser(followerId: string, followingId: string) {
    try {
      const follow = await this.databaseService.userFollow.findUnique({
        where: { followerId_followingId: { followerId, followingId } },
      });

      if (!follow) {
        throw new NotFoundException('Follow relationship not found');
      }

      await this.databaseService.userFollow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      });

      // Update follow counts
      await Promise.all([
        // Follow counts are calculated dynamically from UserFollow table
        Promise.resolve(),
        Promise.resolve(),
      ]);

      return { message: 'Unfollowed successfully' };
    } catch (error) {
      this.logger.error('Failed to unfollow user', error);
      throw error;
    }
  }

  async getUserFollowers(userId: string, params: { page?: number; limit?: number }) {
    try {
      const { page = 1, limit = 20 } = params;
      const skip = (page - 1) * limit;

      const [followers, total] = await Promise.all([
        this.databaseService.userFollow.findMany({
          where: { followingId: userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            follower: {
              include: {
                profile: true,
                reputation: true,
              },
            },
          },
        }),
        this.databaseService.userFollow.count({
          where: { followingId: userId },
        }),
      ]);

      return {
        followers: followers.map(follow => ({
          id: follow.follower.id,
          name: `${follow.follower.profile?.firstName || ''} ${follow.follower.profile?.lastName || ''}`.trim() || 'Unknown User',
          role: follow.follower.role,
          avatar: follow.follower.profile?.avatar,
          verified: follow.follower.isVerified,
          city: follow.follower.profile?.city,
          reputation: {
            level: follow.follower.reputation?.level || 1,
            totalPoints: follow.follower.reputation?.totalPoints || 0,
          },
          followedAt: follow.createdAt,
        })),
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
      this.logger.error('Failed to get user followers', error);
      throw error;
    }
  }

  async getUserFollowing(userId: string, params: { page?: number; limit?: number }) {
    try {
      const { page = 1, limit = 20 } = params;
      const skip = (page - 1) * limit;

      const [following, total] = await Promise.all([
        this.databaseService.userFollow.findMany({
          where: { followerId: userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            following: {
              include: {
                profile: true,
                reputation: true,
              },
            },
          },
        }),
        this.databaseService.userFollow.count({
          where: { followerId: userId },
        }),
      ]);

      return {
        following: following.map(follow => ({
          id: follow.following.id,
          name: `${follow.following.profile?.firstName || ''} ${follow.following.profile?.lastName || ''}`.trim() || 'Unknown User',
          role: follow.following.role,
          avatar: follow.following.profile?.avatar,
          verified: follow.following.isVerified,
          city: follow.following.profile?.city,
          reputation: {
            level: follow.following.reputation?.level || 1,
            totalPoints: follow.following.reputation?.totalPoints || 0,
          },
          followedAt: follow.createdAt,
        })),
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
      this.logger.error('Failed to get user following', error);
      throw error;
    }
  }

  async createGroup(userId: string, groupData: {
    name: string;
    description?: string;
    type: GroupType;
    isPrivate: boolean;
    city?: string;
    category?: string;
    rules?: string[];
    maxMembers?: number;
    icon?: string;
    banner?: string;
  }) {
    try {
      // Check if user can create groups (admins or verified users)
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: { reputation: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Only verified users with level 3+ or admins can create groups
      if (!user.isVerified && user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only verified users can create groups');
      }

      const userLevel = user.reputation?.level || 1;
      if (userLevel < 3 && user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Must be at least level 3 to create groups');
      }

      // Generate slug
      const baseSlug = groupData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      let slug = baseSlug;
      let counter = 1;

      // Ensure unique slug
      while (await this.databaseService.communityGroup.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const group = await this.databaseService.communityGroup.create({
        data: {
          name: groupData.name,
          slug,
          description: groupData.description,
          image: groupData.icon || groupData.banner, // Use icon or banner as image
          isPrivate: groupData.isPrivate || false,
          createdBy: userId,
        },
      });

      // Add creator as admin member
      await this.databaseService.groupMember.create({
        data: {
          userId,
          groupId: group.id,
          role: 'ADMIN',
          joinedAt: new Date(),
        },
      });

      // Update group member count
      await this.databaseService.communityGroup.update({
        where: { id: group.id },
        data: { memberCount: 1 },
      });

      // Award reputation for creating a group
      await this.reputationService.addReputationPoints(
        userId,
        ReputationAction.GROUP_CREATED,
        25,
        `Created group: ${group.name}`,
        group.id,
      );

      return group;
    } catch (error) {
      this.logger.error('Failed to create group', error);
      throw error;
    }
  }

  async joinGroup(userId: string, groupId: string) {
    try {
      const group = await this.databaseService.communityGroup.findUnique({
        where: { id: groupId },
        include: {
          _count: { select: { members: true } },
        },
      });

      if (!group) {
        throw new NotFoundException('Group not found');
      }

      // Check if already a member
      const existingMember = await this.databaseService.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
      });

      if (existingMember) {
        throw new BadRequestException('Already a member of this group');
      }

      // For private groups, require invitation (simplified - skip join request for now)
      if (group.isPrivate) {
        throw new ForbiddenException('This is a private group. An invitation is required to join.');
      }

      // For public groups, directly join
      const membership = await this.databaseService.groupMember.create({
        data: {
          userId,
          groupId,
          role: 'MEMBER',
          joinedAt: new Date(),
        },
      });

      // Update group member count
      await this.databaseService.communityGroup.update({
        where: { id: groupId },
        data: { memberCount: { increment: 1 } },
      });

      return membership;
    } catch (error) {
      this.logger.error('Failed to join group', error);
      throw error;
    }
  }

  async getGroups(params: {
    type?: GroupType;
    city?: string;
    category?: string;
    search?: string;
    isPrivate?: boolean;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        type,
        city,
        category,
        search,
        isPrivate,
        page = 1,
        limit = 20,
      } = params;
      const skip = (page - 1) * limit;

      const whereClause: any = {
        ...(isPrivate !== undefined && { isPrivate }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      const [groups, total] = await Promise.all([
        this.databaseService.communityGroup.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { memberCount: 'desc' },
          include: {
            creator: {
              include: { profile: true },
            },
            _count: {
              select: { members: true, posts: true },
            },
          },
        }),
        this.databaseService.communityGroup.count({ where: whereClause }),
      ]);

      return {
        groups: groups.map(group => ({
          id: group.id,
          name: group.name,
          slug: group.slug,
          description: group.description,
          image: group.image,
          isPrivate: group.isPrivate,
          memberCount: group._count.members,
          postCount: group._count.posts,
          createdAt: group.createdAt,
          creator: {
            id: group.creator.id,
            name: `${group.creator.profile?.firstName || ''} ${group.creator.profile?.lastName || ''}`.trim() || 'Unknown User',
            avatar: group.creator.profile?.avatar,
          },
        })),
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
      this.logger.error('Failed to get groups', error);
      throw error;
    }
  }

  async getGroupDetails(groupId: string, userId?: string) {
    try {
      const group = await this.databaseService.communityGroup.findUnique({
        where: { id: groupId },
        include: {
          creator: {
            include: { profile: true },
          },
          members: {
            take: 10,
            orderBy: { joinedAt: 'desc' },
            include: {
              user: {
                include: { profile: true },
              },
            },
          },
          _count: {
            select: { members: true, posts: true },
          },
        },
      });

      if (!group) {
        throw new NotFoundException('Group not found');
      }

      let userMembership = null;
      let userJoinRequest = null;

      if (userId) {
        userMembership = await this.databaseService.groupMember.findUnique({
          where: { groupId_userId: { groupId, userId } },
        });

        // Note: Join request functionality not implemented yet
      }

      return {
        id: group.id,
        name: group.name,
        slug: group.slug,
        description: group.description,
        image: group.image,
        isPrivate: group.isPrivate,
        memberCount: group._count.members,
        postCount: group._count.posts,
        createdAt: group.createdAt,
        creator: {
          id: group.creator.id,
          name: `${group.creator.profile?.firstName || ''} ${group.creator.profile?.lastName || ''}`.trim() || 'Unknown User',
          avatar: group.creator.profile?.avatar,
        },
        recentMembers: group.members.map(member => ({
          id: member.user.id,
          name: `${member.user.profile?.firstName || ''} ${member.user.profile?.lastName || ''}`.trim() || 'Unknown User',
          avatar: member.user.profile?.avatar,
          role: member.role,
          joinedAt: member.joinedAt,
        })),
        userStatus: userMembership ? {
          isMember: true,
          role: userMembership.role,
          joinedAt: userMembership.joinedAt,
        } : userJoinRequest ? {
          isMember: false,
          hasJoinRequest: true,
          requestedAt: (userJoinRequest as any)?.createdAt,
        } : {
          isMember: false,
          hasJoinRequest: false,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get group details', error);
      throw error;
    }
  }

  async getUserNetworkStats(userId: string) {
    try {
      const [followersCount, followingCount, groupsCount, mutualConnections] = await Promise.all([
        this.databaseService.userFollow.count({
          where: { followingId: userId },
        }),
        this.databaseService.userFollow.count({
          where: { followerId: userId },
        }),
        this.databaseService.groupMember.count({
          where: { userId },
        }),
        // Get users who follow this user and are followed by this user (mutual follows)
        this.databaseService.$queryRaw`
          SELECT COUNT(*)::int as count
          FROM "UserFollow" uf1
          JOIN "UserFollow" uf2 ON uf1.followerId = uf2.followingId AND uf1.followingId = uf2.followerId
          WHERE uf1.followerId = ${userId}
        `,
      ]);

      const mutualCount = Array.isArray(mutualConnections) && mutualConnections.length > 0 
        ? mutualConnections[0].count 
        : 0;

      return {
        followersCount,
        followingCount,
        groupsCount,
        mutualConnections: mutualCount,
      };
    } catch (error) {
      this.logger.error('Failed to get user network stats', error);
      throw error;
    }
  }

  async getSuggestedConnections(userId: string, limit = 10) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: { 
          profile: true,
          reputation: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get users already followed
      const followedUsers = await this.databaseService.userFollow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followedIds = followedUsers.map(f => f.followingId);

      // Find suggested connections based on:
      // 1. Same city
      // 2. Same role
      // 3. Similar reputation level
      // 4. Mutual connections
      const suggestions = await this.databaseService.user.findMany({
        where: {
          id: { not: userId, notIn: followedIds },
          isActive: true,
          OR: [
            // Same city
            { profile: { city: user.profile?.city } },
            // Same role
            { role: user.role },
            // Users in same groups
            {
              groupMemberships: {
                some: {
                  group: {
                    members: {
                      some: { userId },
                    },
                  },
                },
              },
            },
          ],
        },
        take: limit * 2, // Get more to filter later
        include: {
          profile: true,
          reputation: true,
          _count: {
            select: {
              followers: true,
              following: true,
            },
          },
        },
        orderBy: [
          { isVerified: 'desc' },
          { reputation: { totalPoints: 'desc' } },
        ],
      });

      // Calculate suggestion score and sort
      const scoredSuggestions = suggestions.map((suggestion: any) => {
        let score = 0;
        
        // Same city boost
        if (suggestion.profile?.city === user.profile?.city) score += 3;
        
        // Same role boost
        if (suggestion.role === user.role) score += 2;
        
        // Verification boost
        if (suggestion.isVerified) score += 2;
        
        // Reputation similarity boost
        const userLevel = user.reputation?.level || 1;
        const suggestionLevel = suggestion.reputation?.level || 1;
        if (Math.abs(userLevel - suggestionLevel) <= 2) score += 1;

        return {
          ...suggestion,
          suggestionScore: score,
        };
      });

      // Sort by score and take the requested amount
      const topSuggestions = scoredSuggestions
        .sort((a: any, b: any) => b.suggestionScore - a.suggestionScore)
        .slice(0, limit);

      return topSuggestions.map((suggestion: any) => ({
        id: suggestion.id,
        name: `${suggestion.profile?.firstName || ''} ${suggestion.profile?.lastName || ''}`.trim() || 'Unknown User',
        role: suggestion.role,
        avatar: suggestion.profile?.avatar,
        verified: suggestion.isVerified,
        city: suggestion.profile?.city,
        reputation: {
          level: suggestion.reputation?.level || 1,
          totalPoints: suggestion.reputation?.totalPoints || 0,
        },
        networkStats: {
          followersCount: suggestion._count.followers,
          followingCount: suggestion._count.following,
        },
        reasonForSuggestion: this.getReasonForSuggestion(user, suggestion),
      }));
    } catch (error) {
      this.logger.error('Failed to get suggested connections', error);
      throw error;
    }
  }

  private getReasonForSuggestion(user: any, suggestion: any): string {
    if (suggestion.profile?.city === user.profile?.city && suggestion.role === user.role) {
      return `Same ${user.role.toLowerCase()} in ${user.profile.city}`;
    }
    if (suggestion.profile?.city === user.profile?.city) {
      return `Same city: ${user.profile.city}`;
    }
    if (suggestion.role === user.role) {
      return `Same role: ${user.role.toLowerCase()}`;
    }
    if (suggestion.isVerified) {
      return 'Verified user';
    }
    return 'Suggested for you';
  }
}