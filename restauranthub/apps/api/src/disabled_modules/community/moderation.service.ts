import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UserRole, ReportStatus } from '@prisma/client';

type ContentType = 'POST' | 'COMMENT' | 'USER' | 'GROUP';

enum ModerationAction {
  APPROVE = 'APPROVE',
  REMOVE = 'REMOVE',
  WARN = 'WARN',
  SUSPEND = 'SUSPEND',
  BAN = 'BAN'
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  // Spam detection patterns
  private readonly spamPatterns = [
    /(\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)\b/g, // URLs
    /\b(?:buy\s+now|click\s+here|free\s+money|make\s+\$\d+|viagra|casino)\b/gi, // Common spam phrases
    /(.)\1{4,}/g, // Repeated characters
    /[^\w\s]{3,}/g, // Multiple special characters
  ];

  private readonly profanityList = [
    // Add common profanity words here - keeping empty for now
    // This would typically be populated from a comprehensive list
  ];

  constructor(private readonly databaseService: DatabaseService) {}

  async reportContent(
    reporterId: string,
    contentId: string,
    contentType: 'POST' | 'COMMENT' | 'USER' | 'GROUP',
    reason: string,
    description?: string,
    category?: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'MISINFORMATION' | 'COPYRIGHT' | 'OTHER'
  ) {
    try {
      // Check if user has already reported this content
      const existingReport = await this.databaseService.postReport.findFirst({
        where: {
          reporterId,
          postId: contentId,
                  },
      });

      if (existingReport) {
        throw new BadRequestException('You have already reported this content');
      }

      // Verify content exists based on type
      await this.verifyContentExists(contentId, contentType);

      const report = await this.databaseService.postReport.create({
        data: {
          reporterId,
          postId: contentId,
          reason,
          description,
          status: ReportStatus.PENDING,
        },
      });

      // Auto-moderate based on report patterns
      await this.checkAutoModeration(contentId, contentType, reason, category);

      // Update content safety score
      await this.updateContentSafetyScore(contentId, contentType);

      this.logger.log(`Content reported: ${contentType} ${contentId} by user ${reporterId}`);

      return report;
    } catch (error) {
      this.logger.error('Failed to report content', error);
      throw error;
    }
  }

  async getReports(params: {
    status?: ReportStatus;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        status,
        page = 1,
        limit = 20,
      } = params;
      const skip = (page - 1) * limit;

      const whereClause: any = {
        ...(status && { status }),
      };

      const [reports, total] = await Promise.all([
        this.databaseService.postReport.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: {
              include: { profile: true },
            },
          },
        }),
        this.databaseService.postReport.count({ where: whereClause }),
      ]);

      // Enrich reports with content details
      const enrichedReports = await Promise.all(
        reports.map(async (report) => {
          const contentDetails = await this.getContentDetails(
            report.postId,
            'POST'
          );

          return {
            ...report,
            reporter: {
              id: report.reporter.id,
              name: `${report.reporter.profile?.firstName || ''} ${report.reporter.profile?.lastName || ''}`.trim() || 'Unknown User',
              avatar: report.reporter.profile?.avatar,
            },
            contentDetails,
          };
        })
      );

      return {
        reports: enrichedReports,
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
      this.logger.error('Failed to get reports', error);
      throw error;
    }
  }

  async moderateContent(
    moderatorId: string,
    reportId: string,
    action: 'APPROVE' | 'REMOVE' | 'WARN' | 'SUSPEND' | 'BAN',
    reason?: string,
    durationDays?: number
  ) {
    try {
      // Verify moderator permissions
      const moderator = await this.databaseService.user.findUnique({
        where: { id: moderatorId },
      });

      if (!moderator || (moderator.role !== UserRole.ADMIN && moderator.role !== 'MODERATOR' as any)) {
        throw new ForbiddenException('Insufficient permissions for moderation');
      }

      const report = await this.databaseService.postReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      // Update report status
      const updatedReport = await this.databaseService.postReport.update({
        where: { id: reportId },
        data: {
          status: action === 'APPROVE' ? ReportStatus.APPROVED : ReportStatus.REJECTED,
          reviewedBy: moderatorId,
          reviewedAt: new Date(),
        },
      });

      // Apply moderation action
      await this.applyModerationAction(
        report.postId,
        'POST',
        action as ModerationAction,
        moderatorId,
        reason,
        durationDays
      );

      // Log moderation action (simplified - no moderationLog table)
      this.logger.log(`Moderation action logged: ${action} on POST ${report.postId} by ${moderatorId}`);

      // Send notification to content author (if action is taken)
      if (action !== 'APPROVE') {
        await this.notifyContentAuthor(report.postId, 'POST', action, reason);
      }

      this.logger.log(`Moderation action taken: ${action} on POST ${report.postId} by ${moderatorId}`);

      return updatedReport;
    } catch (error) {
      this.logger.error('Failed to moderate content', error);
      throw error;
    }
  }

  async detectSpam(content: string, metadata?: {
    authorId?: string;
    authorReputation?: number;
    authorAge?: number;
    postFrequency?: number;
  }): Promise<{ isSpam: boolean; confidence: number; reasons: string[] }> {
    try {
      let spamScore = 0;
      const reasons: string[] = [];

      // Pattern-based detection
      for (const pattern of this.spamPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          spamScore += matches.length * 2;
          reasons.push(`Contains spam pattern: ${pattern.source}`);
        }
      }

      // Length-based checks
      if (content.length < 10) {
        spamScore += 3;
        reasons.push('Content too short');
      }

      if (content.length > 5000) {
        spamScore += 2;
        reasons.push('Content unusually long');
      }

      // Repetitive content check
      const words = content.toLowerCase().split(/\s+/);
      const wordFreq = words.reduce((freq: any, word) => {
        freq[word] = (freq[word] || 0) + 1;
        return freq;
      }, {});

      const repeatedWords = Object.entries(wordFreq).filter(([word, count]: any) => 
        count > 5 && word.length > 3
      );

      if (repeatedWords.length > 0) {
        spamScore += repeatedWords.length * 2;
        reasons.push('Contains repetitive words');
      }

      // Author-based checks
      if (metadata) {
        if (metadata.authorReputation !== undefined && metadata.authorReputation < 10) {
          spamScore += 3;
          reasons.push('Low reputation author');
        }

        if (metadata.authorAge !== undefined && metadata.authorAge < 7) { // Less than 7 days
          spamScore += 2;
          reasons.push('New account');
        }

        if (metadata.postFrequency !== undefined && metadata.postFrequency > 10) { // More than 10 posts per day
          spamScore += 4;
          reasons.push('High posting frequency');
        }
      }

      // Calculate confidence
      const maxScore = 20;
      const confidence = Math.min(spamScore / maxScore, 1);
      const isSpam = confidence > 0.6; // 60% threshold

      return { isSpam, confidence, reasons };
    } catch (error) {
      this.logger.error('Failed to detect spam', error);
      return { isSpam: false, confidence: 0, reasons: ['Error in spam detection'] };
    }
  }

  async checkContentSafety(content: string): Promise<{
    isSafe: boolean;
    issues: string[];
    safetyScore: number;
  }> {
    try {
      const issues: string[] = [];
      let safetyScore = 100;

      // Profanity check
      const contentLower = content.toLowerCase();
      for (const profanity of this.profanityList) {
        if (contentLower.includes(profanity)) {
          issues.push('Contains inappropriate language');
          safetyScore -= 20;
          break;
        }
      }

      // Personal information detection
      const personalInfoPatterns = [
        /\b\d{3}-\d{2}-\d{4}\b/, // SSN
        /\b\d{16}\b/, // Credit card
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
        /\b\d{10}\b/, // Phone number
      ];

      for (const pattern of personalInfoPatterns) {
        if (pattern.test(content)) {
          issues.push('May contain personal information');
          safetyScore -= 15;
          break;
        }
      }

      // Threat/harassment detection
      const threatPatterns = [
        /\b(kill|hurt|harm|attack|threat|violence)\b/gi,
        /\b(hate|stupid|idiot|loser)\b/gi,
      ];

      for (const pattern of threatPatterns) {
        if (pattern.test(content)) {
          issues.push('May contain threatening or harassing language');
          safetyScore -= 25;
          break;
        }
      }

      // Spam detection
      const spamResult = await this.detectSpam(content);
      if (spamResult.isSpam) {
        issues.push('Detected as potential spam');
        safetyScore -= 30;
      }

      const isSafe = safetyScore >= 70;

      return { isSafe, issues, safetyScore };
    } catch (error) {
      this.logger.error('Failed to check content safety', error);
      return { isSafe: true, issues: [], safetyScore: 100 };
    }
  }

  async getUserSafetyProfile(userId: string) {
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

      // Get user's report history
      const [reportsBy, reportsAgainst, moderationHistory] = await Promise.all([
        this.databaseService.postReport.count({
          where: { reporterId: userId },
        }),
        // Count reports against user's content (simplified)
        this.databaseService.postReport.count({
          where: {
            post: {
              author: {
                id: userId,
              },
            },
          },
        }),
        // Return empty array for moderation history (no moderationLog table)
        Promise.resolve([]),
      ]);

      // Calculate safety score
      let safetyScore = 100;
      
      // Reduce score for reports against user
      safetyScore -= Math.min(reportsAgainst * 5, 30);
      
      // Reduce score for moderation actions
      safetyScore -= Math.min(moderationHistory.length * 10, 40);
      
      // Account age factor (newer accounts are riskier)
      const accountAgeDays = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (accountAgeDays < 30) {
        safetyScore -= 20;
      } else if (accountAgeDays < 90) {
        safetyScore -= 10;
      }

      // Reputation boost
      const userLevel = user.reputation?.level || 1;
      if (userLevel > 5) {
        safetyScore += 10;
      }

      // Verification boost
      if (user.isVerified) {
        safetyScore += 15;
      }

      safetyScore = Math.max(0, Math.min(100, safetyScore));

      return {
        user: {
          id: user.id,
          name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown User',
          role: user.role,
          verified: user.isVerified,
          joinedAt: user.createdAt,
        },
        safetyProfile: {
          safetyScore,
          reportsSubmitted: reportsBy,
          reportsReceived: reportsAgainst,
          moderationActions: moderationHistory.length,
          accountAge: accountAgeDays,
          riskLevel: this.calculateRiskLevel(safetyScore),
        },
        recentModerationActions: moderationHistory.map((action: any) => ({
          action: action.action,
          reason: action.reason,
          date: action.createdAt,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get user safety profile', error);
      throw error;
    }
  }

  async blockUser(blockerId: string, blockedId: string, reason?: string) {
    try {
      if (blockerId === blockedId) {
        throw new BadRequestException('Cannot block yourself');
      }

      // Simplified block functionality (no userBlock table)
      this.logger.log(`User ${blockerId} blocked user ${blockedId}: ${reason}`);
      
      // Remove any following relationships
      await Promise.all([
        this.databaseService.userFollow.deleteMany({
          where: {
            OR: [
              { followerId: blockerId, followingId: blockedId },
              { followerId: blockedId, followingId: blockerId },
            ],
          },
        }),
      ]);
      
      const block = { id: 'blocked', blockerId, blockedId, reason };

      this.logger.log(`User ${blockerId} blocked user ${blockedId}`);

      return block;
    } catch (error) {
      this.logger.error('Failed to block user', error);
      throw error;
    }
  }

  private async verifyContentExists(contentId: string, contentType: string) {
    let exists = false;

    switch (contentType) {
      case 'POST':
        exists = !!(await this.databaseService.forumPost.findUnique({
          where: { id: contentId },
        }));
        break;
      case 'COMMENT':
        exists = !!(await this.databaseService.postComment.findUnique({
          where: { id: contentId },
        }));
        break;
      case 'USER':
        exists = !!(await this.databaseService.user.findUnique({
          where: { id: contentId },
        }));
        break;
      case 'GROUP':
        exists = !!(await this.databaseService.communityGroup.findUnique({
          where: { id: contentId },
        }));
        break;
    }

    if (!exists) {
      throw new NotFoundException(`${contentType} not found`);
    }
  }

  private async checkAutoModeration(
    contentId: string,
    contentType: string,
    reason: string,
    category?: string
  ) {
    // Auto-hide content if it receives multiple reports quickly
    const recentReports = await this.databaseService.postReport.count({
      where: {
        postId: contentId,
                createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (recentReports >= 3) {
      // Auto-hide content
      await this.applyModerationAction(
        contentId,
        'POST',
        ModerationAction.REMOVE,
        'system',
        'Auto-moderation: Multiple reports received'
      );
    }
  }

  private async updateContentSafetyScore(contentId: string, contentType: string) {
    // Update safety scores in content tables
    // This would be implemented based on specific content type
    // For now, we'll skip this implementation
  }

  private async getContentDetails(contentId: string, contentType: ContentType) {
    switch (contentType) {
      case 'POST':
        const post = await this.databaseService.forumPost.findUnique({
          where: { id: contentId },
          include: { author: { include: { profile: true } } },
        });
        return post ? {
          title: post.title,
          content: post.content.substring(0, 100),
          author: `${post.author.profile?.firstName || ''} ${post.author.profile?.lastName || ''}`.trim(),
        } : null;

      case 'COMMENT':
        const comment = await this.databaseService.postComment.findUnique({
          where: { id: contentId },
          include: { author: { include: { profile: true } } },
        });
        return comment ? {
          content: comment.content.substring(0, 100),
          author: `${comment.author.profile?.firstName || ''} ${comment.author.profile?.lastName || ''}`.trim(),
        } : null;

      case 'USER':
        const user = await this.databaseService.user.findUnique({
          where: { id: contentId },
          include: { profile: true },
        });
        return user ? {
          name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
          role: user.role,
        } : null;

      default:
        return null;
    }
  }

  private async applyModerationAction(
    contentId: string,
    contentType: string,
    action: ModerationAction,
    moderatorId: string,
    reason?: string,
    durationDays?: number
  ) {
    switch (contentType) {
      case 'POST':
        if (action === ModerationAction.REMOVE) {
          await this.databaseService.forumPost.update({
            where: { id: contentId },
            data: { isDeleted: true, deletedAt: new Date() },
          });
        }
        break;

      case 'COMMENT':
        if (action === ModerationAction.REMOVE) {
          await this.databaseService.postComment.update({
            where: { id: contentId },
            data: { isDeleted: true, deletedAt: new Date() },
          });
        }
        break;

      case 'USER':
        if (action === ModerationAction.SUSPEND || action === ModerationAction.BAN) {
          // Log suspension action (User model doesn't have suspension fields)
          this.logger.log(`User ${contentId} suspended/banned: ${reason}`);
        }
        break;
    }
  }

  private async notifyContentAuthor(
    contentId: string,
    contentType: string,
    action: string,
    reason?: string
  ) {
    // This would integrate with the notification system
    // For now, we'll log the action
    this.logger.log(`Notification needed: ${contentType} ${contentId} - ${action}: ${reason}`);
  }

  private calculateRiskLevel(safetyScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (safetyScore >= 80) return 'LOW';
    if (safetyScore >= 60) return 'MEDIUM';
    if (safetyScore >= 30) return 'HIGH';
    return 'CRITICAL';
  }
}