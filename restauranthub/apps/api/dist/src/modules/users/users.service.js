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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                restaurant: true,
                employee: true,
                vendor: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.sanitizeUser(user);
    }
    async findByEmail(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                restaurant: true,
                employee: true,
                vendor: true,
            },
        });
        return user ? this.sanitizeUser(user) : null;
    }
    async updateProfile(userId, updateUserDto) {
        const { firstName, lastName, avatar, address, city, state, country, pincode, dateOfBirth } = updateUserDto;
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
            },
            include: {
                restaurant: true,
                employee: true,
                vendor: true,
                profile: true,
            },
        });
        if (dateOfBirth || address || city || state || country || pincode || avatar) {
            await this.prisma.profile.upsert({
                where: { userId },
                create: {
                    userId,
                    firstName: firstName || updatedUser.firstName || '',
                    lastName: lastName || updatedUser.lastName || '',
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                    avatar,
                    address,
                    city,
                    state,
                    country,
                    pincode,
                },
                update: {
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                    avatar,
                    address,
                    city,
                    state,
                    country,
                    pincode,
                },
            });
        }
        return this.sanitizeUser(updatedUser);
    }
    async updateUser(id, updateData) {
        const user = await this.prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                restaurant: true,
                employee: true,
                vendor: true,
            },
        });
        return this.sanitizeUser(user);
    }
    async deactivateUser(id) {
        await this.prisma.user.update({
            where: { id },
            data: {
                status: 'SUSPENDED',
            },
        });
        return { message: 'User deactivated successfully' };
    }
    async activateUser(id) {
        await this.prisma.user.update({
            where: { id },
            data: {
                status: 'ACTIVE',
            },
        });
        return { message: 'User activated successfully' };
    }
    async verifyEmail(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                emailVerifiedAt: new Date(),
            },
        });
        return { message: 'Email verified successfully' };
    }
    async getUserStats(userId) {
        const user = await this.findById(userId);
        let stats = {};
        switch (user.role) {
            case 'RESTAURANT':
                stats = await this.getRestaurantStats(user.restaurant.id);
                break;
            case 'VENDOR':
                stats = await this.getVendorStats(user.vendor.id);
                break;
            case 'EMPLOYEE':
                stats = await this.getEmployeeStats(user.employee.id);
                break;
        }
        return stats;
    }
    async getRestaurantStats(restaurantId) {
        const [employeeCount, jobCount, orderCount] = await Promise.all([
            this.prisma.employee.count({ where: { restaurantId } }),
            this.prisma.job.count({ where: { restaurantId } }),
            this.prisma.order.count({ where: { restaurantId } }),
        ]);
        return {
            employees: employeeCount,
            jobs: jobCount,
            orders: orderCount,
        };
    }
    async getVendorStats(vendorId) {
        const [productCount, orderCount] = await Promise.all([
            this.prisma.product.count({ where: { vendorId } }),
            this.prisma.order.count({ where: { vendorId } }),
        ]);
        return {
            products: productCount,
            orders: orderCount,
        };
    }
    async getEmployeeStats(employeeId) {
        const [applicationCount, attendanceCount] = await Promise.all([
            this.prisma.jobApplication.count({ where: { employeeId: employeeId } }),
            Promise.resolve(0),
        ]);
        return {
            applications: applicationCount,
            attendance: attendanceCount,
        };
    }
    sanitizeUser(user) {
        const { passwordHash, refreshToken, twoFactorSecret, ...sanitized } = user;
        return sanitized;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map