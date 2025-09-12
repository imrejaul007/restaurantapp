import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
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

export class RestaurantHubApiClient extends EventEmitter {
  private client: AxiosInstance;
  private tokens: AuthTokens | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig) {
    super();
    
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      apiKey: '',
      version: 'v1',
      ...config,
    };

    this.client = axios.create({
      baseURL: `${this.config.baseURL}/api/${this.config.version}`,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${this.tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = (error as any).config;

        if ((error as any).response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.tokens?.refreshToken) {
            try {
              const newTokens = await this.refreshAccessToken();
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return this.client.request(originalRequest);
            } catch (refreshError) {
              this.emit('authError', refreshError);
              this.clearTokens();
            }
          } else {
            this.emit('authError', error);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  // Authentication methods
  async signUp(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    phoneNumber?: string;
  }): Promise<ApiResponse<{ user: any; tokens: AuthTokens }>> {
    const response = await this.post('/auth/signup', userData);
    if (response.data.tokens) {
      this.setTokens(response.data.tokens);
    }
    return response;
  }

  async signIn(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ user: any; tokens: AuthTokens }>> {
    const response = await this.post('/auth/signin', credentials);
    if (response.data.tokens) {
      this.setTokens(response.data.tokens);
    }
    return response;
  }

  async signOut(): Promise<ApiResponse> {
    try {
      await this.post('/auth/logout');
    } finally {
      this.clearTokens();
    }
    return { data: null, statusCode: 200, timestamp: new Date().toISOString() };
  }

  async refreshAccessToken(): Promise<AuthTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.post('/auth/refresh', {
      refreshToken: this.tokens.refreshToken,
    }).then((response) => {
      const newTokens = response.data.tokens;
      this.setTokens(newTokens);
      return newTokens;
    }).finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  setTokens(tokens: AuthTokens) {
    this.tokens = tokens;
    this.emit('tokensUpdated', tokens);
  }

  clearTokens() {
    this.tokens = null;
    this.emit('tokensCleared');
  }

  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  // Restaurant methods
  async getRestaurants(params?: SearchParams): Promise<PaginatedResponse<any>> {
    return this.get('/restaurants', { params });
  }

  async getRestaurant(id: string): Promise<ApiResponse<any>> {
    return this.get(`/restaurants/${id}`);
  }

  async createRestaurant(restaurantData: any): Promise<ApiResponse<any>> {
    return this.post('/restaurants', restaurantData);
  }

  async updateRestaurant(id: string, restaurantData: any): Promise<ApiResponse<any>> {
    return this.put(`/restaurants/${id}`, restaurantData);
  }

  async deleteRestaurant(id: string): Promise<ApiResponse> {
    return this.delete(`/restaurants/${id}`);
  }

  // Menu methods
  async getMenus(restaurantId: string, params?: PaginationParams): Promise<PaginatedResponse<any>> {
    return this.get(`/restaurants/${restaurantId}/menus`, { params });
  }

  async getMenu(restaurantId: string, menuId: string): Promise<ApiResponse<any>> {
    return this.get(`/restaurants/${restaurantId}/menus/${menuId}`);
  }

  async createMenu(restaurantId: string, menuData: any): Promise<ApiResponse<any>> {
    return this.post(`/restaurants/${restaurantId}/menus`, menuData);
  }

  async updateMenu(restaurantId: string, menuId: string, menuData: any): Promise<ApiResponse<any>> {
    return this.put(`/restaurants/${restaurantId}/menus/${menuId}`, menuData);
  }

  // Order methods
  async getOrders(params?: SearchParams): Promise<PaginatedResponse<any>> {
    return this.get('/orders', { params });
  }

  async getOrder(id: string): Promise<ApiResponse<any>> {
    return this.get(`/orders/${id}`);
  }

  async createOrder(orderData: any): Promise<ApiResponse<any>> {
    return this.post('/orders', orderData);
  }

  async updateOrderStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return this.put(`/orders/${id}/status`, { status });
  }

  // User methods
  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.get('/users/profile');
  }

  async updateUserProfile(userData: any): Promise<ApiResponse<any>> {
    return this.put('/users/profile', userData);
  }

  // Payment methods
  async createPaymentIntent(paymentData: {
    amount: number;
    currency: string;
    orderId: string;
    gateway: 'stripe' | 'razorpay';
  }): Promise<ApiResponse<any>> {
    return this.post(`/payments/${paymentData.gateway}/create-intent`, paymentData);
  }

  async confirmPayment(paymentId: string, gateway: string): Promise<ApiResponse<any>> {
    return this.post(`/payments/${gateway}/confirm/${paymentId}`);
  }

  // File upload methods
  async uploadFile(
    file: File | Buffer,
    options?: {
      category?: string;
      isPublic?: boolean;
      maxWidth?: number;
      maxHeight?: number;
    }
  ): Promise<ApiResponse<{ url: string; key: string }>> {
    const formData = new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    } else {
      // Convert Buffer/ArrayBuffer to Blob for FormData
      const blob = new Blob([file instanceof ArrayBuffer ? new Uint8Array(file) : new Uint8Array(Buffer.from(file))]);
      formData.append('file', blob);
    }

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    return this.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  // Search methods
  async globalSearch(query: string, type?: string): Promise<ApiResponse<any[]>> {
    return this.get('/search/global', { params: { q: query, type } });
  }

  async getSearchSuggestions(query: string, type?: string): Promise<ApiResponse<string[]>> {
    return this.get('/search/suggestions', { params: { q: query, type } });
  }

  // Analytics methods
  async getBusinessMetrics(period?: string): Promise<ApiResponse<any>> {
    return this.get('/analytics/business/metrics', { params: { period } });
  }

  async getRestaurantAnalytics(restaurantId: string, period?: string): Promise<ApiResponse<any>> {
    return this.get(`/restaurants/${restaurantId}/analytics`, { params: { period } });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.get('/health');
  }

  // HTTP methods with retry logic
  private async get(url: string, config?: AxiosRequestConfig): Promise<any> {
    return this.request('GET', url, undefined, config);
  }

  private async post(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    return this.request('POST', url, data, config);
  }

  private async put(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    return this.request('PUT', url, data, config);
  }

  private async delete(url: string, config?: AxiosRequestConfig): Promise<any> {
    return this.request('DELETE', url, undefined, config);
  }

  private async request(
    method: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<any> {
    let attempts = 0;
    const maxAttempts = this.config.retries + 1;

    while (attempts < maxAttempts) {
      try {
        const response: AxiosResponse = await this.client.request({
          method,
          url,
          data,
          ...config,
        });

        return response.data;
      } catch (error: any) {
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw this.handleError(error);
        }

        if (!this.shouldRetry(error)) {
          throw this.handleError(error);
        }

        await this.delay(this.config.retryDelay * attempts);
      }
    }
  }

  private shouldRetry(error: any): boolean {
    if (!(error as any).response) return true; // Network errors
    const status = (error as any).response.status;
    return status >= 500 || status === 429; // Server errors or rate limiting
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleError(error: any) {
    if ((error as any).response) {
      const apiError = new Error((error as any).response.data?.message || (error as Error).message);
      (apiError as any).statusCode = (error as any).response.status;
      (apiError as any).response = (error as any).response.data;
      return apiError;
    }
    return error;
  }
}

// Default client instance
export let apiClient: RestaurantHubApiClient;

export function createApiClient(config: ApiClientConfig): RestaurantHubApiClient {
  apiClient = new RestaurantHubApiClient(config);
  return apiClient;
}

export function getApiClient(): RestaurantHubApiClient {
  if (!apiClient) {
    throw new Error('API client not initialized. Call createApiClient() first.');
  }
  return apiClient;
}