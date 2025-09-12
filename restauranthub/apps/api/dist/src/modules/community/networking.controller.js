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
exports.NetworkingController = void 0;
const common_1 = require("@nestjs/common");
const networking_service_1 = require("./networking.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let NetworkingController = class NetworkingController {
    constructor(networkingService) {
        this.networkingService = networkingService;
    }
    async followUser(req, userId) {
        return this.networkingService.followUser(req.user.id, userId);
    }
    async unfollowUser(req, userId) {
        return this.networkingService.unfollowUser(req.user.id, userId);
    }
    async getUserFollowers(req, targetUserId, page, limit) {
        const userId = targetUserId || req.user.id;
        return this.networkingService.getUserFollowers(userId, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }
    async getUserFollowing(req, targetUserId, page, limit) {
        const userId = targetUserId || req.user.id;
        return this.networkingService.getUserFollowing(userId, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }
    async getUserNetworkStats(req, targetUserId) {
        const userId = targetUserId || req.user.id;
        return this.networkingService.getUserNetworkStats(userId);
    }
    async getSuggestedConnections(req, limit) {
        return this.networkingService.getSuggestedConnections(req.user.id, limit ? parseInt(limit) : 10);
    }
    async createGroup(req, body) {
        return this.networkingService.createGroup(req.user.id, body);
    }
    async getGroups(type, city, category, search, isPrivate, page, limit) {
        return this.networkingService.getGroups({
            type,
            city,
            category,
            search,
            isPrivate: isPrivate ? isPrivate === 'true' : undefined,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }
    async getGroupDetails(req, groupId) {
        return this.networkingService.getGroupDetails(groupId, req.user.id);
    }
    async joinGroup(req, groupId) {
        return this.networkingService.joinGroup(req.user.id, groupId);
    }
};
exports.NetworkingController = NetworkingController;
__decorate([
    (0, common_1.Post)('follow/:userId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NetworkingController.prototype, "followUser", null);
__decorate([
    (0, common_1.Delete)('follow/:userId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NetworkingController.prototype, "unfollowUser", null);
__decorate([
    (0, common_1.Get)('followers/:userId?'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], NetworkingController.prototype, "getUserFollowers", null);
__decorate([
    (0, common_1.Get)('following/:userId?'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], NetworkingController.prototype, "getUserFollowing", null);
__decorate([
    (0, common_1.Get)('stats/:userId?'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NetworkingController.prototype, "getUserNetworkStats", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NetworkingController.prototype, "getSuggestedConnections", null);
__decorate([
    (0, common_1.Post)('groups'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NetworkingController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Get)('groups'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('city')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('isPrivate')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], NetworkingController.prototype, "getGroups", null);
__decorate([
    (0, common_1.Get)('groups/:groupId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NetworkingController.prototype, "getGroupDetails", null);
__decorate([
    (0, common_1.Post)('groups/:groupId/join'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NetworkingController.prototype, "joinGroup", null);
exports.NetworkingController = NetworkingController = __decorate([
    (0, common_1.Controller)('community/networking'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [networking_service_1.NetworkingService])
], NetworkingController);
//# sourceMappingURL=networking.controller.js.map