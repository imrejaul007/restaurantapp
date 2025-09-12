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
exports.LegalController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../common/decorators/public.decorator");
const legal_service_1 = require("./legal.service");
let LegalController = class LegalController {
    constructor(legalService) {
        this.legalService = legalService;
    }
    getAllLegalDocuments() {
        return this.legalService.getAllLegalDocuments();
    }
    getTermsOfService() {
        return this.legalService.getTermsOfService();
    }
    getPrivacyPolicy() {
        return this.legalService.getPrivacyPolicy();
    }
    getCookiePolicy() {
        return this.legalService.getCookiePolicy();
    }
    getDataProcessingAgreement() {
        return this.legalService.getDataProcessingAgreement();
    }
    getLegalDocument(documentId) {
        switch (documentId) {
            case 'terms-of-service':
                return this.legalService.getTermsOfService();
            case 'privacy-policy':
                return this.legalService.getPrivacyPolicy();
            case 'cookie-policy':
                return this.legalService.getCookiePolicy();
            case 'data-processing-agreement':
                return this.legalService.getDataProcessingAgreement();
            default:
                throw new common_1.NotFoundException('Legal document not found');
        }
    }
};
exports.LegalController = LegalController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available legal documents' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Legal documents list retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LegalController.prototype, "getAllLegalDocuments", null);
__decorate([
    (0, common_1.Get)('terms-of-service'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Terms of Service' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Terms of Service retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LegalController.prototype, "getTermsOfService", null);
__decorate([
    (0, common_1.Get)('privacy-policy'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Privacy Policy' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Privacy Policy retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LegalController.prototype, "getPrivacyPolicy", null);
__decorate([
    (0, common_1.Get)('cookie-policy'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Cookie Policy' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cookie Policy retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LegalController.prototype, "getCookiePolicy", null);
__decorate([
    (0, common_1.Get)('data-processing-agreement'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Data Processing Agreement' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Data Processing Agreement retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LegalController.prototype, "getDataProcessingAgreement", null);
__decorate([
    (0, common_1.Get)(':documentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific legal document by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Legal document retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Legal document not found' }),
    (0, swagger_1.ApiParam)({
        name: 'documentId',
        description: 'Legal document identifier',
        enum: ['terms-of-service', 'privacy-policy', 'cookie-policy', 'data-processing-agreement']
    }),
    __param(0, (0, common_1.Param)('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LegalController.prototype, "getLegalDocument", null);
exports.LegalController = LegalController = __decorate([
    (0, swagger_1.ApiTags)('legal'),
    (0, common_1.Controller)('legal'),
    (0, public_decorator_1.Public)(),
    __metadata("design:paramtypes", [legal_service_1.LegalService])
], LegalController);
//# sourceMappingURL=legal.controller.js.map