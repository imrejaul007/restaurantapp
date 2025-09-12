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
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const posts_service_1 = require("./posts.service");
const rate_limit_decorator_1 = require("./decorators/rate-limit.decorator");
const cache_decorator_1 = require("./decorators/cache.decorator");
const validation_pipe_1 = require("./pipes/validation.pipe");
const common_2 = require("@nestjs/common");
const performance_interceptor_1 = require("./interceptors/performance.interceptor");
const create_post_dto_1 = require("./dto/create-post.dto");
let PostsController = class PostsController {
    constructor(postsService) {
        this.postsService = postsService;
    }
    async getPosts(forumId, userId, search, tags, sortBy, page, limit) {
        const posts = await this.postsService.getPosts({
            forumId,
            userId,
            search,
            tags: tags ? tags.split(',') : undefined,
            sortBy,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Posts retrieved successfully',
            data: posts,
        };
    }
    async getPost(req, postId) {
        const post = await this.postsService.getPost(postId, req.user?.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Post retrieved successfully',
            data: post,
        };
    }
    async createPost(req, createPostDto) {
        const post = await this.postsService.createPost(req.user.id, createPostDto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Post created successfully',
            data: post,
        };
    }
    async updatePost(req, postId, updatePostDto) {
        const post = await this.postsService.updatePost(req.user.id, postId, updatePostDto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Post updated successfully',
            data: post,
        };
    }
    async deletePost(req, postId) {
        const result = await this.postsService.deletePost(req.user.id, postId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: result.message,
        };
    }
    async likePost(req, postId) {
        const like = await this.postsService.likePost(req.user.id, postId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Post liked successfully',
            data: like,
        };
    }
    async unlikePost(req, postId) {
        const result = await this.postsService.unlikePost(req.user.id, postId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: result.message,
        };
    }
    async bookmarkPost(req, postId) {
        const bookmark = await this.postsService.bookmarkPost(req.user.id, postId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Post bookmarked successfully',
            data: bookmark,
        };
    }
    async unbookmarkPost(req, postId) {
        const result = await this.postsService.unbookmarkPost(req.user.id, postId);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: result.message,
        };
    }
    async sharePost(req, postId, platform) {
        const share = await this.postsService.sharePost(req.user.id, postId, platform);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Post shared successfully',
            data: share,
        };
    }
    async reportPost(req, postId, reportPostDto) {
        const report = await this.postsService.reportPost(req.user.id, postId, reportPostDto.reason, reportPostDto.description);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Post reported successfully',
            data: report,
        };
    }
    async createReply(req, postId, createReplyDto) {
        const reply = await this.postsService.createReply(req.user.id, postId, createReplyDto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Reply created successfully',
            data: reply,
        };
    }
    async getReplies(postId, page, limit) {
        const replies = await this.postsService.getReplies(postId, {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Replies retrieved successfully',
            data: replies,
        };
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, common_1.Get)(),
    (0, cache_decorator_1.CachePostsList)(300),
    (0, swagger_1.ApiOperation)({ summary: 'Get posts' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Posts retrieved successfully' }),
    __param(0, (0, common_1.Query)('forumId')),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('tags')),
    __param(4, (0, common_1.Query)('sortBy')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getPosts", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get post by ID' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Post retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getPost", null);
__decorate([
    (0, common_1.Post)(),
    (0, rate_limit_decorator_1.PostCreationLimit)(),
    (0, common_2.UsePipes)(validation_pipe_1.PostValidationPipe),
    (0, swagger_1.ApiOperation)({ summary: 'Create new post' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Post created successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_post_dto_1.CreatePostDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "createPost", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT, client_1.UserRole.VENDOR, client_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Update post' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Post updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_post_dto_1.UpdatePostDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "updatePost", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT, client_1.UserRole.VENDOR, client_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Delete post' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Post deleted successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "deletePost", null);
__decorate([
    (0, common_1.Post)(':id/like'),
    (0, rate_limit_decorator_1.LikeActionLimit)(),
    (0, swagger_1.ApiOperation)({ summary: 'Like post' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Post liked successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "likePost", null);
__decorate([
    (0, common_1.Delete)(':id/like'),
    (0, rate_limit_decorator_1.LikeActionLimit)(),
    (0, swagger_1.ApiOperation)({ summary: 'Unlike post' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Post unliked successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "unlikePost", null);
__decorate([
    (0, common_1.Post)(':id/bookmark'),
    (0, swagger_1.ApiOperation)({ summary: 'Bookmark post' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Post bookmarked successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "bookmarkPost", null);
__decorate([
    (0, common_1.Delete)(':id/bookmark'),
    (0, swagger_1.ApiOperation)({ summary: 'Unbookmark post' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Post unbookmarked successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "unbookmarkPost", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, swagger_1.ApiOperation)({ summary: 'Share post' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Post shared successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "sharePost", null);
__decorate([
    (0, common_1.Post)(':id/report'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT, client_1.UserRole.VENDOR, client_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Report post' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Post reported successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_post_dto_1.ReportPostDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "reportPost", null);
__decorate([
    (0, common_1.Post)(':id/replies'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.RESTAURANT, client_1.UserRole.VENDOR, client_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Create reply to post' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Reply created successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_post_dto_1.CreateReplyDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "createReply", null);
__decorate([
    (0, common_1.Get)(':id/replies'),
    (0, swagger_1.ApiOperation)({ summary: 'Get post replies' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Replies retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getReplies", null);
exports.PostsController = PostsController = __decorate([
    (0, swagger_1.ApiTags)('posts'),
    (0, common_1.Controller)('posts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_2.UseInterceptors)(performance_interceptor_1.PerformanceInterceptor),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsController);
//# sourceMappingURL=posts.controller.js.map