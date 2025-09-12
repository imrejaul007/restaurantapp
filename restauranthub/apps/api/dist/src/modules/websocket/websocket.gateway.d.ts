import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WebsocketService } from './websocket.service';
import { PrismaService } from '../../prisma/prisma.service';
export declare class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private websocketService;
    private jwtService;
    private configService;
    private prisma;
    server: Server;
    private readonly logger;
    constructor(websocketService: WebsocketService, jwtService: JwtService, configService: ConfigService, prisma: PrismaService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    private authenticateSocket;
    handleSendMessage(client: Socket, data: {
        recipientId: string;
        content: string;
        type?: string;
        attachments?: any[];
    }): Promise<{
        success: boolean;
        messageId: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageId?: undefined;
    } | undefined>;
    handleMarkNotificationRead(client: Socket, data: {
        notificationId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    } | undefined>;
    handleJoinRoom(client: Socket, data: {
        room: string;
    }): Promise<{
        success: boolean;
        room: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        room?: undefined;
    } | undefined>;
    handleLeaveRoom(client: Socket, data: {
        room: string;
    }): Promise<{
        success: boolean;
        room: string;
    }>;
    handleUpdateLocation(client: Socket, data: {
        lat: number;
        lng: number;
    }): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleUpdateOrderStatus(client: Socket, data: {
        orderId: string;
        status: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleKitchenItemReady(client: Socket, data: {
        orderId: string;
        itemId: string;
    }): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleTableStatusUpdate(client: Socket, data: {
        tableId: string;
        status: string;
        occupancy?: number;
    }): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleTyping(client: Socket, data: {
        recipientId: string;
        isTyping: boolean;
    }): Promise<void>;
    private canJoinRoom;
}
