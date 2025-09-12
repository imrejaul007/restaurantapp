import { HttpStatus } from '@nestjs/common';
import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    getCategories(includeStats?: string, parentId?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            productCount: number | undefined;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        }[];
    }>;
    getCategory(categoryId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    createCategory(req: any, name: string, description?: string, parentId?: string, icon?: string, color?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: string;
            name: string;
            description: string | undefined;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    updateCategory(req: any, categoryId: string, name?: string, description?: string, parentId?: string, icon?: string, color?: string, isActive?: boolean): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: string;
            name: string;
            description: string | undefined;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    deleteCategory(req: any, categoryId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    getCategoryProducts(categoryId: string, page?: string, limit?: string, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<{
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
    getSubcategories(categoryId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
    }>;
    getCategoryTree(): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        }[];
    }>;
    getCategoryAnalytics(req: any, categoryId: string, startDate?: string, endDate?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            productCount: number;
            totalViews: number;
            totalOrders: number;
            period: {
                startDate: Date | undefined;
                endDate: Date | undefined;
            };
        };
    }>;
    updateCategoryStatus(req: any, categoryId: string, isActive: boolean): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    mergeCategories(req: any, targetCategoryId: string, sourceCategoryIds: string[]): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
}
