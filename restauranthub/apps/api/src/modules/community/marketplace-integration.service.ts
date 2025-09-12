import { Injectable, Logger, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ReputationService } from './reputation.service';
import { PostType, ReputationAction, UserRole } from '@prisma/client';

@Injectable()
export class MarketplaceIntegrationService {
  private readonly logger = new Logger(MarketplaceIntegrationService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(forwardRef(() => ReputationService))
    private readonly reputationService: ReputationService,
  ) {}

  async createProductDiscussion(
    userId: string,
    productId: string,
    discussionData: {
      title: string;
      content: string;
      forumId?: string;
      tags?: string[];
    }
  ) {
    try {
      // Verify product exists
      const product = await this.databaseService.product.findUnique({
        where: { id: productId },
        include: { vendor: true },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Find or create marketplace forum
      let forum = await this.databaseService.forum.findFirst({
        where: { category: 'Marketplace' },
      });

      if (!forum) {
        forum = await this.databaseService.forum.create({
          data: {
            name: 'Marketplace Discussions',
            slug: 'marketplace-discussions',
            description: 'Discuss products, vendors, and marketplace topics',
            category: 'Marketplace',
            icon: '🛍️',
            color: '#10B981',
            displayOrder: 5,
          },
        });
      }

      // Generate slug for the post
      const slug = discussionData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Create forum post linked to product
      const post = await this.databaseService.forumPost.create({
        data: {
          title: discussionData.title,
          content: discussionData.content,
          userId,
          forumId: discussionData.forumId || forum.id,
          type: PostType.DISCUSSION,
          slug: `${slug}-${Date.now()}`, // Ensure uniqueness
          tags: [...(discussionData.tags || []), 'product', product.name.toLowerCase()],
        },
        include: {
          author: { include: { profile: true } },
          forum: true,
        },
      });

      // Award reputation for marketplace engagement
      await this.reputationService.addReputationPoints(
        userId,
        ReputationAction.POST_CREATED,
        8, // Higher points for marketplace discussions
        `Started product discussion: ${product.name}`,
        post.id,
      );

      // Notify product vendor about the discussion
      if (product.vendor?.userId) {
        await this.createMarketplaceNotification(
          product.vendor.userId,
          'PRODUCT_DISCUSSED',
          `New discussion about your product: ${product.name}`,
          { postId: post.id, productId },
        );
      }

      return post;
    } catch (error) {
      this.logger.error('Failed to create product discussion', error);
      throw error;
    }
  }

  async createJobPosting(
    userId: string,
    postingData: {
      title: string;
      description: string;
      restaurantId: string; // Required by Job schema
      location: string;
      jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE';
      salaryMin?: number;
      salaryMax?: number;
      requirements: string[];
      skills?: string[];
      benefits?: string[];
      applicationUrl?: string;
      expiresAt?: Date;
    }
  ) {
    try {
      // Check if user can post jobs (verified users or restaurants/vendors)
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: { reputation: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const canPostJobs = user.isVerified || 
        user.role === UserRole.RESTAURANT || 
        user.role === UserRole.VENDOR ||
        user.role === UserRole.ADMIN ||
        (user.reputation?.level || 0) >= 5;

      if (!canPostJobs) {
        throw new Error('Insufficient permissions to post jobs. Must be verified or level 5+');
      }

      // Find or create jobs forum
      let forum = await this.databaseService.forum.findFirst({
        where: { category: 'Jobs' },
      });

      if (!forum) {
        forum = await this.databaseService.forum.create({
          data: {
            name: 'Job Opportunities',
            slug: 'job-opportunities',
            description: 'Restaurant industry job postings and career discussions',
            category: 'Jobs',
            icon: '💼',
            color: '#3B82F6',
            displayOrder: 3,
          },
        });
      }

      // Generate slug for the job posting
      const slug = postingData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Create job posting as forum post
      const post = await this.databaseService.forumPost.create({
        data: {
          title: postingData.title,
          content: this.formatJobDescription(postingData),
          userId,
          forumId: forum.id,
          type: PostType.JOB_REQUEST,
          slug: `${slug}-${Date.now()}`, // Ensure uniqueness
          tags: ['job', 'hiring', postingData.jobType.toLowerCase(), postingData.location.toLowerCase()],
          isPinned: user.role === UserRole.ADMIN,
        },
        include: {
          author: { include: { profile: true } },
          forum: true,
        },
      });

      // Create dedicated job record for better filtering/searching
      const job = await this.databaseService.job.create({
        data: {
          restaurantId: postingData.restaurantId,
          title: postingData.title,
          description: postingData.description,
          location: postingData.location,
          jobType: postingData.jobType,
          requirements: postingData.requirements || [],
          skills: postingData.skills || [],
          salaryMin: postingData.salaryMin,
          salaryMax: postingData.salaryMax,
          validTill: postingData.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Award reputation for job posting
      await this.reputationService.addReputationPoints(
        userId,
        ReputationAction.POST_CREATED,
        15, // High points for job postings
        `Posted job: ${postingData.title}`,
        post.id,
      );

      return { post, job };
    } catch (error) {
      this.logger.error('Failed to create job posting', error);
      throw error;
    }
  }

  async getMarketplaceInsights(params: {
    type: 'product' | 'vendor' | 'category';
    id?: string;
    timeframe?: 'week' | 'month' | 'quarter';
  }) {
    try {
      const { type, id, timeframe = 'month' } = params;
      const timeRange = this.getTimeRange(timeframe);

      let insights: any = {};

      switch (type) {
        case 'product':
          if (!id) throw new Error('Product ID required');
          insights = await this.getProductInsights(id, timeRange);
          break;

        case 'vendor':
          if (!id) throw new Error('Vendor ID required');
          insights = await this.getVendorInsights(id, timeRange);
          break;

        case 'category':
          insights = await this.getCategoryInsights(id, timeRange);
          break;
      }

      return {
        type,
        id,
        timeframe,
        insights,
      };
    } catch (error) {
      this.logger.error('Failed to get marketplace insights', error);
      throw error;
    }
  }

  async getJobMarketAnalytics(params: {
    location?: string;
    jobType?: string;
    timeframe?: 'week' | 'month' | 'quarter';
  }) {
    try {
      const { location, jobType, timeframe = 'month' } = params;
      const timeRange = this.getTimeRange(timeframe);

      const whereClause: any = {
        createdAt: { gte: timeRange },
        ...(location && { location: { contains: location, mode: 'insensitive' } }),
        ...(jobType && { jobType }),
      };

      const [totalJobs, jobsByType, jobsByLocation, averageSalary] = await Promise.all([
        this.databaseService.job.count({ where: whereClause }),
        
        this.databaseService.job.groupBy({
          by: ['jobType'],
          where: whereClause,
          _count: { id: true },
        }),

        this.databaseService.job.groupBy({
          by: ['location'],
          where: whereClause,
          _count: { id: true },
          take: 10,
          orderBy: { _count: { id: 'desc' } },
        }),

        // Count jobs with salary info
        this.databaseService.job.count({
          where: { ...whereClause, salaryMin: { not: null } },
        }),
      ]);

      // Get trending job skills from requirements
      const jobs = await this.databaseService.job.findMany({
        where: whereClause,
        select: { requirements: true },
      });

      const skillCounts: { [key: string]: number } = {};
      jobs.forEach((job: any) => {
        job.requirements.forEach((req: any) => {
          const skill = req.toLowerCase().trim();
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
      });

      const trendingSkills = Object.entries(skillCounts)
        .sort(([,a], [,b]: [string, number]) => b - a)
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, demand: count }));

      return {
        timeframe,
        summary: {
          totalJobs,
          jobsWithSalary: averageSalary,
        },
        distribution: {
          byType: jobsByType,
          byLocation: jobsByLocation,
        },
        trends: {
          skills: trendingSkills,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get job market analytics', error);
      throw error;
    }
  }

  async getRecommendedProducts(userId: string, limit = 10) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          forumPosts: {
            where: { isDeleted: false },
            select: { tags: true },
            take: 50,
          },
          postComments: {
            where: { isDeleted: false },
            include: { post: { select: { tags: true } } },
            take: 50,
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Extract interest tags from user's posts and comments
      const interestTags = new Set<string>();
      user.forumPosts.forEach((post: any) => {
        post.tags.forEach((tag: any) => interestTags.add(tag.toLowerCase()));
      });
      user.postComments.forEach((comment: any) => {
        comment.post.tags.forEach((tag: any) => interestTags.add(tag.toLowerCase()));
      });

      // Find products matching user interests
      const products = await this.databaseService.product.findMany({
        where: {
          isActive: true,
          OR: [
            // Products with matching tags
            { tags: { hasSome: Array.from(interestTags) } },
          ],
        },
        take: limit * 2,
        include: {
          vendor: {
            include: { 
              user: {
                include: { profile: true }
              }
            },
          },
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: [
          { rating: 'desc' },
          { totalReviews: 'desc' },
        ],
      });

      // Score products based on relevance
      const scoredProducts = products.map((product: any) => {
        let relevanceScore = 0;
        
        // Tag matching boost
        const matchingTags = product.tags.filter((tag: any) => 
          interestTags.has(tag.toLowerCase())
        ).length;
        relevanceScore += matchingTags * 3;

        // Location boost
        if (user.profile?.city && 
            product.vendor?.address?.toLowerCase().includes(user.profile.city.toLowerCase())) {
          relevanceScore += 2;
        }

        // Rating boost
        relevanceScore += (product.rating || 0) * 0.5;

        // Review count boost
        relevanceScore += Math.min(product._count.reviews * 0.1, 2);

        return { ...product, relevanceScore };
      });

      // Sort by relevance and return top products
      const recommendations = scoredProducts
        .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)
        .map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description?.substring(0, 150),
          price: product.price,
          rating: product.rating,
          reviewCount: product._count.reviews,
          vendor: {
            id: product.vendor.id,
            name: product.vendor.businessName,
            avatar: product.vendor.profile?.avatar,
          },
          relevanceScore: product.relevanceScore,
          matchingInterests: product.tags.filter((tag: any) => 
            interestTags.has(tag.toLowerCase())
          ),
        }));

      return {
        recommendations,
        userInterests: Array.from(interestTags).slice(0, 10),
      };
    } catch (error) {
      this.logger.error('Failed to get recommended products', error);
      throw error;
    }
  }

  async getRecommendedJobs(userId: string, limit = 10) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          forumPosts: {
            where: { type: PostType.JOB_SEEKING },
            select: { content: true, tags: true },
            take: 10,
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Extract skills and preferences from job-seeking posts
      const skills = new Set<string>();
      const preferences = new Set<string>();
      
      user.forumPosts.forEach((post: any) => {
        post.tags.forEach((tag: string) => {
          if (tag.includes('skill') || tag.includes('experience')) {
            skills.add(tag);
          } else {
            preferences.add(tag);
          }
        });
      });

      const jobs = await this.databaseService.job.findMany({
        where: {
          status: 'OPEN',
          validTill: { gt: new Date() },
          OR: [
            // Jobs matching skills
            { requirements: { hasSome: Array.from(skills) } },
          ],
        },
        take: limit * 2,
        include: {
          restaurant: {
            include: { 
              user: {
                include: { profile: true }
              }
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Score jobs based on relevance
      const scoredJobs = jobs.map((job: any) => {
        let relevanceScore = 0;

        // Skill matching
        const matchingSkills = job.requirements.filter((req: any) => 
          Array.from(skills).some(skill => 
            req.toLowerCase().includes(skill.toLowerCase())
          )
        ).length;
        relevanceScore += matchingSkills * 5;

        // Location matching
        if (user.profile?.city && 
            job.location.toLowerCase().includes(user.profile.city.toLowerCase())) {
          relevanceScore += 3;
        }

        // Recency boost
        const daysSincePosted = Math.floor(
          (Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        relevanceScore += Math.max(0, 7 - daysSincePosted);

        return { ...job, relevanceScore };
      });

      const recommendations = scoredJobs
        .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)
        .map((job: any) => ({
          id: job.id,
          title: job.title,
          description: job.description.substring(0, 200),
          location: job.location,
          jobType: job.jobType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          postedAt: job.createdAt,
          expiresAt: job.validTill,
          relevanceScore: job.relevanceScore,
          restaurant: {
            id: job.restaurant.id,
            name: job.restaurant.name || job.restaurant.businessName,
            avatar: job.restaurant.user?.profile?.avatar,
          },
        }));

      return {
        recommendations,
        userSkills: Array.from(skills).slice(0, 10),
      };
    } catch (error) {
      this.logger.error('Failed to get recommended jobs', error);
      throw error;
    }
  }

  private formatJobDescription(postingData: any): string {
    let description = `Hiring for **${postingData.title}**\n\n`;
    description += `📍 **Location:** ${postingData.location}\n`;
    description += `💼 **Type:** ${postingData.jobType.replace('_', ' ')}\n`;
    
    if (postingData.salaryMin || postingData.salaryMax) {
      const salaryRange = [postingData.salaryMin, postingData.salaryMax].filter(Boolean).join(' - ');
      description += `💰 **Salary:** ${salaryRange}\n`;
    }
    
    description += `\n**Description:**\n${postingData.description}\n\n`;
    
    if (postingData.requirements.length > 0) {
      description += `**Requirements:**\n${postingData.requirements.map((req: any) => `• ${req}`).join('\n')}\n\n`;
    }
    
    if (postingData.benefits && postingData.benefits.length > 0) {
      description += `**Benefits:**\n${postingData.benefits.map((benefit: any) => `• ${benefit}`).join('\n')}\n\n`;
    }
    
    if (postingData.applicationUrl) {
      description += `**Apply:** ${postingData.applicationUrl}`;
    }
    
    return description;
  }

  private async getProductInsights(productId: string, timeRange: Date) {
    // Get product name for tag search
    const product = await this.databaseService.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });

    const [discussions, suggestions, mentions] = await Promise.all([
      this.databaseService.forumPost.count({
        where: {
          type: PostType.DISCUSSION,
          tags: { has: product?.name.toLowerCase() },
          createdAt: { gte: timeRange },
        },
      }),
      
      this.databaseService.productSuggestion.count({
        where: {
          productId,
          createdAt: { gte: timeRange },
        },
      }),

      this.databaseService.forumPost.count({
        where: {
          content: { contains: productId, mode: 'insensitive' },
          createdAt: { gte: timeRange },
        },
      }),
    ]);

    return { discussions, suggestions, mentions };
  }

  private async getVendorInsights(vendorId: string, timeRange: Date) {
    // Similar implementation for vendor insights
    return { discussions: 0, reviews: 0, recommendations: 0 };
  }

  private async getCategoryInsights(category: string | undefined, timeRange: Date) {
    // Similar implementation for category insights
    return { totalDiscussions: 0, topProducts: [], activeVendors: 0 };
  }

  private async createMarketplaceNotification(
    userId: string,
    type: string,
    message: string,
    metadata: any
  ) {
    // This would integrate with notification service
    this.logger.log(`Notification: ${userId} - ${type}: ${message}`);
  }

  private getTimeRange(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}