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
var WebsocketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let WebsocketService = WebsocketService_1 = class WebsocketService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(WebsocketService_1.name);
        this.connectedUsers = new Map();
    }
    setServer(server) {
        this.server = server;
    }
    async handleConnection(client, user) {
        const connectedUser = {
            userId: user.id,
            role: user.role,
            socketId: client.id,
            restaurantId: user.restaurant?.id || user.employee?.restaurantId,
            lastActivity: new Date(),
        };
        this.connectedUsers.set(client.id, connectedUser);
        await client.join(user.id);
        await client.join(`role:${user.role}`);
        if (connectedUser.restaurantId) {
            await client.join(`restaurant:${connectedUser.restaurantId}`);
        }
        this.logger.log(`User ${user.id} (${user.role}) connected: ${client.id}`);
        this.emitUserStatusUpdate(user.id, true, connectedUser.restaurantId);
        return connectedUser;
    }
    async handleDisconnection(client) {
        const connectedUser = this.connectedUsers.get(client.id);
        if (connectedUser) {
            this.connectedUsers.delete(client.id);
            this.logger.log(`User ${connectedUser.userId} disconnected: ${client.id}`);
            this.emitUserStatusUpdate(connectedUser.userId, false, connectedUser.restaurantId);
        }
    }
    async sendNotificationToUser(userId, notification) {
        const userRoom = userId;
        this.server.to(userRoom).emit('notification', notification);
        const isOnline = await this.isUserOnline(userId);
        if (!isOnline) {
            await this.prisma.notification.create({
                data: {
                    userId,
                    title: notification.title,
                    message: notification.message || notification.content,
                    type: notification.type,
                    data: notification.data || {},
                },
            });
        }
    }
    async sendMessageToUser(userId, event, data) {
        const userRoom = userId;
        this.server.to(userRoom).emit(event, data);
    }
    async sendNotificationToRole(role, notification) {
        const roleRoom = `role:${role}`;
        this.server.to(roleRoom).emit('notification', notification);
    }
    async sendNotificationToRestaurant(restaurantId, notification) {
        const restaurantRoom = `restaurant:${restaurantId}`;
        this.server.to(restaurantRoom).emit('notification', notification);
    }
    async sendNewOrderNotification(order) {
        if (order.restaurantId) {
            this.server.to(`restaurant:${order.restaurantId}`).emit('newOrder', order);
        }
        if (order.vendorId) {
            this.server.to(`vendor:${order.vendorId}`).emit('newOrder', order);
        }
        this.server.to('role:ADMIN').emit('newOrder', order);
    }
    async sendOrderUpdate(orderId, update) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                restaurant: true,
            },
        });
        if (order) {
            this.server.to(order.customerId).emit('orderUpdate', {
                orderId,
                status: update.status,
                ...update,
            });
            this.server.to(`restaurant:${order.restaurantId}`).emit('orderUpdate', {
                orderId,
                status: update.status,
                ...update,
            });
            if (order.restaurantId) {
                this.server.to(order.restaurantId).emit('orderUpdate', {
                    orderId,
                    status: update.status,
                    ...update,
                });
            }
        }
    }
    async sendMessage(senderId, recipientId, message) {
        return { id: 'temp', content: message.content, senderId, recipientId };
    }
    async updateEmployeeLocation(employeeId, location) {
    }
    async broadcastAnalyticsUpdate(restaurantId, analytics) {
        this.server.to(`restaurant:${restaurantId}`).emit('analyticsUpdate', analytics);
    }
    async sendKitchenUpdate(restaurantId, update) {
        this.server.to(`restaurant:${restaurantId}`).emit('kitchenUpdate', update);
    }
    async sendTableUpdate(restaurantId, tableUpdate) {
        this.server.to(`restaurant:${restaurantId}`).emit('tableUpdate', tableUpdate);
    }
    async sendInventoryAlert(restaurantId, alert) {
        this.server.to(`restaurant:${restaurantId}`).emit('inventoryAlert', alert);
        if (alert.type === 'LOW_STOCK' && alert.productId) {
        }
    }
    async isUserOnline(userId) {
        const connectionInfo = null;
        return !!connectionInfo;
    }
    emitUserStatusUpdate(userId, isOnline, restaurantId) {
        const statusUpdate = {
            userId,
            isOnline,
            timestamp: new Date(),
        };
        if (restaurantId) {
            this.server.to(`restaurant:${restaurantId}`).emit('userStatusUpdate', statusUpdate);
        }
        this.server.to('role:ADMIN').emit('userStatusUpdate', statusUpdate);
    }
    async getConnectedUsers() {
        return Array.from(this.connectedUsers.values());
    }
    async getConnectedUsersInRestaurant(restaurantId) {
        return Array.from(this.connectedUsers.values()).filter(user => user.restaurantId === restaurantId);
    }
    async broadcastSystemMaintenance(message, scheduledTime) {
        this.server.emit('systemMaintenance', {
            message,
            scheduledTime,
            timestamp: new Date(),
        });
    }
    async broadcastEmergencyAlert(alert) {
        this.server.emit('emergencyAlert', {
            ...alert,
            timestamp: new Date(),
        });
    }
};
exports.WebsocketService = WebsocketService;
exports.WebsocketService = WebsocketService = WebsocketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebsocketService);
//# sourceMappingURL=websocket.service.js.map