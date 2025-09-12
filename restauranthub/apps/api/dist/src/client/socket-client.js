"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketClient = exports.RestaurantHubSocketClient = void 0;
exports.createSocketClient = createSocketClient;
exports.getSocketClient = getSocketClient;
const socket_io_client_1 = require("socket.io-client");
const events_1 = require("events");
class RestaurantHubSocketClient extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.socket = null;
        this.reconnectTimer = null;
        this.isConnecting = false;
        this.config = {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            timeout: 10000,
            ...config,
            auth: config.auth || {},
        };
    }
    connect() {
        return new Promise((resolve, reject) => {
            if (this.socket?.connected) {
                resolve();
                return;
            }
            if (this.isConnecting) {
                this.once('connected', resolve);
                this.once('error', reject);
                return;
            }
            this.isConnecting = true;
            try {
                this.socket = (0, socket_io_client_1.io)(this.config.baseURL, {
                    auth: this.config.auth,
                    timeout: this.config.timeout,
                    reconnection: this.config.reconnection,
                    reconnectionAttempts: this.config.reconnectionAttempts,
                    reconnectionDelay: this.config.reconnectionDelay,
                });
                this.setupEventHandlers();
                this.socket.once('connect', () => {
                    this.isConnecting = false;
                    this.emit('connected');
                    resolve();
                });
                this.socket.once('connect_error', (error) => {
                    this.isConnecting = false;
                    this.emit('error', error);
                    reject(error);
                });
            }
            catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }
    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.emit('disconnected');
    }
    updateAuth(token) {
        this.config.auth.token = token;
        if (this.socket?.connected) {
            this.socket.auth = { token };
            this.socket.disconnect().connect();
        }
    }
    isConnected() {
        return this.socket?.connected || false;
    }
    subscribeToOrderUpdates(orderId) {
        if (!this.socket)
            throw new Error('Socket not connected');
        if (orderId) {
            this.socket.emit('joinOrderRoom', orderId);
        }
        else {
            this.socket.emit('subscribeToOrders');
        }
    }
    unsubscribeFromOrderUpdates(orderId) {
        if (!this.socket)
            return;
        if (orderId) {
            this.socket.emit('leaveOrderRoom', orderId);
        }
        else {
            this.socket.emit('unsubscribeFromOrders');
        }
    }
    subscribeToRestaurantUpdates(restaurantId) {
        if (!this.socket)
            throw new Error('Socket not connected');
        this.socket.emit('joinRestaurantRoom', restaurantId);
    }
    unsubscribeFromRestaurantUpdates(restaurantId) {
        if (!this.socket)
            return;
        this.socket.emit('leaveRestaurantRoom', restaurantId);
    }
    sendMessage(messageData) {
        if (!this.socket)
            throw new Error('Socket not connected');
        this.socket.emit('sendMessage', messageData);
    }
    subscribeToMessages() {
        if (!this.socket)
            throw new Error('Socket not connected');
        this.socket.emit('subscribeToMessages');
    }
    subscribeToNotifications() {
        if (!this.socket)
            throw new Error('Socket not connected');
        this.socket.emit('subscribeToNotifications');
    }
    markNotificationAsRead(notificationId) {
        if (!this.socket)
            throw new Error('Socket not connected');
        this.socket.emit('markNotificationRead', notificationId);
    }
    subscribeToKitchenUpdates(restaurantId) {
        if (!this.socket)
            throw new Error('Socket not connected');
        this.socket.emit('subscribeToKitchen', restaurantId);
    }
    updateOrderInKitchen(orderId, status) {
        if (!this.socket)
            throw new Error('Socket not connected');
        this.socket.emit('kitchenOrderUpdate', { orderId, status });
    }
    subscribeToDriverTracking(orderId) {
        if (!this.socket)
            throw new Error('Socket not connected');
        this.socket.emit('trackDriver', orderId);
    }
    updateDriverLocation(orderId, location) {
        if (!this.socket)
            throw new Error('Socket not connected');
        this.socket.emit('driverLocationUpdate', { orderId, location });
    }
    setupEventHandlers() {
        if (!this.socket)
            return;
        this.socket.on('connect', () => {
            this.emit('connected');
        });
        this.socket.on('disconnect', (reason) => {
            this.emit('disconnected', reason);
            if (reason === 'io server disconnect') {
                this.scheduleReconnect();
            }
        });
        this.socket.on('connect_error', (error) => {
            this.emit('connectionError', error);
            this.scheduleReconnect();
        });
        this.socket.on('reconnect', (attemptNumber) => {
            this.emit('reconnected', attemptNumber);
        });
        this.socket.on('reconnect_error', (error) => {
            this.emit('reconnectionError', error);
        });
        this.socket.on('reconnect_failed', () => {
            this.emit('reconnectionFailed');
        });
        this.socket.on('orderUpdate', (data) => {
            this.emit('orderUpdate', data);
        });
        this.socket.on('newMessage', (data) => {
            this.emit('newMessage', data);
        });
        this.socket.on('notification', (data) => {
            this.emit('notification', data);
        });
        this.socket.on('restaurantStatusUpdate', (data) => {
            this.emit('restaurantStatusUpdate', data);
        });
        this.socket.on('menuItemUpdate', (data) => {
            this.emit('menuItemUpdate', data);
        });
        this.socket.on('kitchenOrderUpdate', (data) => {
            this.emit('kitchenOrderUpdate', data);
        });
        this.socket.on('driverLocationUpdate', (data) => {
            this.emit('driverLocationUpdate', data);
        });
        this.socket.on('paymentUpdate', (data) => {
            this.emit('paymentUpdate', data);
        });
        this.socket.on('error', (error) => {
            this.emit('socketError', error);
        });
        this.socket.on('authError', (error) => {
            this.emit('authError', error);
        });
        this.socket.on('authenticated', () => {
            this.emit('authenticated');
        });
    }
    scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = setTimeout(() => {
            if (!this.socket?.connected) {
                this.connect().catch((error) => {
                    this.emit('reconnectionError', error);
                });
            }
        }, this.config.reconnectionDelay);
    }
    getConnectionStatus() {
        return {
            connected: this.socket?.connected || false,
            connecting: this.isConnecting,
            id: this.socket?.id,
        };
    }
    on(event, listener) {
        return super.on(event, listener);
    }
}
exports.RestaurantHubSocketClient = RestaurantHubSocketClient;
function createSocketClient(config) {
    exports.socketClient = new RestaurantHubSocketClient(config);
    return exports.socketClient;
}
function getSocketClient() {
    if (!exports.socketClient) {
        throw new Error('Socket client not initialized. Call createSocketClient() first.');
    }
    return exports.socketClient;
}
//# sourceMappingURL=socket-client.js.map