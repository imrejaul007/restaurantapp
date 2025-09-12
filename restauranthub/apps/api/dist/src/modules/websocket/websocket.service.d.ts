import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
interface ConnectedUser {
    userId: string;
    role: string;
    socketId: string;
    restaurantId?: string;
    lastActivity: Date;
}
export declare class WebsocketService {
    private prisma;
    private readonly logger;
    private server;
    private connectedUsers;
    constructor(prisma: PrismaService);
    setServer(server: Server): void;
    handleConnection(client: Socket, user: any): Promise<ConnectedUser>;
    handleDisconnection(client: Socket): Promise<void>;
    sendNotificationToUser(userId: string, notification: any): Promise<void>;
    sendMessageToUser(userId: string, event: string, data: any): Promise<void>;
    sendNotificationToRole(role: string, notification: any): Promise<void>;
    sendNotificationToRestaurant(restaurantId: string, notification: any): Promise<void>;
    sendNewOrderNotification(order: any): Promise<void>;
    sendOrderUpdate(orderId: string, update: any): Promise<void>;
    sendMessage(senderId: string, recipientId: string, message: any): Promise<{
        id: string;
        content: any;
        senderId: string;
        recipientId: string;
    }>;
    updateEmployeeLocation(employeeId: string, location: {
        lat: number;
        lng: number;
    }): Promise<void>;
    broadcastAnalyticsUpdate(restaurantId: string, analytics: any): Promise<void>;
    sendKitchenUpdate(restaurantId: string, update: any): Promise<void>;
    sendTableUpdate(restaurantId: string, tableUpdate: any): Promise<void>;
    sendInventoryAlert(restaurantId: string, alert: any): Promise<void>;
    private isUserOnline;
    private emitUserStatusUpdate;
    getConnectedUsers(): Promise<ConnectedUser[]>;
    getConnectedUsersInRestaurant(restaurantId: string): Promise<ConnectedUser[]>;
    broadcastSystemMaintenance(message: string, scheduledTime?: Date): Promise<void>;
    broadcastEmergencyAlert(alert: any): Promise<void>;
}
export {};
