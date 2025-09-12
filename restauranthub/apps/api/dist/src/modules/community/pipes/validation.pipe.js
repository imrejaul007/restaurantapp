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
exports.SearchValidationPipe = exports.CommentValidationPipe = exports.PostValidationPipe = exports.CommunityValidationPipe = void 0;
const common_1 = require("@nestjs/common");
const security_performance_service_1 = require("../security-performance.service");
let CommunityValidationPipe = class CommunityValidationPipe {
    constructor(securityPerformanceService) {
        this.securityPerformanceService = securityPerformanceService;
    }
    async transform(value, metadata) {
        if (!value || typeof value !== 'object') {
            return value;
        }
        switch (metadata.metatype?.name) {
            case 'CreatePostDto':
                return this.validateCreatePost(value);
            case 'CreateCommentDto':
                return this.validateCreateComment(value);
            case 'SearchDto':
                return this.validateSearch(value);
            default:
                return value;
        }
    }
    validateCreatePost(value) {
        return this.securityPerformanceService.validateAndSanitizePostInput({
            title: value.title,
            content: value.content,
            tags: value.tags,
        });
    }
    validateCreateComment(value) {
        return {
            ...value,
            content: this.securityPerformanceService.validateAndSanitizeCommentInput(value.content),
        };
    }
    validateSearch(value) {
        return {
            ...value,
            query: value.query ? this.securityPerformanceService.validateAndSanitizeSearchInput(value.query) : value.query,
        };
    }
};
exports.CommunityValidationPipe = CommunityValidationPipe;
exports.CommunityValidationPipe = CommunityValidationPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [security_performance_service_1.SecurityPerformanceService])
], CommunityValidationPipe);
let PostValidationPipe = class PostValidationPipe {
    constructor(securityPerformanceService) {
        this.securityPerformanceService = securityPerformanceService;
    }
    transform(value, metadata) {
        if (metadata.type !== 'body') {
            return value;
        }
        return this.securityPerformanceService.validateAndSanitizePostInput({
            title: value.title,
            content: value.content,
            tags: value.tags,
        });
    }
};
exports.PostValidationPipe = PostValidationPipe;
exports.PostValidationPipe = PostValidationPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [security_performance_service_1.SecurityPerformanceService])
], PostValidationPipe);
let CommentValidationPipe = class CommentValidationPipe {
    constructor(securityPerformanceService) {
        this.securityPerformanceService = securityPerformanceService;
    }
    transform(value, metadata) {
        if (metadata.type !== 'body' || !value.content) {
            return value;
        }
        return {
            ...value,
            content: this.securityPerformanceService.validateAndSanitizeCommentInput(value.content),
        };
    }
};
exports.CommentValidationPipe = CommentValidationPipe;
exports.CommentValidationPipe = CommentValidationPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [security_performance_service_1.SecurityPerformanceService])
], CommentValidationPipe);
let SearchValidationPipe = class SearchValidationPipe {
    constructor(securityPerformanceService) {
        this.securityPerformanceService = securityPerformanceService;
    }
    transform(value, metadata) {
        if (metadata.type !== 'query' || !value.query) {
            return value;
        }
        return {
            ...value,
            query: this.securityPerformanceService.validateAndSanitizeSearchInput(value.query),
        };
    }
};
exports.SearchValidationPipe = SearchValidationPipe;
exports.SearchValidationPipe = SearchValidationPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [security_performance_service_1.SecurityPerformanceService])
], SearchValidationPipe);
//# sourceMappingURL=validation.pipe.js.map