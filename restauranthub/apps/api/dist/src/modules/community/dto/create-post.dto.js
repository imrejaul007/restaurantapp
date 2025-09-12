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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportPostDto = exports.CreateReplyDto = exports.UpdatePostDto = exports.CreatePostDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreatePostDto {
}
exports.CreatePostDto = CreatePostDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Best practices for inventory management' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreatePostDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'I wanted to share some insights on inventory management...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreatePostDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'forum-uuid-123' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "forumId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.PostType, example: client_1.PostType.DISCUSSION }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PostType),
    __metadata("design:type", String)
], CreatePostDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.PostVisibility, example: client_1.PostVisibility.PUBLIC }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PostVisibility),
    __metadata("design:type", String)
], CreatePostDto.prototype, "visibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['inventory', 'management', 'tips'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMaxSize)(10),
    __metadata("design:type", Array)
], CreatePostDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePostDto.prototype, "isPinned", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['attachment-url-1', 'attachment-url-2'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMaxSize)(5),
    __metadata("design:type", Array)
], CreatePostDto.prototype, "attachments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['image-url-1', 'image-url-2'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMaxSize)(5),
    __metadata("design:type", Array)
], CreatePostDto.prototype, "images", void 0);
class UpdatePostDto {
}
exports.UpdatePostDto = UpdatePostDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Updated post title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdatePostDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Updated post content' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], UpdatePostDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['updated', 'tags'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMaxSize)(10),
    __metadata("design:type", Array)
], UpdatePostDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['updated-attachment'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdatePostDto.prototype, "attachments", void 0);
class CreateReplyDto {
}
exports.CreateReplyDto = CreateReplyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Great insights! I would also add...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateReplyDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'parent-comment-uuid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReplyDto.prototype, "parentId", void 0);
class ReportPostDto {
}
exports.ReportPostDto = ReportPostDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'spam' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], ReportPostDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'This post contains promotional content that violates forum rules' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ReportPostDto.prototype, "description", void 0);
//# sourceMappingURL=create-post.dto.js.map