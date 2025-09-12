import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        // DEVELOPMENT MODE: Skip token authentication to avoid rate limiting
        // TODO: Re-enable for production authentication
        if (typeof window !== 'undefined') {
          // Clear any existing malformed tokens that might cause issues
          const token = localStorage.getItem('accessToken');
          if (token === 'mock-jwt-token-for-development') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
          // Don't attach any tokens in development to prevent JWT failures
          // const token = localStorage.getItem('accessToken');
          // if (token) {
          //   config.headers.Authorization = `Bearer ${token}`;
          // }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (typeof window !== 'undefined') {
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (refreshToken) {
              try {
                const response = await this.post('/auth/refresh', {
                  refreshToken,
                });
                
                const { accessToken, refreshToken: newRefreshToken } = response.data;
                
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);
                
                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return this.client(originalRequest);
              } catch (refreshError) {
                // Refresh failed, redirect to login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                
                if (typeof window !== 'undefined') {
                  window.location.href = '/auth/login';
                }
                
                return Promise.reject(refreshError);
              }
            } else {
              // No refresh token, redirect to login
              if (typeof window !== 'undefined') {
                window.location.href = '/auth/login';
              }
            }
          }
        }

        // Handle other errors
        if (error.response?.status >= 500) {
          toast.error('Server error occurred. Please try again later.');
        } else if (error.response?.status === 403) {
          toast.error('Access denied. You do not have permission to perform this action.');
        } else if (error.response?.status === 404) {
          toast.error('Resource not found.');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else if (error.message) {
          toast.error(error.message);
        } else {
          toast.error('An unexpected error occurred.');
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // File upload method
  async upload<T = any>(
    url: string,
    file: File,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });

    return response.data;
  }

  // Pagination helper
  async getPaginated<T = any>(
    url: string,
    params?: {
      page?: number;
      limit?: number;
      [key: string]: any;
    }
  ): Promise<PaginatedResponse<T>> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  // Search helper
  async search<T = any>(
    url: string,
    query: string,
    filters?: Record<string, any>
  ): Promise<ApiResponse<T[]>> {
    const params = { q: query, ...filters };
    const response = await this.client.get(url, { params });
    return response.data;
  }
}

export const apiClient = new ApiClient();