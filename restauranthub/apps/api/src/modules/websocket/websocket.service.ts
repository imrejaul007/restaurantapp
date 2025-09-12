import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
// import { RedisService } from '../../redis/redis.service';

interface ConnectedUser {
  userId: string;
  role: string;
  socketId: string;
  restaurantId?: string;
  lastActivity: Date;
}

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);
  private server!: Server;
  private connectedUsers = new Map<string, ConnectedUser>();

  constructor(
    private prisma: PrismaService,
    // private redisService: RedisService, // Temporarily disabled
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  async handleConnection(client: Socket, user: any) {
    const connectedUser: ConnectedUser = {
      userId: user.id,
      role: user.role,
      socketId: client.id,
      restaurantId: user.restaurant?.id || user.employee?.restaurantId,
      lastActivity: new Date(),
    };

    this.connectedUsers.set(client.id, connectedUser);

    // Join user to their role-specific rooms
    await client.join(user.id); // Personal room
    await client.join(`role:${user.role}`); // Role-based room

    if (connectedUser.restaurantId) {
      await client.join(`restaurant:${connectedUser.restaurantId}`); // Restaurant room
    }

    // Store connection in Redis for scaling across instances
    // await this.redisService.set(
    //   `ws:user:${user.id}`,
    //   JSON.stringify({
    //     socketId: client.id,
    //     role: user.role,
    //     restaurantId: connectedUser.restaurantId,
    //     connectedAt: new Date().toISOString(),
    //   }),
    //   3600, // 1 hour
    // );

    // TODO: User model doesn't have isOnline/lastSeenAt fields
    // Update user online status
    // await this.prisma.user.update({
    //   where: { id: user.id },
    //   data: {
    //     isOnline: true,
    //     lastSeenAt: new Date(),
    //   },
    // });

    this.logger.log(`User ${user.id} (${user.role}) connected: ${client.id}`);

    // Emit user online status to relevant rooms
    this.emitUserStatusUpdate(user.id, true, connectedUser.restaurantId);

    return connectedUser;
  }

  async handleDisconnection(client: Socket) {
    const connectedUser = this.connectedUsers.get(client.id);
    
    if (connectedUser) {
      this.connectedUsers.delete(client.id);

      // Remove from Redis
      // await this.redisService.del(`ws:user:${connectedUser.userId}`);

      // Update user offline status
      // TODO: User model doesn't have isOnline/lastSeenAt fields
      // await this.prisma.user.update({
      //   where: { id: connectedUser.userId },
      //   data: {
      //     isOnline: false,
      //     lastSeenAt: new Date(),
      //   },
      // });

      this.logger.log(`User ${connectedUser.userId} disconnected: ${client.id}`);

      // Emit user offline status
      this.emitUserStatusUpdate(connectedUser.userId, false, connectedUser.restaurantId);
    }
  }

  // Real-time notifications
  async sendNotificationToUser(userId: string, notification: any) {
    const userRoom = userId;
    this.server.to(userRoom).emit('notification', notification);
    
    // Store notification in database if user is offline
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

  // Generic message sending to user
  async sendMessageToUser(userId: string, event: string, data: any) {
    const userRoom = userId;
    this.server.to(userRoom).emit(event, data);
  }

  async sendNotificationToRole(role: string, notification: any) {
    const roleRoom = `role:${role}`;
    this.server.to(roleRoom).emit('notification', notification);
  }

  async sendNotificationToRestaurant(restaurantId: string, notification: any) {
    const restaurantRoom = `restaurant:${restaurantId}`;
    this.server.to(restaurantRoom).emit('notification', notification);
  }

  // Real-time order updates
  async sendNewOrderNotification(order: any) {
    // Notify restaurant/vendor about new order
    if (order.restaurantId) {
      this.server.to(`restaurant:${order.restaurantId}`).emit('newOrder', order);
    }
    
    if (order.vendorId) {
      this.server.to(`vendor:${order.vendorId}`).emit('newOrder', order);
    }

    // Send notification to admin
    this.server.to('role:ADMIN').emit('newOrder', order);
  }

  async sendOrderUpdate(orderId: string, update: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
      },
    });

    if (order) {
      // Notify customer
      this.server.to(order.customerId).emit('orderUpdate', {
        orderId,
        status: update.status,
        ...update,
      });

      // Notify restaurant
      this.server.to(`restaurant:${order.restaurantId}`).emit('orderUpdate', {
        orderId,
        status: update.status,
        ...update,
      });

      // Notify restaurant staff
      if (order.restaurantId) {
        this.server.to(order.restaurantId).emit('orderUpdate', {
          orderId,
          status: update.status,
          ...update,
        });
      }
    }
  }

  // Real-time messaging
  async sendMessage(senderId: string, recipientId: string, message: any) {
    // TODO: Message model requires conversationId - implement conversation creation first
    // Store message in database
    // const savedMessage = await this.prisma.message.create({
    //   data: {
    //     senderId,
    //     conversationId: 'CONVERSATION_ID_NEEDED',
    //     content: message.content,
    //     type: message.type || 'TEXT',
    //     attachments: message.attachments || [],
    //   },
    //   include: {
    //     sender: {
    //       select: {
    //         id: true,
    //         email: true,
    //         firstName: true,
    //         lastName: true,
    //         role: true,
    //       },
    //     },
    //   },
    // });

    // TODO: Implement proper message sending once conversation model is set up
    // Send to recipient
    // this.server.to(recipientId).emit('newMessage', savedMessage);
    
    // Send delivery confirmation to sender
    // this.server.to(senderId).emit('messageDelivered', {
    //   messageId: 'TEMP_MESSAGE_ID',
    //   deliveredAt: new Date(),
    // });

    // return savedMessage;
    return { id: 'temp', content: message.content, senderId, recipientId };
  }

  // Employee tracking for restaurants
  async updateEmployeeLocation(employeeId: string, location: { lat: number; lng: number }) {
    // TODO: Employee model not yet implemented
    // const employee = await this.prisma.employee.findUnique({
    //   where: { userId: employeeId },
    //   include: { restaurant: true },
    // });

    // if (employee) {
    //   // Update employee location
    //   await this.prisma.employee.update({
    //     where: { userId: employeeId },
    //     data: {
    //       currentLocation: location,
    //       lastLocationUpdate: new Date(),
    //     },
    //   });

      // Notify restaurant managers
      // this.server.to(`restaurant:${employee.restaurantId}`).emit('employeeLocationUpdate', {
      //   employeeId,
      //   location,
      //   timestamp: new Date(),
      // });
    // }
  }

  // Live analytics updates
  async broadcastAnalyticsUpdate(restaurantId: string, analytics: any) {
    this.server.to(`restaurant:${restaurantId}`).emit('analyticsUpdate', analytics);
  }

  // Kitchen display updates
  async sendKitchenUpdate(restaurantId: string, update: any) {
    this.server.to(`restaurant:${restaurantId}`).emit('kitchenUpdate', update);
  }

  // Table management updates
  async sendTableUpdate(restaurantId: string, tableUpdate: any) {
    this.server.to(`restaurant:${restaurantId}`).emit('tableUpdate', tableUpdate);
  }

  // Inventory alerts
  async sendInventoryAlert(restaurantId: string, alert: any) {
    this.server.to(`restaurant:${restaurantId}`).emit('inventoryAlert', alert);
    
    // Also notify vendors if it's a low stock alert
    if (alert.type === 'LOW_STOCK' && alert.productId) {
      // TODO: Vendor model not yet implemented
      // const vendors = await this.prisma.vendor.findMany({
      //   where: {
      //     products: {
      //       some: {
      //         id: alert.productId,
      //       },
      //     },
      //   },
      // });

      // vendors.forEach(vendor => {
      //   this.server.to(vendor.userId).emit('stockAlert', {
      //     restaurantId,
      //     productId: alert.productId,
      //     message: `Low stock alert from restaurant`,
      //     ...alert,
      //   });
      // });
    }
  }

  // Helper methods
  private async isUserOnline(userId: string): Promise<boolean> {
    const connectionInfo = null; // await this.redisService.get(`ws:user:${userId}`);
    return !!connectionInfo;
  }

  private emitUserStatusUpdate(userId: string, isOnline: boolean, restaurantId?: string) {
    const statusUpdate = {
      userId,
      isOnline,
      timestamp: new Date(),
    };

    // Emit to restaurant if user belongs to one
    if (restaurantId) {
      this.server.to(`restaurant:${restaurantId}`).emit('userStatusUpdate', statusUpdate);
    }

    // Emit to admin
    this.server.to('role:ADMIN').emit('userStatusUpdate', statusUpdate);
  }

  async getConnectedUsers(): Promise<ConnectedUser[]> {
    return Array.from(this.connectedUsers.values());
  }

  async getConnectedUsersInRestaurant(restaurantId: string): Promise<ConnectedUser[]> {
    return Array.from(this.connectedUsers.values()).filter(
      user => user.restaurantId === restaurantId
    );
  }

  async broadcastSystemMaintenance(message: string, scheduledTime?: Date) {
    this.server.emit('systemMaintenance', {
      message,
      scheduledTime,
      timestamp: new Date(),
    });
  }

  async broadcastEmergencyAlert(alert: any) {
    this.server.emit('emergencyAlert', {
      ...alert,
      timestamp: new Date(),
    });
  }
}