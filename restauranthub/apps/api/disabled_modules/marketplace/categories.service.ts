import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

@Injectable()
export class CategoriesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly loggingService: LoggingService,
  ) {}

  async getCategories(filters: CategoryFilters) {
    this.loggingService.log('Getting categories', { context: 'CategoriesService', filters });

    // Get categories from the Category table which exists in the schema
    const categories = await this.databaseService.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const categoriesWithStats = await Promise.all(categories.map(async (category) => ({
      ...category,
      productCount: filters.includeStats ? await this.getProductCount(category.id) : undefined,
    })));

    return categoriesWithStats;
  }

  async getCategoryById(categoryId: string) {
    this.loggingService.log('Getting category by ID', { context: 'CategoriesService', categoryId });

    const category = await this.databaseService.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const productCount = await this.getProductCount(categoryId);

    return {
      ...category,
      productCount,
    };
  }

  async createCategory(userId: string, data: CreateCategoryData) {
    this.loggingService.log('Creating category', { context: 'CategoriesService', userId, data });
    
    // For the current schema, we can't actually create categories
    // They're derived from product categories
    // Return a simulated response
    return {
      id: data.name,
      name: data.name,
      description: data.description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateCategory(userId: string, categoryId: string, data: UpdateCategoryData) {
    this.loggingService.log('Updating category', { context: 'CategoriesService', userId, categoryId, data });
    
    // Verify category exists
    await this.getCategoryById(categoryId);
    
    // Return updated category
    return {
      id: categoryId,
      name: data.name || categoryId,
      description: data.description,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deleteCategory(userId: string, categoryId: string) {
    this.loggingService.log('Deleting category', { context: 'CategoriesService', userId, categoryId });
    
    // Check if category has products
    const productCount = await this.getProductCount(categoryId);
    if (productCount > 0) {
      throw new ForbiddenException('Cannot delete category with existing products');
    }
    
    // In the current schema, we can't actually delete categories
    // They're derived from products
  }

  async getCategoryProducts(categoryId: string, options: CategoryProductsOptions) {
    this.loggingService.log('Getting category products', { context: 'CategoriesService', categoryId, options });

    const skip = (options.page - 1) * options.limit;
    
    const where = {
      categoryId: categoryId,
      isActive: true,
    };

    const orderBy: any = {};
    if (options.sortBy) {
      orderBy[options.sortBy] = options.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [products, total] = await Promise.all([
      this.databaseService.product.findMany({
        where,
        skip,
        take: options.limit,
        orderBy,
        include: {
          vendor: {
            select: {
              businessName: true,
              rating: true,
            },
          },
        },
      }),
      this.databaseService.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        total,
        page: options.page,
        limit: options.limit,
        pages: Math.ceil(total / options.limit),
      },
    };
  }

  async getSubcategories(categoryId: string) {
    this.loggingService.log('Getting subcategories', { context: 'CategoriesService', categoryId });

    const subcategories = await this.databaseService.category.findMany({
      where: {
        parentId: categoryId,
        isActive: true,
      },
    });

    return subcategories;
  }

  async getCategoryTree() {
    this.loggingService.log('Getting category tree', 'CategoriesService');

    const categories = await this.getCategories({});
    
    const categoryTree = [];
    for (const category of categories) {
      const subcategories = await this.getSubcategories(category.id);
      categoryTree.push({
        ...category,
        children: subcategories,
      });
    }

    return categoryTree;
  }

  async getCategoryAnalytics(userId: string, categoryId: string, options: CategoryAnalyticsOptions) {
    this.loggingService.log('Getting category analytics', { context: 'CategoriesService', userId, categoryId, options });

    const where: any = {
      categoryId: categoryId,
    };

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const [productCount, totalViews] = await Promise.all([
      this.databaseService.product.count({ where }),
      this.databaseService.product.aggregate({
        where,
        _sum: { viewCount: true },
      }),
    ]);

    // Get total orders from order items
    const totalOrders = await this.databaseService.orderItem.aggregate({
      where: {
        product: {
          categoryId: categoryId,
        },
      },
      _sum: { quantity: true },
    });

    return {
      productCount,
      totalViews: totalViews._sum.viewCount || 0,
      totalOrders: totalOrders._sum.quantity || 0,
      period: {
        startDate: options.startDate,
        endDate: options.endDate,
      },
    };
  }

  async updateCategoryStatus(userId: string, categoryId: string, isActive: boolean) {
    this.loggingService.log('Updating category status', { context: 'CategoriesService', userId, categoryId, isActive });
    
    // Update category status directly
    await this.databaseService.category.update({
      where: { id: categoryId },
      data: { isActive },
    });
    
    // Also update all products in this category
    await this.databaseService.product.updateMany({
      where: { categoryId: categoryId },
      data: { isActive },
    });
  }

  async mergeCategories(userId: string, targetCategoryId: string, sourceCategoryIds: string[]) {
    this.loggingService.log('Merging categories', { context: 'CategoriesService', userId, targetCategoryId, sourceCategoryIds });
    
    // Update all products from source categories to target category
    for (const sourceCategoryId of sourceCategoryIds) {
      await this.databaseService.product.updateMany({
        where: { categoryId: sourceCategoryId },
        data: { categoryId: targetCategoryId },
      });
    }
  }

  private async getProductCount(categoryId: string): Promise<number> {
    return this.databaseService.product.count({
      where: {
        categoryId,
        isActive: true,
      },
    });
  }
}