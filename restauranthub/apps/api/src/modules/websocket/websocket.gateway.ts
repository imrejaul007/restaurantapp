import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WebsocketService } from './websocket.service';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: '/',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private websocketService: WebsocketService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.websocketService.setServer(server);
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const user = await this.authenticateSocket(client);
      if (!user) {
        client.disconnect();
        return;
      }

      await this.websocketService.handleConnection(client, user);
      
      // Send initial data
      client.emit('connected', {
        message: 'Connected successfully',
        userId: user.id,
        role: user.role,
      });

      // Send pending notifications
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

    } catch (error) {
      this.logger.error(`Connection failed: ${(error as Error).message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    await this.websocketService.handleDisconnection(client);
  }

  private async authenticateSocket(client: Socket): Promise<any> {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        // TODO: Remove non-existent model includes
        // include: {
        //   restaurant: true,
        //   vendor: true,
        //   employee: true,
        // },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User not found or inactive');
      }

      return user;
    } catch (error) {
      this.logger.warn(`Socket authentication failed: ${(error as Error).message}`);
      return null;
    }
  }

  // Message handling
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { recipientId: string; content: string; type?: string; attachments?: any[] },
  ) {
    try {
      const user = await this.authenticateSocket(client);
      if (!user) return;

      const message = await this.websocketService.sendMessage(
        user.id,
        data.recipientId,
        {
          content: data.content,
          type: data.type,
          attachments: data.attachments,
        },
      );

      return { success: true, messageId: message.id };
    } catch (error) {
      this.logger.error(`Failed to send message: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('markNotificationRead')
  async handleMarkNotificationRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    try {
      const user = await this.authenticateSocket(client);
      if (!user) return;

      await this.prisma.notification.update({
        where: {
          id: data.notificationId,
          userId: user.id,
        },
        data: { readAt: new Date() },
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    try {
      const user = await this.authenticateSocket(client);
      if (!user) return;

      // Validate room access based on user role and permissions
      if (await this.canJoinRoom(user, data.room)) {
        await client.join(data.room);
        this.logger.log(`User ${user.id} joined room: ${data.room}`);
        return { success: true, room: data.room };
      } else {
        return { success: false, error: 'Access denied to room' };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    await client.leave(data.room);
    return { success: true, room: data.room };
  }

  // Employee location updates
  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lat: number; lng: number },
  ) {
    try {
      const user = await this.authenticateSocket(client);
      if (!user || user.role !== 'EMPLOYEE') return { success: false, error: 'Unauthorized' };

      await this.websocketService.updateEmployeeLocation(user.id, {
        lat: data.lat,
        lng: data.lng,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Order status updates from kitchen/staff
  @SubscribeMessage('updateOrderStatus')
  async handleUpdateOrderStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; status: string; notes?: string },
  ) {
    try {
      const user = await this.authenticateSocket(client);
      if (!user) return { success: false, error: 'Unauthorized' };

      // Verify user has permission to update this order
      const order = await this.prisma.order.findUnique({
        where: { id: data.orderId },
        include: { restaurant: true },
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Check permissions based on user role
      const hasPermission = 
        user.role === 'ADMIN' ||
        (user.role === 'RESTAURANT' && user.restaurant?.id === order.restaurantId) ||
        (user.role === 'EMPLOYEE' && user.employee?.restaurantId === order.restaurantId);

      if (!hasPermission) {
        return { success: false, error: 'Permission denied' };
      }

      // Update order status
      await this.prisma.order.update({
        where: { id: data.orderId },
        data: {
          status: data.status as any,
          // TODO: statusUpdatedAt and statusUpdatedBy fields don't exist in schema
          // statusUpdatedAt: new Date(),
          // statusUpdatedBy: user.id,
        },
      });

      // Broadcast update
      await this.websocketService.sendOrderUpdate(data.orderId, {
        status: data.status,
        notes: data.notes,
        updatedBy: user.firstName || user.email,
        updatedAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to update order status: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  // Kitchen display system events
  @SubscribeMessage('kitchenItemReady')
  async handleKitchenItemReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; itemId: string },
  ) {
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
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('tableStatusUpdate')
  async handleTableStatusUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tableId: string; status: string; occupancy?: number },
  ) {
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
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Typing indicators for messaging
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { recipientId: string; isTyping: boolean },
  ) {
    const user = await this.authenticateSocket(client);
    if (!user) return;

    client.to(data.recipientId).emit('userTyping', {
      userId: user.id,
      isTyping: data.isTyping,
      timestamp: new Date(),
    });
  }

  // Helper method to validate room access
  private async canJoinRoom(user: any, room: string): Promise<boolean> {
    // Admin can join any room
    if (user.role === 'ADMIN') return true;

    // Personal rooms
    if (room === user.id) return true;

    // Role-based rooms
    if (room === `role:${user.role}`) return true;

    // Restaurant rooms
    if (room.startsWith('restaurant:')) {
      const restaurantId = room.replace('restaurant:', '');
      return user.restaurant?.id === restaurantId || user.employee?.restaurantId === restaurantId;
    }

    // Order rooms (for customers and restaurants)
    if (room.startsWith('order:')) {
      const orderId = room.replace('order:', '');
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      return Boolean(order &&
        (order.customerId === user.id ||
         // TODO: Restaurant and employee relations not implemented yet
         order.restaurantId === user.id));
    }

    // Chat rooms for messaging
    if (room.startsWith('chat:')) {
      const participants = room.replace('chat:', '').split('-').sort();
      return participants.includes(user.id);
    }

    return false;
  }
}