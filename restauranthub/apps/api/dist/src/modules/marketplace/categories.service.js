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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const logging_service_1 = require("../logging/logging.service");
let CategoriesService = class CategoriesService {
    constructor(databaseService, loggingService) {
        this.databaseService = databaseService;
        this.loggingService = loggingService;
    }
    async getCategories(filters) {
        this.loggingService.log('Getting categories', { context: 'CategoriesService', filters });
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
    async getCategoryById(categoryId) {
        this.loggingService.log('Getting category by ID', { context: 'CategoriesService', categoryId });
        const category = await this.databaseService.category.findUnique({
            where: { id: categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        const productCount = await this.getProductCount(categoryId);
        return {
            ...category,
            productCount,
        };
    }
    async createCategory(userId, data) {
        this.loggingService.log('Creating category', { context: 'CategoriesService', userId, data });
        return {
            id: data.name,
            name: data.name,
            description: data.description,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    async updateCategory(userId, categoryId, data) {
        this.loggingService.log('Updating category', { context: 'CategoriesService', userId, categoryId, data });
        await this.getCategoryById(categoryId);
        return {
            id: categoryId,
            name: data.name || categoryId,
            description: data.description,
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    async deleteCategory(userId, categoryId) {
        this.loggingService.log('Deleting category', { context: 'CategoriesService', userId, categoryId });
        const productCount = await this.getProductCount(categoryId);
        if (productCount > 0) {
            throw new common_1.ForbiddenException('Cannot delete category with existing products');
        }
    }
    async getCategoryProducts(categoryId, options) {
        this.loggingService.log('Getting category products', { context: 'CategoriesService', categoryId, options });
        const skip = (options.page - 1) * options.limit;
        const where = {
            categoryId: categoryId,
            isActive: true,
        };
        const orderBy = {};
        if (options.sortBy) {
            orderBy[options.sortBy] = options.sortOrder || 'asc';
        }
        else {
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
    async getSubcategories(categoryId) {
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
    async getCategoryAnalytics(userId, categoryId, options) {
        this.loggingService.log('Getting category analytics', { context: 'CategoriesService', userId, categoryId, options });
        const where = {
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
    async updateCategoryStatus(userId, categoryId, isActive) {
        this.loggingService.log('Updating category status', { context: 'CategoriesService', userId, categoryId, isActive });
        await this.databaseService.category.update({
            where: { id: categoryId },
            data: { isActive },
        });
        await this.databaseService.product.updateMany({
            where: { categoryId: categoryId },
            data: { isActive },
        });
    }
    async mergeCategories(userId, targetCategoryId, sourceCategoryIds) {
        this.loggingService.log('Merging categories', { context: 'CategoriesService', userId, targetCategoryId, sourceCategoryIds });
        for (const sourceCategoryId of sourceCategoryIds) {
            await this.databaseService.product.updateMany({
                where: { categoryId: sourceCategoryId },
                data: { categoryId: targetCategoryId },
            });
        }
    }
    async getProductCount(categoryId) {
        return this.databaseService.product.count({
            where: {
                categoryId,
                isActive: true,
            },
        });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        logging_service_1.LoggingService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map