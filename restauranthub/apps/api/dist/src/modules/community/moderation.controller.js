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
exports.ModerationController = void 0;
const common_1 = require("@nestjs/common");
const moderation_service_1 = require("./moderation.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let ModerationController = class ModerationController {
    constructor(moderationService) {
        this.moderationService = moderationService;
    }
    async reportContent(req, body) {
        return this.moderationService.reportContent(req.user.id, body.contentId, body.contentType, body.reason, body.description, body.category);
    }
    async getReports(status, contentType, category, assignedTo, page, limit) {
        return this.moderationService.getReports({
            status,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }
    async moderateContent(req, reportId, body) {
        return this.moderationService.moderateContent(req.user.id, reportId, body.action, body.reason, body.durationDays);
    }
    async checkSpam(body) {
        return this.moderationService.detectSpam(body.content, body.metadata);
    }
    async checkSafety(body) {
        return this.moderationService.checkContentSafety(body.content);
    }
    async getSafetyProfile(req, targetUserId) {
        const userId = targetUserId || req.user.id;
        if (targetUserId && targetUserId !== req.user.id && req.user.role !== client_1.UserRole.ADMIN) {
            throw new Error('Forbidden');
        }
        return this.moderationService.getUserSafetyProfile(userId);
    }
    async blockUser(req, userId, body) {
        return this.moderationService.blockUser(req.user.id, userId, body.reason);
    }
    async getMyReports(req, page, limit) {
        return this.moderationService.getReports({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }
};
exports.ModerationController = ModerationController;
__decorate([
    (0, common_1.Post)('report'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "reportContent", null);
__decorate([
    (0, common_1.Get)('reports'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('contentType')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('assignedTo')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "getReports", null);
__decorate([
    (0, common_1.Post)('moderate/:reportId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('reportId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "moderateContent", null);
__decorate([
    (0, common_1.Post)('check-spam'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "checkSpam", null);
__decorate([
    (0, common_1.Post)('check-safety'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "checkSafety", null);
__decorate([
    (0, common_1.Get)('safety-profile/:userId?'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "getSafetyProfile", null);
__decorate([
    (0, common_1.Post)('block/:userId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "blockUser", null);
__decorate([
    (0, common_1.Get)('my-reports'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "getMyReports", null);
exports.ModerationController = ModerationController = __decorate([
    (0, common_1.Controller)('community/moderation'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [moderation_service_1.ModerationService])
], ModerationController);
//# sourceMappingURL=moderation.controller.js.map