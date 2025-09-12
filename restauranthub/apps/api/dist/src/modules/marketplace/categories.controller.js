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
exports.CategoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const categories_service_1 = require("./categories.service");
const client_1 = require("@prisma/client");
let CategoriesController = class CategoriesController {
    constructor(categoriesService) {
        this.categoriesService = categoriesService;
    }
    async getCategories(includeStats, parentId) {
        const categories = await this.categoriesService.getCategories({
            includeStats: includeStats === 'true',
            parentId,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Categories retrieved successfully',
            data: categories,
        };
    }
    async getCategory(categoryId) {
        const category = await this.categoriesService.getCategoryById(categoryId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Category retrieved successfully',
            data: category,
        };
    }
    async createCategory(req, name, description, parentId, icon, color) {
        const category = await this.categoriesService.createCategory(req.user.id, {
            name,
            description,
            parentId,
            icon,
            color,
        });
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Category created successfully',
            data: category,
        };
    }
    async updateCategory(req, categoryId, name, description, parentId, icon, color, isActive) {
        const category = await this.categoriesService.updateCategory(req.user.id, categoryId, {
            name,
            description,
            parentId,
            icon,
            color,
            isActive,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Category updated successfully',
            data: category,
        };
    }
    async deleteCategory(req, categoryId) {
        await this.categoriesService.deleteCategory(req.user.id, categoryId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Category deleted successfully',
        };
    }
    async getCategoryProducts(categoryId, page, limit, sortBy, sortOrder) {
        const products = await this.categoriesService.getCategoryProducts(categoryId, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            sortBy,
            sortOrder,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Category products retrieved successfully',
            data: products,
        };
    }
    async getSubcategories(categoryId) {
        const subcategories = await this.categoriesService.getSubcategories(categoryId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Subcategories retrieved successfully',
            data: subcategories,
        };
    }
    async getCategoryTree() {
        const tree = await this.categoriesService.getCategoryTree();
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Category hierarchy retrieved successfully',
            data: tree,
        };
    }
    async getCategoryAnalytics(req, categoryId, startDate, endDate) {
        const analytics = await this.categoriesService.getCategoryAnalytics(req.user.id, categoryId, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Category analytics retrieved successfully',
            data: analytics,
        };
    }
    async updateCategoryStatus(req, categoryId, isActive) {
        await this.categoriesService.updateCategoryStatus(req.user.id, categoryId, isActive);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Category status updated successfully',
        };
    }
    async mergeCategories(req, targetCategoryId, sourceCategoryIds) {
        await this.categoriesService.mergeCategories(req.user.id, targetCategoryId, sourceCategoryIds);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Categories merged successfully',
        };
    }
};
exports.CategoriesController = CategoriesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all product categories' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Categories retrieved successfully' }),
    __param(0, (0, common_1.Query)('includeStats')),
    __param(1, (0, common_1.Query)('parentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CategoriesController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get category by ID' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Category retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CategoriesController.prototype, "getCategory", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.VENDOR),
    (0, swagger_1.ApiOperation)({ summary: 'Create new category' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Category created successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('name')),
    __param(2, (0, common_1.Body)('description')),
    __param(3, (0, common_1.Body)('parentId')),
    __param(4, (0, common_1.Body)('icon')),
    __param(5, (0, common_1.Body)('color')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CategoriesController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update category' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Category updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('name')),
    __param(3, (0, common_1.Body)('description')),
    __param(4, (0, common_1.Body)('parentId')),
    __param(5, (0, common_1.Body)('icon')),
    __param(6, (0, common_1.Body)('color')),
    __param(7, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, Boolean]),
    __metadata("design:returntype", Promise)
], CategoriesController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete category' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Category deleted successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CategoriesController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Get)(':id/products'),
    (0, swagger_1.ApiOperation)({ summary: 'Get products by category' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Category products retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('sortBy')),
    __param(4, (0, common_1.Query)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CategoriesController.prototype, "getCategoryProducts", null);
__decorate([
    (0, common_1.Get)(':id/subcategories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get subcategories' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Subcategories retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CategoriesController.prototype, "getSubcategories", null);
__decorate([
    (0, common_1.Get)('tree/hierarchy'),
    (0, swagger_1.ApiOperation)({ summary: 'Get category tree hierarchy' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Category hierarchy retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CategoriesController.prototype, "getCategoryTree", null);
__decorate([
    (0, common_1.Get)(':id/analytics'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.VENDOR),
    (0, swagger_1.ApiOperation)({ summary: 'Get category analytics' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Category analytics retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], CategoriesController.prototype, "getCategoryAnalytics", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update category status' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Category status updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean]),
    __metadata("design:returntype", Promise)
], CategoriesController.prototype, "updateCategoryStatus", null);
__decorate([
    (0, common_1.Post)(':id/merge'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Merge categories' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Categories merged successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('sourceCategoryIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", Promise)
], CategoriesController.prototype, "mergeCategories", null);
exports.CategoriesController = CategoriesController = __decorate([
    (0, swagger_1.ApiTags)('categories'),
    (0, common_1.Controller)('categories'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [categories_service_1.CategoriesService])
], CategoriesController);
//# sourceMappingURL=categories.controller.js.map