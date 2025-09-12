import { EventEmitter } from 'events';
export interface SocketClientConfig {
    baseURL: string;
    auth?: {
        token?: string;
    };
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    timeout?: number;
}
export interface OrderUpdate {
    orderId: string;
    status: string;
    updatedAt: string;
    estimatedDeliveryTime?: string;
}
export interface MessageData {
    recipientId: string;
    content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE';
    metadata?: any;
}
export interface NotificationData {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    data?: any;
    createdAt: string;
}
export declare class RestaurantHubSocketClient extends EventEmitter {
    private socket;
    private config;
    private reconnectTimer;
    private isConnecting;
    constructor(config: SocketClientConfig);
    connect(): Promise<void>;
    disconnect(): void;
    updateAuth(token: string): void;
    isConnected(): boolean;
    subscribeToOrderUpdates(orderId?: string): void;
    unsubscribeFromOrderUpdates(orderId?: string): void;
    subscribeToRestaurantUpdates(restaurantId: string): void;
    unsubscribeFromRestaurantUpdates(restaurantId: string): void;
    sendMessage(messageData: MessageData): void;
    subscribeToMessages(): void;
    subscribeToNotifications(): void;
    markNotificationAsRead(notificationId: string): void;
    subscribeToKitchenUpdates(restaurantId: string): void;
    updateOrderInKitchen(orderId: string, status: string): void;
    subscribeToDriverTracking(orderId: string): void;
    updateDriverLocation(orderId: string, location: {
        lat: number;
        lng: number;
    }): void;
    private setupEventHandlers;
    private scheduleReconnect;
    getConnectionStatus(): {
        connected: boolean;
        connecting: boolean;
        id?: string;
    };
    on(event: 'connected', listener: () => void): this;
    on(event: 'disconnected', listener: (reason?: string) => void): this;
    on(event: 'connectionError', listener: (error: Error) => void): this;
    on(event: 'reconnected', listener: (attemptNumber: number) => void): this;
    on(event: 'reconnectionError', listener: (error: Error) => void): this;
    on(event: 'reconnectionFailed', listener: () => void): this;
    on(event: 'orderUpdate', listener: (data: OrderUpdate) => void): this;
    on(event: 'newMessage', listener: (data: any) => void): this;
    on(event: 'notification', listener: (data: NotificationData) => void): this;
    on(event: 'restaurantStatusUpdate', listener: (data: any) => void): this;
    on(event: 'menuItemUpdate', listener: (data: any) => void): this;
    on(event: 'kitchenOrderUpdate', listener: (data: any) => void): this;
    on(event: 'driverLocationUpdate', listener: (data: any) => void): this;
    on(event: 'paymentUpdate', listener: (data: any) => void): this;
    on(event: 'socketError', listener: (error: any) => void): this;
    on(event: 'authError', listener: (error: any) => void): this;
    on(event: 'authenticated', listener: () => void): this;
    on(event: 'orderUpdate', listener: (data: any) => void): this;
    on(event: 'notification', listener: (data: any) => void): this;
}
export declare let socketClient: RestaurantHubSocketClient;
export declare function createSocketClient(config: SocketClientConfig): RestaurantHubSocketClient;
export declare function getSocketClient(): RestaurantHubSocketClient;
