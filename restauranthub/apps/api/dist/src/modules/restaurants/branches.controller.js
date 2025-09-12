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
exports.BranchesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const branches_service_1 = require("./branches.service");
const create_branch_dto_1 = require("./dto/create-branch.dto");
const update_branch_dto_1 = require("./dto/update-branch.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let BranchesController = class BranchesController {
    constructor(branchesService) {
        this.branchesService = branchesService;
    }
    async create(restaurantId, req, createBranchDto) {
        return this.branchesService.create(restaurantId, req.user.id, createBranchDto);
    }
    async findAll(restaurantId) {
        return this.branchesService.findAll(restaurantId);
    }
    async findOne(id) {
        return this.branchesService.findOne(id);
    }
    async update(id, req, updateBranchDto) {
        return this.branchesService.update(id, req.user.id, req.user.role, updateBranchDto);
    }
    async deactivate(id, req) {
        return this.branchesService.deactivate(id, req.user.id, req.user.role);
    }
    async activate(id, req) {
        return this.branchesService.activate(id, req.user.id, req.user.role);
    }
    async getStats(id) {
        return this.branchesService.getBranchStats(id);
    }
};
exports.BranchesController = BranchesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create restaurant branch' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Branch created successfully' }),
    __param(0, (0, common_1.Param)('restaurantId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_branch_dto_1.CreateBranchDto]),
    __metadata("design:returntype", Promise)
], BranchesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all branches for restaurant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Branches retrieved successfully' }),
    __param(0, (0, common_1.Param)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BranchesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get branch by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Branch retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Branch not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BranchesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update branch' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Branch updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_branch_dto_1.UpdateBranchDto]),
    __metadata("design:returntype", Promise)
], BranchesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate branch' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Branch deactivated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BranchesController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate branch' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Branch activated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BranchesController.prototype, "activate", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get branch statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Branch stats retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BranchesController.prototype, "getStats", null);
exports.BranchesController = BranchesController = __decorate([
    (0, swagger_1.ApiTags)('branches'),
    (0, common_1.Controller)('restaurants/:restaurantId/branches'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.RESTAURANT, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [branches_service_1.BranchesService])
], BranchesController);
//# sourceMappingURL=branches.controller.js.map