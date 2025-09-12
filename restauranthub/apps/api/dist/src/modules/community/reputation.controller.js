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
exports.ReputationController = void 0;
const common_1 = require("@nestjs/common");
const reputation_service_1 = require("./reputation.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const client_1 = require("@prisma/client");
let ReputationController = class ReputationController {
    constructor(reputationService) {
        this.reputationService = reputationService;
    }
    async getUserReputation(req, targetUserId) {
        const userId = targetUserId || req.user.id;
        return this.reputationService.getUserReputation(userId);
    }
    async getLeaderboard(timeframe, city, role, limit, page) {
        return this.reputationService.getLeaderboard({
            timeframe: timeframe || 'all',
            city,
            role,
            limit: limit ? parseInt(limit) : 20,
            page: page ? parseInt(page) : 1,
        });
    }
    async getTrendingContributors(timeframe, limit) {
        return this.reputationService.getTrendingContributors(timeframe || 'week', limit ? parseInt(limit) : 10);
    }
    async refreshBadges(req, targetUserId) {
        const userId = targetUserId || req.user.id;
        if (targetUserId && targetUserId !== req.user.id && req.user.role !== client_1.UserRole.ADMIN) {
            throw new Error('Forbidden');
        }
        await this.reputationService.checkActivityBadges(userId);
        return { message: 'Badges refreshed successfully' };
    }
};
exports.ReputationController = ReputationController;
__decorate([
    (0, common_1.Get)('profile/:userId?'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReputationController.prototype, "getUserReputation", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    __param(0, (0, common_1.Query)('timeframe')),
    __param(1, (0, common_1.Query)('city')),
    __param(2, (0, common_1.Query)('role')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReputationController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)('trending'),
    __param(0, (0, common_1.Query)('timeframe')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReputationController.prototype, "getTrendingContributors", null);
__decorate([
    (0, common_1.Post)('refresh-badges/:userId?'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReputationController.prototype, "refreshBadges", null);
exports.ReputationController = ReputationController = __decorate([
    (0, common_1.Controller)('community/reputation'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [reputation_service_1.ReputationService])
], ReputationController);
//# sourceMappingURL=reputation.controller.js.map