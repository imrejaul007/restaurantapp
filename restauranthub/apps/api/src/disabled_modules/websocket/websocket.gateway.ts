import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WSGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://restopapa.com', 'https://www.restopapa.com']
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
    credentials: true,
  },
  namespace: '/',
})
export class RestoPapaWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RestoPapaWebSocketGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from auth or query
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      client.userId = payload.sub;
      client.userRole = payload.role;

      // Store connection
      if (client.userId) {
        this.connectedUsers.set(client.userId, client);
      }

      // Join user-specific room
      await client.join(`user:${client.userId}`);

      // Join role-based room
      await client.join(`role:${client.userRole}`);

      // Join restaurant room if user is restaurant owner
      if (client.userRole === 'RESTAURANT' && payload.restaurant?.id) {
        await client.join(`restaurant:${payload.restaurant.id}`);
      }

      // Join vendor room if user is vendor
      if (client.userRole === 'VENDOR' && payload.vendor?.id) {
        await client.join(`vendor:${payload.vendor.id}`);
      }

      this.logger.log(`User ${client.userId} (${client.userRole}) connected with socket ${client.id}`);

      // Emit connection success
      client.emit('connected', {
        message: 'Connected successfully',
        userId: client.userId,
        rooms: Array.from(client.rooms),
      });

      // Send any pending notifications
      this.sendPendingNotifications(client);

    } catch (error) {
      this.logger.error(`Failed to authenticate client ${client.id}:`, error.message);
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.userId} disconnected (socket ${client.id})`);
    } else {
      this.logger.log(`Anonymous client ${client.id} disconnected`);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      await client.join(data.room);
      this.logger.log(`User ${client.userId} joined room: ${data.room}`);
      client.emit('joinedRoom', { room: data.room });
    } catch (error) {
      this.logger.error(`Failed to join room ${data.room}:`, error.message);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      await client.leave(data.room);
      this.logger.log(`User ${client.userId} left room: ${data.room}`);
      client.emit('leftRoom', { room: data.room });
    } catch (error) {
      this.logger.error(`Failed to leave room ${data.room}:`, error.message);
      client.emit('error', { message: 'Failed to leave room' });
    }
  }

  // Real-time notification methods
  sendNotificationToUser(userId: string, notification: any) {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit('notification', notification);
    this.logger.log(`Sent notification to user ${userId}`);
  }

  sendNotificationToRole(role: string, notification: any) {
    const roleRoom = `role:${role}`;
    this.server.to(roleRoom).emit('notification', notification);
    this.logger.log(`Sent notification to role ${role}`);
  }

  sendNotificationToRestaurant(restaurantId: string, notification: any) {
    const restaurantRoom = `restaurant:${restaurantId}`;
    this.server.to(restaurantRoom).emit('notification', notification);
    this.logger.log(`Sent notification to restaurant ${restaurantId}`);
  }

  sendNotificationToVendor(vendorId: string, notification: any) {
    const vendorRoom = `vendor:${vendorId}`;
    this.server.to(vendorRoom).emit('notification', notification);
    this.logger.log(`Sent notification to vendor ${vendorId}`);
  }

  // Order-related real-time updates
  sendOrderUpdate(orderId: string, orderData: any) {
    // Send to restaurant
    if (orderData.restaurantId) {
      this.server.to(`restaurant:${orderData.restaurantId}`).emit('orderStatusUpdate', {
        orderId,
        ...orderData,
      });
    }

    // Send to vendor if applicable
    if (orderData.vendorId) {
      this.server.to(`vendor:${orderData.vendorId}`).emit('orderStatusUpdate', {
        orderId,
        ...orderData,
      });
    }

    // Send to customer if order includes customer info
    if (orderData.customerId) {
      this.server.to(`user:${orderData.customerId}`).emit('orderStatusUpdate', {
        orderId,
        ...orderData,
      });
    }

    this.logger.log(`Sent order update for order ${orderId}`);
  }

  sendNewOrderNotification(orderData: any) {
    // Notify restaurant about new order
    if (orderData.restaurantId) {
      this.server.to(`restaurant:${orderData.restaurantId}`).emit('newOrder', orderData);
    }

    // Notify vendor about new order
    if (orderData.vendorId) {
      this.server.to(`vendor:${orderData.vendorId}`).emit('newOrder', orderData);
    }

    this.logger.log(`Sent new order notification for order ${orderData.orderNumber}`);
  }

  // Job-related real-time updates
  sendJobApplicationUpdate(jobId: string, applicationData: any) {
    // Send to restaurant that posted the job
    if (applicationData.restaurantId) {
      this.server.to(`restaurant:${applicationData.restaurantId}`).emit('jobApplication', {
        jobId,
        ...applicationData,
      });
    }

    // Send to applicant
    if (applicationData.applicantId) {
      this.server.to(`user:${applicationData.applicantId}`).emit('jobApplicationUpdate', {
        jobId,
        ...applicationData,
      });
    }

    this.logger.log(`Sent job application update for job ${jobId}`);
  }

  // Message-related real-time updates
  sendMessage(conversationId: string, messageData: any) {
    // Send to conversation participants
    if (messageData.participants && Array.isArray(messageData.participants)) {
      messageData.participants.forEach((userId: string) => {
        if (userId !== messageData.senderId) {
          this.server.to(`user:${userId}`).emit('newMessage', {
            conversationId,
            ...messageData,
          });
        }
      });
    }

    this.logger.log(`Sent message in conversation ${conversationId}`);
  }

  // Community-related real-time updates
  sendCommunityUpdate(postId: string, updateData: any) {
    // Broadcast to all community members
    this.server.emit('communityUpdate', {
      postId,
      ...updateData,
    });

    this.logger.log(`Sent community update for post ${postId}`);
  }

  // System-wide announcements
  sendSystemAnnouncement(announcement: any) {
    this.server.emit('systemAnnouncement', announcement);
    this.logger.log('Sent system-wide announcement');
  }

  // Send pending notifications to newly connected user
  private async sendPendingNotifications(client: AuthenticatedSocket) {
    try {
      // In a real implementation, you would fetch pending notifications from database
      // For now, we'll simulate this
      const pendingNotifications: any[] = [
        // This would be replaced with actual database query
      ];

      if (pendingNotifications.length > 0) {
        client.emit('pendingNotifications', pendingNotifications);
        this.logger.log(`Sent ${pendingNotifications.length} pending notifications to user ${client.userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send pending notifications to user ${client.userId}:`, error.message);
    }
  }

  // Utility methods
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getConnectedUserCount(): number {
    return this.connectedUsers.size;
  }

  // Health check for WebSocket
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }
}