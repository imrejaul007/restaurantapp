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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const websocket_service_1 = require("../websocket/websocket.service");
const client_1 = require("@prisma/client");
const order_utils_1 = require("../../utils/order.utils");
let OrdersService = class OrdersService {
    constructor(prisma, websocketService) {
        this.prisma = prisma;
        this.websocketService = websocketService;
    }
    async create(createOrderDto) {
        const orderNumber = await (0, order_utils_1.generateOrderNumber)();
        const order = await this.prisma.order.create({
            data: {
                orderNumber,
                ...createOrderDto,
                status: client_1.OrderStatus.PENDING,
                paymentStatus: client_1.PaymentStatus.PENDING,
                items: {
                    create: createOrderDto.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.unitPrice,
                        gstAmount: item.totalPrice * 0.18,
                        totalAmount: item.totalPrice,
                    })),
                },
                statusHistory: {
                    create: {
                        status: client_1.OrderStatus.PENDING,
                        notes: 'Order created',
                    },
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                vendor: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        await this.websocketService.sendNewOrderNotification(order);
        return order;
    }
    async findAll(query, userId, userRole, filterRestaurantId, filterVendorId) {
        const { page = 1, limit = 10, status, type, restaurantId: queryRestaurantId, vendorId: queryVendorId, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (userRole === 'RESTAURANT' && filterRestaurantId) {
            where.restaurantId = filterRestaurantId;
        }
        else if (userRole === 'VENDOR' && filterVendorId) {
            where.vendorId = filterVendorId;
        }
        if (status)
            where.status = status;
        if (queryRestaurantId)
            where.restaurantId = queryRestaurantId;
        if (queryVendorId)
            where.vendorId = queryVendorId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        if (query.search) {
            where.OR = [
                { orderNumber: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const orderBy = {
            [sortBy]: sortOrder
        };
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    vendor: {
                        select: {
                            id: true,
                            companyName: true,
                        },
                    },
                    statusHistory: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    },
                },
            }),
            this.prisma.order.count({ where }),
        ]);
        return {
            data: orders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id, userId, userRole) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        rating: true,
                    },
                },
                vendor: {
                    select: {
                        id: true,
                        companyName: true,
                        rating: true,
                    },
                },
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (userRole === 'RESTAURANT' && !order.restaurantId) {
            throw new common_1.ForbiddenException('This order is not for your restaurant');
        }
        if (userRole === 'VENDOR' && !order.vendorId) {
            throw new common_1.ForbiddenException('This order is not for your vendor account');
        }
        return order;
    }
    async update(id, updateOrderDto, userId, userRole) {
        const order = await this.findOne(id, userId, userRole);
        if (updateOrderDto.status && !this.canUpdateStatus(order.status, updateOrderDto.status, userRole)) {
            throw new common_1.BadRequestException('Invalid status transition');
        }
        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: {
                ...updateOrderDto,
                deliveredAt: updateOrderDto.status === client_1.OrderStatus.DELIVERED ? new Date() : order.deliveredAt,
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                vendor: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (updateOrderDto.status && updateOrderDto.status !== order.status) {
            await this.prisma.orderStatusHistory.create({
                data: {
                    orderId: id,
                    status: updateOrderDto.status,
                    notes: `Status updated to ${updateOrderDto.status}`,
                },
            });
            await this.websocketService.sendOrderUpdate(id, {
                status: updateOrderDto.status,
                notes: `Status updated to ${updateOrderDto.status}`,
                updatedBy: 'System',
                updatedAt: new Date(),
            });
        }
        return updatedOrder;
    }
    async cancel(id, reason, userId, userRole) {
        const order = await this.findOne(id, userId, userRole);
        if (order.status === client_1.OrderStatus.DELIVERED || order.status === client_1.OrderStatus.CANCELLED) {
            throw new common_1.BadRequestException('Order cannot be cancelled');
        }
        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: {
                status: client_1.OrderStatus.CANCELLED,
                updatedAt: new Date(),
            },
            include: {
                items: true,
            },
        });
        await this.prisma.orderStatusHistory.create({
            data: {
                orderId: id,
                status: client_1.OrderStatus.CANCELLED,
                notes: `Order cancelled. Reason: ${reason}`,
            },
        });
        await this.websocketService.sendOrderUpdate(id, {
            status: client_1.OrderStatus.CANCELLED,
            notes: `Order cancelled. Reason: ${reason}`,
            updatedBy: userRole || 'System',
            updatedAt: new Date(),
        });
        return updatedOrder;
    }
    async getOrderStats(userId, userRole, restaurantId, vendorId) {
        const where = {};
        if (userRole === 'RESTAURANT' && restaurantId) {
            where.restaurantId = restaurantId;
        }
        else if (userRole === 'VENDOR' && vendorId) {
            where.vendorId = vendorId;
        }
        const [totalOrders, pendingOrders, confirmedOrders, preparingOrders, readyOrders, dispatchedOrders, deliveredOrders, cancelledOrders, totalRevenue,] = await Promise.all([
            this.prisma.order.count({ where }),
            this.prisma.order.count({ where: { ...where, status: client_1.OrderStatus.PENDING } }),
            this.prisma.order.count({ where: { ...where, status: client_1.OrderStatus.CONFIRMED } }),
            this.prisma.order.count({ where: { ...where, status: client_1.OrderStatus.PREPARING } }),
            this.prisma.order.count({ where: { ...where, status: client_1.OrderStatus.READY } }),
            this.prisma.order.count({ where: { ...where, status: client_1.OrderStatus.DISPATCHED } }),
            this.prisma.order.count({ where: { ...where, status: client_1.OrderStatus.DELIVERED } }),
            this.prisma.order.count({ where: { ...where, status: client_1.OrderStatus.CANCELLED } }),
            this.prisma.order.aggregate({
                where: { ...where, status: { not: client_1.OrderStatus.CANCELLED } },
                _sum: { totalAmount: true },
            }),
        ]);
        return {
            totalOrders,
            pendingOrders,
            confirmedOrders,
            preparingOrders,
            readyOrders,
            dispatchedOrders,
            deliveredOrders,
            cancelledOrders,
            totalRevenue: totalRevenue._sum?.totalAmount || 0,
            processingOrders: confirmedOrders + preparingOrders + readyOrders,
        };
    }
    canUpdateStatus(currentStatus, newStatus, userRole) {
        const statusFlow = {
            [client_1.OrderStatus.PENDING]: [client_1.OrderStatus.CONFIRMED, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.CONFIRMED]: [client_1.OrderStatus.PREPARING, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.PREPARING]: [client_1.OrderStatus.READY, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.READY]: [client_1.OrderStatus.DISPATCHED, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.DISPATCHED]: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.PROCESSING]: [client_1.OrderStatus.SHIPPED, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.SHIPPED]: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.DELIVERED]: [],
            [client_1.OrderStatus.CANCELLED]: [],
            [client_1.OrderStatus.REFUNDED]: [],
        };
        const allowedStatuses = statusFlow[currentStatus] || [];
        if (userRole === 'CUSTOMER' && newStatus !== client_1.OrderStatus.CANCELLED) {
            return false;
        }
        return allowedStatuses.includes(newStatus);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_service_1.WebsocketService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map