"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VendorSuggestionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorSuggestionsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const client_1 = require("@prisma/client");
let VendorSuggestionsService = VendorSuggestionsService_1 = class VendorSuggestionsService {
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.logger = new common_1.Logger(VendorSuggestionsService_1.name);
    }
    async suggestVendor(userId, postId, vendorId, reason) {
        try {
            const post = await this.databaseService.forumPost.findUnique({
                where: { id: postId, isDeleted: false },
            });
            if (!post) {
                throw new common_1.NotFoundException('Post not found');
            }
            if (post.type !== 'VENDOR_REQUEST') {
                throw new common_1.BadRequestException('Can only suggest vendors for vendor request posts');
            }
            const vendor = await this.databaseService.vendor.findUnique({
                where: { id: vendorId },
            });
            if (!vendor) {
                throw new common_1.NotFoundException('Vendor not found');
            }
            const existingSuggestion = await this.databaseService.vendorSuggestion.findUnique({
                where: { postId_suggestedBy_vendorId: { postId, suggestedBy: userId, vendorId } },
            });
            if (existingSuggestion) {
                throw new common_1.BadRequestException('You have already suggested this vendor for this post');
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
            await this.databaseService.postVendorTag.create({
                data: {
                    postId,
                    vendorId,
                    taggedBy: userId,
                },
            });
            await this.updateUserReputation(userId, 'VENDOR_TAGGED', 3, `Tagged vendor in post: ${post.title}`, postId);
            return {
                ...suggestion,
                vendor: {
                    id: suggestion.vendor.id,
                    name: suggestion.vendor.companyName,
                    businessType: suggestion.vendor.businessType,
                    description: suggestion.vendor.description,
                    rating: suggestion.vendor.rating,
                    verified: suggestion.vendor.verificationStatus === client_1.VerificationStatus.VERIFIED,
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
        }
        catch (error) {
            this.logger.error('Failed to suggest vendor', error);
            throw error;
        }
    }
    async suggestProduct(userId, postId, productId, reason) {
        try {
            const post = await this.databaseService.forumPost.findUnique({
                where: { id: postId, isDeleted: false },
            });
            if (!post) {
                throw new common_1.NotFoundException('Post not found');
            }
            if (post.type !== 'PRODUCT_REQUEST') {
                throw new common_1.BadRequestException('Can only suggest products for product request posts');
            }
            const product = await this.databaseService.product.findUnique({
                where: { id: productId },
                include: {
                    vendor: true,
                },
            });
            if (!product) {
                throw new common_1.NotFoundException('Product not found');
            }
            const existingSuggestion = await this.databaseService.productSuggestion.findUnique({
                where: { postId_suggestedBy_productId: { postId, suggestedBy: userId, productId } },
            });
            if (existingSuggestion) {
                throw new common_1.BadRequestException('You have already suggested this product for this post');
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
            await this.databaseService.postProductTag.create({
                data: {
                    postId,
                    productId,
                    taggedBy: userId,
                },
            });
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
                        verified: suggestion.product.vendor.verificationStatus === client_1.VerificationStatus.VERIFIED,
                    } : null,
                },
                suggester: {
                    id: suggestion.suggester.id,
                    name: `${suggestion.suggester.profile?.firstName || ''} ${suggestion.suggester.profile?.lastName || ''}`.trim() || 'Unknown User',
                    role: suggestion.suggester.role,
                    avatar: suggestion.suggester.profile?.avatar,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to suggest product', error);
            throw error;
        }
    }
    async rateSuggestion(userId, suggestionId, suggestionType, rating) {
        try {
            let suggestion;
            let post;
            if (suggestionType === 'vendor') {
                suggestion = await this.databaseService.vendorSuggestion.findUnique({
                    where: { id: suggestionId },
                    include: { post: true },
                });
                if (!suggestion) {
                    throw new common_1.NotFoundException('Vendor suggestion not found');
                }
                post = suggestion.post;
                if (post.userId !== userId) {
                    throw new common_1.ForbiddenException('Only the post author can rate suggestions');
                }
                if (suggestion.rating) {
                    throw new common_1.BadRequestException('Suggestion already rated');
                }
                const updatedSuggestion = await this.databaseService.vendorSuggestion.update({
                    where: { id: suggestionId },
                    data: {
                        rating,
                        ratedBy: userId,
                        ratedAt: new Date(),
                    },
                });
                const points = this.getPointsForRating(rating);
                await this.updateUserReputation(suggestion.suggestedBy, 'SUGGESTION_HELPFUL', points, `Received ${rating} rating for vendor suggestion`, suggestionId);
                return updatedSuggestion;
            }
            else {
                suggestion = await this.databaseService.productSuggestion.findUnique({
                    where: { id: suggestionId },
                    include: { post: true },
                });
                if (!suggestion) {
                    throw new common_1.NotFoundException('Product suggestion not found');
                }
                post = suggestion.post;
                if (post.userId !== userId) {
                    throw new common_1.ForbiddenException('Only the post author can rate suggestions');
                }
                if (suggestion.rating) {
                    throw new common_1.BadRequestException('Suggestion already rated');
                }
                const updatedSuggestion = await this.databaseService.productSuggestion.update({
                    where: { id: suggestionId },
                    data: {
                        rating,
                        ratedBy: userId,
                        ratedAt: new Date(),
                    },
                });
                const points = this.getPointsForRating(rating);
                await this.updateUserReputation(suggestion.suggestedBy, 'SUGGESTION_HELPFUL', points, `Received ${rating} rating for product suggestion`, suggestionId);
                return updatedSuggestion;
            }
        }
        catch (error) {
            this.logger.error('Failed to rate suggestion', error);
            throw error;
        }
    }
    async markBestSuggestion(userId, suggestionId, suggestionType) {
        try {
            let suggestion;
            let post;
            if (suggestionType === 'vendor') {
                suggestion = await this.databaseService.vendorSuggestion.findUnique({
                    where: { id: suggestionId },
                    include: { post: true },
                });
                if (!suggestion) {
                    throw new common_1.NotFoundException('Vendor suggestion not found');
                }
                post = suggestion.post;
                if (post.userId !== userId) {
                    throw new common_1.ForbiddenException('Only the post author can mark best suggestions');
                }
                await this.databaseService.vendorSuggestion.updateMany({
                    where: { postId: post.id },
                    data: { isBest: false, markedBy: null, markedAt: null },
                });
                const updatedSuggestion = await this.databaseService.vendorSuggestion.update({
                    where: { id: suggestionId },
                    data: {
                        isBest: true,
                        markedBy: userId,
                        markedAt: new Date(),
                    },
                });
                await this.updateUserReputation(suggestion.suggestedBy, 'SUGGESTION_BEST', 15, `Marked as best vendor suggestion`, suggestionId);
                return updatedSuggestion;
            }
            else {
                suggestion = await this.databaseService.productSuggestion.findUnique({
                    where: { id: suggestionId },
                    include: { post: true },
                });
                if (!suggestion) {
                    throw new common_1.NotFoundException('Product suggestion not found');
                }
                post = suggestion.post;
                if (post.userId !== userId) {
                    throw new common_1.ForbiddenException('Only the post author can mark best suggestions');
                }
                await this.databaseService.productSuggestion.updateMany({
                    where: { postId: post.id },
                    data: { isBest: false, markedBy: null, markedAt: null },
                });
                const updatedSuggestion = await this.databaseService.productSuggestion.update({
                    where: { id: suggestionId },
                    data: {
                        isBest: true,
                        markedBy: userId,
                        markedAt: new Date(),
                    },
                });
                await this.updateUserReputation(suggestion.suggestedBy, 'SUGGESTION_BEST', 15, `Marked as best product suggestion`, suggestionId);
                return updatedSuggestion;
            }
        }
        catch (error) {
            this.logger.error('Failed to mark best suggestion', error);
            throw error;
        }
    }
    async getSuggestions(postId, params) {
        try {
            const { type, page = 1, limit = 20 } = params;
            const skip = (page - 1) * limit;
            const post = await this.databaseService.forumPost.findUnique({
                where: { id: postId, isDeleted: false },
            });
            if (!post) {
                throw new common_1.NotFoundException('Post not found');
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
                            verified: s.vendor.verificationStatus === client_1.VerificationStatus.VERIFIED,
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
            else {
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
                                verified: s.product.vendor.verificationStatus === client_1.VerificationStatus.VERIFIED,
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
        }
        catch (error) {
            this.logger.error('Failed to get suggestions', error);
            throw error;
        }
    }
    getPointsForRating(rating) {
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
    async updateUserReputation(userId, action, points, description, relatedId) {
        try {
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
            const updateData = {
                totalPoints: { increment: points },
            };
            switch (action) {
                case 'VENDOR_TAGGED':
                    break;
                case 'SUGGESTION_HELPFUL':
                    updateData.helpfulSuggestions = { increment: 1 };
                    break;
                case 'SUGGESTION_BEST':
                    updateData.bestSuggestions = { increment: 1 };
                    break;
            }
            const newTotalPoints = reputation.totalPoints + points;
            const newLevel = Math.floor(newTotalPoints / 100) + 1;
            if (newLevel > reputation.level) {
                updateData.level = newLevel;
            }
            await this.databaseService.userReputation.update({
                where: { userId },
                data: updateData,
            });
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
        }
        catch (error) {
            this.logger.error('Failed to update user reputation', error);
        }
    }
};
exports.VendorSuggestionsService = VendorSuggestionsService;
exports.VendorSuggestionsService = VendorSuggestionsService = VendorSuggestionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], VendorSuggestionsService);
//# sourceMappingURL=vendor-suggestions.service.js.map