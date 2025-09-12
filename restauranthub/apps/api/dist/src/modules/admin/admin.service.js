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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const websocket_service_1 = require("../websocket/websocket.service");
let AdminService = AdminService_1 = class AdminService {
    constructor(databaseService, websocketService) {
        this.databaseService = databaseService;
        this.websocketService = websocketService;
        this.logger = new common_1.Logger(AdminService_1.name);
    }
    async getDashboardData() {
        try {
            const [totalUsers, totalRestaurants, totalVendors, totalEmployees, pendingVerifications, totalOrders, monthlyRevenue, activeUsers,] = await Promise.all([
                this.databaseService.user.count(),
                this.databaseService.restaurant.count(),
                this.databaseService.vendor.count(),
                this.databaseService.employee.count(),
                Promise.all([
                    this.databaseService.restaurant.count({
                        where: { verificationStatus: 'PENDING' },
                    }),
                    this.databaseService.vendor.count({
                        where: { verificationStatus: 'PENDING' },
                    })
                ]).then(([restaurantCount, vendorCount]) => restaurantCount + vendorCount),
                this.databaseService.order.count(),
                this.databaseService.order.aggregate({
                    where: {
                        createdAt: {
                            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        },
                        status: 'DELIVERED',
                    },
                    _sum: { subtotal: true },
                }),
                this.databaseService.user.count({
                    where: {
                        lastLoginAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                }),
            ]);
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const [userGrowth, restaurantGrowth, orderGrowth] = await Promise.all([
                this.databaseService.user.count({
                    where: { createdAt: { gte: lastMonth } },
                }),
                this.databaseService.restaurant.count({
                    where: { createdAt: { gte: lastMonth } },
                }),
                this.databaseService.order.count({
                    where: { createdAt: { gte: lastMonth } },
                }),
            ]);
            return {
                overview: {
                    totalUsers,
                    totalRestaurants,
                    totalVendors,
                    totalEmployees,
                    pendingVerifications,
                    totalOrders,
                    monthlyRevenue: monthlyRevenue._sum?.total || 0,
                    activeUsers,
                },
                growth: {
                    userGrowth,
                    restaurantGrowth,
                    orderGrowth,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get dashboard data', error);
            throw error;
        }
    }
    async getUsers(params) {
        try {
            const { role, status, page = 1, limit = 20, search, } = params;
            const skip = (page - 1) * limit;
            const where = {};
            if (role) {
                where.role = role;
            }
            if (status) {
                where.isActive = status === 'active';
            }
            if (search) {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                    { profile: { firstName: { contains: search, mode: 'insensitive' } } },
                    { profile: { lastName: { contains: search, mode: 'insensitive' } } },
                ];
            }
            const [users, total] = await Promise.all([
                this.databaseService.user.findMany({
                    where,
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        role: true,
                        status: true,
                        emailVerifiedAt: true,
                        createdAt: true,
                        lastLoginAt: true,
                        firstName: true,
                        lastName: true,
                        restaurant: {
                            select: {
                                businessName: true,
                                verifiedAt: true,
                            },
                        },
                        vendor: {
                            select: {
                                businessName: true,
                                verifiedAt: true,
                            },
                        },
                        employee: {
                            select: {
                                employeeCode: true,
                                restaurant: {
                                    select: { businessName: true },
                                },
                            },
                        },
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                this.databaseService.user.count({ where }),
            ]);
            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get users', error);
            throw error;
        }
    }
    async getUserById(userId) {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                include: {
                    restaurant: {
                        include: {
                            employees: true,
                        },
                    },
                    vendor: {
                        include: {
                            products: true,
                        },
                    },
                    employee: {
                        include: {
                            restaurant: true,
                        },
                    },
                    sessions: true,
                },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            return user;
        }
        catch (error) {
            this.logger.error('Failed to get user by ID', error);
            throw error;
        }
    }
    async updateUserStatus(userId, status, reason) {
        try {
            const userStatus = status === 'active' ? 'ACTIVE' : 'SUSPENDED';
            const user = await this.databaseService.user.update({
                where: { id: userId },
                data: { status: userStatus },
            });
            await this.databaseService.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'User',
                    resource: 'User',
                    entityId: userId,
                    newData: { status: userStatus, reason },
                },
            });
            if (userStatus !== 'ACTIVE') {
                this.websocketService?.sendMessageToUser(userId, 'accountStatusChanged', {
                    status: 'deactivated',
                    reason,
                });
            }
            return user;
        }
        catch (error) {
            this.logger.error('Failed to update user status', error);
            throw error;
        }
    }
    async getPendingRestaurants(params) {
        try {
            const { page = 1, limit = 20 } = params;
            const skip = (page - 1) * limit;
            const [restaurants, total] = await Promise.all([
                this.databaseService.restaurant.findMany({
                    where: { verificationStatus: 'PENDING' },
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                            },
                        },
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'asc' },
                }),
                this.databaseService.restaurant.count({
                    where: { verificationStatus: 'PENDING' },
                }),
            ]);
            return {
                restaurants,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get pending restaurants', error);
            throw error;
        }
    }
    async approveRestaurant(restaurantId, notes) {
        try {
            const restaurant = await this.databaseService.restaurant.update({
                where: { id: restaurantId },
                data: {
                    verificationStatus: 'VERIFIED',
                    verifiedAt: new Date(),
                },
                include: { user: true },
            });
            await this.databaseService.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'Restaurant',
                    resource: 'Restaurant',
                    entityId: restaurantId,
                    newData: { notes },
                },
            });
            this.websocketService?.sendMessageToUser(restaurant.userId, 'verificationStatusChanged', {
                status: 'approved',
                message: 'Your restaurant has been verified and approved!',
                notes,
            });
            return restaurant;
        }
        catch (error) {
            this.logger.error('Failed to approve restaurant', error);
            throw error;
        }
    }
    async rejectRestaurant(restaurantId, reason) {
        try {
            const restaurant = await this.databaseService.restaurant.update({
                where: { id: restaurantId },
                data: {
                    verificationStatus: 'REJECTED',
                },
                include: { user: true },
            });
            await this.databaseService.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'Restaurant',
                    resource: 'Restaurant',
                    entityId: restaurantId,
                    newData: { reason },
                },
            });
            this.websocketService?.sendMessageToUser(restaurant.userId, 'verificationStatusChanged', {
                status: 'rejected',
                message: 'Your restaurant verification has been rejected',
                reason,
            });
            return restaurant;
        }
        catch (error) {
            this.logger.error('Failed to reject restaurant', error);
            throw error;
        }
    }
    async getPendingVendors(params) {
        try {
            const { page = 1, limit = 20 } = params;
            const skip = (page - 1) * limit;
            const [vendors, total] = await Promise.all([
                this.databaseService.vendor.findMany({
                    where: { verificationStatus: 'PENDING' },
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                            },
                        },
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'asc' },
                }),
                this.databaseService.vendor.count({
                    where: { verificationStatus: 'PENDING' },
                }),
            ]);
            return {
                vendors,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get pending vendors', error);
            throw error;
        }
    }
    async approveVendor(vendorId, notes) {
        try {
            const vendor = await this.databaseService.vendor.update({
                where: { id: vendorId },
                data: {
                    verificationStatus: 'VERIFIED',
                    verifiedAt: new Date(),
                },
                include: { user: true },
            });
            await this.databaseService.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'Vendor',
                    resource: 'Vendor',
                    entityId: vendorId,
                    newData: { notes },
                },
            });
            this.websocketService?.sendMessageToUser(vendor.userId, 'verificationStatusChanged', {
                status: 'approved',
                message: 'Your vendor account has been verified and approved!',
                notes,
            });
            return vendor;
        }
        catch (error) {
            this.logger.error('Failed to approve vendor', error);
            throw error;
        }
    }
    async rejectVendor(vendorId, reason) {
        try {
            const vendor = await this.databaseService.vendor.update({
                where: { id: vendorId },
                data: {
                    verificationStatus: 'REJECTED',
                },
                include: { user: true },
            });
            await this.databaseService.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'Vendor',
                    resource: 'Vendor',
                    entityId: vendorId,
                    newData: { reason },
                },
            });
            this.websocketService?.sendMessageToUser(vendor.userId, 'verificationStatusChanged', {
                status: 'rejected',
                message: 'Your vendor verification has been rejected',
                reason,
            });
            return vendor;
        }
        catch (error) {
            this.logger.error('Failed to reject vendor', error);
            throw error;
        }
    }
    async getAnalytics(params) {
        try {
            const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date(), type, } = params;
            const where = {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            };
            const [userStats, orderStats, revenueStats, topRestaurants, topProducts,] = await Promise.all([
                this.databaseService.user.groupBy({
                    by: ['role'],
                    where,
                    _count: true,
                }),
                this.databaseService.order.groupBy({
                    by: ['status'],
                    where,
                    _count: true,
                }),
                this.databaseService.order.aggregate({
                    where: { ...where, status: 'DELIVERED' },
                    _sum: { total: true },
                    _avg: { total: true },
                }),
                this.databaseService.restaurant.findMany({
                    include: {
                        _count: {
                            select: { orders: true },
                        },
                    },
                    orderBy: {
                        orders: { _count: 'desc' },
                    },
                    take: 10,
                }),
                this.databaseService.product.findMany({
                    include: {
                        _count: {
                            select: { orderItems: true },
                        },
                    },
                    orderBy: {
                        orderItems: { _count: 'desc' },
                    },
                    take: 10,
                }),
            ]);
            return {
                period: { startDate, endDate },
                userStats,
                orderStats,
                revenue: {
                    total: revenueStats._sum?.total || 0,
                    average: 0,
                },
                topRestaurants,
                topProducts,
            };
        }
        catch (error) {
            this.logger.error('Failed to get analytics', error);
            throw error;
        }
    }
    async getFlaggedReviews(params) {
        try {
            const { page = 1, limit = 20 } = params;
            const skip = (page - 1) * limit;
            const [reviews, total] = await Promise.all([
                this.databaseService.review.findMany({
                    where: {},
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profile: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                this.databaseService.review.count({}),
            ]);
            return {
                reviews,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get flagged reviews', error);
            throw error;
        }
    }
    async reviewAction(reviewId, action, reason) {
        try {
            let updateData = {};
            switch (action) {
                case 'approve':
                    updateData = { status: 'ACTIVE' };
                    break;
                case 'hide':
                    updateData = { status: 'HIDDEN' };
                    break;
                case 'delete':
                    updateData = { status: 'DELETED' };
                    break;
            }
            const review = await this.databaseService.review.update({
                where: { id: reviewId },
                data: updateData,
                include: { user: true },
            });
            await this.databaseService.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'Review',
                    resource: 'Review',
                    entityId: reviewId,
                    newData: { action, reason },
                },
            });
            return review;
        }
        catch (error) {
            this.logger.error('Failed to perform review action', error);
            throw error;
        }
    }
    async getAuditLogs(params) {
        try {
            const { userId, action, resource, startDate, endDate, page = 1, limit = 50, } = params;
            const skip = (page - 1) * limit;
            const where = {};
            if (userId) {
                where.userId = userId;
            }
            if (action) {
                where.action = action;
            }
            if (resource) {
                where.resource = resource;
            }
            if (startDate && endDate) {
                where.createdAt = {
                    gte: startDate,
                    lte: endDate,
                };
            }
            const [logs, total] = await Promise.all([
                this.databaseService.auditLog.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                this.databaseService.auditLog.count({ where }),
            ]);
            return {
                logs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to get audit logs', error);
            throw error;
        }
    }
    async toggleMaintenance(enabled, message) {
        try {
            this.logger.log(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}: ${message || ''}`);
            if (enabled) {
                this.websocketService?.broadcastSystemMaintenance(message || 'System is under maintenance. Please try again later.');
            }
            return { enabled, message, timestamp: new Date() };
        }
        catch (error) {
            this.logger.error('Failed to toggle maintenance mode', error);
            throw error;
        }
    }
    async getSystemConfig() {
        try {
            const defaultConfig = {
                maintenance_mode: { enabled: false, message: '' },
                max_upload_size: '10MB',
                allowed_file_types: ['jpg', 'jpeg', 'png', 'pdf'],
                payment_enabled: true
            };
            return defaultConfig;
        }
        catch (error) {
            this.logger.error('Failed to get system config', error);
            throw error;
        }
    }
    async updateSystemConfig(config) {
        try {
            const updates = Object.keys(config).map(key => ({
                key,
                value: typeof config[key] === 'string' ? config[key] : JSON.stringify(config[key]),
            }));
            const results = await Promise.all(updates.map(update => Promise.resolve({ key: update.key, value: update.value })));
            return results;
        }
        catch (error) {
            this.logger.error('Failed to update system config', error);
            throw error;
        }
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        websocket_service_1.WebsocketService])
], AdminService);
//# sourceMappingURL=admin.service.js.map