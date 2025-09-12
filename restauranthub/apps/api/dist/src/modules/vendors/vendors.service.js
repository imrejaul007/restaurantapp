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
exports.VendorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let VendorsService = class VendorsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createVendorDto) {
        const vendor = await this.prisma.vendor.create({
            data: {
                ...createVendorDto,
                companyName: createVendorDto.businessName,
                userId,
            },
            include: {
                user: {
                    include: {
                        restaurant: true,
                        employee: true,
                        vendor: true,
                    },
                },
            },
        });
        return vendor;
    }
    async findAll(page = 1, limit = 20, filters) {
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (filters?.verificationStatus) {
            where.verificationStatus = filters.verificationStatus;
        }
        if (filters?.businessType) {
            where.businessType = {
                contains: filters.businessType,
                mode: 'insensitive',
            };
        }
        const [vendors, total] = await Promise.all([
            this.prisma.vendor.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        include: {
                            restaurant: true,
                            employee: true,
                            vendor: true,
                        },
                    },
                    _count: {
                        select: {
                            products: true,
                            orders: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.vendor.count({ where }),
        ]);
        return {
            data: vendors,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const vendor = await this.prisma.vendor.findUnique({
            where: { id },
            include: {
                user: {
                    include: {
                        restaurant: true,
                        employee: true,
                        vendor: true,
                    },
                },
                products: {
                    where: { isActive: true },
                    take: 10,
                },
                _count: {
                    select: {
                        products: true,
                        orders: true,
                    },
                },
            },
        });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor not found');
        }
        return vendor;
    }
    async update(id, userId, userRole, updateVendorDto) {
        const vendor = await this.findOne(id);
        if (userRole !== client_1.UserRole.ADMIN && vendor.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const updatedVendor = await this.prisma.vendor.update({
            where: { id },
            data: updateVendorDto,
            include: {
                user: {
                    include: {
                        restaurant: true,
                        employee: true,
                        vendor: true,
                    },
                },
            },
        });
        return updatedVendor;
    }
    async getDashboard(vendorId, userId) {
        const vendor = await this.findOne(vendorId);
        if (vendor.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const [productCount, activeProductCount, totalOrdersCount, pendingOrdersCount, totalRevenue, recentOrders, topProducts,] = await Promise.all([
            this.prisma.product.count({ where: { vendorId } }),
            this.prisma.product.count({ where: { vendorId, isActive: true } }),
            this.prisma.order.count({ where: { vendorId } }),
            this.prisma.order.count({ where: { vendorId, status: 'PENDING' } }),
            this.prisma.order.aggregate({
                where: { vendorId, status: 'DELIVERED' },
                _sum: { total: true },
            }),
            this.prisma.order.findMany({
                where: { vendorId },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    restaurant: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            }),
            this.prisma.$queryRaw `
        SELECT p.name, p.id, SUM(oi.quantity) as total_sold, SUM(oi.total_amount) as revenue
        FROM "Product" p
        JOIN "OrderItem" oi ON p.id = oi.product_id
        JOIN "Order" o ON oi.order_id = o.id
        WHERE p.vendor_id = ${vendorId}
        GROUP BY p.id, p.name
        ORDER BY total_sold DESC
        LIMIT 5
      `,
        ]);
        return {
            stats: {
                products: productCount,
                activeProducts: activeProductCount,
                totalOrders: totalOrdersCount,
                pendingOrders: pendingOrdersCount,
                totalRevenue: totalRevenue._sum?.total || 0,
            },
            recentOrders,
            topProducts,
        };
    }
    async verifyVendor(id, status, notes) {
        await this.createAuditLog('Vendor', 'UPDATE', id, { status, notes });
        return { id, verificationStatus: status };
    }
    async remove(userId, id) {
        const vendor = await this.prisma.vendor.findFirst({
            where: { id, userId },
        });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor not found');
        }
        await this.prisma.vendor.delete({
            where: { id },
        });
        return { message: 'Vendor removed successfully' };
    }
    async getAnalytics(userId, id) {
        const vendor = await this.prisma.vendor.findFirst({
            where: { id, userId },
        });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor not found');
        }
        return this.getAnalytics(vendor.userId, id);
    }
    async verify(userId, id) {
        return this.verifyVendor(id, client_1.VerificationStatus.VERIFIED);
    }
    async suspend(userId, id) {
        const vendor = await this.prisma.vendor.findFirst({
            where: { id, userId },
        });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor not found');
        }
        const updatedVendor = await this.prisma.vendor.update({
            where: { id },
            data: { verificationStatus: 'REJECTED' },
        });
        await this.createAuditLog('Vendor', 'UPDATE', id, { suspended: true });
        return updatedVendor;
    }
    async createAuditLog(entity, action, entityId, data) {
        await this.prisma.auditLog.create({
            data: {
                entity,
                resource: entity,
                action,
                entityId,
                newData: data,
            },
        });
    }
};
exports.VendorsService = VendorsService;
exports.VendorsService = VendorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VendorsService);
//# sourceMappingURL=vendors.service.js.map