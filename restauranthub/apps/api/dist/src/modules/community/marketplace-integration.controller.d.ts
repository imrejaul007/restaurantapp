import { MarketplaceIntegrationService } from './marketplace-integration.service';
export declare class MarketplaceIntegrationController {
    private readonly marketplaceIntegrationService;
    constructor(marketplaceIntegrationService: MarketplaceIntegrationService);
    createProductDiscussion(req: any, body: {
        productId: string;
        title: string;
        content: string;
        forumId?: string;
        tags?: string[];
    }): Promise<{
        forum: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            slug: string;
            memberCount: number;
            postCount: number;
            category: string;
            icon: string | null;
            color: string | null;
            displayOrder: number;
        };
        author: {
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
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        deletedAt: Date | null;
        title: string;
        type: import(".prisma/client").$Enums.PostType;
        slug: string;
        content: string;
        visibility: import(".prisma/client").$Enums.PostVisibility;
        images: string[];
        attachments: string[];
        viewCount: number;
        likeCount: number;
        shareCount: number;
        commentCount: number;
        isPinned: boolean;
        isLocked: boolean;
        isFeatured: boolean;
        isDeleted: boolean;
        forumId: string;
    }>;
    createJobPosting(req: any, body: {
        title: string;
        description: string;
        restaurantId: string;
        location: string;
        jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE';
        salaryMin?: number;
        salaryMax?: number;
        requirements: string[];
        skills?: string[];
        benefits?: string[];
        applicationUrl?: string;
        expiresAt?: string;
    }): Promise<{
        post: {
            forum: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                slug: string;
                memberCount: number;
                postCount: number;
                category: string;
                icon: string | null;
                color: string | null;
                displayOrder: number;
            };
            author: {
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
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            tags: string[];
            deletedAt: Date | null;
            title: string;
            type: import(".prisma/client").$Enums.PostType;
            slug: string;
            content: string;
            visibility: import(".prisma/client").$Enums.PostVisibility;
            images: string[];
            attachments: string[];
            viewCount: number;
            likeCount: number;
            shareCount: number;
            commentCount: number;
            isPinned: boolean;
            isLocked: boolean;
            isFeatured: boolean;
            isDeleted: boolean;
            forumId: string;
        };
        job: {
            id: string;
            restaurantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.JobStatus;
            description: string;
            title: string;
            viewCount: number;
            requirements: string[];
            skills: string[];
            experienceMin: number;
            experienceMax: number | null;
            salaryMin: number | null;
            salaryMax: number | null;
            location: string;
            jobType: string;
            validTill: Date;
            applicationCount: number;
        };
    }>;
    getMarketplaceInsights(type: 'product' | 'vendor' | 'category', id?: string, timeframe?: 'week' | 'month' | 'quarter'): Promise<{
        type: "vendor" | "category" | "product";
        id: string | undefined;
        timeframe: "week" | "month" | "quarter";
        insights: any;
    }>;
    getJobMarketAnalytics(location?: string, jobType?: string, timeframe?: 'week' | 'month' | 'quarter'): Promise<{
        timeframe: "week" | "month" | "quarter";
        summary: {
            totalJobs: number;
            jobsWithSalary: number;
        };
        distribution: {
            byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.JobGroupByOutputType, "jobType"[]> & {
                _count: {
                    id: number;
                };
            })[];
            byLocation: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.JobGroupByOutputType, "location"[]> & {
                _count: {
                    id: number;
                };
            })[];
        };
        trends: {
            skills: {
                skill: string;
                demand: number;
            }[];
        };
    }>;
    getRecommendedProducts(req: any, limit?: string): Promise<{
        recommendations: {
            id: any;
            name: any;
            description: any;
            price: any;
            rating: any;
            reviewCount: any;
            vendor: {
                id: any;
                name: any;
                avatar: any;
            };
            relevanceScore: any;
            matchingInterests: any;
        }[];
        userInterests: string[];
    }>;
    getRecommendedJobs(req: any, limit?: string): Promise<{
        recommendations: {
            id: any;
            title: any;
            description: any;
            location: any;
            jobType: any;
            salaryMin: any;
            salaryMax: any;
            postedAt: any;
            expiresAt: any;
            relevanceScore: any;
            restaurant: {
                id: any;
                name: any;
                avatar: any;
            };
        }[];
        userSkills: string[];
    }>;
}
