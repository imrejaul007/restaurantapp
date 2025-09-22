import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prisma, SuggestionRating, ReputationAction, VerificationStatus } from '@prisma/client';

@Injectable()
export class VendorSuggestionsService {
  private readonly logger = new Logger(VendorSuggestionsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async suggestVendor(userId: string, postId: string, vendorId: string, reason: string) {
    try {
      // Check if post exists and is a vendor request
      const post = await this.databaseService.forumPost.findUnique({
        where: { id: postId, isDeleted: false },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (post.type !== 'VENDOR_REQUEST') {
        throw new BadRequestException('Can only suggest vendors for vendor request posts');
      }

      // Check if vendor exists
      const vendor = await this.databaseService.vendor.findUnique({
        where: { id: vendorId },
      });

      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      // Check if user already suggested this vendor for this post
      const existingSuggestion = await this.databaseService.vendorSuggestion.findUnique({
        where: { postId_suggestedBy_vendorId: { postId, suggestedBy: userId, vendorId } },
      });

      if (existingSuggestion) {
        throw new BadRequestException('You have already suggested this vendor for this post');
      }

      const suggestion = await this.databaseService.vendorSuggestion.create({
        data: {
          postId,
          suggestedBy: userId,
          vendorId,
          reason,
        },
        include: {
          vendor: {
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
            },
          },
          suggester: {
            include: {
              profile: true,
            },
          },
        },
      });

      // Create vendor tag
      await this.databaseService.postVendorTag.create({
        data: {
          postId,
          vendorId,
          taggedBy: userId,
        },
      });

      // Update user reputation
      await this.updateUserReputation(userId, 'VENDOR_TAGGED', 3, `Tagged vendor in post: ${post.title}`, postId);

      return {
        ...suggestion,
        vendor: {
          id: suggestion.vendor.id,
          name: suggestion.vendor.companyName,
          businessType: suggestion.vendor.businessType,
          description: suggestion.vendor.description,
          rating: suggestion.vendor.rating,
          verified: suggestion.vendor.verificationStatus === VerificationStatus.VERIFIED,
          user: {
            id: suggestion.vendor.user.id,
            name: `${suggestion.vendor.user.profile?.firstName || ''} ${suggestion.vendor.user.profile?.lastName || ''}`.trim() || 'Unknown User',
            avatar: suggestion.vendor.user.profile?.avatar,
          },
        },
        suggester: {
          id: suggestion.suggester.id,
          name: `${suggestion.suggester.profile?.firstName || ''} ${suggestion.suggester.profile?.lastName || ''}`.trim() || 'Unknown User',
          role: suggestion.suggester.role,
          avatar: suggestion.suggester.profile?.avatar,
        },
      };
    } catch (error) {
      this.logger.error('Failed to suggest vendor', error);
      throw error;
    }
  }

  async suggestProduct(userId: string, postId: string, productId: string, reason: string) {
    try {
      // Check if post exists and is a product request
      const post = await this.databaseService.forumPost.findUnique({
        where: { id: postId, isDeleted: false },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (post.type !== 'PRODUCT_REQUEST') {
        throw new BadRequestException('Can only suggest products for product request posts');
      }

      // Check if product exists
      const product = await this.databaseService.product.findUnique({
        where: { id: productId },
        include: {
          vendor: true,
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Check if user already suggested this product for this post
      const existingSuggestion = await this.databaseService.productSuggestion.findUnique({
        where: { postId_suggestedBy_productId: { postId, suggestedBy: userId, productId } },
      });

      if (existingSuggestion) {
        throw new BadRequestException('You have already suggested this product for this post');
      }

      const suggestion = await this.databaseService.productSuggestion.create({
        data: {
          postId,
          suggestedBy: userId,
          productId,
          reason,
        },
        include: {
          product: {
            include: {
              vendor: {
                include: {
                  user: {
                    include: {
                      profile: true,
                    },
                  },
                },
              },
            },
          },
          suggester: {
            include: {
              profile: true,
            },
          },
        },
      });

      // Create product tag
      await this.databaseService.postProductTag.create({
        data: {
          postId,
          productId,
          taggedBy: userId,
        },
      });

      // Update user reputation
      await this.updateUserReputation(userId, 'VENDOR_TAGGED', 3, `Tagged product in post: ${post.title}`, postId);

      return {
        ...suggestion,
        product: {
          id: suggestion.product.id,
          name: suggestion.product.name,
          description: suggestion.product.description,
          price: suggestion.product.price,
          rating: suggestion.product.rating,
          vendor: suggestion.product.vendor ? {
            id: suggestion.product.vendor.id,
            name: suggestion.product.vendor.companyName,
            verified: suggestion.product.vendor.verificationStatus === VerificationStatus.VERIFIED,
          } : null,
        },
        suggester: {
          id: suggestion.suggester.id,
          name: `${suggestion.suggester.profile?.firstName || ''} ${suggestion.suggester.profile?.lastName || ''}`.trim() || 'Unknown User',
          role: suggestion.suggester.role,
          avatar: suggestion.suggester.profile?.avatar,
        },
      };
    } catch (error) {
      this.logger.error('Failed to suggest product', error);
      throw error;
    }
  }

  async rateSuggestion(userId: string, suggestionId: string, suggestionType: 'vendor' | 'product', rating: SuggestionRating) {
    try {
      let suggestion;
      let post;

      if (suggestionType === 'vendor') {
        suggestion = await this.databaseService.vendorSuggestion.findUnique({
          where: { id: suggestionId },
          include: { post: true },
        });

        if (!suggestion) {
          throw new NotFoundException('Vendor suggestion not found');
        }

        post = suggestion.post;

        // Check if user is the post author
        if (post.userId !== userId) {
          throw new ForbiddenException('Only the post author can rate suggestions');
        }

        // Check if already rated
        if (suggestion.rating) {
          throw new BadRequestException('Suggestion already rated');
        }

        // Update the rating
        const updatedSuggestion = await this.databaseService.vendorSuggestion.update({
          where: { id: suggestionId },
          data: {
            rating,
            ratedBy: userId,
            ratedAt: new Date(),
          },
        });

        // Update suggester reputation based on rating
        const points = this.getPointsForRating(rating);
        await this.updateUserReputation(
          suggestion.suggestedBy, 
          'SUGGESTION_HELPFUL', 
          points, 
          `Received ${rating} rating for vendor suggestion`,
          suggestionId
        );

        return updatedSuggestion;
      } else {
        suggestion = await this.databaseService.productSuggestion.findUnique({
          where: { id: suggestionId },
          include: { post: true },
        });

        if (!suggestion) {
          throw new NotFoundException('Product suggestion not found');
        }

        post = suggestion.post;

        // Check if user is the post author
        if (post.userId !== userId) {
          throw new ForbiddenException('Only the post author can rate suggestions');
        }

        // Check if already rated
        if (suggestion.rating) {
          throw new BadRequestException('Suggestion already rated');
        }

        // Update the rating
        const updatedSuggestion = await this.databaseService.productSuggestion.update({
          where: { id: suggestionId },
          data: {
            rating,
            ratedBy: userId,
            ratedAt: new Date(),
          },
        });

        // Update suggester reputation based on rating
        const points = this.getPointsForRating(rating);
        await this.updateUserReputation(
          suggestion.suggestedBy, 
          'SUGGESTION_HELPFUL', 
          points, 
          `Received ${rating} rating for product suggestion`,
          suggestionId
        );

        return updatedSuggestion;
      }
    } catch (error) {
      this.logger.error('Failed to rate suggestion', error);
      throw error;
    }
  }

  async markBestSuggestion(userId: string, suggestionId: string, suggestionType: 'vendor' | 'product') {
    try {
      let suggestion;
      let post;

      if (suggestionType === 'vendor') {
        suggestion = await this.databaseService.vendorSuggestion.findUnique({
          where: { id: suggestionId },
          include: { post: true },
        });

        if (!suggestion) {
          throw new NotFoundException('Vendor suggestion not found');
        }

        post = suggestion.post;

        // Check if user is the post author
        if (post.userId !== userId) {
          throw new ForbiddenException('Only the post author can mark best suggestions');
        }

        // Unmark any existing best suggestions for this post
        await this.databaseService.vendorSuggestion.updateMany({
          where: { postId: post.id },
          data: { isBest: false, markedBy: null, markedAt: null },
        });

        // Mark this as best
        const updatedSuggestion = await this.databaseService.vendorSuggestion.update({
          where: { id: suggestionId },
          data: {
            isBest: true,
            markedBy: userId,
            markedAt: new Date(),
          },
        });

        // Give bonus reputation points for best suggestion
        await this.updateUserReputation(
          suggestion.suggestedBy, 
          'SUGGESTION_BEST', 
          15, 
          `Marked as best vendor suggestion`,
          suggestionId
        );

        return updatedSuggestion;
      } else {
        suggestion = await this.databaseService.productSuggestion.findUnique({
          where: { id: suggestionId },
          include: { post: true },
        });

        if (!suggestion) {
          throw new NotFoundException('Product suggestion not found');
        }

        post = suggestion.post;

        // Check if user is the post author
        if (post.userId !== userId) {
          throw new ForbiddenException('Only the post author can mark best suggestions');
        }

        // Unmark any existing best suggestions for this post
        await this.databaseService.productSuggestion.updateMany({
          where: { postId: post.id },
          data: { isBest: false, markedBy: null, markedAt: null },
        });

        // Mark this as best
        const updatedSuggestion = await this.databaseService.productSuggestion.update({
          where: { id: suggestionId },
          data: {
            isBest: true,
            markedBy: userId,
            markedAt: new Date(),
          },
        });

        // Give bonus reputation points for best suggestion
        await this.updateUserReputation(
          suggestion.suggestedBy, 
          'SUGGESTION_BEST', 
          15, 
          `Marked as best product suggestion`,
          suggestionId
        );

        return updatedSuggestion;
      }
    } catch (error) {
      this.logger.error('Failed to mark best suggestion', error);
      throw error;
    }
  }

  async getSuggestions(postId: string, params: {
    type?: 'vendor' | 'product';
    page?: number;
    limit?: number;
  }) {
    try {
      const { type, page = 1, limit = 20 } = params;
      const skip = (page - 1) * limit;

      const post = await this.databaseService.forumPost.findUnique({
        where: { id: postId, isDeleted: false },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (type === 'vendor' || post.type === 'VENDOR_REQUEST') {
        const [suggestions, total] = await Promise.all([
          this.databaseService.vendorSuggestion.findMany({
            where: { postId },
            orderBy: [{ isBest: 'desc' }, { createdAt: 'desc' }],
            skip,
            take: limit,
            include: {
              vendor: {
                include: {
                  user: {
                    include: {
                      profile: true,
                    },
                  },
                },
              },
              suggester: {
                include: {
                  profile: true,
                },
              },
              rater: {
                include: {
                  profile: true,
                },
              },
            },
          }),
          this.databaseService.vendorSuggestion.count({ where: { postId } }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
          suggestions: suggestions.map(s => ({
            ...s,
            vendor: {
              id: s.vendor.id,
              name: s.vendor.companyName,
              businessType: s.vendor.businessType,
              description: s.vendor.description,
              rating: s.vendor.rating,
              verified: s.vendor.verificationStatus === VerificationStatus.VERIFIED,
            },
            suggester: {
              id: s.suggester.id,
              name: `${s.suggester.profile?.firstName || ''} ${s.suggester.profile?.lastName || ''}`.trim() || 'Unknown User',
              role: s.suggester.role,
              avatar: s.suggester.profile?.avatar,
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
      } else {
        const [suggestions, total] = await Promise.all([
          this.databaseService.productSuggestion.findMany({
            where: { postId },
            orderBy: [{ isBest: 'desc' }, { createdAt: 'desc' }],
            skip,
            take: limit,
            include: {
              product: {
                include: {
                  vendor: true,
                },
              },
              suggester: {
                include: {
                  profile: true,
                },
              },
            },
          }),
          this.databaseService.productSuggestion.count({ where: { postId } }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
          suggestions: suggestions.map(s => ({
            ...s,
            product: {
              id: s.product.id,
              name: s.product.name,
              description: s.product.description,
              price: s.product.price,
              rating: s.product.rating,
              vendor: s.product.vendor ? {
                id: s.product.vendor.id,
                name: s.product.vendor.companyName,
                verified: s.product.vendor.verificationStatus === VerificationStatus.VERIFIED,
              } : null,
            },
            suggester: {
              id: s.suggester.id,
              name: `${s.suggester.profile?.firstName || ''} ${s.suggester.profile?.lastName || ''}`.trim() || 'Unknown User',
              role: s.suggester.role,
              avatar: s.suggester.profile?.avatar,
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
      }
    } catch (error) {
      this.logger.error('Failed to get suggestions', error);
      throw error;
    }
  }

  private getPointsForRating(rating: SuggestionRating): number {
    switch (rating) {
      case 'VERY_HELPFUL':
        return 10;
      case 'HELPFUL':
        return 7;
      case 'SOMEWHAT_HELPFUL':
        return 3;
      case 'NOT_HELPFUL':
        return 0;
      default:
        return 0;
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
      // Get or create user reputation
      let reputation = await this.databaseService.userReputation.findUnique({
        where: { userId },
      });

      if (!reputation) {
        reputation = await this.databaseService.userReputation.create({
          data: {
            userId,
            totalPoints: 0,
            level: 1,
          },
        });
      }

      // Update reputation points based on action
      const updateData: any = {
        totalPoints: { increment: points },
      };

      switch (action) {
        case 'VENDOR_TAGGED':
          break; // No specific counter for vendor tagging
        case 'SUGGESTION_HELPFUL':
          updateData.helpfulSuggestions = { increment: 1 };
          break;
        case 'SUGGESTION_BEST':
          updateData.bestSuggestions = { increment: 1 };
          break;
      }

      // Calculate new level (every 100 points = 1 level)
      const newTotalPoints = reputation.totalPoints + points;
      const newLevel = Math.floor(newTotalPoints / 100) + 1;
      
      if (newLevel > reputation.level) {
        updateData.level = newLevel;
      }

      await this.databaseService.userReputation.update({
        where: { userId },
        data: updateData,
      });

      // Create reputation history entry
      await this.databaseService.reputationHistory.create({
        data: {
          userId,
          action,
          points,
          description,
          relatedId,
          relatedType: 'suggestion',
        },
      });

    } catch (error) {
      this.logger.error('Failed to update user reputation', error);
      // Don't throw error as this is a supporting feature
    }
  }
}