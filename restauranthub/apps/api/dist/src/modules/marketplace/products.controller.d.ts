import { HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    getProducts(req: any, category?: string, status?: string, page?: string, limit?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            products: ({
                vendor: {
                    businessName: string;
                    rating: number;
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
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    getProduct(req: any, productId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            vendor: {
                businessName: string;
                rating: number;
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
        };
    }>;
    createProduct(req: any, productData: any, files?: Express.Multer.File[]): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            vendor: {
                businessName: string;
                rating: number;
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
        };
    }>;
    updateProduct(req: any, productId: string, productData: any, files?: Express.Multer.File[]): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            vendor: {
                businessName: string;
                rating: number;
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
        };
    }>;
    deleteProduct(req: any, productId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    updateProductStatus(req: any, productId: string, status: 'active' | 'inactive' | 'out_of_stock'): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    updateProductAvailability(req: any, productId: string, isAvailable: boolean): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    updateStock(req: any, productId: string, stockQuantity: number, operation?: 'set' | 'add' | 'subtract'): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    getProductAnalytics(req: any, productId: string, startDate?: string, endDate?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            views: number;
            orders: number;
            rating: number;
            reviews: number;
            createdAt: Date;
            period: {
                startDate: Date | undefined;
                endDate: Date | undefined;
            };
        };
    }>;
    addImages(req: any, productId: string, files: Express.Multer.File[]): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    removeImage(req: any, productId: string, imageId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    addReview(req: any, productId: string, rating: number, comment: string, orderId?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: string;
            userId: string;
            productId: string;
            rating: number;
            comment: string;
            orderId: string | undefined;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    getReviews(productId: string, page?: string, limit?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            reviews: {
                id: string;
                userId: string;
                productId: string;
                rating: number;
                comment: string;
                createdAt: Date;
                user: {
                    firstName: string;
                    lastName: string;
                };
            }[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    updateReview(req: any, reviewId: string, rating?: number, comment?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: string;
            userId: string;
            rating: number;
            comment: string;
            updatedAt: Date;
        };
    }>;
    deleteReview(req: any, reviewId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
}
