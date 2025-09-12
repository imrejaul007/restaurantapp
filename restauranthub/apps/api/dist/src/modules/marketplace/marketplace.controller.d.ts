import { HttpStatus } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
export declare class MarketplaceController {
    private readonly marketplaceService;
    constructor(marketplaceService: MarketplaceService);
    getMarketplaceOverview(req: any): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    searchProducts(query?: string, category?: string, minPrice?: string, maxPrice?: string, vendorId?: string, sortBy?: string, sortOrder?: 'asc' | 'desc', page?: string, limit?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    getProduct(productId: string, req: any): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    addToCart(req: any, productId: string, quantity: number): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            cartItemCount: number;
        };
    }>;
    getCart(req: any): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            items: any[];
            itemsByVendor: unknown[];
            summary: {
                itemCount: number;
                subtotal: any;
                taxAmount: number;
                total: any;
            };
        };
    }>;
    updateCartItem(req: any, cartItemId: string, quantity: number): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            cartItemCount: number;
        };
    }>;
    removeFromCart(req: any, cartItemId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            cartItemCount: number;
        };
    }>;
    clearCart(req: any): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            cartItemCount: number;
        };
    }>;
    getVendors(category?: string, city?: string, state?: string, verified?: string, page?: string, limit?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    getVendor(vendorId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    getCategories(): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            name: any;
            count: any;
        }[];
    }>;
    createOrder(req: any, deliveryAddress: any, paymentMethod: string, notes?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            orderId: string;
        };
    }>;
    getOrders(req: any, status?: string, page?: string, limit?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            orders: never[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getOrder(req: any, orderId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {};
    }>;
    updateOrderStatus(req: any, orderId: string, status: string, notes?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
}
