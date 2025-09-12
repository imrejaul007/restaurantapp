"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = exports.HTTP_STATUS = exports.SOCKET_EVENTS = exports.API_ENDPOINTS = exports.formatApiError = exports.isApiError = exports.createFullApiUrl = exports.DEFAULT_CONFIG = exports.getSocketClient = exports.createSocketClient = exports.RestaurantHubSocketClient = exports.getApiClient = exports.createApiClient = exports.RestaurantHubApiClient = void 0;
var api_client_1 = require("./api-client");
Object.defineProperty(exports, "RestaurantHubApiClient", { enumerable: true, get: function () { return api_client_1.RestaurantHubApiClient; } });
Object.defineProperty(exports, "createApiClient", { enumerable: true, get: function () { return api_client_1.createApiClient; } });
Object.defineProperty(exports, "getApiClient", { enumerable: true, get: function () { return api_client_1.getApiClient; } });
var socket_client_1 = require("./socket-client");
Object.defineProperty(exports, "RestaurantHubSocketClient", { enumerable: true, get: function () { return socket_client_1.RestaurantHubSocketClient; } });
Object.defineProperty(exports, "createSocketClient", { enumerable: true, get: function () { return socket_client_1.createSocketClient; } });
Object.defineProperty(exports, "getSocketClient", { enumerable: true, get: function () { return socket_client_1.getSocketClient; } });
__exportStar(require("./types"), exports);
__exportStar(require("./react-hooks"), exports);
exports.DEFAULT_CONFIG = {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    version: 'v1',
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
};
const createFullApiUrl = (baseURL, version = 'v1') => {
    return `${baseURL.replace(/\/$/, '')}/api/${version}`;
};
exports.createFullApiUrl = createFullApiUrl;
const isApiError = (error) => {
    return error && typeof error.statusCode === 'number';
};
exports.isApiError = isApiError;
const formatApiError = (error) => {
    if ((0, exports.isApiError)(error)) {
        return error.message || `API Error: ${error.statusCode}`;
    }
    return error?.message || 'Unknown error occurred';
};
exports.formatApiError = formatApiError;
exports.API_ENDPOINTS = {
    AUTH: {
        SIGNUP: '/auth/signup',
        SIGNIN: '/auth/signin',
        SIGNOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        VERIFY_EMAIL: '/auth/verify-email',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
    },
    USERS: {
        PROFILE: '/users/profile',
        UPDATE_PROFILE: '/users/profile',
        CHANGE_PASSWORD: '/users/change-password',
        UPLOAD_AVATAR: '/users/avatar',
    },
    RESTAURANTS: {
        BASE: '/restaurants',
        BY_ID: (id) => `/restaurants/${id}`,
        MENUS: (id) => `/restaurants/${id}/menus`,
        MENU_BY_ID: (restaurantId, menuId) => `/restaurants/${restaurantId}/menus/${menuId}`,
        ANALYTICS: (id) => `/restaurants/${id}/analytics`,
    },
    ORDERS: {
        BASE: '/orders',
        BY_ID: (id) => `/orders/${id}`,
        STATUS: (id) => `/orders/${id}/status`,
        CANCEL: (id) => `/orders/${id}/cancel`,
    },
    PAYMENTS: {
        STRIPE_INTENT: '/payments/stripe/create-intent',
        STRIPE_CONFIRM: (id) => `/payments/stripe/confirm/${id}`,
        RAZORPAY_ORDER: '/payments/razorpay/create-order',
        RAZORPAY_VERIFY: '/payments/razorpay/verify',
    },
    FILES: {
        UPLOAD: '/files/upload',
        UPLOAD_MULTIPLE: '/files/upload-multiple',
        DELETE: (id) => `/files/${id}`,
    },
    SEARCH: {
        GLOBAL: '/search/global',
        RESTAURANTS: '/search/restaurants',
        PRODUCTS: '/search/products',
        SUGGESTIONS: '/search/suggestions',
    },
    ANALYTICS: {
        BUSINESS: '/analytics/business/metrics',
        DATABASE: '/analytics/database/metrics',
        REVENUE: '/analytics/revenue',
    },
    JOBS: {
        BASE: '/jobs',
        BY_ID: (id) => `/jobs/${id}`,
        APPLY: (id) => `/jobs/${id}/apply`,
        APPLICATIONS: '/jobs/applications',
    },
    PRODUCTS: {
        BASE: '/products',
        BY_ID: (id) => `/products/${id}`,
        BY_VENDOR: (vendorId) => `/vendors/${vendorId}/products`,
    },
    VENDOR_ORDERS: {
        BASE: '/vendor-orders',
        BY_ID: (id) => `/vendor-orders/${id}`,
        BY_VENDOR: (vendorId) => `/vendors/${vendorId}/orders`,
    },
    HEALTH: {
        CHECK: '/health',
        DETAILED: '/health/detailed',
        READY: '/health/ready',
        LIVE: '/health/live',
    },
};
exports.SOCKET_EVENTS = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',
    RECONNECT: 'reconnect',
    AUTHENTICATE: 'authenticate',
    AUTHENTICATED: 'authenticated',
    AUTH_ERROR: 'authError',
    ORDER_UPDATE: 'orderUpdate',
    ORDER_STATUS_CHANGE: 'orderStatusChange',
    NEW_ORDER: 'newOrder',
    SUBSCRIBE_TO_ORDERS: 'subscribeToOrders',
    UNSUBSCRIBE_FROM_ORDERS: 'unsubscribeFromOrders',
    JOIN_ORDER_ROOM: 'joinOrderRoom',
    LEAVE_ORDER_ROOM: 'leaveOrderRoom',
    KITCHEN_ORDER_UPDATE: 'kitchenOrderUpdate',
    SUBSCRIBE_TO_KITCHEN: 'subscribeToKitchen',
    RESTAURANT_STATUS_UPDATE: 'restaurantStatusUpdate',
    MENU_ITEM_UPDATE: 'menuItemUpdate',
    JOIN_RESTAURANT_ROOM: 'joinRestaurantRoom',
    LEAVE_RESTAURANT_ROOM: 'leaveRestaurantRoom',
    SEND_MESSAGE: 'sendMessage',
    NEW_MESSAGE: 'newMessage',
    SUBSCRIBE_TO_MESSAGES: 'subscribeToMessages',
    NOTIFICATION: 'notification',
    SUBSCRIBE_TO_NOTIFICATIONS: 'subscribeToNotifications',
    MARK_NOTIFICATION_READ: 'markNotificationRead',
    DRIVER_LOCATION_UPDATE: 'driverLocationUpdate',
    TRACK_DRIVER: 'trackDriver',
    PAYMENT_UPDATE: 'paymentUpdate',
};
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
};
exports.ERROR_CODES = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    CONFLICT_ERROR: 'CONFLICT_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};
//# sourceMappingURL=index.js.map