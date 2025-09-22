import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
  meta?: any;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface EndpointDocumentation {
  method: string;
  path: string;
  description: string;
  authentication: boolean;
  rateLimit?: string;
  cache?: string;
  parameters?: ParameterDoc[];
  responseFormat: any;
  examples: {
    request?: any;
    response: any;
  };
}

export interface ParameterDoc {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
  validation?: string[];
}

@Injectable()
export class FrontendIntegrationService {
  private readonly logger = new Logger(FrontendIntegrationService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  // Standardized response formatter
  formatResponse<T>(
    data?: T,
    message?: string,
    pagination?: PaginationMeta,
    meta?: any
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      pagination,
      meta,
      timestamp: new Date().toISOString(),
    };
  }

  formatErrorResponse(
    error: string,
    statusCode?: number,
    meta?: any
  ): ApiResponse {
    return {
      success: false,
      error,
      meta: {
        ...meta,
        statusCode,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Generate pagination metadata
  generatePaginationMeta(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  // Get comprehensive API documentation
  getApiDocumentation(): { [category: string]: EndpointDocumentation[] } {
    return {
      // Posts API
      posts: [
        {
          method: 'GET',
          path: '/posts',
          description: 'Retrieve paginated list of forum posts with filtering options',
          authentication: true,
          cache: '5 minutes',
          parameters: [
            {
              name: 'forumId',
              type: 'string',
              required: false,
              description: 'Filter posts by forum ID',
              example: 'forum_123',
            },
            {
              name: 'userId',
              type: 'string',
              required: false,
              description: 'Filter posts by author user ID',
              example: 'user_456',
            },
            {
              name: 'search',
              type: 'string',
              required: false,
              description: 'Search posts by title or content',
              example: 'recipe tips',
              validation: ['1-100 characters', 'XSS sanitized'],
            },
            {
              name: 'page',
              type: 'number',
              required: false,
              description: 'Page number for pagination',
              example: 1,
            },
            {
              name: 'limit',
              type: 'number',
              required: false,
              description: 'Number of posts per page (max 50)',
              example: 20,
            },
          ],
          responseFormat: {
            success: true,
            data: {
              posts: [
                {
                  id: 'string',
                  title: 'string',
                  content: 'string',
                  author: {
                    id: 'string',
                    name: 'string',
                    avatar: 'string|null',
                    role: 'string',
                    verified: 'boolean',
                  },
                  forum: {
                    id: 'string',
                    name: 'string',
                    slug: 'string',
                  },
                  engagement: {
                    likes: 'number',
                    comments: 'number',
                    shares: 'number',
                    views: 'number',
                  },
                  createdAt: 'ISO datetime',
                  updatedAt: 'ISO datetime',
                }
              ]
            },
            pagination: 'PaginationMeta',
            timestamp: 'ISO datetime'
          },
          examples: {
            request: {
              url: '/posts?forumId=forum_123&page=1&limit=10',
              method: 'GET',
              headers: {
                'Authorization': 'Bearer <jwt_token>',
              },
            },
            response: {
              success: true,
              data: {
                posts: [
                  {
                    id: 'post_123',
                    title: 'Best Restaurant Management Tips',
                    content: 'Here are some proven strategies...',
                    author: {
                      id: 'user_456',
                      name: 'John Chef',
                      avatar: 'https://example.com/avatar.jpg',
                      role: 'RESTAURANT',
                      verified: true,
                    },
                    forum: {
                      id: 'forum_123',
                      name: 'Restaurant Management',
                      slug: 'restaurant-management',
                    },
                    engagement: {
                      likes: 15,
                      comments: 8,
                      shares: 3,
                      views: 156,
                    },
                    createdAt: '2024-01-15T10:30:00Z',
                    updatedAt: '2024-01-15T10:30:00Z',
                  }
                ]
              },
              pagination: {
                page: 1,
                limit: 10,
                total: 150,
                totalPages: 15,
                hasNext: true,
                hasPrev: false,
              },
              timestamp: '2024-01-15T10:35:00Z'
            },
          },
        },
        {
          method: 'POST',
          path: '/posts',
          description: 'Create a new forum post',
          authentication: true,
          rateLimit: '5 requests per minute',
          parameters: [
            {
              name: 'title',
              type: 'string',
              required: true,
              description: 'Post title',
              example: 'My Restaurant Experience',
              validation: ['3-200 characters', 'XSS sanitized'],
            },
            {
              name: 'content',
              type: 'string',
              required: true,
              description: 'Post content (supports markdown)',
              example: 'This is my experience with...',
              validation: ['10-10000 characters', 'XSS sanitized'],
            },
            {
              name: 'forumId',
              type: 'string',
              required: true,
              description: 'Forum ID where post will be created',
              example: 'forum_123',
            },
            {
              name: 'tags',
              type: 'string[]',
              required: false,
              description: 'Array of tags (max 10)',
              example: ['tips', 'management', 'efficiency'],
            },
          ],
          responseFormat: {
            success: true,
            data: {
              id: 'string',
              title: 'string',
              content: 'string',
              // ... full post object
            },
            message: 'Post created successfully',
            timestamp: 'ISO datetime'
          },
          examples: {
            request: {
              url: '/posts',
              method: 'POST',
              headers: {
                'Authorization': 'Bearer <jwt_token>',
                'Content-Type': 'application/json',
              },
              body: {
                title: 'Best Practices for Food Safety',
                content: 'Food safety is crucial for every restaurant...',
                forumId: 'forum_123',
                tags: ['food-safety', 'best-practices'],
              },
            },
            response: {
              success: true,
              data: {
                id: 'post_789',
                title: 'Best Practices for Food Safety',
                content: 'Food safety is crucial for every restaurant...',
                author: {
                  id: 'user_456',
                  name: 'John Chef',
                  avatar: 'https://example.com/avatar.jpg',
                  role: 'RESTAURANT',
                  verified: true,
                },
                // ... rest of post data
              },
              message: 'Post created successfully',
              timestamp: '2024-01-15T10:40:00Z'
            },
          },
        },
      ],

      // Search API
      search: [
        {
          method: 'GET',
          path: '/community/search',
          description: 'Universal search across posts, users, groups, and forums',
          authentication: true,
          rateLimit: '20 requests per minute',
          cache: '10 minutes',
          parameters: [
            {
              name: 'query',
              type: 'string',
              required: false,
              description: 'Search query',
              example: 'restaurant management',
              validation: ['1-100 characters', 'XSS sanitized'],
            },
            {
              name: 'type',
              type: 'string',
              required: false,
              description: 'Content type to search',
              example: 'posts',
              validation: ['one of: all, posts, users, groups, forums'],
            },
            {
              name: 'category',
              type: 'string',
              required: false,
              description: 'Filter by category',
              example: 'Restaurant Management',
            },
          ],
          responseFormat: {
            success: true,
            data: {
              results: 'SearchResult[]',
              type: 'string',
            },
            pagination: 'PaginationMeta',
            timestamp: 'ISO datetime'
          },
          examples: {
            request: {
              url: '/community/search?query=management&type=posts&page=1',
              method: 'GET',
            },
            response: {
              success: true,
              data: {
                results: [
                  {
                    id: 'post_123',
                    title: 'Restaurant Management Tips',
                    content: 'Here are some key strategies...',
                    type: 'post',
                    relevanceScore: 8.5,
                  }
                ],
                type: 'posts',
              },
              pagination: {
                page: 1,
                limit: 20,
                total: 45,
                totalPages: 3,
                hasNext: true,
                hasPrev: false,
              },
              timestamp: '2024-01-15T10:45:00Z'
            },
          },
        },
      ],

      // User & Networking API
      networking: [
        {
          method: 'POST',
          path: '/community/networking/follow/:userId',
          description: 'Follow another user',
          authentication: true,
          rateLimit: '10 requests per minute',
          parameters: [
            {
              name: 'userId',
              type: 'string',
              required: true,
              description: 'ID of user to follow',
              example: 'user_789',
            },
          ],
          responseFormat: {
            success: true,
            data: {
              id: 'string',
              followerId: 'string',
              followingId: 'string',
              createdAt: 'ISO datetime',
            },
            message: 'User followed successfully',
            timestamp: 'ISO datetime'
          },
          examples: {
            request: {
              url: '/community/networking/follow/user_789',
              method: 'POST',
            },
            response: {
              success: true,
              data: {
                id: 'follow_456',
                followerId: 'user_123',
                followingId: 'user_789',
                createdAt: '2024-01-15T10:50:00Z',
              },
              message: 'User followed successfully',
              timestamp: '2024-01-15T10:50:00Z'
            },
          },
        },
      ],

      // Admin API
      admin: [
        {
          method: 'GET',
          path: '/admin/community/dashboard',
          description: 'Get community management dashboard data',
          authentication: true,
          parameters: [],
          responseFormat: {
            success: true,
            data: {
              overview: {
                totalUsers: 'number',
                activeUsers: 'number',
                totalPosts: 'number',
                pendingReports: 'number',
              },
              recentActivity: 'object',
              topContributors: 'User[]',
            },
            timestamp: 'ISO datetime'
          },
          examples: {
            response: {
              success: true,
              data: {
                overview: {
                  totalUsers: 1250,
                  activeUsers: 856,
                  totalPosts: 3420,
                  pendingReports: 12,
                },
                recentActivity: {
                  period: '7 days',
                  newUsers: 45,
                  newPosts: 156,
                  newComments: 423,
                },
                topContributors: [
                  {
                    id: 'user_123',
                    name: 'John Chef',
                    reputation: { level: 15, totalPoints: 2450 },
                    stats: { posts: 67, comments: 234 },
                  }
                ],
              },
              timestamp: '2024-01-15T10:55:00Z'
            },
          },
        },
      ],
    };
  }

  // Get comprehensive field mappings for frontend forms
  getFormFieldMappings(): { [formType: string]: any } {
    return {
      createPost: {
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true,
            minLength: 3,
            maxLength: 200,
            placeholder: 'Enter post title...',
            validation: 'Title must be between 3 and 200 characters',
          },
          {
            name: 'content',
            type: 'textarea',
            required: true,
            minLength: 10,
            maxLength: 10000,
            placeholder: 'Write your post content here...',
            validation: 'Content must be between 10 and 10,000 characters',
            supportMarkdown: true,
          },
          {
            name: 'forumId',
            type: 'select',
            required: true,
            endpoint: '/forums',
            validation: 'Please select a forum',
          },
          {
            name: 'tags',
            type: 'tag-input',
            required: false,
            maxTags: 10,
            maxTagLength: 30,
            placeholder: 'Add tags...',
          },
        ],
        submitEndpoint: '/posts',
        method: 'POST',
        successMessage: 'Post created successfully!',
        redirectAfterSuccess: '/community/posts/{id}',
      },

      createComment: {
        fields: [
          {
            name: 'content',
            type: 'textarea',
            required: true,
            minLength: 1,
            maxLength: 2000,
            placeholder: 'Write your comment...',
            validation: 'Comment must be between 1 and 2,000 characters',
          },
        ],
        submitEndpoint: '/posts/{postId}/comments',
        method: 'POST',
        successMessage: 'Comment added successfully!',
      },

      search: {
        fields: [
          {
            name: 'query',
            type: 'text',
            required: false,
            minLength: 1,
            maxLength: 100,
            placeholder: 'Search posts, users, groups...',
          },
          {
            name: 'type',
            type: 'select',
            required: false,
            options: [
              { value: 'all', label: 'All Content' },
              { value: 'posts', label: 'Posts' },
              { value: 'users', label: 'Users' },
              { value: 'groups', label: 'Groups' },
              { value: 'forums', label: 'Forums' },
            ],
            default: 'all',
          },
        ],
        submitEndpoint: '/community/search',
        method: 'GET',
      },
    };
  }

  // Get comprehensive error code mappings
  getErrorCodeMappings(): { [code: string]: any } {
    return {
      // Authentication Errors
      'AUTH_001': {
        message: 'Authentication required',
        userMessage: 'Please log in to access this feature',
        action: 'redirect_to_login',
      },
      'AUTH_002': {
        message: 'Invalid or expired token',
        userMessage: 'Your session has expired. Please log in again',
        action: 'redirect_to_login',
      },
      'AUTH_003': {
        message: 'Insufficient permissions',
        userMessage: 'You do not have permission to perform this action',
        action: 'show_error_modal',
      },

      // Rate Limiting Errors
      'RATE_001': {
        message: 'Rate limit exceeded for post creation',
        userMessage: 'You are posting too quickly. Please wait before creating another post',
        action: 'show_countdown_timer',
      },
      'RATE_002': {
        message: 'Rate limit exceeded for likes',
        userMessage: 'Please wait before liking more posts',
        action: 'disable_like_buttons_temporarily',
      },

      // Validation Errors
      'VAL_001': {
        message: 'Title is required',
        userMessage: 'Please enter a title for your post',
        action: 'highlight_field',
        field: 'title',
      },
      'VAL_002': {
        message: 'Content too long',
        userMessage: 'Your post content is too long. Please shorten it',
        action: 'highlight_field_with_counter',
        field: 'content',
      },

      // Content Security Errors
      'SEC_001': {
        message: 'Content blocked by security filters',
        userMessage: 'Your content contains potentially harmful elements. Please review and try again',
        action: 'show_content_guidelines',
      },
      'SEC_002': {
        message: 'Suspicious links detected',
        userMessage: 'Please remove suspicious links from your content',
        action: 'highlight_suspicious_content',
      },

      // Resource Errors
      'RES_001': {
        message: 'Post not found',
        userMessage: 'The post you are looking for does not exist or has been removed',
        action: 'redirect_to_forum',
      },
      'RES_002': {
        message: 'Forum not found',
        userMessage: 'The forum you are trying to access does not exist',
        action: 'redirect_to_forum_list',
      },
    };
  }

  // Get frontend integration checklist
  getFrontendIntegrationChecklist(): { [category: string]: any[] } {
    return {
      authentication: [
        {
          item: 'JWT token storage (secure HttpOnly cookies recommended)',
          implemented: false,
        },
        {
          item: 'Automatic token refresh on expiry',
          implemented: false,
        },
        {
          item: 'Role-based access control in UI',
          implemented: false,
        },
      ],

      apiIntegration: [
        {
          item: 'Centralized API client with base URL configuration',
          implemented: false,
        },
        {
          item: 'Request/response interceptors for auth and error handling',
          implemented: false,
        },
        {
          item: 'Standardized error handling across all components',
          implemented: false,
        },
        {
          item: 'Loading states for all API calls',
          implemented: false,
        },
      ],

      userExperience: [
        {
          item: 'Rate limit feedback (show remaining requests)',
          implemented: false,
        },
        {
          item: 'Real-time notifications via WebSocket',
          implemented: false,
        },
        {
          item: 'Optimistic UI updates for likes, follows',
          implemented: false,
        },
        {
          item: 'Infinite scroll for posts and comments',
          implemented: false,
        },
      ],

      performance: [
        {
          item: 'Client-side caching for frequently accessed data',
          implemented: false,
        },
        {
          item: 'Image optimization and lazy loading',
          implemented: false,
        },
        {
          item: 'Virtualized lists for large datasets',
          implemented: false,
        },
        {
          item: 'Bundle splitting and code lazy loading',
          implemented: false,
        },
      ],

      security: [
        {
          item: 'Content sanitization on display',
          implemented: false,
        },
        {
          item: 'CSRF protection',
          implemented: false,
        },
        {
          item: 'XSS protection in rich text editors',
          implemented: false,
        },
        {
          item: 'Secure file upload handling',
          implemented: false,
        },
      ],
    };
  }

  // Generate TypeScript interfaces for frontend
  generateTypeScriptInterfaces(): string {
    return `
// Community API TypeScript Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'RESTAURANT' | 'EMPLOYEE' | 'VENDOR';
  avatar?: string;
  verified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: User;
  forum: Forum;
  tags: string[];
  engagement: PostEngagement;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface Forum {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  memberCount: number;
  postCount: number;
}

export interface PostEngagement {
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  postId: string;
  parentId?: string;
  totalLikes: number;
  totalReplies: number;
  createdAt: string;
  isLiked?: boolean;
}

export interface SearchResult {
  id: string;
  title?: string;
  content: string;
  type: 'post' | 'user' | 'group' | 'forum';
  relevanceScore: number;
  matchingInterests?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
  meta?: any;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  forumId: string;
  tags?: string[];
  visibility?: 'PUBLIC' | 'PRIVATE' | 'FORUM_ONLY';
}

export interface SearchRequest {
  query?: string;
  type?: 'all' | 'posts' | 'users' | 'groups' | 'forums';
  category?: string;
  tags?: string[];
  timeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
  page?: number;
  limit?: number;
}

// API Client Class Example
export class CommunityApiClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = \`\${this.baseUrl}\${endpoint}\`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.authToken && { Authorization: \`Bearer \${this.authToken}\` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(\`API request failed: \${response.statusText}\`);
    }

    return response.json();
  }

  // Posts API
  async getPosts(params: Partial<SearchRequest> = {}): Promise<ApiResponse<{ posts: Post[] }>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ posts: Post[] }>(\`/posts?\${query}\`);
  }

  async createPost(data: CreatePostRequest): Promise<ApiResponse<Post>> {
    return this.request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async likePost(postId: string): Promise<ApiResponse<any>> {
    return this.request<any>(\`/posts/\${postId}/like\`, {
      method: 'POST',
    });
  }

  // Search API
  async search(params: SearchRequest): Promise<ApiResponse<{ results: SearchResult[] }>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ results: SearchResult[] }>(\`/community/search?\${query}\`);
  }

  // User/Networking API
  async followUser(userId: string): Promise<ApiResponse<any>> {
    return this.request<any>(\`/community/networking/follow/\${userId}\`, {
      method: 'POST',
    });
  }

  async getNotifications(page = 1, limit = 20): Promise<ApiResponse<any>> {
    return this.request<any>(\`/community/notifications?page=\${page}&limit=\${limit}\`);
  }
}
`;
  }
}