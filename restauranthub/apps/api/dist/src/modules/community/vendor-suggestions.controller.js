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
exports.VendorSuggestionsController = void 0;
const common_1 = require("@nestjs/common");
const vendor_suggestions_service_1 = require("./vendor-suggestions.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let VendorSuggestionsController = class VendorSuggestionsController {
    constructor(vendorSuggestionsService) {
        this.vendorSuggestionsService = vendorSuggestionsService;
    }
    async suggestVendor(req, body) {
        return this.vendorSuggestionsService.suggestVendor(req.user.id, body.postId, body.vendorId, body.reason);
    }
    async suggestProduct(req, body) {
        return this.vendorSuggestionsService.suggestProduct(req.user.id, body.postId, body.productId, body.reason);
    }
    async getSuggestions(postId, page, limit) {
        return this.vendorSuggestionsService.getSuggestions(postId, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }
    async rateSuggestion(req, suggestionId, body) {
        return this.vendorSuggestionsService.rateSuggestion(req.user.id, suggestionId, 'vendor', body.rating);
    }
    async markBestSuggestion(req, suggestionId) {
        return this.vendorSuggestionsService.markBestSuggestion(req.user.id, suggestionId, 'vendor');
    }
};
exports.VendorSuggestionsController = VendorSuggestionsController;
__decorate([
    (0, common_1.Post)('vendor'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VendorSuggestionsController.prototype, "suggestVendor", null);
__decorate([
    (0, common_1.Post)('product'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VendorSuggestionsController.prototype, "suggestProduct", null);
__decorate([
    (0, common_1.Get)('post/:postId'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], VendorSuggestionsController.prototype, "getSuggestions", null);
__decorate([
    (0, common_1.Post)('rate/:suggestionId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('suggestionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], VendorSuggestionsController.prototype, "rateSuggestion", null);
__decorate([
    (0, common_1.Post)('mark-best/:suggestionId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('suggestionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VendorSuggestionsController.prototype, "markBestSuggestion", null);
exports.VendorSuggestionsController = VendorSuggestionsController = __decorate([
    (0, common_1.Controller)('community/suggestions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [vendor_suggestions_service_1.VendorSuggestionsService])
], VendorSuggestionsController);
//# sourceMappingURL=vendor-suggestions.controller.js.map