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
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const search_service_1 = require("./search.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const public_decorator_1 = require("../common/decorators/public.decorator");
let SearchController = class SearchController {
    constructor(searchService) {
        this.searchService = searchService;
    }
    async searchRestaurants(query = '', page, limit, sortBy, sortOrder, category, minPrice, maxPrice, lat, lng, radius, minRating, availableOnly, tags) {
        const filters = {};
        if (category.length > 0)
            filters.category = category;
        if (minPrice > 0 || maxPrice < 10000) {
            filters.priceRange = { min: minPrice, max: maxPrice };
        }
        if (lat !== null && lng !== null) {
            filters.location = { lat, lng, radius: radius / 111 };
        }
        if (minRating > 0)
            filters.rating = minRating;
        if (availableOnly)
            filters.availability = true;
        if (tags.length > 0)
            filters.tags = tags;
        const pagination = { page, limit, sortBy, sortOrder, skip: ((page || 1) - 1) * (limit || 20) };
        return this.searchService.searchRestaurants(query, filters, pagination);
    }
    async searchProducts(query = '', page, limit, sortBy, sortOrder, category, minPrice, maxPrice, availableOnly, tags) {
        const filters = {};
        if (category.length > 0)
            filters.category = category;
        if (minPrice > 0 || maxPrice < 10000) {
            filters.priceRange = { min: minPrice, max: maxPrice };
        }
        if (availableOnly)
            filters.availability = true;
        if (tags.length > 0)
            filters.tags = tags;
        const pagination = { page, limit, sortBy, sortOrder, skip: ((page || 1) - 1) * (limit || 20) };
        return this.searchService.searchProducts(query, filters, pagination);
    }
    async searchJobs(query = '', page, limit, sortBy, sortOrder, location, status, from, to) {
        const filters = {};
        if (status.length > 0)
            filters.status = status;
        if (from || to) {
            filters.dateRange = {
                from: from ? new Date(from) : new Date(0),
                to: to ? new Date(to) : new Date(),
            };
        }
        const pagination = { page, limit, sortBy, sortOrder, skip: ((page || 1) - 1) * (limit || 20) };
        return this.searchService.searchJobs(query, filters, pagination);
    }
    async searchUsers(query = '', page, limit, sortBy, sortOrder, role, status) {
        const filters = {};
        if (role.length > 0)
            filters.role = role;
        if (status.length > 0)
            filters.status = status;
        const pagination = { page, limit, sortBy, sortOrder, skip: ((page || 1) - 1) * (limit || 20) };
        return this.searchService.searchUsers(query, filters, pagination);
    }
    async globalSearch(query, page, limit) {
        const pagination = { page, limit, skip: ((page || 1) - 1) * (limit || 20) };
        return this.searchService.globalSearch(query, pagination);
    }
    async getSuggestions(query, type) {
        if (query.length < 2) {
            return [];
        }
        return this.searchService.getSearchSuggestions(query, type);
    }
    async getFilterCategories() {
        return {
            restaurants: {
                cuisineTypes: [
                    'Indian', 'Chinese', 'Continental', 'Italian', 'Mexican',
                    'Japanese', 'Thai', 'Mediterranean', 'American', 'Fast Food',
                    'Street Food', 'Desserts', 'Beverages',
                ],
                priceRanges: [
                    { label: 'Budget (₹0-₹200)', min: 0, max: 200 },
                    { label: 'Mid-range (₹200-₹500)', min: 200, max: 500 },
                    { label: 'Premium (₹500-₹1000)', min: 500, max: 1000 },
                    { label: 'Fine Dining (₹1000+)', min: 1000, max: 10000 },
                ],
                ratings: [1, 2, 3, 4, 5],
            },
            products: {
                categories: [
                    'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Meat', 'Seafood',
                    'Spices', 'Beverages', 'Snacks', 'Frozen Foods', 'Equipment',
                    'Packaging', 'Cleaning Supplies',
                ],
                priceRanges: [
                    { label: 'Under ₹100', min: 0, max: 100 },
                    { label: '₹100-₹500', min: 100, max: 500 },
                    { label: '₹500-₹1000', min: 500, max: 1000 },
                    { label: '₹1000+', min: 1000, max: 10000 },
                ],
            },
            jobs: {
                departments: [
                    'Kitchen', 'Service', 'Management', 'Administration',
                    'Marketing', 'Finance', 'HR', 'IT', 'Delivery',
                ],
                employmentTypes: [
                    'Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship',
                ],
                experienceLevels: [
                    'Entry Level', 'Mid Level', 'Senior Level', 'Executive',
                ],
            },
        };
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)('restaurants'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search restaurants with filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Restaurants found' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Search query' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, type: [String], description: 'Cuisine categories' }),
    (0, swagger_1.ApiQuery)({ name: 'minPrice', required: false, type: Number, description: 'Minimum price' }),
    (0, swagger_1.ApiQuery)({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price' }),
    (0, swagger_1.ApiQuery)({ name: 'lat', required: false, type: Number, description: 'Latitude for location search' }),
    (0, swagger_1.ApiQuery)({ name: 'lng', required: false, type: Number, description: 'Longitude for location search' }),
    (0, swagger_1.ApiQuery)({ name: 'radius', required: false, type: Number, description: 'Search radius in km' }),
    (0, swagger_1.ApiQuery)({ name: 'minRating', required: false, type: Number, description: 'Minimum rating' }),
    (0, swagger_1.ApiQuery)({ name: 'availableOnly', required: false, type: Boolean, description: 'Show only available restaurants' }),
    (0, swagger_1.ApiQuery)({ name: 'tags', required: false, type: [String], description: 'Filter by tags' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('sortBy', new common_1.DefaultValuePipe('createdAt'))),
    __param(4, (0, common_1.Query)('sortOrder', new common_1.DefaultValuePipe('desc'))),
    __param(5, (0, common_1.Query)('category', new common_1.DefaultValuePipe([]), new common_1.ParseArrayPipe({ items: String, separator: ',' }))),
    __param(6, (0, common_1.Query)('minPrice', new common_1.DefaultValuePipe(0), common_1.ParseFloatPipe)),
    __param(7, (0, common_1.Query)('maxPrice', new common_1.DefaultValuePipe(10000), common_1.ParseFloatPipe)),
    __param(8, (0, common_1.Query)('lat', new common_1.DefaultValuePipe(null))),
    __param(9, (0, common_1.Query)('lng', new common_1.DefaultValuePipe(null))),
    __param(10, (0, common_1.Query)('radius', new common_1.DefaultValuePipe(10), common_1.ParseFloatPipe)),
    __param(11, (0, common_1.Query)('minRating', new common_1.DefaultValuePipe(0), common_1.ParseFloatPipe)),
    __param(12, (0, common_1.Query)('availableOnly', new common_1.DefaultValuePipe(false))),
    __param(13, (0, common_1.Query)('tags', new common_1.DefaultValuePipe([]), new common_1.ParseArrayPipe({ items: String, separator: ',' }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String, Array, Number, Number, Object, Object, Number, Number, Boolean, Array]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchRestaurants", null);
__decorate([
    (0, common_1.Get)('products'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search products with filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Products found' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Search query' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, type: [String], description: 'Product categories' }),
    (0, swagger_1.ApiQuery)({ name: 'minPrice', required: false, type: Number, description: 'Minimum price' }),
    (0, swagger_1.ApiQuery)({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price' }),
    (0, swagger_1.ApiQuery)({ name: 'availableOnly', required: false, type: Boolean, description: 'Show only available products' }),
    (0, swagger_1.ApiQuery)({ name: 'tags', required: false, type: [String], description: 'Filter by tags' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('sortBy', new common_1.DefaultValuePipe('createdAt'))),
    __param(4, (0, common_1.Query)('sortOrder', new common_1.DefaultValuePipe('desc'))),
    __param(5, (0, common_1.Query)('category', new common_1.DefaultValuePipe([]), new common_1.ParseArrayPipe({ items: String, separator: ',' }))),
    __param(6, (0, common_1.Query)('minPrice', new common_1.DefaultValuePipe(0), common_1.ParseFloatPipe)),
    __param(7, (0, common_1.Query)('maxPrice', new common_1.DefaultValuePipe(10000), common_1.ParseFloatPipe)),
    __param(8, (0, common_1.Query)('availableOnly', new common_1.DefaultValuePipe(false))),
    __param(9, (0, common_1.Query)('tags', new common_1.DefaultValuePipe([]), new common_1.ParseArrayPipe({ items: String, separator: ',' }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String, Array, Number, Number, Boolean, Array]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchProducts", null);
__decorate([
    (0, common_1.Get)('jobs'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search jobs with filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Jobs found' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Search query' }),
    (0, swagger_1.ApiQuery)({ name: 'location', required: false, description: 'Job location' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: [String], description: 'Job status filter' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'Posted after date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'Posted before date (ISO string)' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('sortBy', new common_1.DefaultValuePipe('createdAt'))),
    __param(4, (0, common_1.Query)('sortOrder', new common_1.DefaultValuePipe('desc'))),
    __param(5, (0, common_1.Query)('location')),
    __param(6, (0, common_1.Query)('status', new common_1.DefaultValuePipe([]), new common_1.ParseArrayPipe({ items: String, separator: ',' }))),
    __param(7, (0, common_1.Query)('from')),
    __param(8, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String, String, Array, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchJobs", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search users (authenticated users only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Users found' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Search query' }),
    (0, swagger_1.ApiQuery)({ name: 'role', required: false, type: [String], description: 'User roles filter' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: [String], description: 'User status filter' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('sortBy', new common_1.DefaultValuePipe('createdAt'))),
    __param(4, (0, common_1.Query)('sortOrder', new common_1.DefaultValuePipe('desc'))),
    __param(5, (0, common_1.Query)('role', new common_1.DefaultValuePipe([]), new common_1.ParseArrayPipe({ items: String, separator: ',' }))),
    __param(6, (0, common_1.Query)('status', new common_1.DefaultValuePipe([]), new common_1.ParseArrayPipe({ items: String, separator: ',' }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String, Array, Array]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)('global'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Global search across all entities' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results from all categories' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Search query' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "globalSearch", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get search suggestions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search suggestions' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Search query (minimum 2 characters)' }),
    (0, swagger_1.ApiQuery)({
        name: 'type',
        required: false,
        enum: ['restaurants', 'products', 'jobs'],
        description: 'Type of suggestions to return',
    }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('type', new common_1.DefaultValuePipe('restaurants'))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSuggestions", null);
__decorate([
    (0, common_1.Get)('filters/categories'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get available filter categories' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Available categories for filtering' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getFilterCategories", null);
exports.SearchController = SearchController = __decorate([
    (0, swagger_1.ApiTags)('search'),
    (0, common_1.Controller)('search'),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map