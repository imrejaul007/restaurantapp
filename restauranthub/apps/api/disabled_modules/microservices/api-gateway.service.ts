import { Injectable, Logger, BadGatewayException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceRegistryService, ServiceInstance } from './service-registry.service';
import { AdvancedCacheService } from '../cache/advanced-cache.service';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';

export interface RouteConfig {
  path: string;
  serviceName: string;
  methods: string[];
  stripPrefix?: boolean;
  timeout?: number;
  retries?: number;
  circuitBreaker?: {
    enabled: boolean;
    errorThreshold: number;
    timeout: number;
    resetTimeout: number;
  };
  rateLimit?: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
  auth?: {
    required: boolean;
    roles?: string[];
  };
}

export interface CircuitBreakerState {
  serviceName: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: Date;
  nextAttemptTime: Date;
}

export interface ProxyRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  user?: any;
}

export interface ProxyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  serviceInstance?: ServiceInstance;
  responseTime: number;
}

@Injectable()
export class ApiGatewayService {
  private readonly logger = new Logger(ApiGatewayService.name);
  private routes: RouteConfig[] = [];
  private circuitBreakers = new Map<string, CircuitBreakerState>();

  constructor(
    private configService: ConfigService,
    private serviceRegistry: ServiceRegistryService,
    private cacheService: AdvancedCacheService,
  ) {
    this.initializeRoutes();
  }

  async proxyRequest(request: ProxyRequest): Promise<ProxyResponse> {
    const startTime = Date.now();

    try {
      // Find matching route
      const route = this.findMatchingRoute(request.path, request.method);
      if (!route) {
        throw new HttpException('Route not found', HttpStatus.NOT_FOUND);
      }

      // Check authentication if required
      if (route.auth?.required && !request.user) {
        throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
      }

      // Check authorization if roles are specified
      if (route.auth?.roles && request.user) {
        const hasRequiredRole = route.auth.roles.some(role =>
          request.user.roles?.includes(role) || request.user.role === role
        );
        if (!hasRequiredRole) {
          throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
        }
      }

      // Check rate limiting
      if (route.rateLimit?.enabled) {
        const rateLimitPassed = await this.checkRateLimit(request, route);
        if (!rateLimitPassed) {
          throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
        }
      }

      // Check circuit breaker
      if (route.circuitBreaker?.enabled) {
        const circuitOpen = await this.isCircuitOpen(route.serviceName);
        if (circuitOpen) {
          throw new BadGatewayException(`Service ${route.serviceName} is currently unavailable`);
        }
      }

      // Select service instance
      const serviceInstance = await this.serviceRegistry.selectServiceInstance(
        route.serviceName,
        'weighted'
      );

      if (!serviceInstance) {
        throw new BadGatewayException(`No healthy instances of ${route.serviceName} available`);
      }

      // Prepare target URL
      const targetPath = route.stripPrefix ? this.stripRoutePrefix(request.path, route.path) : request.path;
      const targetUrl = `${serviceInstance.protocol}://${serviceInstance.host}:${serviceInstance.port}${targetPath}`;

      // Prepare request configuration
      const axiosConfig: AxiosRequestConfig = {
        method: request.method.toLowerCase() as any,
        url: targetUrl,
        headers: this.prepareHeaders(request.headers, serviceInstance),
        timeout: route.timeout || 30000,
        params: request.query,
      };

      if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase())) {
        axiosConfig.data = request.body;
      }

      // Make request with retries
      const response = await this.makeRequestWithRetries(axiosConfig, route.retries || 1);

      // Record successful request for circuit breaker
      if (route.circuitBreaker?.enabled) {
        await this.recordCircuitBreakerSuccess(route.serviceName);
      }

      const responseTime = Date.now() - startTime;

      return {
        statusCode: response.status,
        headers: this.filterResponseHeaders(response.headers),
        body: response.data,
        serviceInstance,
        responseTime,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Record failure for circuit breaker
      const route = this.findMatchingRoute(request.path, request.method);
      if (route?.circuitBreaker?.enabled) {
        await this.recordCircuitBreakerFailure(route.serviceName);
      }

      this.logger.error(`Proxy request failed for ${request.method} ${request.path}:`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      // Handle network/service errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new BadGatewayException('Service unavailable');
      }

      if (error.response) {
        return {
          statusCode: error.response.status,
          headers: this.filterResponseHeaders(error.response.headers),
          body: error.response.data,
          responseTime,
        };
      }

      throw new BadGatewayException('Internal server error');
    }
  }

  async addRoute(route: RouteConfig): Promise<void> {
    this.routes.push(route);
    await this.cacheRoutes();
    this.logger.log(`Route added: ${route.method} ${route.path} -> ${route.serviceName}`);
  }

  async removeRoute(path: string, method?: string): Promise<boolean> {
    const initialLength = this.routes.length;
    this.routes = this.routes.filter(route =>
      !(route.path === path && (!method || route.methods.includes(method)))
    );

    if (this.routes.length < initialLength) {
      await this.cacheRoutes();
      this.logger.log(`Route removed: ${method || 'ALL'} ${path}`);
      return true;
    }

    return false;
  }

  async getRoutes(): Promise<RouteConfig[]> {
    return [...this.routes];
  }

  async getCircuitBreakerStatus(): Promise<CircuitBreakerState[]> {
    return Array.from(this.circuitBreakers.values());
  }

  async resetCircuitBreaker(serviceName: string): Promise<boolean> {
    const breaker = this.circuitBreakers.get(serviceName);
    if (breaker) {
      breaker.state = 'closed';
      breaker.failureCount = 0;
      this.logger.log(`Circuit breaker reset for service: ${serviceName}`);
      return true;
    }
    return false;
  }

  private findMatchingRoute(path: string, method: string): RouteConfig | null {
    return this.routes.find(route =>
      this.pathMatches(path, route.path) &&
      route.methods.includes(method.toUpperCase())
    );
  }

  private pathMatches(requestPath: string, routePath: string): boolean {
    // Simple path matching - in production, you'd want more sophisticated matching
    if (routePath.includes('*')) {
      const prefix = routePath.replace('*', '');
      return requestPath.startsWith(prefix);
    }

    if (routePath.includes(':')) {
      // Handle path parameters
      const routeSegments = routePath.split('/');
      const pathSegments = requestPath.split('/');

      if (routeSegments.length !== pathSegments.length) {
        return false;
      }

      return routeSegments.every((segment, index) =>
        segment.startsWith(':') || segment === pathSegments[index]
      );
    }

    return requestPath === routePath || requestPath.startsWith(routePath + '/');
  }

  private stripRoutePrefix(requestPath: string, routePath: string): string {
    if (routePath.endsWith('*')) {
      const prefix = routePath.slice(0, -1);
      return requestPath.replace(prefix, '');
    }
    return requestPath;
  }

  private prepareHeaders(
    requestHeaders: Record<string, string>,
    serviceInstance: ServiceInstance
  ): Record<string, string> {
    const headers = { ...requestHeaders };

    // Remove hop-by-hop headers
    delete headers.connection;
    delete headers['proxy-connection'];
    delete headers['transfer-encoding'];
    delete headers.upgrade;

    // Add service instance information
    headers['x-forwarded-for'] = requestHeaders['x-forwarded-for'] || 'unknown';
    headers['x-service-instance'] = serviceInstance.id;
    headers['x-service-version'] = serviceInstance.version;

    return headers;
  }

  private filterResponseHeaders(responseHeaders: Record<string, string>): Record<string, string> {
    const filtered = { ...responseHeaders };

    // Remove hop-by-hop headers
    delete filtered.connection;
    delete filtered['transfer-encoding'];
    delete filtered.upgrade;

    return filtered;
  }

  private async makeRequestWithRetries(
    config: AxiosRequestConfig,
    retries: number
  ): Promise<AxiosResponse> {
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await axios(config);
      } catch (error) {
        lastError = error;

        if (attempt === retries) {
          break;
        }

        // Only retry on network errors or 5xx responses
        if (error.response?.status && error.response.status < 500) {
          break;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));

        this.logger.warn(`Retrying request (attempt ${attempt + 2}/${retries + 1}) after ${delay}ms`);
      }
    }

    throw lastError;
  }

  private async checkRateLimit(request: ProxyRequest, route: RouteConfig): Promise<boolean> {
    if (!route.rateLimit?.enabled) {
      return true;
    }

    const key = `rate-limit:${route.path}:${request.headers['x-forwarded-for'] || 'unknown'}`;
    const windowStart = Math.floor(Date.now() / route.rateLimit.windowMs) * route.rateLimit.windowMs;
    const windowKey = `${key}:${windowStart}`;

    const currentCount = await this.cacheService.get<number>(windowKey, 'rate-limit') || 0;

    if (currentCount >= route.rateLimit.maxRequests) {
      return false;
    }

    await this.cacheService.set(
      windowKey,
      currentCount + 1,
      { ttl: Math.ceil(route.rateLimit.windowMs / 1000), namespace: 'rate-limit' }
    );

    return true;
  }

  private async isCircuitOpen(serviceName: string): Promise<boolean> {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      return false;
    }

    const now = new Date();

    switch (breaker.state) {
      case 'closed':
        return false;

      case 'open':
        if (now >= breaker.nextAttemptTime) {
          breaker.state = 'half-open';
          this.logger.log(`Circuit breaker for ${serviceName} moved to half-open state`);
          return false;
        }
        return true;

      case 'half-open':
        return false;

      default:
        return false;
    }
  }

  private async recordCircuitBreakerSuccess(serviceName: string): Promise<void> {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      return;
    }

    if (breaker.state === 'half-open') {
      breaker.state = 'closed';
      breaker.failureCount = 0;
      this.logger.log(`Circuit breaker for ${serviceName} moved to closed state`);
    }
  }

  private async recordCircuitBreakerFailure(serviceName: string): Promise<void> {
    let breaker = this.circuitBreakers.get(serviceName);

    if (!breaker) {
      breaker = {
        serviceName,
        state: 'closed',
        failureCount: 0,
        lastFailureTime: new Date(),
        nextAttemptTime: new Date(),
      };
      this.circuitBreakers.set(serviceName, breaker);
    }

    breaker.failureCount++;
    breaker.lastFailureTime = new Date();

    const route = this.routes.find(r => r.serviceName === serviceName);
    const errorThreshold = route?.circuitBreaker?.errorThreshold || 5;
    const resetTimeout = route?.circuitBreaker?.resetTimeout || 60000;

    if (breaker.failureCount >= errorThreshold && breaker.state === 'closed') {
      breaker.state = 'open';
      breaker.nextAttemptTime = new Date(Date.now() + resetTimeout);
      this.logger.warn(`Circuit breaker for ${serviceName} opened due to ${breaker.failureCount} failures`);
    }
  }

  private async cacheRoutes(): Promise<void> {
    await this.cacheService.set(
      'api-gateway-routes',
      this.routes,
      { ttl: 3600, namespace: 'api-gateway' }
    );
  }

  private initializeRoutes(): void {
    this.routes = [
      {
        path: '/api/v1/auth/*',
        serviceName: 'auth-service',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        stripPrefix: true,
        timeout: 10000,
        retries: 2,
        circuitBreaker: {
          enabled: true,
          errorThreshold: 5,
          timeout: 30000,
          resetTimeout: 60000,
        },
        rateLimit: {
          enabled: true,
          windowMs: 60000, // 1 minute
          maxRequests: 100,
        },
      },
      {
        path: '/api/v1/users/*',
        serviceName: 'user-service',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        stripPrefix: true,
        timeout: 15000,
        retries: 2,
        auth: {
          required: true,
        },
        circuitBreaker: {
          enabled: true,
          errorThreshold: 5,
          timeout: 30000,
          resetTimeout: 60000,
        },
      },
      {
        path: '/api/v1/restaurants/*',
        serviceName: 'restaurant-service',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        stripPrefix: true,
        timeout: 15000,
        retries: 2,
        auth: {
          required: true,
        },
        circuitBreaker: {
          enabled: true,
          errorThreshold: 5,
          timeout: 30000,
          resetTimeout: 60000,
        },
      },
      {
        path: '/api/v1/orders/*',
        serviceName: 'order-service',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        stripPrefix: true,
        timeout: 20000,
        retries: 3,
        auth: {
          required: true,
        },
        circuitBreaker: {
          enabled: true,
          errorThreshold: 3,
          timeout: 30000,
          resetTimeout: 60000,
        },
      },
      {
        path: '/api/v1/payments/*',
        serviceName: 'payment-service',
        methods: ['GET', 'POST', 'PUT'],
        stripPrefix: true,
        timeout: 30000,
        retries: 3,
        auth: {
          required: true,
        },
        circuitBreaker: {
          enabled: true,
          errorThreshold: 2,
          timeout: 30000,
          resetTimeout: 120000,
        },
      },
      {
        path: '/api/v1/notifications/*',
        serviceName: 'notification-service',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        stripPrefix: true,
        timeout: 10000,
        retries: 2,
        auth: {
          required: true,
        },
        circuitBreaker: {
          enabled: true,
          errorThreshold: 5,
          timeout: 30000,
          resetTimeout: 60000,
        },
      },
      {
        path: '/api/v1/analytics/*',
        serviceName: 'analytics-service',
        methods: ['GET', 'POST'],
        stripPrefix: true,
        timeout: 25000,
        retries: 2,
        auth: {
          required: true,
          roles: ['ADMIN', 'RESTAURANT'],
        },
        circuitBreaker: {
          enabled: true,
          errorThreshold: 5,
          timeout: 30000,
          resetTimeout: 60000,
        },
      },
      {
        path: '/api/v1/health',
        serviceName: 'api-gateway',
        methods: ['GET'],
        stripPrefix: false,
        timeout: 5000,
        retries: 0,
      },
    ];
  }
}