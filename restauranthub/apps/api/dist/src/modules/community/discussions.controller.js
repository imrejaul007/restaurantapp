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
exports.DiscussionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const discussions_service_1 = require("./discussions.service");
let DiscussionsController = class DiscussionsController {
    constructor(discussionsService) {
        this.discussionsService = discussionsService;
    }
    async getDiscussions(req, type, search, status, page, limit) {
        const discussions = await this.discussionsService.getAllDiscussions({
            type,
            search,
            status,
            userId: req.user.id,
        }, {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Discussions retrieved successfully',
            data: discussions,
        };
    }
    async getDiscussion(req, discussionId) {
        const discussion = await this.discussionsService.getDiscussionById(discussionId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Discussion retrieved successfully',
            data: discussion,
        };
    }
    async createDiscussion(req, title, description, type, participantIds, maxParticipants) {
        const discussion = await this.discussionsService.createDiscussion(req.user.id, {
            title,
            description,
            type: type || 'public',
            participantIds,
            maxParticipants,
        });
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Discussion created successfully',
            data: discussion,
        };
    }
    async updateDiscussion(req, discussionId, title, description, maxParticipants, isActive) {
        const discussion = await this.discussionsService.updateDiscussion(req.user.id, discussionId, {
            title,
            description,
            maxParticipants,
            isActive,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Discussion updated successfully',
            data: discussion,
        };
    }
    async deleteDiscussion(req, discussionId) {
        const result = await this.discussionsService.deleteDiscussion(req.user.id, discussionId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: result.message,
        };
    }
    async joinDiscussion(req, discussionId) {
        const participant = await this.discussionsService.joinDiscussion(req.user.id, discussionId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Joined discussion successfully',
            data: participant,
        };
    }
    async leaveDiscussion(req, discussionId) {
        const result = await this.discussionsService.leaveDiscussion(req.user.id, discussionId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: result.message,
        };
    }
    async sendMessage(req, discussionId, content, type, attachments) {
        const message = await this.discussionsService.sendMessage(req.user.id, discussionId, {
            content,
            type,
            attachments,
        });
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Message sent successfully',
            data: message,
        };
    }
    async getMessages(req, discussionId, page, limit, before) {
        const messages = await this.discussionsService.getMessages(discussionId, {
            before,
        }, {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Messages retrieved successfully',
            data: messages,
        };
    }
};
exports.DiscussionsController = DiscussionsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get discussions' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Discussions retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "getDiscussions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get discussion by ID' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Discussion retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "getDiscussion", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new discussion' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Discussion created successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('title')),
    __param(2, (0, common_1.Body)('description')),
    __param(3, (0, common_1.Body)('type')),
    __param(4, (0, common_1.Body)('participantIds')),
    __param(5, (0, common_1.Body)('maxParticipants')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Array, Number]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "createDiscussion", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update discussion' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Discussion updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('title')),
    __param(3, (0, common_1.Body)('description')),
    __param(4, (0, common_1.Body)('maxParticipants')),
    __param(5, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Number, Boolean]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "updateDiscussion", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete discussion' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Discussion deleted successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "deleteDiscussion", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    (0, swagger_1.ApiOperation)({ summary: 'Join discussion' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Joined discussion successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "joinDiscussion", null);
__decorate([
    (0, common_1.Delete)(':id/leave'),
    (0, swagger_1.ApiOperation)({ summary: 'Leave discussion' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Left discussion successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "leaveDiscussion", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Send message to discussion' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Message sent successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('content')),
    __param(3, (0, common_1.Body)('type')),
    __param(4, (0, common_1.Body)('attachments')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Array]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get discussion messages' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Messages retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('before')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], DiscussionsController.prototype, "getMessages", null);
exports.DiscussionsController = DiscussionsController = __decorate([
    (0, swagger_1.ApiTags)('discussions'),
    (0, common_1.Controller)('discussions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [discussions_service_1.DiscussionsService])
], DiscussionsController);
//# sourceMappingURL=discussions.controller.js.map