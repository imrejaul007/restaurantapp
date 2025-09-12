import { DatabaseService } from '../database/database.service';
import { LoggingService } from '../logging/logging.service';
interface CategoryFilters {
    includeStats?: boolean;
    parentId?: string;
}
interface CreateCategoryData {
    name: string;
    description?: string;
    parentId?: string;
    icon?: string;
    color?: string;
}
interface UpdateCategoryData {
    name?: string;
    description?: string;
    parentId?: string;
    icon?: string;
    color?: string;
    isActive?: boolean;
}
interface CategoryProductsOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
interface CategoryAnalyticsOptions {
    startDate?: Date;
    endDate?: Date;
}
export declare class CategoriesService {
    private readonly databaseService;
    private readonly loggingService;
    constructor(databaseService: DatabaseService, loggingService: LoggingService);
    getCategories(filters: CategoryFilters): Promise<{
        productCount: number | undefined;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }[]>;
    getCategoryById(categoryId: string): Promise<{
        productCount: number;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        slug: string;
        image: string | null;
        displayOrder: number;
        parentId: string | null;
    }>;
    createCategory(userId: string, data: CreateCategoryData): Promise<{
        id: string;
        name: string;
        description: string | undefined;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateCategory(userId: string, categoryId: string, data: UpdateCategoryData): Promise<{
        id: string;
        name: string;
        description: string | undefined;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteCategory(userId: string, categoryId: string): Promise<void>;
    getCategoryProducts(categoryId: string, options: CategoryProductsOptions): Promise<{
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
    getSubcategories(categoryId: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        slug: string;
        image: string | null;
        displayOrder: number;
        parentId: string | null;
    }[]>;
    getCategoryTree(): Promise<{
        children: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            slug: string;
            image: string | null;
            displayOrder: number;
            parentId: string | null;
        }[];
        productCount: number | undefined;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }[]>;
    getCategoryAnalytics(userId: string, categoryId: string, options: CategoryAnalyticsOptions): Promise<{
        productCount: number;
        totalViews: number;
        totalOrders: number;
        period: {
            startDate: Date | undefined;
            endDate: Date | undefined;
        };
    }>;
    updateCategoryStatus(userId: string, categoryId: string, isActive: boolean): Promise<void>;
    mergeCategories(userId: string, targetCategoryId: string, sourceCategoryIds: string[]): Promise<void>;
    private getProductCount;
}
export {};
