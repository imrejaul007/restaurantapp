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
exports.ForumController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const forum_service_1 = require("./forum.service");
const client_1 = require("@prisma/client");
const create_forum_dto_1 = require("./dto/create-forum.dto");
let ForumController = class ForumController {
    constructor(forumService) {
        this.forumService = forumService;
    }
    async getForums(category, search, page, limit) {
        const forums = await this.forumService.getForums();
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Forums retrieved successfully',
            data: forums,
        };
    }
    async getForum(req, forumId) {
        const forum = await this.forumService.getForum(forumId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Forum retrieved successfully',
            data: forum,
        };
    }
    async createForum(req, createForumDto) {
        const forum = await this.forumService.createForum(req.user.id, createForumDto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Forum created successfully',
            data: forum,
        };
    }
    async updateForum(req, forumId, updateForumDto) {
        const forum = await this.forumService.updateForum(req.user.id, forumId, updateForumDto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Forum updated successfully',
            data: forum,
        };
    }
    async deleteForum(req, forumId) {
        const result = await this.forumService.deleteForum(req.user.id, forumId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: result.message,
        };
    }
    async joinForum(req, forumId) {
        const membership = await this.forumService.joinForum(req.user.id, forumId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Joined forum successfully',
            data: membership,
        };
    }
    async leaveForum(req, forumId) {
        const result = await this.forumService.leaveForum(req.user.id, forumId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: result.message,
        };
    }
    async getForumMembers(forumId, page, limit) {
        const members = await this.forumService.getForumMembers(forumId, {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Forum members retrieved successfully',
            data: members,
        };
    }
    async addModerator(req, forumId, userId, permissions) {
        const moderator = await this.forumService.addModerator(req.user.id, forumId, userId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Moderator added successfully',
            data: moderator,
        };
    }
    async removeModerator(req, forumId, userId) {
        const result = await this.forumService.removeModerator(req.user.id, forumId, userId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: result.message,
        };
    }
};
exports.ForumController = ForumController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all forums' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Forums retrieved successfully' }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "getForums", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get forum by ID' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Forum retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "getForum", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Create new forum' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Forum created successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_forum_dto_1.CreateForumDto]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "createForum", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Update forum' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Forum updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_forum_dto_1.UpdateForumDto]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "updateForum", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete forum' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Forum deleted successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "deleteForum", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    (0, swagger_1.ApiOperation)({ summary: 'Join forum' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Joined forum successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "joinForum", null);
__decorate([
    (0, common_1.Delete)(':id/leave'),
    (0, swagger_1.ApiOperation)({ summary: 'Leave forum' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Left forum successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "leaveForum", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Get forum members' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Forum members retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "getForumMembers", null);
__decorate([
    (0, common_1.Post)(':id/moderators'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Add forum moderator' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Moderator added successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('userId')),
    __param(3, (0, common_1.Body)('permissions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Array]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "addModerator", null);
__decorate([
    (0, common_1.Delete)(':id/moderators/:userId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove forum moderator' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Moderator removed successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "removeModerator", null);
exports.ForumController = ForumController = __decorate([
    (0, swagger_1.ApiTags)('forums'),
    (0, common_1.Controller)('forums'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [forum_service_1.ForumService])
], ForumController);
//# sourceMappingURL=forum.controller.js.map