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
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let BranchesService = class BranchesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(restaurantId, userId, createBranchDto) {
        const restaurant = await this.prisma.restaurant.findFirst({
            where: { id: restaurantId, userId },
        });
        if (!restaurant) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const branch = {
            id: restaurant.id,
            name: createBranchDto.name || restaurant.businessName || restaurant.name,
            address: 'N/A',
            city: 'N/A',
            state: 'N/A',
            zipCode: 'N/A',
            phone: 'N/A',
            email: 'N/A',
            isActive: restaurant.isActive,
            restaurantId: restaurant.id,
            restaurant,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return branch;
    }
    async findAll(restaurantId) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                user: true,
            },
        });
        if (!restaurant) {
            return [];
        }
        const branch = {
            id: restaurant.id,
            name: restaurant.businessName || restaurant.name,
            address: 'N/A',
            city: 'N/A',
            state: 'N/A',
            zipCode: 'N/A',
            phone: 'N/A',
            email: 'N/A',
            isActive: restaurant.isActive,
            restaurantId: restaurant.id,
            restaurant,
            employees: [],
            _count: { employees: 0 },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return [branch];
    }
    async findOne(id) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException('Branch not found');
        }
        const branch = {
            id: restaurant.id,
            name: restaurant.businessName || restaurant.name,
            address: 'N/A',
            city: 'N/A',
            state: 'N/A',
            zipCode: 'N/A',
            phone: 'N/A',
            email: 'N/A',
            isActive: restaurant.isActive,
            restaurantId: restaurant.id,
            restaurant,
            employees: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return branch;
    }
    async update(id, userId, userRole, updateBranchDto) {
        const branch = await this.findOne(id);
        if (userRole !== client_1.UserRole.ADMIN && branch.restaurant.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const updatedRestaurant = await this.prisma.restaurant.update({
            where: { id },
            data: {
                name: updateBranchDto.name || branch.name,
            },
            include: {
                user: true,
            },
        });
        return {
            ...branch,
            name: updatedRestaurant.businessName || updatedRestaurant.name,
            address: 'N/A',
            city: 'N/A',
            state: 'N/A',
            zipCode: 'N/A',
            phone: 'N/A',
            email: 'N/A',
            restaurant: updatedRestaurant,
            updatedAt: new Date(),
        };
    }
    async deactivate(id, userId, userRole) {
        const branch = await this.findOne(id);
        if (userRole !== client_1.UserRole.ADMIN && branch.restaurant.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        await this.prisma.restaurant.update({
            where: { id },
            data: { isActive: false },
        });
        return { message: 'Branch deactivated successfully' };
    }
    async activate(id, userId, userRole) {
        const branch = await this.findOne(id);
        if (userRole !== client_1.UserRole.ADMIN && branch.restaurant.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        await this.prisma.restaurant.update({
            where: { id },
            data: { isActive: true },
        });
        return { message: 'Branch activated successfully' };
    }
    async getBranchStats(id) {
        return {
            employeeCount: 0,
            totalSalary: 0,
            activeEmployees: [],
        };
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BranchesService);
//# sourceMappingURL=branches.service.js.map