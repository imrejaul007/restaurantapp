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
exports.FrontendIntegrationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const frontend_integration_service_1 = require("./frontend-integration.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let FrontendIntegrationController = class FrontendIntegrationController {
    constructor(frontendIntegrationService) {
        this.frontendIntegrationService = frontendIntegrationService;
    }
    getApiDocumentation() {
        return this.frontendIntegrationService.formatResponse(this.frontendIntegrationService.getApiDocumentation(), 'API documentation retrieved successfully');
    }
    getFormFieldMappings() {
        return this.frontendIntegrationService.formatResponse(this.frontendIntegrationService.getFormFieldMappings(), 'Form mappings retrieved successfully');
    }
    getErrorCodeMappings() {
        return this.frontendIntegrationService.formatResponse(this.frontendIntegrationService.getErrorCodeMappings(), 'Error codes retrieved successfully');
    }
    getIntegrationChecklist() {
        return this.frontendIntegrationService.formatResponse(this.frontendIntegrationService.getFrontendIntegrationChecklist(), 'Integration checklist retrieved successfully');
    }
    getTypeScriptInterfaces() {
        return this.frontendIntegrationService.formatResponse({
            interfaces: this.frontendIntegrationService.generateTypeScriptInterfaces(),
            usage: 'Copy these interfaces to your frontend TypeScript project',
        }, 'TypeScript interfaces generated successfully');
    }
};
exports.FrontendIntegrationController = FrontendIntegrationController;
__decorate([
    (0, common_1.Get)('api-docs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get comprehensive API documentation for frontend integration' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FrontendIntegrationController.prototype, "getApiDocumentation", null);
__decorate([
    (0, common_1.Get)('form-mappings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get form field mappings for frontend forms' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FrontendIntegrationController.prototype, "getFormFieldMappings", null);
__decorate([
    (0, common_1.Get)('error-codes'),
    (0, swagger_1.ApiOperation)({ summary: 'Get comprehensive error code mappings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FrontendIntegrationController.prototype, "getErrorCodeMappings", null);
__decorate([
    (0, common_1.Get)('checklist'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get frontend integration checklist (Admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FrontendIntegrationController.prototype, "getIntegrationChecklist", null);
__decorate([
    (0, common_1.Get)('typescript-interfaces'),
    (0, swagger_1.ApiOperation)({ summary: 'Get TypeScript interfaces for frontend development' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FrontendIntegrationController.prototype, "getTypeScriptInterfaces", null);
exports.FrontendIntegrationController = FrontendIntegrationController = __decorate([
    (0, swagger_1.ApiTags)('frontend-integration'),
    (0, common_1.Controller)('community/integration'),
    __metadata("design:paramtypes", [frontend_integration_service_1.FrontendIntegrationService])
], FrontendIntegrationController);
//# sourceMappingURL=frontend-integration.controller.js.map