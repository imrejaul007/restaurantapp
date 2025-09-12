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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBusinessMetrics() {
        try {
            const [totalUsers, totalOrders, totalRevenue] = await Promise.all([
                this.prisma.user.count(),
                this.prisma.order.count(),
                this.prisma.order.aggregate({
                    _sum: { total: true }
                })
            ]);
            return {
                totalUsers,
                totalOrders,
                totalRevenue: totalRevenue._sum?.total || 0,
                totalRestaurants: await this.prisma.restaurant.count(),
                totalVendors: await this.prisma.vendor.count(),
                activeOrders: await this.prisma.order.count({
                    where: {
                        status: { not: 'DELIVERED' }
                    }
                })
            };
        }
        catch (error) {
            console.error('Error fetching business metrics:', error);
            return {
                totalUsers: 0,
                totalOrders: 0,
                totalRevenue: 0,
                totalRestaurants: 0,
                totalVendors: 0,
                activeOrders: 0
            };
        }
    }
    async getUserGrowth(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        try {
            const userGrowth = await this.prisma.user.groupBy({
                by: ['createdAt'],
                where: {
                    createdAt: {
                        gte: startDate
                    }
                },
                _count: true
            });
            return userGrowth.map((item) => ({
                date: item.createdAt,
                count: item._count
            }));
        }
        catch (error) {
            console.error('Error fetching user growth:', error);
            return [];
        }
    }
    async getOrderAnalytics() {
        try {
            const [totalOrders, completedOrders, cancelledOrders] = await Promise.all([
                this.prisma.order.count(),
                this.prisma.order.count({ where: { status: 'DELIVERED' } }),
                this.prisma.order.count({ where: { status: 'CANCELLED' } })
            ]);
            const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
            const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
            return {
                totalOrders,
                completedOrders,
                cancelledOrders,
                completionRate,
                cancellationRate
            };
        }
        catch (error) {
            console.error('Error fetching order analytics:', error);
            return {
                totalOrders: 0,
                completedOrders: 0,
                cancelledOrders: 0,
                completionRate: 0,
                cancellationRate: 0
            };
        }
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map