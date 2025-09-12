import { EventEmitter } from 'events';
export interface ApiClientConfig {
    baseURL: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    apiKey?: string;
    version?: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface SearchParams extends PaginationParams {
    q?: string;
    filters?: Record<string, any>;
}
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    statusCode: number;
    timestamp: string;
}
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export declare class RestaurantHubApiClient extends EventEmitter {
    private client;
    private tokens;
    private refreshPromise;
    private config;
    constructor(config: ApiClientConfig);
    private setupInterceptors;
    signUp(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role?: string;
        phoneNumber?: string;
    }): Promise<ApiResponse<{
        user: any;
        tokens: AuthTokens;
    }>>;
    signIn(credentials: {
        email: string;
        password: string;
    }): Promise<ApiResponse<{
        user: any;
        tokens: AuthTokens;
    }>>;
    signOut(): Promise<ApiResponse>;
    refreshAccessToken(): Promise<AuthTokens>;
    setTokens(tokens: AuthTokens): void;
    clearTokens(): void;
    getTokens(): AuthTokens | null;
    getRestaurants(params?: SearchParams): Promise<PaginatedResponse<any>>;
    getRestaurant(id: string): Promise<ApiResponse<any>>;
    createRestaurant(restaurantData: any): Promise<ApiResponse<any>>;
    updateRestaurant(id: string, restaurantData: any): Promise<ApiResponse<any>>;
    deleteRestaurant(id: string): Promise<ApiResponse>;
    getMenus(restaurantId: string, params?: PaginationParams): Promise<PaginatedResponse<any>>;
    getMenu(restaurantId: string, menuId: string): Promise<ApiResponse<any>>;
    createMenu(restaurantId: string, menuData: any): Promise<ApiResponse<any>>;
    updateMenu(restaurantId: string, menuId: string, menuData: any): Promise<ApiResponse<any>>;
    getOrders(params?: SearchParams): Promise<PaginatedResponse<any>>;
    getOrder(id: string): Promise<ApiResponse<any>>;
    createOrder(orderData: any): Promise<ApiResponse<any>>;
    updateOrderStatus(id: string, status: string): Promise<ApiResponse<any>>;
    getUserProfile(): Promise<ApiResponse<any>>;
    updateUserProfile(userData: any): Promise<ApiResponse<any>>;
    createPaymentIntent(paymentData: {
        amount: number;
        currency: string;
        orderId: string;
        gateway: 'stripe' | 'razorpay';
    }): Promise<ApiResponse<any>>;
    confirmPayment(paymentId: string, gateway: string): Promise<ApiResponse<any>>;
    uploadFile(file: File | Buffer, options?: {
        category?: string;
        isPublic?: boolean;
        maxWidth?: number;
        maxHeight?: number;
    }): Promise<ApiResponse<{
        url: string;
        key: string;
    }>>;
    globalSearch(query: string, type?: string): Promise<ApiResponse<any[]>>;
    getSearchSuggestions(query: string, type?: string): Promise<ApiResponse<string[]>>;
    getBusinessMetrics(period?: string): Promise<ApiResponse<any>>;
    getRestaurantAnalytics(restaurantId: string, period?: string): Promise<ApiResponse<any>>;
    healthCheck(): Promise<ApiResponse<any>>;
    private get;
    private post;
    private put;
    private delete;
    private request;
    private shouldRetry;
    private delay;
    private handleError;
}
export declare let apiClient: RestaurantHubApiClient;
export declare function createApiClient(config: ApiClientConfig): RestaurantHubApiClient;
export declare function getApiClient(): RestaurantHubApiClient;
