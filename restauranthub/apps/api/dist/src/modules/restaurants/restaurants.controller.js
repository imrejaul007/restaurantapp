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
exports.RestaurantsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const restaurants_service_1 = require("./restaurants.service");
const create_restaurant_dto_1 = require("./dto/create-restaurant.dto");
const update_restaurant_dto_1 = require("./dto/update-restaurant.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let RestaurantsController = class RestaurantsController {
    constructor(restaurantsService) {
        this.restaurantsService = restaurantsService;
    }
    async create(req, createRestaurantDto) {
        return this.restaurantsService.create(req.user.id, createRestaurantDto);
    }
    async findAll(page, limit, isVerified, cuisineType, city) {
        const filters = { isVerified: isVerified ? isVerified === 'true' : undefined, cuisineType, city };
        return this.restaurantsService.findAll(page, limit, filters);
    }
    async search(query, cuisineType) {
        const filters = { cuisineType };
        return this.restaurantsService.searchRestaurants(query, filters);
    }
    async findOne(id) {
        return this.restaurantsService.findOne(id);
    }
    async update(id, req, updateRestaurantDto) {
        return this.restaurantsService.update(id, req.user.id, req.user.role, updateRestaurantDto);
    }
    async getDashboard(id, req) {
        return this.restaurantsService.getDashboard(id, req.user.id);
    }
    async getAnalytics(id, period) {
        return this.restaurantsService.getRestaurantAnalytics(id, period);
    }
    async getMenu(id) {
        return this.restaurantsService.getMenu(id);
    }
    async uploadDocument(id, body) {
        return this.restaurantsService.uploadDocument(id, body.type, body.url, body.name);
    }
    async verify(id, body) {
        return this.restaurantsService.verifyRestaurant(id, body.isVerified, body.notes);
    }
};
exports.RestaurantsController = RestaurantsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create restaurant profile' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Restaurant created successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_restaurant_dto_1.CreateRestaurantDto]),
    __metadata("design:returntype", Promise)
], RestaurantsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all restaurants' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 20 }),
    (0, swagger_1.ApiQuery)({ name: 'isVerified', required: false, description: 'Filter by verification status (true/false)' }),
    (0, swagger_1.ApiQuery)({ name: 'cuisineType', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Restaurants retrieved successfully' }),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('isVerified')),
    __param(3, (0, common_1.Query)('cuisineType')),
    __param(4, (0, common_1.Query)('city')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], RestaurantsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search restaurants' }),
    (0, swagger_1.ApiQuery)({ name: 'q', description: 'Search query' }),
    (0, swagger_1.ApiQuery)({ name: 'cuisineType', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('cuisineType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RestaurantsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get restaurant by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Restaurant retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Restaurant not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RestaurantsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update restaurant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Restaurant updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_restaurant_dto_1.UpdateRestaurantDto]),
    __metadata("design:returntype", Promise)
], RestaurantsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get restaurant dashboard' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard data retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RestaurantsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)(':id/analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'period', required: false, example: '30d' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get restaurant analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics data retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RestaurantsController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)(':id/menu'),
    (0, swagger_1.ApiOperation)({ summary: 'Get restaurant menu' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Menu retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RestaurantsController.prototype, "getMenu", null);
__decorate([
    (0, common_1.Post)(':id/documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Upload restaurant documents' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Document uploaded' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RestaurantsController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Patch)(':id/verify'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Verify restaurant (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Restaurant verification updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RestaurantsController.prototype, "verify", null);
exports.RestaurantsController = RestaurantsController = __decorate([
    (0, swagger_1.ApiTags)('restaurants'),
    (0, common_1.Controller)('restaurants'),
    __metadata("design:paramtypes", [restaurants_service_1.RestaurantsService])
], RestaurantsController);
//# sourceMappingURL=restaurants.controller.js.map