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
exports.VendorsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const vendors_service_1 = require("./vendors.service");
const client_1 = require("@prisma/client");
let VendorsController = class VendorsController {
    constructor(vendorsService) {
        this.vendorsService = vendorsService;
    }
    async create(req, createVendorDto) {
        const vendor = await this.vendorsService.create(req.user.id, createVendorDto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Vendor profile created successfully',
            data: vendor,
        };
    }
    async findAll(page, limit, businessType, verificationStatus) {
        const result = await this.vendorsService.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, {
            businessType,
            verificationStatus,
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Vendors retrieved successfully',
            data: result,
        };
    }
    async findOne(id) {
        const vendor = await this.vendorsService.findOne(id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Vendor retrieved successfully',
            data: vendor,
        };
    }
    async update(req, id, updateVendorDto) {
        const vendor = await this.vendorsService.update(id, req.user.id, req.user.role, updateVendorDto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Vendor profile updated successfully',
            data: vendor,
        };
    }
    async remove(req, id) {
        await this.vendorsService.remove(req.user.id, id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Vendor profile deleted successfully',
        };
    }
    async getAnalytics(req, id) {
        const analytics = await this.vendorsService.getAnalytics(req.user.id, id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Vendor analytics retrieved successfully',
            data: analytics,
        };
    }
    async verify(req, id) {
        const vendor = await this.vendorsService.verify(req.user.id, id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Vendor profile verified successfully',
            data: vendor,
        };
    }
    async suspend(req, id) {
        const vendor = await this.vendorsService.suspend(req.user.id, id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Vendor profile suspended successfully',
            data: vendor,
        };
    }
};
exports.VendorsController = VendorsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.VENDOR),
    (0, swagger_1.ApiOperation)({ summary: 'Create vendor profile' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Vendor profile created successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VendorsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all vendors' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Vendors retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('businessType')),
    __param(3, (0, common_1.Query)('verificationStatus')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], VendorsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get vendor by ID' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Vendor retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VendorsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.VENDOR, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update vendor profile' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Vendor profile updated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], VendorsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.VENDOR, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete vendor profile' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Vendor profile deleted successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VendorsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/analytics'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.VENDOR),
    (0, swagger_1.ApiOperation)({ summary: 'Get vendor analytics' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Vendor analytics retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VendorsController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Put)(':id/verify'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Verify vendor profile' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Vendor profile verified successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VendorsController.prototype, "verify", null);
__decorate([
    (0, common_1.Put)(':id/suspend'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Suspend vendor profile' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Vendor profile suspended successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VendorsController.prototype, "suspend", null);
exports.VendorsController = VendorsController = __decorate([
    (0, swagger_1.ApiTags)('vendors'),
    (0, common_1.Controller)('vendors'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [vendors_service_1.VendorsService])
], VendorsController);
//# sourceMappingURL=vendors.controller.js.map