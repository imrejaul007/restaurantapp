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
exports.RestaurantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let RestaurantsService = class RestaurantsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createRestaurantDto) {
        const { name, description, cuisineType, licenseNumber, gstNumber, fssaiNumber, panNumber, bankAccountNumber, bankName, ifscCode, } = createRestaurantDto;
        const restaurant = await this.prisma.restaurant.create({
            data: {
                userId,
                name: name,
                description,
                cuisineType: cuisineType || [],
                licenseNumber: licenseNumber,
                gstNumber,
                fssaiNumber,
                panNumber,
            },
            include: {
                user: true,
            },
        });
        return restaurant;
    }
    async findAll(page = 1, limit = 20, filters) {
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (filters?.verificationStatus) {
            where.verificationStatus = filters.verificationStatus;
        }
        if (filters?.cuisineType) {
            where.cuisineType = {
                hasSome: Array.isArray(filters.cuisineType)
                    ? filters.cuisineType
                    : [filters.cuisineType],
            };
        }
        if (filters?.city) {
            where.user = {
                profile: {
                    city: {
                        contains: filters.city,
                        mode: 'insensitive',
                    },
                },
            };
        }
        const [restaurants, total] = await Promise.all([
            this.prisma.restaurant.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        include: {
                            profile: true,
                            restaurant: true,
                            employee: true,
                            vendor: true,
                        },
                    },
                    _count: {
                        select: {
                            employees: true,
                            jobs: true,
                            orders: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.restaurant.count({ where }),
        ]);
        return {
            data: restaurants,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id },
            include: {
                user: {
                    include: {
                        restaurant: true,
                        employee: true,
                        vendor: true,
                        profile: true,
                    },
                },
                employees: {
                    include: {
                        user: {
                            include: {
                                profile: true,
                                restaurant: true,
                                employee: true,
                                vendor: true,
                            },
                        },
                    },
                },
                jobs: {
                    where: { status: 'OPEN' },
                    take: 5,
                },
                documents: true,
                _count: {
                    select: {
                        employees: true,
                        jobs: true,
                        orders: true,
                        products: true,
                    },
                },
            },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        return restaurant;
    }
    async update(id, userId, userRole, updateRestaurantDto) {
        const restaurant = await this.findOne(id);
        if (userRole !== client_1.UserRole.ADMIN && restaurant.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const updatedRestaurant = await this.prisma.restaurant.update({
            where: { id },
            data: updateRestaurantDto,
            include: {
                user: {
                    include: {
                        restaurant: true,
                        employee: true,
                        vendor: true,
                        profile: true,
                    },
                },
            },
        });
        return updatedRestaurant;
    }
    async uploadDocument(restaurantId, type, url, name) {
        const document = await this.prisma.document.create({
            data: {
                restaurantId,
                type,
                url,
                name,
            },
        });
        return document;
    }
    async verifyRestaurant(id, isVerified, notes) {
        const restaurant = await this.prisma.restaurant.update({
            where: { id },
            data: {
                verificationStatus: isVerified ? client_1.VerificationStatus.VERIFIED : client_1.VerificationStatus.REJECTED,
                verifiedAt: isVerified ? new Date() : null,
            },
        });
        await this.createAuditLog('restaurant', 'UPDATE', id, { verificationStatus: isVerified ? 'VERIFIED' : 'REJECTED', notes });
        return restaurant;
    }
    async getDashboard(restaurantId, userId) {
        const restaurant = await this.findOne(restaurantId);
        if (restaurant.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const [employeeCount, openJobsCount, totalOrdersCount, pendingOrdersCount, totalRevenue, recentOrders, recentApplications, analytics,] = await Promise.all([
            this.prisma.employee.count({
                where: { restaurantId, isActive: true },
            }),
            this.prisma.job.count({
                where: { restaurantId, status: 'OPEN' },
            }),
            this.prisma.order.count({
                where: { restaurantId },
            }),
            this.prisma.order.count({
                where: { restaurantId, status: 'PENDING' },
            }),
            this.prisma.order.aggregate({
                where: { restaurantId, status: 'DELIVERED' },
                _sum: { total: true },
            }),
            this.prisma.order.findMany({
                where: { restaurantId },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    vendor: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            }),
            this.prisma.jobApplication.findMany({
                where: {
                    job: { restaurantId },
                    status: client_1.ApplicationStatus.SUBMITTED,
                },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    employee: {
                        include: {
                            user: {
                                include: {
                                    profile: true,
                                    restaurant: true,
                                    employee: true,
                                    vendor: true,
                                },
                            },
                        },
                    },
                    job: true,
                },
            }),
            this.getRestaurantAnalytics(restaurantId),
        ]);
        return {
            stats: {
                employees: employeeCount,
                openJobs: openJobsCount,
                totalOrders: totalOrdersCount,
                pendingOrders: pendingOrdersCount,
                totalRevenue: totalRevenue._sum?.total || 0,
            },
            recentOrders,
            recentApplications,
            analytics,
        };
    }
    async getRestaurantAnalytics(restaurantId, period = '30d') {
        const endDate = new Date();
        const startDate = new Date();
        switch (period) {
            case '7d':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(endDate.getDate() - 90);
                break;
            default:
                startDate.setDate(endDate.getDate() - 30);
        }
        const [ordersByDay, revenueByDay, topProducts, employeeGrowth] = await Promise.all([
            this.prisma.$queryRaw `
        SELECT DATE(created_at) as date, COUNT(*) as orders
        FROM "Order" 
        WHERE restaurant_id = ${restaurantId} 
        AND created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
            this.prisma.$queryRaw `
        SELECT DATE(created_at) as date, SUM(total_amount) as revenue
        FROM "Order" 
        WHERE restaurant_id = ${restaurantId} 
        AND status = 'DELIVERED'
        AND created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
            this.prisma.$queryRaw `
        SELECT p.name, p.id, SUM(oi.quantity) as total_quantity, SUM(oi.total_amount) as total_revenue
        FROM "OrderItem" oi
        JOIN "Product" p ON oi.product_id = p.id
        JOIN "Order" o ON oi.order_id = o.id
        WHERE o.restaurant_id = ${restaurantId}
        AND o.created_at >= ${startDate}
        GROUP BY p.id, p.name
        ORDER BY total_revenue DESC
        LIMIT 10
      `,
            this.prisma.$queryRaw `
        SELECT DATE(created_at) as date, COUNT(*) as employees
        FROM "Employee"
        WHERE restaurant_id = ${restaurantId}
        AND created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
        ]);
        return {
            ordersByDay,
            revenueByDay,
            topProducts,
            employeeGrowth,
        };
    }
    async getMenu(restaurantId) {
        const products = await this.prisma.product.findMany({
            where: {
                restaurantId,
                isActive: true,
            },
            include: {
                category: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        const categoriesMap = new Map();
        products.forEach(product => {
            const categoryId = product.category.id;
            if (!categoriesMap.has(categoryId)) {
                categoriesMap.set(categoryId, {
                    id: product.category.id,
                    name: product.category.name,
                    description: product.category.description,
                    image: product.category.image,
                    products: [],
                });
            }
            categoriesMap.get(categoryId).products.push(product);
        });
        return Array.from(categoriesMap.values());
    }
    async searchRestaurants(query, filters) {
        const where = {
            deletedAt: null,
            verificationStatus: client_1.VerificationStatus.VERIFIED,
            OR: [
                {
                    name: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
                {
                    description: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
            ],
        };
        if (filters?.cuisineType) {
            where.cuisineType = {
                hasSome: Array.isArray(filters.cuisineType)
                    ? filters.cuisineType
                    : [filters.cuisineType],
            };
        }
        const restaurants = await this.prisma.restaurant.findMany({
            where,
            include: {
                user: {
                    include: {
                        restaurant: true,
                        employee: true,
                        vendor: true,
                        profile: true,
                    },
                },
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
            take: 1,
            orderBy: {
                rating: 'desc',
            },
        });
        return restaurants;
    }
    async createAuditLog(resource, action, entityId, data) {
        await this.prisma.auditLog.create({
            data: {
                entity: resource,
                resource,
                action,
                entityId,
                newData: data,
            },
        });
    }
};
exports.RestaurantsService = RestaurantsService;
exports.RestaurantsService = RestaurantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RestaurantsService);
//# sourceMappingURL=restaurants.service.js.map