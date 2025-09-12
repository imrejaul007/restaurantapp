import { DatabaseService } from '../database/database.service';
import { LoggingService } from '../logging/logging.service';
interface ProductFilters {
    categoryId?: string;
    status?: string;
    page: number;
    limit: number;
}
interface CreateProductData {
    name: string;
    description?: string;
    categoryId: string;
    price: number;
    unit: string;
    quantity: number;
    minOrderQuantity: number;
    maxOrderQuantity?: number;
    specifications?: any;
    tags?: string[];
}
interface UpdateProductData {
    name?: string;
    description?: string;
    categoryId?: string;
    price?: number;
    unit?: string;
    quantity?: number;
    minOrderQuantity?: number;
    maxOrderQuantity?: number;
    specifications?: any;
    tags?: string[];
    isActive?: boolean;
}
interface ProductAnalyticsOptions {
    startDate?: Date;
    endDate?: Date;
}
interface ReviewData {
    rating: number;
    comment: string;
    orderId?: string;
}
interface UpdateReviewData {
    rating?: number;
    comment?: string;
}
interface ReviewsOptions {
    page: number;
    limit: number;
}
export declare class ProductsService {
    private readonly databaseService;
    private readonly loggingService;
    constructor(databaseService: DatabaseService, loggingService: LoggingService);
    getProducts(userId: string, filters: ProductFilters): Promise<{
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
    }>;
    getProductById(userId: string, productId: string): Promise<{
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
    }>;
    createProduct(userId: string, data: CreateProductData, files?: Express.Multer.File[]): Promise<{
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
    }>;
    updateProduct(userId: string, productId: string, data: UpdateProductData, files?: Express.Multer.File[]): Promise<{
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
    }>;
    deleteProduct(userId: string, productId: string): Promise<void>;
    updateProductStatus(userId: string, productId: string, status: 'active' | 'inactive' | 'out_of_stock'): Promise<void>;
    updateProductAvailability(userId: string, productId: string, isActive: boolean): Promise<void>;
    updateStock(userId: string, productId: string, quantity: number, operation?: 'set' | 'add' | 'subtract'): Promise<void>;
    getProductAnalytics(userId: string, productId: string, options: ProductAnalyticsOptions): Promise<{
        views: number;
        orders: number;
        rating: number;
        reviews: number;
        createdAt: Date;
        period: {
            startDate: Date | undefined;
            endDate: Date | undefined;
        };
    }>;
    addProductImages(userId: string, productId: string, files: Express.Multer.File[]): Promise<void>;
    removeProductImage(userId: string, productId: string, imageId: string): Promise<void>;
    addProductReview(userId: string, productId: string, data: ReviewData): Promise<{
        id: string;
        userId: string;
        productId: string;
        rating: number;
        comment: string;
        orderId: string | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getProductReviews(productId: string, options: ReviewsOptions): Promise<{
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
    }>;
    updateProductReview(userId: string, reviewId: string, data: UpdateReviewData): Promise<{
        id: string;
        userId: string;
        rating: number;
        comment: string;
        updatedAt: Date;
    }>;
    deleteProductReview(userId: string, reviewId: string): Promise<void>;
    private checkProductOwnership;
}
export {};
