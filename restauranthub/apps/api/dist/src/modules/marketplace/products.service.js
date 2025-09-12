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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const logging_service_1 = require("../logging/logging.service");
let ProductsService = class ProductsService {
    constructor(databaseService, loggingService) {
        this.databaseService = databaseService;
        this.loggingService = loggingService;
    }
    async getProducts(userId, filters) {
        this.loggingService.log('Getting products for user', { context: 'ProductsService', userId, filters });
        const user = await this.databaseService.user.findUnique({
            where: { id: userId },
            include: { vendor: true },
        });
        if (!user?.vendor) {
            throw new common_1.ForbiddenException('Only vendors can access their products');
        }
        const skip = (filters.page - 1) * filters.limit;
        const where = {
            vendorId: user.vendor.id,
        };
        if (filters.categoryId) {
            where.categoryId = filters.categoryId;
        }
        if (filters.status) {
            if (filters.status === 'active') {
                where.isActive = true;
                where.isActive = true;
            }
            else if (filters.status === 'inactive') {
                where.isActive = false;
            }
            else if (filters.status === 'out_of_stock') {
                where.quantity = 0;
            }
        }
        const [products, total] = await Promise.all([
            this.databaseService.product.findMany({
                where,
                skip,
                take: filters.limit,
                orderBy: { createdAt: 'desc' },
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
                page: filters.page,
                limit: filters.limit,
                pages: Math.ceil(total / filters.limit),
            },
        };
    }
    async getProductById(userId, productId) {
        this.loggingService.log('Getting product by ID', { context: 'ProductsService', userId, productId });
        const user = await this.databaseService.user.findUnique({
            where: { id: userId },
            include: { vendor: true },
        });
        const product = await this.databaseService.product.findUnique({
            where: { id: productId },
            include: {
                vendor: {
                    select: {
                        businessName: true,
                        rating: true,
                    },
                },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (user?.vendor && product.vendorId !== user.vendor.id) {
            throw new common_1.ForbiddenException('You can only access your own products');
        }
        await this.databaseService.product.update({
            where: { id: productId },
            data: { viewCount: { increment: 1 } },
        });
        return product;
    }
    async createProduct(userId, data, files) {
        this.loggingService.log('Creating product', { context: 'ProductsService', userId, data });
        const user = await this.databaseService.user.findUnique({
            where: { id: userId },
            include: { vendor: true },
        });
        if (!user?.vendor) {
            throw new common_1.ForbiddenException('Only vendors can create products');
        }
        const images = [];
        if (files && files.length > 0) {
            for (const file of files) {
                images.push(`/uploads/products/${Date.now()}-${file.originalname}`);
            }
        }
        const product = await this.databaseService.product.create({
            data: {
                vendorId: user.vendor.id,
                name: data.name,
                slug: data.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
                sku: 'SKU-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
                description: data.description,
                categoryId: data.categoryId,
                price: data.price,
                unit: data.unit,
                quantity: data.quantity,
                minOrderQuantity: data.minOrderQuantity,
                maxOrderQuantity: data.maxOrderQuantity,
                tags: data.tags || [],
                images,
            },
            include: {
                vendor: {
                    select: {
                        businessName: true,
                        rating: true,
                    },
                },
            },
        });
        return product;
    }
    async updateProduct(userId, productId, data, files) {
        this.loggingService.log('Updating product', { context: 'ProductsService', userId, productId, data });
        const user = await this.databaseService.user.findUnique({
            where: { id: userId },
            include: { vendor: true },
        });
        if (!user?.vendor) {
            throw new common_1.ForbiddenException('Only vendors can update products');
        }
        const existingProduct = await this.databaseService.product.findUnique({
            where: { id: productId },
        });
        if (!existingProduct) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (existingProduct.vendorId !== user.vendor.id) {
            throw new common_1.ForbiddenException('You can only update your own products');
        }
        let images = existingProduct.images;
        if (files && files.length > 0) {
            const newImages = [];
            for (const file of files) {
                newImages.push(`/uploads/products/${Date.now()}-${file.originalname}`);
            }
            images = [...images, ...newImages];
        }
        const updateData = {
            ...data,
            images,
        };
        const product = await this.databaseService.product.update({
            where: { id: productId },
            data: updateData,
            include: {
                vendor: {
                    select: {
                        businessName: true,
                        rating: true,
                    },
                },
            },
        });
        return product;
    }
    async deleteProduct(userId, productId) {
        this.loggingService.log('Deleting product', { context: 'ProductsService', userId, productId });
        const user = await this.databaseService.user.findUnique({
            where: { id: userId },
            include: { vendor: true },
        });
        if (!user?.vendor) {
            throw new common_1.ForbiddenException('Only vendors can delete products');
        }
        const existingProduct = await this.databaseService.product.findUnique({
            where: { id: productId },
        });
        if (!existingProduct) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (existingProduct.vendorId !== user.vendor.id) {
            throw new common_1.ForbiddenException('You can only delete your own products');
        }
        await this.databaseService.product.delete({
            where: { id: productId },
        });
    }
    async updateProductStatus(userId, productId, status) {
        this.loggingService.log('Updating product status', { context: 'ProductsService', userId, productId, status });
        await this.checkProductOwnership(userId, productId);
        const updateData = {};
        switch (status) {
            case 'active':
                updateData.isActive = true;
                updateData.isActive = true;
                break;
            case 'inactive':
                updateData.isActive = false;
                break;
            case 'out_of_stock':
                updateData.quantity = 0;
                updateData.isActive = false;
                break;
        }
        await this.databaseService.product.update({
            where: { id: productId },
            data: updateData,
        });
    }
    async updateProductAvailability(userId, productId, isActive) {
        this.loggingService.log('Updating product availability', { context: 'ProductsService', userId, productId, isActive });
        await this.checkProductOwnership(userId, productId);
        await this.databaseService.product.update({
            where: { id: productId },
            data: { isActive },
        });
    }
    async updateStock(userId, productId, quantity, operation = 'set') {
        this.loggingService.log('Updating product stock', { context: 'ProductsService', userId, productId, quantity, operation });
        await this.checkProductOwnership(userId, productId);
        let updateData = {};
        switch (operation) {
            case 'set':
                updateData = { quantity };
                break;
            case 'add':
                updateData = { quantity: { increment: quantity } };
                break;
            case 'subtract':
                updateData = { quantity: { decrement: quantity } };
                break;
        }
        await this.databaseService.product.update({
            where: { id: productId },
            data: updateData,
        });
    }
    async getProductAnalytics(userId, productId, options) {
        this.loggingService.log('Getting product analytics', { context: 'ProductsService', userId, productId, options });
        await this.checkProductOwnership(userId, productId);
        const product = await this.databaseService.product.findUnique({
            where: { id: productId },
            select: {
                viewCount: true,
                rating: true,
                totalReviews: true,
                createdAt: true,
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        return {
            views: product.viewCount,
            orders: 0,
            rating: product.rating,
            reviews: product.totalReviews,
            createdAt: product.createdAt,
            period: {
                startDate: options.startDate,
                endDate: options.endDate,
            },
        };
    }
    async addProductImages(userId, productId, files) {
        this.loggingService.log('Adding product images', { context: 'ProductsService', userId, productId, fileCount: files.length });
        await this.checkProductOwnership(userId, productId);
        const newImages = [];
        for (const file of files) {
            newImages.push(`/uploads/products/${Date.now()}-${file.originalname}`);
        }
        const product = await this.databaseService.product.findUnique({
            where: { id: productId },
            select: { images: true },
        });
        await this.databaseService.product.update({
            where: { id: productId },
            data: {
                images: [...(product?.images || []), ...newImages],
            },
        });
    }
    async removeProductImage(userId, productId, imageId) {
        this.loggingService.log('Removing product image', { context: 'ProductsService', userId, productId, imageId });
        await this.checkProductOwnership(userId, productId);
        const product = await this.databaseService.product.findUnique({
            where: { id: productId },
            select: { images: true },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        const updatedImages = product.images.filter((img, index) => index.toString() !== imageId);
        await this.databaseService.product.update({
            where: { id: productId },
            data: { images: updatedImages },
        });
    }
    async addProductReview(userId, productId, data) {
        this.loggingService.log('Adding product review', { context: 'ProductsService', userId, productId, data });
        const product = await this.databaseService.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        const review = {
            id: `review_${Date.now()}`,
            userId,
            productId,
            rating: data.rating,
            comment: data.comment,
            orderId: data.orderId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const newReviewCount = product.totalReviews + 1;
        const newRating = ((product.rating * product.totalReviews) + data.rating) / newReviewCount;
        await this.databaseService.product.update({
            where: { id: productId },
            data: {
                rating: newRating,
                totalReviews: newReviewCount,
            },
        });
        return review;
    }
    async getProductReviews(productId, options) {
        this.loggingService.log('Getting product reviews', { context: 'ProductsService', productId, options });
        const product = await this.databaseService.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        const reviews = [
            {
                id: 'review_1',
                userId: 'user_1',
                productId,
                rating: 5,
                comment: 'Great product!',
                createdAt: new Date(),
                user: {
                    firstName: 'John',
                    lastName: 'Doe',
                },
            },
        ];
        return {
            reviews,
            pagination: {
                total: reviews.length,
                page: options.page,
                limit: options.limit,
                pages: Math.ceil(reviews.length / options.limit),
            },
        };
    }
    async updateProductReview(userId, reviewId, data) {
        this.loggingService.log('Updating product review', { context: 'ProductsService', userId, reviewId, data });
        return {
            id: reviewId,
            userId,
            rating: data.rating || 5,
            comment: data.comment || 'Updated review',
            updatedAt: new Date(),
        };
    }
    async deleteProductReview(userId, reviewId) {
        this.loggingService.log('Deleting product review', { context: 'ProductsService', userId, reviewId });
    }
    async checkProductOwnership(userId, productId) {
        const user = await this.databaseService.user.findUnique({
            where: { id: userId },
            include: { vendor: true },
        });
        if (!user?.vendor) {
            throw new common_1.ForbiddenException('Only vendors can access products');
        }
        const product = await this.databaseService.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (product.vendorId !== user.vendor.id) {
            throw new common_1.ForbiddenException('You can only access your own products');
        }
        return { user, product };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        logging_service_1.LoggingService])
], ProductsService);
//# sourceMappingURL=products.service.js.map