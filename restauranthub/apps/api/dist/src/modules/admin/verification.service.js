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
exports.VerificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let VerificationService = class VerificationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async verifyRestaurant(restaurantId) {
        try {
            await this.prisma.restaurant.update({
                where: { id: restaurantId },
                data: {
                    verificationStatus: 'VERIFIED',
                    verifiedAt: new Date()
                }
            });
            return { success: true, message: 'Restaurant verified successfully' };
        }
        catch (error) {
            return { success: false, message: 'Failed to verify restaurant' };
        }
    }
    async verifyVendor(vendorId) {
        try {
            await this.prisma.vendor.update({
                where: { id: vendorId },
                data: {
                    verificationStatus: 'VERIFIED',
                    verifiedAt: new Date()
                }
            });
            return { success: true, message: 'Vendor verified successfully' };
        }
        catch (error) {
            return { success: false, message: 'Failed to verify vendor' };
        }
    }
    async getPendingVerifications() {
        const pendingRestaurants = await this.prisma.restaurant.findMany({
            where: { verificationStatus: 'PENDING' },
            include: { user: true }
        });
        const pendingVendors = await this.prisma.vendor.findMany({
            where: { verificationStatus: 'PENDING' },
            include: { user: true }
        });
        return {
            restaurants: pendingRestaurants,
            vendors: pendingVendors
        };
    }
};
exports.VerificationService = VerificationService;
exports.VerificationService = VerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VerificationService);
//# sourceMappingURL=verification.service.js.map