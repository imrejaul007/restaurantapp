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
var WebsocketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const websocket_service_1 = require("./websocket.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let WebsocketGateway = WebsocketGateway_1 = class WebsocketGateway {
    constructor(websocketService, jwtService, configService, prisma) {
        this.websocketService = websocketService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(WebsocketGateway_1.name);
    }
    afterInit(server) {
        this.websocketService.setServer(server);
        this.logger.log('WebSocket Gateway initialized');
    }
    async handleConnection(client) {
        try {
            const user = await this.authenticateSocket(client);
            if (!user) {
                client.disconnect();
                return;
            }
            await this.websocketService.handleConnection(client, user);
            client.emit('connected', {
                message: 'Connected successfully',
                userId: user.id,
                role: user.role,
            });
            const pendingNotifications = await this.prisma.notification.findMany({
                where: {
                    userId: user.id,
                    readAt: null,
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            if (pendingNotifications.length > 0) {
                client.emit('pendingNotifications', pendingNotifications);
            }
        }
        catch (error) {
            this.logger.error(`Connection failed: ${error.message}`);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        await this.websocketService.handleDisconnection(client);
    }
    async authenticateSocket(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                throw new common_1.UnauthorizedException('No token provided');
            }
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user || user.status !== 'ACTIVE') {
                throw new common_1.UnauthorizedException('User not found or inactive');
            }
            return user;
        }
        catch (error) {
            this.logger.warn(`Socket authentication failed: ${error.message}`);
            return null;
        }
    }
    async handleSendMessage(client, data) {
        try {
            const user = await this.authenticateSocket(client);
            if (!user)
                return;
            const message = await this.websocketService.sendMessage(user.id, data.recipientId, {
                content: data.content,
                type: data.type,
                attachments: data.attachments,
            });
            return { success: true, messageId: message.id };
        }
        catch (error) {
            this.logger.error(`Failed to send message: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async handleMarkNotificationRead(client, data) {
        try {
            const user = await this.authenticateSocket(client);
            if (!user)
                return;
            await this.prisma.notification.update({
                where: {
                    id: data.notificationId,
                    userId: user.id,
                },
                data: { readAt: new Date() },
            });
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Failed to mark notification as read: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async handleJoinRoom(client, data) {
        try {
            const user = await this.authenticateSocket(client);
            if (!user)
                return;
            if (await this.canJoinRoom(user, data.room)) {
                await client.join(data.room);
                this.logger.log(`User ${user.id} joined room: ${data.room}`);
                return { success: true, room: data.room };
            }
            else {
                return { success: false, error: 'Access denied to room' };
            }
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleLeaveRoom(client, data) {
        await client.leave(data.room);
        return { success: true, room: data.room };
    }
    async handleUpdateLocation(client, data) {
        try {
            const user = await this.authenticateSocket(client);
            if (!user || user.role !== 'EMPLOYEE')
                return { success: false, error: 'Unauthorized' };
            await this.websocketService.updateEmployeeLocation(user.id, {
                lat: data.lat,
                lng: data.lng,
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleUpdateOrderStatus(client, data) {
        try {
            const user = await this.authenticateSocket(client);
            if (!user)
                return { success: false, error: 'Unauthorized' };
            const order = await this.prisma.order.findUnique({
                where: { id: data.orderId },
                include: { restaurant: true },
            });
            if (!order) {
                return { success: false, error: 'Order not found' };
            }
            const hasPermission = user.role === 'ADMIN' ||
                (user.role === 'RESTAURANT' && user.restaurant?.id === order.restaurantId) ||
                (user.role === 'EMPLOYEE' && user.employee?.restaurantId === order.restaurantId);
            if (!hasPermission) {
                return { success: false, error: 'Permission denied' };
            }
            await this.prisma.order.update({
                where: { id: data.orderId },
                data: {
                    status: data.status,
                },
            });
            await this.websocketService.sendOrderUpdate(data.orderId, {
                status: data.status,
                notes: data.notes,
                updatedBy: user.firstName || user.email,
                updatedAt: new Date(),
            });
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Failed to update order status: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async handleKitchenItemReady(client, data) {
        try {
            const user = await this.authenticateSocket(client);
            if (!user || !['RESTAURANT', 'EMPLOYEE'].includes(user.role)) {
                return { success: false, error: 'Unauthorized' };
            }
            const restaurantId = user.restaurant?.id || user.employee?.restaurantId;
            if (!restaurantId) {
                return { success: false, error: 'Restaurant not found' };
            }
            await this.websocketService.sendKitchenUpdate(restaurantId, {
                type: 'ITEM_READY',
                orderId: data.orderId,
                itemId: data.itemId,
                timestamp: new Date(),
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleTableStatusUpdate(client, data) {
        try {
            const user = await this.authenticateSocket(client);
            if (!user || !['RESTAURANT', 'EMPLOYEE'].includes(user.role)) {
                return { success: false, error: 'Unauthorized' };
            }
            const restaurantId = user.restaurant?.id || user.employee?.restaurantId;
            if (!restaurantId) {
                return { success: false, error: 'Restaurant not found' };
            }
            await this.websocketService.sendTableUpdate(restaurantId, {
                tableId: data.tableId,
                status: data.status,
                occupancy: data.occupancy,
                updatedBy: user.id,
                timestamp: new Date(),
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleTyping(client, data) {
        const user = await this.authenticateSocket(client);
        if (!user)
            return;
        client.to(data.recipientId).emit('userTyping', {
            userId: user.id,
            isTyping: data.isTyping,
            timestamp: new Date(),
        });
    }
    async canJoinRoom(user, room) {
        if (user.role === 'ADMIN')
            return true;
        if (room === user.id)
            return true;
        if (room === `role:${user.role}`)
            return true;
        if (room.startsWith('restaurant:')) {
            const restaurantId = room.replace('restaurant:', '');
            return user.restaurant?.id === restaurantId || user.employee?.restaurantId === restaurantId;
        }
        if (room.startsWith('order:')) {
            const orderId = room.replace('order:', '');
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
            });
            return Boolean(order &&
                (order.customerId === user.id ||
                    order.restaurantId === user.id));
        }
        if (room.startsWith('chat:')) {
            const participants = room.replace('chat:', '').split('-').sort();
            return participants.includes(user.id);
        }
        return false;
    }
};
exports.WebsocketGateway = WebsocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebsocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('markNotificationRead'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleMarkNotificationRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('updateLocation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleUpdateLocation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('updateOrderStatus'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleUpdateOrderStatus", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('kitchenItemReady'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleKitchenItemReady", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('tableStatusUpdate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleTableStatusUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleTyping", null);
exports.WebsocketGateway = WebsocketGateway = WebsocketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: ['http://localhost:3000', 'http://localhost:3001'],
            credentials: true,
        },
        namespace: '/',
    }),
    __metadata("design:paramtypes", [websocket_service_1.WebsocketService,
        jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], WebsocketGateway);
//# sourceMappingURL=websocket.gateway.js.map