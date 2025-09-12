import { RestaurantHubApiClient } from './api-client';
import { RestaurantHubSocketClient } from './socket-client';
import { User, Restaurant, Order, AuthTokens, SearchParams, OrderUpdate, NotificationData } from './types';
export declare function useApiClient(): {
    client: RestaurantHubApiClient | null;
    isInitialized: boolean;
    initializeClient: (config: any) => RestaurantHubApiClient;
};
export declare function useAuth(): {
    user: User | null;
    tokens: AuthTokens | null;
    loading: boolean;
    error: string | null;
    signUp: (client: RestaurantHubApiClient, userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role?: string;
        phoneNumber?: string;
    }) => Promise<import("./api-client").ApiResponse<{
        user: any;
        tokens: import("./api-client").AuthTokens;
    }>>;
    signIn: (client: RestaurantHubApiClient, credentials: {
        email: string;
        password: string;
    }) => Promise<import("./api-client").ApiResponse<{
        user: any;
        tokens: import("./api-client").AuthTokens;
    }>>;
    signOut: (client: RestaurantHubApiClient) => Promise<void>;
    updateProfile: (client: RestaurantHubApiClient, userData: Partial<User>) => Promise<import("./api-client").ApiResponse<any>>;
    setUser: import("react").Dispatch<import("react").SetStateAction<User | null>>;
    setTokens: import("react").Dispatch<import("react").SetStateAction<AuthTokens | null>>;
};
export declare function useRestaurants(): {
    restaurants: Restaurant[];
    loading: boolean;
    error: string | null;
    pagination: any;
    fetchRestaurants: (client: RestaurantHubApiClient, params?: SearchParams) => Promise<import("./api-client").PaginatedResponse<any>>;
    createRestaurant: (client: RestaurantHubApiClient, restaurantData: Partial<Restaurant>) => Promise<import("./api-client").ApiResponse<any>>;
    updateRestaurant: (client: RestaurantHubApiClient, id: string, restaurantData: Partial<Restaurant>) => Promise<import("./api-client").ApiResponse<any>>;
    deleteRestaurant: (client: RestaurantHubApiClient, id: string) => Promise<void>;
    setRestaurants: import("react").Dispatch<import("react").SetStateAction<Restaurant[]>>;
};
export declare function useOrders(): {
    orders: Order[];
    loading: boolean;
    error: string | null;
    pagination: any;
    fetchOrders: (client: RestaurantHubApiClient, params?: SearchParams) => Promise<import("./api-client").PaginatedResponse<any>>;
    createOrder: (client: RestaurantHubApiClient, orderData: Partial<Order>) => Promise<import("./api-client").ApiResponse<any>>;
    updateOrderStatus: (client: RestaurantHubApiClient, id: string, status: string) => Promise<import("./api-client").ApiResponse<any>>;
    setOrders: import("react").Dispatch<import("react").SetStateAction<Order[]>>;
};
export declare function useSocket(): {
    socket: RestaurantHubSocketClient | null;
    isConnected: boolean;
    error: string | null;
    initializeSocket: (config: any) => RestaurantHubSocketClient;
    connect: () => Promise<void>;
    disconnect: () => void;
};
export declare function useOrderUpdates(orderId?: string): {
    orderUpdate: OrderUpdate | null;
    subscribeToUpdates: (socketClient: RestaurantHubSocketClient, orderIdParam?: string) => () => void;
};
export declare function useNotifications(): {
    notifications: NotificationData[];
    unreadCount: number;
    subscribeToNotifications: (socketClient: RestaurantHubSocketClient) => () => void;
    markAsRead: (socketClient: RestaurantHubSocketClient, notificationId: string) => void;
    markAllAsRead: (socketClient: RestaurantHubSocketClient) => void;
    setNotifications: import("react").Dispatch<import("react").SetStateAction<NotificationData[]>>;
};
export declare function useFileUpload(): {
    uploading: boolean;
    progress: number;
    error: string | null;
    uploadFile: (client: RestaurantHubApiClient, file: File, options?: any) => Promise<import("./api-client").ApiResponse<{
        url: string;
        key: string;
    }>>;
};
export declare function useSearch<T = any>(): {
    results: T[];
    loading: boolean;
    error: string | null;
    suggestions: string[];
    search: (client: RestaurantHubApiClient, query: string, type?: string) => Promise<import("./api-client").ApiResponse<any[]>>;
    getSuggestions: (client: RestaurantHubApiClient, query: string, type?: string) => Promise<import("./api-client").ApiResponse<string[]>>;
    setResults: import("react").Dispatch<import("react").SetStateAction<T[]>>;
};
export declare function usePagination(initialPage?: number, initialLimit?: number): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    setPage: import("react").Dispatch<import("react").SetStateAction<number>>;
    setLimit: import("react").Dispatch<import("react").SetStateAction<number>>;
    updatePagination: (paginationData: any) => void;
    goToPage: (newPage: number) => void;
    nextPage: () => void;
    prevPage: () => void;
};
export declare function useTokenStorage(): {
    tokens: AuthTokens | null;
    saveTokens: (newTokens: AuthTokens) => void;
    clearTokens: () => void;
};
