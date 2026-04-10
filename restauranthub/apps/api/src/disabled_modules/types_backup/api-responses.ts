/**
 * Common API Response Types
 *
 * This file contains standardized response types for the RestoPapa API
 * to ensure type safety and consistency across all endpoints.
 */

// Base Response Interface
export interface BaseApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
  path?: string;
  statusCode?: number;
}

// Success Response
export interface SuccessResponse<T = any> extends BaseApiResponse<T> {
  success: true;
  data: T;
}

// Error Response
export interface ErrorResponse extends BaseApiResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  data?: never;
}

// Pagination Metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated Response
export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: PaginationMeta;
}

// Authentication Response Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  profile?: UserProfileResponse;
}

export interface AuthResponse extends SuccessResponse<{
  user: AuthUserResponse;
  tokens: AuthTokens;
}> {}

export interface RefreshTokenResponse extends SuccessResponse<AuthTokens> {}

// User Management Response Types
export interface UserProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  avatar?: string;
  bio?: string;
  preferences: {
    language: string;
    notifications: boolean;
    newsletter: boolean;
  };
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse extends SuccessResponse<{
  id: string;
  email: string;
  role: string;
  status: string;
  isActive: boolean;
  emailVerified: boolean;
  loginCount: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  profile: UserProfileResponse;
}> {}

export interface UsersListResponse extends PaginatedResponse<UserResponse['data']> {}

// Restaurant Response Types
export interface RestaurantResponse {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  cuisineType: string[];
  priceRange: string;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  status: string;
  operatingHours: Record<string, string>;
  features: string[];
  imageUrl?: string;
  coverImageUrl?: string;
  gallery: string[];
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  verificationStatus: string;
  verificationDocuments: string[];
  taxInfo: {
    gstNumber: string;
    panNumber: string;
  };
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
  subscription: {
    plan: string;
    status: string;
    validUntil: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantsListResponse extends PaginatedResponse<RestaurantResponse> {}

// Job Response Types
export interface JobResponse {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  experience: string;
  education: string;
  jobType: string;
  workSchedule: string;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  benefits: string[];
  location: string;
  isRemote: boolean;
  status: string;
  priority: string;
  validTill: string;
  tags: string[];
  applicationCount: number;
  viewCount: number;
  restaurant: {
    id: string;
    name: string;
    imageUrl?: string;
    location: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface JobsListResponse extends PaginatedResponse<JobResponse> {}

export interface JobApplicationResponse {
  id: string;
  status: string;
  coverLetter: string;
  resumeUrl: string;
  portfolioUrl?: string;
  availability: {
    startDate: string;
    preferredShifts: string[];
    hoursPerWeek: number;
  };
  expectedSalary: number;
  experience: string;
  skills: string[];
  references: Array<{
    name: string;
    position: string;
    company: string;
    phone: string;
    email: string;
  }>;
  notes?: string;
  appliedAt: string;
  reviewedAt?: string;
  job: JobResponse;
  employee: {
    id: string;
    user: {
      profile: UserProfileResponse;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface JobApplicationsListResponse extends PaginatedResponse<JobApplicationResponse> {}

// Order Response Types
export interface OrderItemResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  customizations: string[];
  total: number;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  orderType: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  items: OrderItemResponse[];
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  specialInstructions?: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  restaurant: {
    id: string;
    name: string;
    phone: string;
    address: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrdersListResponse extends PaginatedResponse<OrderResponse> {}

// Community Response Types
export interface CommunityPostResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  imageUrls: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPostsListResponse extends PaginatedResponse<CommunityPostResponse> {}

// Analytics Response Types
export interface AnalyticsOverviewResponse extends SuccessResponse<{
  totalUsers: number;
  totalRestaurants: number;
  totalOrders: number;
  totalRevenue: number;
  growthRates: {
    users: number;
    restaurants: number;
    orders: number;
    revenue: number;
  };
  timeRange: string;
}> {}

export interface AnalyticsChartDataResponse extends SuccessResponse<{
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}> {}

// File Upload Response Types
export interface FileUploadResponse extends SuccessResponse<{
  url: string;
  publicId: string;
  filename: string;
  size: number;
  format: string;
  thumbnailUrl?: string;
}> {}

export interface MultipleFileUploadResponse extends SuccessResponse<Array<FileUploadResponse['data']>> {}

// Search Response Types
export interface SearchResult {
  id: string;
  type: 'restaurant' | 'job' | 'user' | 'post';
  title: string;
  description: string;
  imageUrl?: string;
  url: string;
  relevanceScore: number;
}

export interface SearchResponse extends SuccessResponse<{
  results: SearchResult[];
  totalResults: number;
  query: string;
  filters: Record<string, any>;
  suggestions: string[];
}> {}

// Health Check Response Types
export interface HealthCheckResponse extends SuccessResponse<{
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime: number;
    };
    redis: {
      status: 'up' | 'down';
      responseTime: number;
    };
    email: {
      status: 'up' | 'down';
      responseTime: number;
    };
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
}> {}

// Notification Response Types
export interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationsListResponse extends PaginatedResponse<NotificationResponse> {}

// Validation Error Response
export interface ValidationErrorResponse extends ErrorResponse {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: Array<{
      field: string;
      message: string;
      value?: any;
    }>;
  };
}

// Rate Limit Response
export interface RateLimitResponse extends ErrorResponse {
  error: {
    code: 'RATE_LIMIT_EXCEEDED';
    message: string;
    details: {
      limit: number;
      remaining: number;
      resetTime: string;
    };
  };
}

// Generic List Response Helper
export type ListResponse<T> = PaginatedResponse<T>;

// Generic Success Message Response
export interface MessageResponse extends SuccessResponse<never> {
  data?: never;
}

// Export utility type helpers
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
export type ApiPromise<T> = Promise<ApiResponse<T>>;

// Type guards for response validation
export const isSuccessResponse = <T>(response: ApiResponse<T>): response is SuccessResponse<T> => {
  return response.success === true;
};

export const isErrorResponse = (response: ApiResponse<any>): response is ErrorResponse => {
  return response.success === false;
};

export const isPaginatedResponse = <T>(response: ApiResponse<T[]>): response is PaginatedResponse<T> => {
  return isSuccessResponse(response) && 'pagination' in response;
};