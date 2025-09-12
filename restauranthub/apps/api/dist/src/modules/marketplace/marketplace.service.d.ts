import { DatabaseService } from '../database/database.service';
import { SearchService } from '../search/search.service';
export declare class MarketplaceService {
    private readonly databaseService;
    private readonly searchService?;
    private readonly logger;
    constructor(databaseService: DatabaseService, searchService?: SearchService | undefined);
    getMarketplaceOverview(userId: string): Promise<{
        featuredProducts: ({
            vendor: {
                id: string;
                verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
                rating: number;
                companyName: string;
            } | null;
        } & {
            id: string;
            restaurantId: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            tags: string[];
            name: string;
            status: import(".prisma/client").$Enums.ProductStatus;
            deletedAt: Date | null;
            description: string | null;
            rating: number;
            totalReviews: number;
            slug: string;
            images: string[];
            viewCount: number;
            sku: string;
            vendorId: string | null;
            categoryId: string;
            price: number;
            comparePrice: number | null;
            costPrice: number | null;
            quantity: number;
            unit: string;
            minOrderQuantity: number;
            maxOrderQuantity: number | null;
            gstRate: number;
            hsnCode: string | null;
            isWholesale: boolean;
            isBulkOnly: boolean;
        })[];
        categories: {
            name: any;
            count: any;
        }[];
        recentOrders: any[];
        stats: {
            totalProducts: number;
            totalVendors: number;
            totalCategories: number;
        };
    }>;
    searchProducts(params: {
        query?: string;
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        vendorId?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        page?: number;
        limit?: number;
    }): Promise<{
        products: ({
            vendor: {
                id: string;
                verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
                rating: number;
                companyName: string;
            } | null;
        } & {
            id: string;
            restaurantId: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            tags: string[];
            name: string;
            status: import(".prisma/client").$Enums.ProductStatus;
            deletedAt: Date | null;
            description: string | null;
            rating: number;
            totalReviews: number;
            slug: string;
            images: string[];
            viewCount: number;
            sku: string;
            vendorId: string | null;
            categoryId: string;
            price: number;
            comparePrice: number | null;
            costPrice: number | null;
            quantity: number;
            unit: string;
            minOrderQuantity: number;
            maxOrderQuantity: number | null;
            gstRate: number;
            hsnCode: string | null;
            isWholesale: boolean;
            isBulkOnly: boolean;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
        filters: {
            priceRange: {
                min: number;
                max: number;
            };
            categories: {
                name: any;
                count: any;
            }[];
            vendors: any[];
        };
    }>;
    getProduct(productId: string, userId?: string): Promise<{
        relatedProducts: ({
            vendor: {
                rating: number;
                companyName: string;
            } | null;
        } & {
            id: string;
            restaurantId: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            tags: string[];
            name: string;
            status: import(".prisma/client").$Enums.ProductStatus;
            deletedAt: Date | null;
            description: string | null;
            rating: number;
            totalReviews: number;
            slug: string;
            images: string[];
            viewCount: number;
            sku: string;
            vendorId: string | null;
            categoryId: string;
            price: number;
            comparePrice: number | null;
            costPrice: number | null;
            quantity: number;
            unit: string;
            minOrderQuantity: number;
            maxOrderQuantity: number | null;
            gstRate: number;
            hsnCode: string | null;
            isWholesale: boolean;
            isBulkOnly: boolean;
        })[];
        vendor: ({
            user: {
                email: string;
                phone: string | null;
                firstName: string | null;
                lastName: string | null;
            };
        } & {
            id: string;
            userId: string;
            verifiedAt: Date | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            businessName: string;
            description: string | null;
            logo: string | null;
            gstNumber: string | null;
            panNumber: string | null;
            bankAccountNumber: string | null;
            bankName: string | null;
            ifscCode: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            rating: number;
            totalReviews: number;
            companyName: string;
            businessType: string;
        }) | null;
        reviews: ({
            user: {
                firstName: string | null;
                lastName: string | null;
            };
        } & {
            id: string;
            userId: string;
            restaurantId: string | null;
            createdAt: Date;
            updatedAt: Date;
            rating: number;
            title: string | null;
            images: string[];
            comment: string | null;
            vendorId: string | null;
            productId: string | null;
            isVerifiedPurchase: boolean;
            helpfulCount: number;
        })[];
        id: string;
        restaurantId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
        name: string;
        status: import(".prisma/client").$Enums.ProductStatus;
        deletedAt: Date | null;
        description: string | null;
        rating: number;
        totalReviews: number;
        slug: string;
        images: string[];
        viewCount: number;
        sku: string;
        vendorId: string | null;
        categoryId: string;
        price: number;
        comparePrice: number | null;
        costPrice: number | null;
        quantity: number;
        unit: string;
        minOrderQuantity: number;
        maxOrderQuantity: number | null;
        gstRate: number;
        hsnCode: string | null;
        isWholesale: boolean;
        isBulkOnly: boolean;
    }>;
    addToCart(userId: string, productId: string, quantity: number): Promise<{
        message: string;
        cartItemCount: number;
    }>;
    getCart(userId: string): Promise<{
        items: any[];
        itemsByVendor: unknown[];
        summary: {
            itemCount: number;
            subtotal: any;
            taxAmount: number;
            total: any;
        };
    }>;
    private getProductCategories;
    private getAvailableFilters;
    updateCartItem(userId: string, cartItemId: string, quantity: number): Promise<{
        message: string;
        cartItemCount: number;
    }>;
    removeFromCart(userId: string, cartItemId: string): Promise<{
        message: string;
        cartItemCount: number;
    }>;
    clearCart(userId: string): Promise<{
        message: string;
        cartItemCount: number;
    }>;
    getVendors(params: {
        category?: string;
        city?: string;
        state?: string;
        verified?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        vendors: ({
            user: {
                email: string;
                phone: string | null;
                profile: {
                    firstName: string;
                    lastName: string;
                    city: string | null;
                    state: string | null;
                } | null;
            };
            _count: {
                products: number;
            };
        } & {
            id: string;
            userId: string;
            verifiedAt: Date | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            businessName: string;
            description: string | null;
            logo: string | null;
            gstNumber: string | null;
            panNumber: string | null;
            bankAccountNumber: string | null;
            bankName: string | null;
            ifscCode: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            rating: number;
            totalReviews: number;
            companyName: string;
            businessType: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    getVendor(vendorId: string): Promise<{
        stats: {
            totalProducts: number;
            averageRating: number;
        };
        user: {
            email: string;
            phone: string | null;
            profile: {
                firstName: string;
                lastName: string;
                city: string | null;
                state: string | null;
            } | null;
        };
        products: {
            id: string;
            restaurantId: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            tags: string[];
            name: string;
            status: import(".prisma/client").$Enums.ProductStatus;
            deletedAt: Date | null;
            description: string | null;
            rating: number;
            totalReviews: number;
            slug: string;
            images: string[];
            viewCount: number;
            sku: string;
            vendorId: string | null;
            categoryId: string;
            price: number;
            comparePrice: number | null;
            costPrice: number | null;
            quantity: number;
            unit: string;
            minOrderQuantity: number;
            maxOrderQuantity: number | null;
            gstRate: number;
            hsnCode: string | null;
            isWholesale: boolean;
            isBulkOnly: boolean;
        }[];
        _count: {
            products: number;
        };
        id: string;
        userId: string;
        verifiedAt: Date | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        businessName: string;
        description: string | null;
        logo: string | null;
        gstNumber: string | null;
        panNumber: string | null;
        bankAccountNumber: string | null;
        bankName: string | null;
        ifscCode: string | null;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        rating: number;
        totalReviews: number;
        companyName: string;
        businessType: string;
    }>;
    getCategories(): Promise<{
        name: any;
        count: any;
    }[]>;
    private getCartItemCount;
}
