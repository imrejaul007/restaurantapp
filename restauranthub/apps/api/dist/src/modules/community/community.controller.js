"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const community_service_1 = require("./community.service");
const sanitizeHtml = __importStar(require("sanitize-html"));
const SANITIZE_OPTIONS = {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
    allowedSchemes: [],
};
let CommunityController = class CommunityController {
    constructor(communityService) {
        this.communityService = communityService;
    }
    async getCommunityOverview(req) {
        const data = await this.communityService.getCommunityOverview(req.user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Community overview retrieved successfully',
            data,
        };
    }
    async searchCommunity(query, type, category, userId, page, limit) {
        const results = await this.communityService.searchCommunity({
            query,
            type,
            category,
            userId,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Search results retrieved successfully',
            data: results,
        };
    }
    async getCommunityStats(req, timeframe) {
        const stats = await this.communityService.getCommunityStats(req.user.id, timeframe);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Community statistics retrieved successfully',
            data: stats,
        };
    }
    async getUserActivity(req, userId) {
        const activity = await this.communityService.getUserActivity(req.user.id, userId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'User activity retrieved successfully',
            data: activity,
        };
    }
    async getMyActivity(req) {
        const activity = await this.communityService.getUserActivity(req.user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'My activity retrieved successfully',
            data: activity,
        };
    }
    async reportContent(req, contentId, contentType, reason) {
        const sanitizedReason = sanitizeHtml(reason, SANITIZE_OPTIONS);
        const report = await this.communityService.reportContent(req.user.id, contentId, contentType, sanitizedReason);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Content reported successfully',
            data: report,
        };
    }
};
exports.CommunityController = CommunityController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get community overview' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Community overview retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getCommunityOverview", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search community content' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Search results retrieved successfully' }),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('userId')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "searchCommunity", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get community statistics' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Community statistics retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getCommunityStats", null);
__decorate([
    (0, common_1.Get)('users/:id/activity'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user activity in community' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'User activity retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getUserActivity", null);
__decorate([
    (0, common_1.Get)('my-activity'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my community activity' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'My activity retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getMyActivity", null);
__decorate([
    (0, common_1.Post)('report'),
    (0, swagger_1.ApiOperation)({ summary: 'Report content' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Content reported successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('contentId')),
    __param(2, (0, common_1.Body)('contentType')),
    __param(3, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "reportContent", null);
exports.CommunityController = CommunityController = __decorate([
    (0, swagger_1.ApiTags)('community'),
    (0, common_1.Controller)('community'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [community_service_1.CommunityService])
], CommunityController);
//# sourceMappingURL=community.controller.js.map