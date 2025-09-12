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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const products_service_1 = require("./products.service");
const client_1 = require("@prisma/client");
let ProductsController = class ProductsController {
    constructor(productsService) {
        this.productsService = productsService;
    }
    async getProducts(req, category, status, page, limit) {
        const products = await this.productsService.getProducts(req.user.id, {
            categoryId: category,
            status,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Products retrieved successfully',
            data: products,
        };
    }
    async getProduct(req, productId) {
        const product = await this.productsService.getProductById(req.user.id, productId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Product retrieved successfully',
            data: product,
        };
    }
    async createProduct(req, productData, files) {
        const product = await this.productsService.createProduct(req.user.id, {
            ...productData,
            price: parseFloat(productData.price),
            stockQuantity: parseInt(productData.stockQuantity),
            minOrderQty: productData.minOrderQty ? parseInt(productData.minOrderQty) : 1,
            maxOrderQty: productData.maxOrderQty ? parseInt(productData.maxOrderQty) : null,
        }, files);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Product created successfully',
            data: product,
        };
    }
    async updateProduct(req, productId, productData, files) {
        const product = await this.productsService.updateProduct(req.user.id, productId, {
            ...productData,
            price: productData.price ? parseFloat(productData.price) : undefined,
            stockQuantity: productData.stockQuantity ? parseInt(productData.stockQuantity) : undefined,
            minOrderQty: productData.minOrderQty ? parseInt(productData.minOrderQty) : undefined,
            maxOrderQty: productData.maxOrderQty ? parseInt(productData.maxOrderQty) : undefined,
        }, files);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Product updated successfully',
            data: product,
        };
    }
    async deleteProduct(req, productId) {
        await this.productsService.deleteProduct(req.user.id, productId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Product deleted successfully',
        };
    }
    async updateProductStatus(req, productId, status) {
        await this.productsService.updateProductStatus(req.user.id, productId, status);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Product status updated successfully',
        };
    }
    async updateProductAvailability(req, productId, isAvailable) {
        await this.productsService.updateProductAvailability(req.user.id, productId, isAvailable);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Product availability updated successfully',
        };
    }
    async updateStock(req, productId, stockQuantity, operation = 'set') {
        await this.productsService.updateStock(req.user.id, productId, stockQuantity, operation);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Product stock updated successfully',
        };
    }
    async getProductAnalytics(req, productId, startDate, endDate) {
        const analytics = await this.productsService.getProductAnalytics(req.user.id, productId, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Product analytics retrieved successfully',
            data: analytics,
        };
    }
    async addImages(req, productId, files) {
        await this.productsService.addProductImages(req.user.id, productId, files);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Images added successfully',
        };
    }
    async removeImage(req, productId, imageId) {
        await this.productsService.removeProductImage(req.user.id, productId, imageId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Image removed successfully',
        };
    }
    async addReview(req, productId, rating, comment, orderId) {
        const review = await this.productsService.addProductReview(req.user.id, productId, {
            rating,
            comment,
            orderId,
        });
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Review added successfully',
            data: review,
        };
    }
    async getReviews(productId, page, limit) {
        const reviews = await this.productsService.getProductReviews(productId, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Reviews retrieved successfully',
            data: reviews,
        };
    }
    async updateReview(req, reviewId, rating, comment) {
        const review = await this.productsService.updateProductReview(req.user.id, reviewId, {
            rating,
            comment,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Review updated successfully',
            data: review,
        };
    }
    async deleteReview(req, reviewId) {
        await this.productsService.deleteProductReview(req.user.id, reviewId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Review deleted successfully',
        };
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get products (for vendors to manage their products)' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Products retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product by ID' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Product retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.VENDOR),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 10)),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new product' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Product created successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Array]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.VENDOR),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 10)),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Update product' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Product updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Array]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.VENDOR),
    (0, swagger_1.ApiOperation)({ summary: 'Delete product' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Product deleted successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.VENDOR),
    (0, swagger_1.ApiOperation)({ summary: 'Update product status' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Product status updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "updateProductStatus", null);
__decorate([
    (0, common_1.Put)(':id/availability'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.VENDOR),
    (0, swagger_1.ApiOperation)({ summary: 'Update product availability' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Product availability updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('isAvailable')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "updateProductAvailability", null);
__decorate([
    (0, common_1.Put)(':id/stock'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.VENDOR),
    (0, swagger_1.ApiOperation)({ summary: 'Update product stock' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Product stock updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('stockQuantity')),
    __param(3, (0, common_1.Body)('operation')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "updateStock", null);
__decorate([
    (0, common_1.Get)(':id/analytics'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.VENDOR),
    (0, swagger_1.ApiOperation)({ summary: 'Get product analytics' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Product analytics retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "getProductAnalytics", null);
__decorate([
    (0, common_1.Post)(':id/images'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.VENDOR),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 10)),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Add product images' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Images added successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "addImages", null);
__decorate([
    (0, common_1.Delete)(':id/images/:imageId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.VENDOR),
    (0, swagger_1.ApiOperation)({ summary: 'Remove product image' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Image removed successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('imageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "removeImage", null);
__decorate([
    (0, common_1.Post)(':id/reviews'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Add product review' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Review added successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('rating')),
    __param(3, (0, common_1.Body)('comment')),
    __param(4, (0, common_1.Body)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "addReview", null);
__decorate([
    (0, common_1.Get)(':id/reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product reviews' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Reviews retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "getReviews", null);
__decorate([
    (0, common_1.Put)('reviews/:reviewId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Update product review' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Review updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('reviewId')),
    __param(2, (0, common_1.Body)('rating')),
    __param(3, (0, common_1.Body)('comment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "updateReview", null);
__decorate([
    (0, common_1.Delete)('reviews/:reviewId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete product review' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Review deleted successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('reviewId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "deleteReview", null);
exports.ProductsController = ProductsController = __decorate([
    (0, swagger_1.ApiTags)('products'),
    (0, common_1.Controller)('products'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map