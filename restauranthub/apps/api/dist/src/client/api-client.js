"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = exports.RestaurantHubApiClient = void 0;
exports.createApiClient = createApiClient;
exports.getApiClient = getApiClient;
const axios_1 = __importDefault(require("axios"));
const events_1 = require("events");
class RestaurantHubApiClient extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.tokens = null;
        this.refreshPromise = null;
        this.config = {
            timeout: 30000,
            retries: 3,
            retryDelay: 1000,
            apiKey: '',
            version: 'v1',
            ...config,
        };
        this.client = axios_1.default.create({
            baseURL: `${this.config.baseURL}/api/${this.config.version}`,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
            },
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        this.client.interceptors.request.use((config) => {
            if (this.tokens?.accessToken) {
                config.headers.Authorization = `Bearer ${this.tokens.accessToken}`;
            }
            return config;
        }, (error) => Promise.reject(error));
        this.client.interceptors.response.use((response) => response, async (error) => {
            const originalRequest = error.config;
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                if (this.tokens?.refreshToken) {
                    try {
                        const newTokens = await this.refreshAccessToken();
                        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                        return this.client.request(originalRequest);
                    }
                    catch (refreshError) {
                        this.emit('authError', refreshError);
                        this.clearTokens();
                    }
                }
                else {
                    this.emit('authError', error);
                }
            }
            return Promise.reject(error);
        });
    }
    async signUp(userData) {
        const response = await this.post('/auth/signup', userData);
        if (response.data.tokens) {
            this.setTokens(response.data.tokens);
        }
        return response;
    }
    async signIn(credentials) {
        const response = await this.post('/auth/signin', credentials);
        if (response.data.tokens) {
            this.setTokens(response.data.tokens);
        }
        return response;
    }
    async signOut() {
        try {
            await this.post('/auth/logout');
        }
        finally {
            this.clearTokens();
        }
        return { data: null, statusCode: 200, timestamp: new Date().toISOString() };
    }
    async refreshAccessToken() {
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
    setTokens(tokens) {
        this.tokens = tokens;
        this.emit('tokensUpdated', tokens);
    }
    clearTokens() {
        this.tokens = null;
        this.emit('tokensCleared');
    }
    getTokens() {
        return this.tokens;
    }
    async getRestaurants(params) {
        return this.get('/restaurants', { params });
    }
    async getRestaurant(id) {
        return this.get(`/restaurants/${id}`);
    }
    async createRestaurant(restaurantData) {
        return this.post('/restaurants', restaurantData);
    }
    async updateRestaurant(id, restaurantData) {
        return this.put(`/restaurants/${id}`, restaurantData);
    }
    async deleteRestaurant(id) {
        return this.delete(`/restaurants/${id}`);
    }
    async getMenus(restaurantId, params) {
        return this.get(`/restaurants/${restaurantId}/menus`, { params });
    }
    async getMenu(restaurantId, menuId) {
        return this.get(`/restaurants/${restaurantId}/menus/${menuId}`);
    }
    async createMenu(restaurantId, menuData) {
        return this.post(`/restaurants/${restaurantId}/menus`, menuData);
    }
    async updateMenu(restaurantId, menuId, menuData) {
        return this.put(`/restaurants/${restaurantId}/menus/${menuId}`, menuData);
    }
    async getOrders(params) {
        return this.get('/orders', { params });
    }
    async getOrder(id) {
        return this.get(`/orders/${id}`);
    }
    async createOrder(orderData) {
        return this.post('/orders', orderData);
    }
    async updateOrderStatus(id, status) {
        return this.put(`/orders/${id}/status`, { status });
    }
    async getUserProfile() {
        return this.get('/users/profile');
    }
    async updateUserProfile(userData) {
        return this.put('/users/profile', userData);
    }
    async createPaymentIntent(paymentData) {
        return this.post(`/payments/${paymentData.gateway}/create-intent`, paymentData);
    }
    async confirmPayment(paymentId, gateway) {
        return this.post(`/payments/${gateway}/confirm/${paymentId}`);
    }
    async uploadFile(file, options) {
        const formData = new FormData();
        if (file instanceof File) {
            formData.append('file', file);
        }
        else {
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
    async globalSearch(query, type) {
        return this.get('/search/global', { params: { q: query, type } });
    }
    async getSearchSuggestions(query, type) {
        return this.get('/search/suggestions', { params: { q: query, type } });
    }
    async getBusinessMetrics(period) {
        return this.get('/analytics/business/metrics', { params: { period } });
    }
    async getRestaurantAnalytics(restaurantId, period) {
        return this.get(`/restaurants/${restaurantId}/analytics`, { params: { period } });
    }
    async healthCheck() {
        return this.get('/health');
    }
    async get(url, config) {
        return this.request('GET', url, undefined, config);
    }
    async post(url, data, config) {
        return this.request('POST', url, data, config);
    }
    async put(url, data, config) {
        return this.request('PUT', url, data, config);
    }
    async delete(url, config) {
        return this.request('DELETE', url, undefined, config);
    }
    async request(method, url, data, config) {
        let attempts = 0;
        const maxAttempts = this.config.retries + 1;
        while (attempts < maxAttempts) {
            try {
                const response = await this.client.request({
                    method,
                    url,
                    data,
                    ...config,
                });
                return response.data;
            }
            catch (error) {
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
    shouldRetry(error) {
        if (!error.response)
            return true;
        const status = error.response.status;
        return status >= 500 || status === 429;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    handleError(error) {
        if (error.response) {
            const apiError = new Error(error.response.data?.message || error.message);
            apiError.statusCode = error.response.status;
            apiError.response = error.response.data;
            return apiError;
        }
        return error;
    }
}
exports.RestaurantHubApiClient = RestaurantHubApiClient;
function createApiClient(config) {
    exports.apiClient = new RestaurantHubApiClient(config);
    return exports.apiClient;
}
function getApiClient() {
    if (!exports.apiClient) {
        throw new Error('API client not initialized. Call createApiClient() first.');
    }
    return exports.apiClient;
}
//# sourceMappingURL=api-client.js.map