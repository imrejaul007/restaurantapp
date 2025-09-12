export { RestaurantHubApiClient, createApiClient, getApiClient } from './api-client';
export { RestaurantHubSocketClient, createSocketClient, getSocketClient } from './socket-client';
export * from './types';
export * from './react-hooks';
export declare const DEFAULT_CONFIG: {
    timeout: number;
    retries: number;
    retryDelay: number;
    version: string;
    reconnection: boolean;
    reconnectionAttempts: number;
    reconnectionDelay: number;
};
export declare const createFullApiUrl: (baseURL: string, version?: string) => string;
export declare const isApiError: (error: any) => boolean;
export declare const formatApiError: (error: any) => string;
export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly SIGNUP: "/auth/signup";
        readonly SIGNIN: "/auth/signin";
        readonly SIGNOUT: "/auth/logout";
        readonly REFRESH: "/auth/refresh";
        readonly VERIFY_EMAIL: "/auth/verify-email";
        readonly FORGOT_PASSWORD: "/auth/forgot-password";
        readonly RESET_PASSWORD: "/auth/reset-password";
    };
    readonly USERS: {
        readonly PROFILE: "/users/profile";
        readonly UPDATE_PROFILE: "/users/profile";
        readonly CHANGE_PASSWORD: "/users/change-password";
        readonly UPLOAD_AVATAR: "/users/avatar";
    };
    readonly RESTAURANTS: {
        readonly BASE: "/restaurants";
        readonly BY_ID: (id: string) => string;
        readonly MENUS: (id: string) => string;
        readonly MENU_BY_ID: (restaurantId: string, menuId: string) => string;
        readonly ANALYTICS: (id: string) => string;
    };
    readonly ORDERS: {
        readonly BASE: "/orders";
        readonly BY_ID: (id: string) => string;
        readonly STATUS: (id: string) => string;
        readonly CANCEL: (id: string) => string;
    };
    readonly PAYMENTS: {
        readonly STRIPE_INTENT: "/payments/stripe/create-intent";
        readonly STRIPE_CONFIRM: (id: string) => string;
        readonly RAZORPAY_ORDER: "/payments/razorpay/create-order";
        readonly RAZORPAY_VERIFY: "/payments/razorpay/verify";
    };
    readonly FILES: {
        readonly UPLOAD: "/files/upload";
        readonly UPLOAD_MULTIPLE: "/files/upload-multiple";
        readonly DELETE: (id: string) => string;
    };
    readonly SEARCH: {
        readonly GLOBAL: "/search/global";
        readonly RESTAURANTS: "/search/restaurants";
        readonly PRODUCTS: "/search/products";
        readonly SUGGESTIONS: "/search/suggestions";
    };
    readonly ANALYTICS: {
        readonly BUSINESS: "/analytics/business/metrics";
        readonly DATABASE: "/analytics/database/metrics";
        readonly REVENUE: "/analytics/revenue";
    };
    readonly JOBS: {
        readonly BASE: "/jobs";
        readonly BY_ID: (id: string) => string;
        readonly APPLY: (id: string) => string;
        readonly APPLICATIONS: "/jobs/applications";
    };
    readonly PRODUCTS: {
        readonly BASE: "/products";
        readonly BY_ID: (id: string) => string;
        readonly BY_VENDOR: (vendorId: string) => string;
    };
    readonly VENDOR_ORDERS: {
        readonly BASE: "/vendor-orders";
        readonly BY_ID: (id: string) => string;
        readonly BY_VENDOR: (vendorId: string) => string;
    };
    readonly HEALTH: {
        readonly CHECK: "/health";
        readonly DETAILED: "/health/detailed";
        readonly READY: "/health/ready";
        readonly LIVE: "/health/live";
    };
};
export declare const SOCKET_EVENTS: {
    readonly CONNECT: "connect";
    readonly DISCONNECT: "disconnect";
    readonly CONNECT_ERROR: "connect_error";
    readonly RECONNECT: "reconnect";
    readonly AUTHENTICATE: "authenticate";
    readonly AUTHENTICATED: "authenticated";
    readonly AUTH_ERROR: "authError";
    readonly ORDER_UPDATE: "orderUpdate";
    readonly ORDER_STATUS_CHANGE: "orderStatusChange";
    readonly NEW_ORDER: "newOrder";
    readonly SUBSCRIBE_TO_ORDERS: "subscribeToOrders";
    readonly UNSUBSCRIBE_FROM_ORDERS: "unsubscribeFromOrders";
    readonly JOIN_ORDER_ROOM: "joinOrderRoom";
    readonly LEAVE_ORDER_ROOM: "leaveOrderRoom";
    readonly KITCHEN_ORDER_UPDATE: "kitchenOrderUpdate";
    readonly SUBSCRIBE_TO_KITCHEN: "subscribeToKitchen";
    readonly RESTAURANT_STATUS_UPDATE: "restaurantStatusUpdate";
    readonly MENU_ITEM_UPDATE: "menuItemUpdate";
    readonly JOIN_RESTAURANT_ROOM: "joinRestaurantRoom";
    readonly LEAVE_RESTAURANT_ROOM: "leaveRestaurantRoom";
    readonly SEND_MESSAGE: "sendMessage";
    readonly NEW_MESSAGE: "newMessage";
    readonly SUBSCRIBE_TO_MESSAGES: "subscribeToMessages";
    readonly NOTIFICATION: "notification";
    readonly SUBSCRIBE_TO_NOTIFICATIONS: "subscribeToNotifications";
    readonly MARK_NOTIFICATION_READ: "markNotificationRead";
    readonly DRIVER_LOCATION_UPDATE: "driverLocationUpdate";
    readonly TRACK_DRIVER: "trackDriver";
    readonly PAYMENT_UPDATE: "paymentUpdate";
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
export declare const ERROR_CODES: {
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly TIMEOUT_ERROR: "TIMEOUT_ERROR";
    readonly AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR";
    readonly AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly NOT_FOUND_ERROR: "NOT_FOUND_ERROR";
    readonly CONFLICT_ERROR: "CONFLICT_ERROR";
    readonly RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR";
    readonly SERVER_ERROR: "SERVER_ERROR";
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
};
