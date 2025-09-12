import { DatabaseService } from '../database/database.service';
import { SuggestionRating } from '@prisma/client';
export declare class VendorSuggestionsService {
    private readonly databaseService;
    private readonly logger;
    constructor(databaseService: DatabaseService);
    suggestVendor(userId: string, postId: string, vendorId: string, reason: string): Promise<{
        vendor: {
            id: string;
            name: string;
            businessType: string;
            description: string | null;
            rating: number;
            verified: boolean;
            user: {
                id: string;
                name: string;
                avatar: string | null | undefined;
            };
        };
        suggester: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            avatar: string | null | undefined;
        };
        id: string;
        createdAt: Date;
        rating: import(".prisma/client").$Enums.SuggestionRating | null;
        postId: string;
        reason: string;
        vendorId: string;
        ratedAt: Date | null;
        isBest: boolean;
        markedAt: Date | null;
        suggestedBy: string;
        ratedBy: string | null;
        markedBy: string | null;
    }>;
    suggestProduct(userId: string, postId: string, productId: string, reason: string): Promise<{
        product: {
            id: string;
            name: string;
            description: string | null;
            price: number;
            rating: number;
            vendor: {
                id: string;
                name: string;
                verified: boolean;
            } | null;
        };
        suggester: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            avatar: string | null | undefined;
        };
        id: string;
        createdAt: Date;
        rating: import(".prisma/client").$Enums.SuggestionRating | null;
        postId: string;
        reason: string;
        productId: string;
        ratedAt: Date | null;
        isBest: boolean;
        markedAt: Date | null;
        suggestedBy: string;
        ratedBy: string | null;
        markedBy: string | null;
    }>;
    rateSuggestion(userId: string, suggestionId: string, suggestionType: 'vendor' | 'product', rating: SuggestionRating): Promise<{
        id: string;
        createdAt: Date;
        rating: import(".prisma/client").$Enums.SuggestionRating | null;
        postId: string;
        reason: string;
        vendorId: string;
        ratedAt: Date | null;
        isBest: boolean;
        markedAt: Date | null;
        suggestedBy: string;
        ratedBy: string | null;
        markedBy: string | null;
    } | {
        id: string;
        createdAt: Date;
        rating: import(".prisma/client").$Enums.SuggestionRating | null;
        postId: string;
        reason: string;
        productId: string;
        ratedAt: Date | null;
        isBest: boolean;
        markedAt: Date | null;
        suggestedBy: string;
        ratedBy: string | null;
        markedBy: string | null;
    }>;
    markBestSuggestion(userId: string, suggestionId: string, suggestionType: 'vendor' | 'product'): Promise<{
        id: string;
        createdAt: Date;
        rating: import(".prisma/client").$Enums.SuggestionRating | null;
        postId: string;
        reason: string;
        vendorId: string;
        ratedAt: Date | null;
        isBest: boolean;
        markedAt: Date | null;
        suggestedBy: string;
        ratedBy: string | null;
        markedBy: string | null;
    } | {
        id: string;
        createdAt: Date;
        rating: import(".prisma/client").$Enums.SuggestionRating | null;
        postId: string;
        reason: string;
        productId: string;
        ratedAt: Date | null;
        isBest: boolean;
        markedAt: Date | null;
        suggestedBy: string;
        ratedBy: string | null;
        markedBy: string | null;
    }>;
    getSuggestions(postId: string, params: {
        type?: 'vendor' | 'product';
        page?: number;
        limit?: number;
    }): Promise<{
        suggestions: {
            vendor: {
                id: string;
                name: string;
                businessType: string;
                description: string | null;
                rating: number;
                verified: boolean;
            };
            suggester: {
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.UserRole;
                avatar: string | null | undefined;
            };
            rater: ({
                profile: {
                    id: string;
                    userId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    firstName: string;
                    lastName: string;
                    avatar: string | null;
                    bio: string | null;
                    address: string | null;
                    city: string | null;
                    state: string | null;
                    country: string | null;
                    pincode: string | null;
                    dateOfBirth: Date | null;
                } | null;
            } & {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                phone: string | null;
                passwordHash: string;
                firstName: string | null;
                lastName: string | null;
                role: import(".prisma/client").$Enums.UserRole;
                status: import(".prisma/client").$Enums.UserStatus;
                isVerified: boolean;
                emailVerifiedAt: Date | null;
                isAadhaarVerified: boolean;
                aadhaarVerificationId: string | null;
                twoFactorEnabled: boolean;
                twoFactorSecret: string | null;
                lastLoginAt: Date | null;
                refreshToken: string | null;
                deletedAt: Date | null;
            }) | null;
            id: string;
            createdAt: Date;
            rating: import(".prisma/client").$Enums.SuggestionRating | null;
            postId: string;
            reason: string;
            vendorId: string;
            ratedAt: Date | null;
            isBest: boolean;
            markedAt: Date | null;
            suggestedBy: string;
            ratedBy: string | null;
            markedBy: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    } | {
        suggestions: {
            product: {
                id: string;
                name: string;
                description: string | null;
                price: number;
                rating: number;
                vendor: {
                    id: string;
                    name: string;
                    verified: boolean;
                } | null;
            };
            suggester: {
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.UserRole;
                avatar: string | null | undefined;
            };
            id: string;
            createdAt: Date;
            rating: import(".prisma/client").$Enums.SuggestionRating | null;
            postId: string;
            reason: string;
            productId: string;
            ratedAt: Date | null;
            isBest: boolean;
            markedAt: Date | null;
            suggestedBy: string;
            ratedBy: string | null;
            markedBy: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    private getPointsForRating;
    private updateUserReputation;
}
