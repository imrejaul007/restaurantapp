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
exports.MarketplaceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const marketplace_service_1 = require("./marketplace.service");
const client_1 = require("@prisma/client");
let MarketplaceController = class MarketplaceController {
    constructor(marketplaceService) {
        this.marketplaceService = marketplaceService;
    }
    async getMarketplaceOverview(req) {
        const data = await this.marketplaceService.getMarketplaceOverview(req.user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Marketplace overview retrieved successfully',
            data,
        };
    }
    async searchProducts(query, category, minPrice, maxPrice, vendorId, sortBy, sortOrder, page, limit) {
        const products = await this.marketplaceService.searchProducts({
            query,
            category,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            vendorId,
            sortBy,
            sortOrder,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Products retrieved successfully',
            data: products,
        };
    }
    async getProduct(productId, req) {
        const product = await this.marketplaceService.getProduct(productId, req.user?.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Product retrieved successfully',
            data: product,
        };
    }
    async addToCart(req, productId, quantity) {
        const result = await this.marketplaceService.addToCart(req.user.id, productId, quantity);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: result.message,
            data: { cartItemCount: result.cartItemCount },
        };
    }
    async getCart(req) {
        const cart = await this.marketplaceService.getCart(req.user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Cart retrieved successfully',
            data: cart,
        };
    }
    async updateCartItem(req, cartItemId, quantity) {
        const result = await this.marketplaceService.updateCartItem(req.user.id, cartItemId, quantity);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: result.message,
            data: { cartItemCount: result.cartItemCount },
        };
    }
    async removeFromCart(req, cartItemId) {
        const result = await this.marketplaceService.removeFromCart(req.user.id, cartItemId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: result.message,
            data: { cartItemCount: result.cartItemCount },
        };
    }
    async clearCart(req) {
        const result = await this.marketplaceService.clearCart(req.user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: result.message,
            data: { cartItemCount: result.cartItemCount },
        };
    }
    async getVendors(category, city, state, verified, page, limit) {
        const vendors = await this.marketplaceService.getVendors({
            category,
            city,
            state,
            verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Vendors retrieved successfully',
            data: vendors,
        };
    }
    async getVendor(vendorId) {
        const vendor = await this.marketplaceService.getVendor(vendorId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Vendor retrieved successfully',
            data: vendor,
        };
    }
    async getCategories() {
        const categories = await this.marketplaceService.getCategories();
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Categories retrieved successfully',
            data: categories,
        };
    }
    async createOrder(req, deliveryAddress, paymentMethod, notes) {
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Order created successfully',
            data: { orderId: 'order_id' },
        };
    }
    async getOrders(req, status, page, limit) {
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Orders retrieved successfully',
            data: {
                orders: [],
                pagination: {
                    page: parseInt(page || '1'),
                    limit: parseInt(limit || '20'),
                    total: 0,
                    totalPages: 0,
                },
            },
        };
    }
    async getOrder(req, orderId) {
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Order retrieved successfully',
            data: {},
        };
    }
    async updateOrderStatus(req, orderId, status, notes) {
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Order status updated successfully',
        };
    }
};
exports.MarketplaceController = MarketplaceController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get marketplace overview' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Marketplace overview retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getMarketplaceOverview", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search products in marketplace' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Products retrieved successfully' }),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('minPrice')),
    __param(3, (0, common_1.Query)('maxPrice')),
    __param(4, (0, common_1.Query)('vendorId')),
    __param(5, (0, common_1.Query)('sortBy')),
    __param(6, (0, common_1.Query)('sortOrder')),
    __param(7, (0, common_1.Query)('page')),
    __param(8, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "searchProducts", null);
__decorate([
    (0, common_1.Get)('products/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product details' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Product retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Post)('cart/add'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Add product to cart' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Product added to cart successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('productId')),
    __param(2, (0, common_1.Body)('quantity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "addToCart", null);
__decorate([
    (0, common_1.Get)('cart'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Get shopping cart' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Cart retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getCart", null);
__decorate([
    (0, common_1.Put)('cart/item/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Update cart item quantity' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Cart item updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('quantity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "updateCartItem", null);
__decorate([
    (0, common_1.Delete)('cart/item/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove item from cart' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Item removed from cart successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "removeFromCart", null);
__decorate([
    (0, common_1.Delete)('cart/clear'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Clear shopping cart' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Cart cleared successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "clearCart", null);
__decorate([
    (0, common_1.Get)('vendors'),
    (0, swagger_1.ApiOperation)({ summary: 'Get marketplace vendors' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Vendors retrieved successfully' }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('city')),
    __param(2, (0, common_1.Query)('state')),
    __param(3, (0, common_1.Query)('verified')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getVendors", null);
__decorate([
    (0, common_1.Get)('vendors/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get vendor details' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Vendor retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getVendor", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product categories' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Categories retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Post)('orders'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Create order from cart' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Order created successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('deliveryAddress')),
    __param(2, (0, common_1.Body)('paymentMethod')),
    __param(3, (0, common_1.Body)('notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.VENDOR),
    (0, swagger_1.ApiOperation)({ summary: 'Get marketplace orders' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Orders retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.VENDOR),
    (0, swagger_1.ApiOperation)({ summary: 'Get order details' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Order retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Put)('orders/:id/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.VENDOR),
    (0, swagger_1.ApiOperation)({ summary: 'Update order status' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Order status updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('status')),
    __param(3, (0, common_1.Body)('notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "updateOrderStatus", null);
exports.MarketplaceController = MarketplaceController = __decorate([
    (0, swagger_1.ApiTags)('marketplace'),
    (0, common_1.Controller)('marketplace'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [marketplace_service_1.MarketplaceService])
], MarketplaceController);
//# sourceMappingURL=marketplace.controller.js.map