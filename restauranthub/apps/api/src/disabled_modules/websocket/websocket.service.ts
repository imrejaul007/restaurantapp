import { Injectable, Logger } from '@nestjs/common';
import { RestaurantHubWebSocketGateway } from './websocket.gateway';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);

  constructor(private readonly webSocketGateway: RestaurantHubWebSocketGateway) {}

  // Notification methods
  async sendNotificationToUser(userId: string, notification: any) {
    try {
      this.webSocketGateway.sendNotificationToUser(userId, notification);
      this.logger.log(`Notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}:`, error.message);
    }
  }

  async sendNotificationToRole(role: string, notification: any) {
    try {
      this.webSocketGateway.sendNotificationToRole(role, notification);
      this.logger.log(`Notification sent to role ${role}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to role ${role}:`, error.message);
    }
  }

  async sendNotificationToRestaurant(restaurantId: string, notification: any) {
    try {
      this.webSocketGateway.sendNotificationToRestaurant(restaurantId, notification);
      this.logger.log(`Notification sent to restaurant ${restaurantId}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to restaurant ${restaurantId}:`, error.message);
    }
  }

  async sendNotificationToVendor(vendorId: string, notification: any) {
    try {
      this.webSocketGateway.sendNotificationToVendor(vendorId, notification);
      this.logger.log(`Notification sent to vendor ${vendorId}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to vendor ${vendorId}:`, error.message);
    }
  }

  // Order-related methods
  async sendOrderUpdate(orderId: string, orderData: any) {
    try {
      this.webSocketGateway.sendOrderUpdate(orderId, orderData);
      this.logger.log(`Order update sent for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to send order update for order ${orderId}:`, error.message);
    }
  }

  async sendNewOrderNotification(orderData: any) {
    try {
      this.webSocketGateway.sendNewOrderNotification(orderData);
      this.logger.log(`New order notification sent for order ${orderData.orderNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send new order notification:`, error.message);
    }
  }

  // Job-related methods
  async sendJobApplicationUpdate(jobId: string, applicationData: any) {
    try {
      this.webSocketGateway.sendJobApplicationUpdate(jobId, applicationData);
      this.logger.log(`Job application update sent for job ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to send job application update for job ${jobId}:`, error.message);
    }
  }

  // Message-related methods
  async sendMessage(conversationId: string, messageData: any) {
    try {
      this.webSocketGateway.sendMessage(conversationId, messageData);
      this.logger.log(`Message sent in conversation ${conversationId}`);
    } catch (error) {
      this.logger.error(`Failed to send message in conversation ${conversationId}:`, error.message);
    }
  }

  // Community-related methods
  async sendCommunityUpdate(postId: string, updateData: any) {
    try {
      this.webSocketGateway.sendCommunityUpdate(postId, updateData);
      this.logger.log(`Community update sent for post ${postId}`);
    } catch (error) {
      this.logger.error(`Failed to send community update for post ${postId}:`, error.message);
    }
  }

  // System methods
  async sendSystemAnnouncement(announcement: any) {
    try {
      this.webSocketGateway.sendSystemAnnouncement(announcement);
      this.logger.log('System announcement sent');
    } catch (error) {
      this.logger.error('Failed to send system announcement:', error.message);
    }
  }

  // Utility methods
  getConnectedUsers(): string[] {
    return this.webSocketGateway.getConnectedUsers();
  }

  isUserConnected(userId: string): boolean {
    return this.webSocketGateway.isUserConnected(userId);
  }

  getConnectedUserCount(): number {
    return this.webSocketGateway.getConnectedUserCount();
  }
}