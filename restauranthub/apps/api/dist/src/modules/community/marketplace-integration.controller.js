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
exports.MarketplaceIntegrationController = void 0;
const common_1 = require("@nestjs/common");
const marketplace_integration_service_1 = require("./marketplace-integration.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let MarketplaceIntegrationController = class MarketplaceIntegrationController {
    constructor(marketplaceIntegrationService) {
        this.marketplaceIntegrationService = marketplaceIntegrationService;
    }
    async createProductDiscussion(req, body) {
        return this.marketplaceIntegrationService.createProductDiscussion(req.user.id, body.productId, {
            title: body.title,
            content: body.content,
            forumId: body.forumId,
            tags: body.tags,
        });
    }
    async createJobPosting(req, body) {
        return this.marketplaceIntegrationService.createJobPosting(req.user.id, {
            title: body.title,
            description: body.description,
            restaurantId: body.restaurantId,
            location: body.location,
            jobType: body.jobType,
            salaryMin: body.salaryMin,
            salaryMax: body.salaryMax,
            requirements: body.requirements,
            skills: body.skills,
            benefits: body.benefits,
            applicationUrl: body.applicationUrl,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        });
    }
    async getMarketplaceInsights(type, id, timeframe) {
        return this.marketplaceIntegrationService.getMarketplaceInsights({
            type,
            id,
            timeframe,
        });
    }
    async getJobMarketAnalytics(location, jobType, timeframe) {
        return this.marketplaceIntegrationService.getJobMarketAnalytics({
            location,
            jobType,
            timeframe,
        });
    }
    async getRecommendedProducts(req, limit) {
        return this.marketplaceIntegrationService.getRecommendedProducts(req.user.id, limit ? parseInt(limit) : 10);
    }
    async getRecommendedJobs(req, limit) {
        return this.marketplaceIntegrationService.getRecommendedJobs(req.user.id, limit ? parseInt(limit) : 10);
    }
};
exports.MarketplaceIntegrationController = MarketplaceIntegrationController;
__decorate([
    (0, common_1.Post)('product-discussion'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceIntegrationController.prototype, "createProductDiscussion", null);
__decorate([
    (0, common_1.Post)('job-posting'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceIntegrationController.prototype, "createJobPosting", null);
__decorate([
    (0, common_1.Get)('insights'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('id')),
    __param(2, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceIntegrationController.prototype, "getMarketplaceInsights", null);
__decorate([
    (0, common_1.Get)('job-analytics'),
    __param(0, (0, common_1.Query)('location')),
    __param(1, (0, common_1.Query)('jobType')),
    __param(2, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceIntegrationController.prototype, "getJobMarketAnalytics", null);
__decorate([
    (0, common_1.Get)('recommended-products'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketplaceIntegrationController.prototype, "getRecommendedProducts", null);
__decorate([
    (0, common_1.Get)('recommended-jobs'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketplaceIntegrationController.prototype, "getRecommendedJobs", null);
exports.MarketplaceIntegrationController = MarketplaceIntegrationController = __decorate([
    (0, common_1.Controller)('community/marketplace'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [marketplace_integration_service_1.MarketplaceIntegrationService])
], MarketplaceIntegrationController);
//# sourceMappingURL=marketplace-integration.controller.js.map