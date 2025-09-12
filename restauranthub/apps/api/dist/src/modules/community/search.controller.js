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
const search_service_1 = require("./search.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const client_1 = require("@prisma/client");
const rate_limit_decorator_1 = require("./decorators/rate-limit.decorator");
const cache_decorator_1 = require("./decorators/cache.decorator");
const validation_pipe_1 = require("./pipes/validation.pipe");
const performance_interceptor_1 = require("./interceptors/performance.interceptor");
let SearchController = class SearchController {
    constructor(searchService) {
        this.searchService = searchService;
    }
    async universalSearch(req, query, type, category, tags, authorRole, postType, city, timeframe, sortBy, minReputation, verified, page, limit) {
        const filters = {
            query,
            type: type || 'all',
            category,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
            authorRole,
            postType,
            city,
            timeframe: timeframe || 'all',
            sortBy: sortBy || 'relevance',
            minReputation: minReputation ? parseInt(minReputation) : undefined,
            verified: verified ? verified === 'true' : undefined,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        };
        return this.searchService.universalSearch(req.user.id, filters);
    }
    async getTrendingContent(req, timeframe, type, category, limit) {
        return this.searchService.getTrendingContent(req.user.id, {
            timeframe: timeframe || 'week',
            type: type || 'all',
            category,
            limit: limit ? parseInt(limit) : 10,
        });
    }
    async getPersonalizedFeed(req, page, limit) {
        return this.searchService.getPersonalizedFeed(req.user.id, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }
    async getSearchSuggestions(query, type) {
        return {
            query,
            type: type || 'all',
            suggestions: [],
        };
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)(),
    (0, rate_limit_decorator_1.SearchLimit)(),
    (0, cache_decorator_1.CacheSearchResults)(600),
    (0, common_1.UsePipes)(validation_pipe_1.SearchValidationPipe),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('query')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('category')),
    __param(4, (0, common_1.Query)('tags')),
    __param(5, (0, common_1.Query)('authorRole')),
    __param(6, (0, common_1.Query)('postType')),
    __param(7, (0, common_1.Query)('city')),
    __param(8, (0, common_1.Query)('timeframe')),
    __param(9, (0, common_1.Query)('sortBy')),
    __param(10, (0, common_1.Query)('minReputation')),
    __param(11, (0, common_1.Query)('verified')),
    __param(12, (0, common_1.Query)('page')),
    __param(13, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "universalSearch", null);
__decorate([
    (0, common_1.Get)('trending'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('timeframe')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('category')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getTrendingContent", null);
__decorate([
    (0, common_1.Get)('feed'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getPersonalizedFeed", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSearchSuggestions", null);
exports.SearchController = SearchController = __decorate([
    (0, common_1.Controller)('community/search'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)(performance_interceptor_1.PerformanceInterceptor),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map