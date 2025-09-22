import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  All,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request as ExpressRequest, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ServiceRegistryService, ServiceDiscoveryConfig, ServiceInstance } from './service-registry.service';
import { ApiGatewayService, RouteConfig, ProxyRequest } from './api-gateway.service';
import { ServiceMeshService, SecurityPolicy, LoadBalancingPolicy, ServiceMeshConfig } from './service-mesh.service';

class RegisterServiceDto {
  serviceName: string;
  version: string;
  host: string;
  port: number;
  healthCheckInterval: number;
  deregistrationDelay: number;
  tags: string[];
  metadata: Record<string, any>;
}

class AddRouteDto {
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

class AddSecurityPolicyDto {
  name: string;
  sourceService: string;
  targetService: string;
  methods: string[];
  endpoints: string[];
  action: 'allow' | 'deny';
  conditions?: Array<{
    type: 'header' | 'jwt_claim' | 'ip_range';
    key: string;
    operator: 'equals' | 'contains' | 'in' | 'regex';
    value: string | string[];
  }>;
  enabled: boolean;
}

class SetLoadBalancingPolicyDto {
  serviceName: string;
  algorithm: 'round_robin' | 'weighted' | 'least_connections' | 'consistent_hash';
  healthCheckConfig: {
    enabled: boolean;
    interval: number;
    timeout: number;
    healthyThreshold: number;
    unhealthyThreshold: number;
  };
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'exponential' | 'linear' | 'fixed';
    baseDelayMs: number;
    maxDelayMs: number;
  };
}

@ApiTags('microservices')
@Controller('api/v1/microservices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class MicroservicesController {
  constructor(
    private readonly serviceRegistry: ServiceRegistryService,
    private readonly apiGateway: ApiGatewayService,
    private readonly serviceMesh: ServiceMeshService,
  ) {}

  // Service Registry Endpoints
  @Post('registry/register')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Register a new service instance' })
  @ApiResponse({ status: 201, description: 'Service registered successfully' })
  async registerService(@Body() registerDto: RegisterServiceDto) {
    const config: ServiceDiscoveryConfig = {
      serviceName: registerDto.serviceName,
      version: registerDto.version,
      host: registerDto.host,
      port: registerDto.port,
      healthCheckInterval: registerDto.healthCheckInterval,
      deregistrationDelay: registerDto.deregistrationDelay,
      tags: registerDto.tags,
      metadata: registerDto.metadata,
    };

    const serviceId = await this.serviceRegistry.registerService(config);

    return {
      serviceId,
      message: 'Service registered successfully',
      config,
      registeredAt: new Date(),
    };
  }

  @Delete('registry/:serviceId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deregister a service instance' })
  @ApiResponse({ status: 200, description: 'Service deregistered successfully' })
  async deregisterService(@Param('serviceId') serviceId: string) {
    const success = await this.serviceRegistry.deregisterService(serviceId);

    return {
      success,
      message: success ? 'Service deregistered successfully' : 'Service not found',
      serviceId,
      deregisteredAt: new Date(),
    };
  }

  @Get('registry/services')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all registered services' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async getAllServices() {
    const services = await this.serviceRegistry.getAllServices();

    return {
      services,
      totalServices: Object.keys(services).length,
      totalInstances: Object.values(services).reduce((total, instances) => total + instances.length, 0),
      retrievedAt: new Date(),
    };
  }

  @Get('registry/services/:serviceName')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Discover service instances by name' })
  @ApiResponse({ status: 200, description: 'Service instances retrieved successfully' })
  async discoverServices(@Param('serviceName') serviceName: string) {
    const instances = await this.serviceRegistry.discoverServices(serviceName);

    return {
      serviceName,
      instances,
      totalInstances: instances.length,
      healthyInstances: instances.filter(i => i.status === 'healthy').length,
      retrievedAt: new Date(),
    };
  }

  @Get('registry/services/:serviceName/select')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Select a service instance using load balancing' })
  @ApiResponse({ status: 200, description: 'Service instance selected successfully' })
  async selectServiceInstance(
    @Param('serviceName') serviceName: string,
    @Query('strategy') strategy: 'round-robin' | 'weighted' | 'least-connections' | 'random' = 'weighted'
  ) {
    const instance = await this.serviceRegistry.selectServiceInstance(serviceName, strategy);

    return {
      serviceName,
      strategy,
      selectedInstance: instance,
      selectedAt: new Date(),
    };
  }

  // API Gateway Endpoints
  @Post('gateway/routes')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Add a new route to the API gateway' })
  @ApiResponse({ status: 201, description: 'Route added successfully' })
  async addRoute(@Body() routeDto: AddRouteDto) {
    const route: RouteConfig = {
      path: routeDto.path,
      serviceName: routeDto.serviceName,
      methods: routeDto.methods,
      stripPrefix: routeDto.stripPrefix,
      timeout: routeDto.timeout,
      retries: routeDto.retries,
      circuitBreaker: routeDto.circuitBreaker,
      rateLimit: routeDto.rateLimit,
      auth: routeDto.auth,
    };

    await this.apiGateway.addRoute(route);

    return {
      message: 'Route added successfully',
      route,
      addedAt: new Date(),
    };
  }

  @Delete('gateway/routes')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remove a route from the API gateway' })
  @ApiResponse({ status: 200, description: 'Route removed successfully' })
  async removeRoute(
    @Query('path') path: string,
    @Query('method') method?: string
  ) {
    const success = await this.apiGateway.removeRoute(path, method);

    return {
      success,
      message: success ? 'Route removed successfully' : 'Route not found',
      path,
      method,
      removedAt: new Date(),
    };
  }

  @Get('gateway/routes')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all gateway routes' })
  @ApiResponse({ status: 200, description: 'Routes retrieved successfully' })
  async getRoutes() {
    const routes = await this.apiGateway.getRoutes();

    return {
      routes,
      totalRoutes: routes.length,
      retrievedAt: new Date(),
    };
  }

  @Get('gateway/circuit-breakers')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get circuit breaker status' })
  @ApiResponse({ status: 200, description: 'Circuit breaker status retrieved successfully' })
  async getCircuitBreakerStatus() {
    const circuitBreakers = await this.apiGateway.getCircuitBreakerStatus();

    return {
      circuitBreakers,
      totalCircuitBreakers: circuitBreakers.length,
      openCircuits: circuitBreakers.filter(cb => cb.state === 'open').length,
      retrievedAt: new Date(),
    };
  }

  @Post('gateway/circuit-breakers/:serviceName/reset')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reset a circuit breaker' })
  @ApiResponse({ status: 200, description: 'Circuit breaker reset successfully' })
  async resetCircuitBreaker(@Param('serviceName') serviceName: string) {
    const success = await this.apiGateway.resetCircuitBreaker(serviceName);

    return {
      success,
      message: success ? 'Circuit breaker reset successfully' : 'Circuit breaker not found',
      serviceName,
      resetAt: new Date(),
    };
  }

  // Service Mesh Endpoints
  @Post('mesh/security-policies')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Add a security policy' })
  @ApiResponse({ status: 201, description: 'Security policy added successfully' })
  async addSecurityPolicy(@Body() policyDto: AddSecurityPolicyDto) {
    const policy: Omit<SecurityPolicy, 'id'> = {
      name: policyDto.name,
      sourceService: policyDto.sourceService,
      targetService: policyDto.targetService,
      methods: policyDto.methods,
      endpoints: policyDto.endpoints,
      action: policyDto.action,
      conditions: policyDto.conditions,
      enabled: policyDto.enabled,
    };

    const policyId = await this.serviceMesh.addSecurityPolicy(policy);

    return {
      policyId,
      message: 'Security policy added successfully',
      policy,
      addedAt: new Date(),
    };
  }

  @Post('mesh/load-balancing-policies')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Set load balancing policy for a service' })
  @ApiResponse({ status: 200, description: 'Load balancing policy set successfully' })
  async setLoadBalancingPolicy(@Body() policyDto: SetLoadBalancingPolicyDto) {
    const policy: LoadBalancingPolicy = {
      serviceName: policyDto.serviceName,
      algorithm: policyDto.algorithm,
      healthCheckConfig: policyDto.healthCheckConfig,
      retryPolicy: policyDto.retryPolicy,
    };

    await this.serviceMesh.setLoadBalancingPolicy(policy);

    return {
      message: 'Load balancing policy set successfully',
      policy,
      setAt: new Date(),
    };
  }

  @Get('mesh/metrics/:serviceName')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get service mesh metrics for a service' })
  @ApiResponse({ status: 200, description: 'Service metrics retrieved successfully' })
  async getServiceMetrics(
    @Param('serviceName') serviceName: string,
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
    const timeRange = start && end ? {
      start: new Date(start),
      end: new Date(end),
    } : undefined;

    const metrics = await this.serviceMesh.getServiceMetrics(serviceName, timeRange);

    return {
      serviceName,
      metrics,
      totalMetrics: metrics.length,
      timeRange,
      retrievedAt: new Date(),
    };
  }

  @Put('mesh/config')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update service mesh configuration' })
  @ApiResponse({ status: 200, description: 'Service mesh configuration updated successfully' })
  async updateMeshConfig(@Body() config: Partial<ServiceMeshConfig>) {
    await this.serviceMesh.updateMeshConfig(config);

    return {
      message: 'Service mesh configuration updated successfully',
      config: this.serviceMesh.getMeshConfig(),
      updatedAt: new Date(),
    };
  }

  @Get('mesh/config')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get service mesh configuration' })
  @ApiResponse({ status: 200, description: 'Service mesh configuration retrieved successfully' })
  async getMeshConfig() {
    const config = this.serviceMesh.getMeshConfig();

    return {
      config,
      retrievedAt: new Date(),
    };
  }

  // Gateway Proxy - This handles all other requests through the gateway
  @All('gateway/proxy/*')
  @ApiOperation({ summary: 'Proxy request through API gateway' })
  @ApiResponse({ status: 200, description: 'Request proxied successfully' })
  async proxyRequest(
    @Req() req: ExpressRequest,
    @Res() res: Response,
    @Request() nestReq: any
  ) {
    try {
      const proxyRequest: ProxyRequest = {
        method: req.method,
        path: req.path.replace('/api/v1/microservices/gateway/proxy', ''),
        headers: req.headers as Record<string, string>,
        body: req.body,
        query: req.query as Record<string, string>,
        user: nestReq.user,
      };

      const proxyResponse = await this.apiGateway.proxyRequest(proxyRequest);

      // Set response headers
      Object.entries(proxyResponse.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Add custom headers
      res.setHeader('X-Gateway-Response-Time', proxyResponse.responseTime.toString());
      if (proxyResponse.serviceInstance) {
        res.setHeader('X-Service-Instance', proxyResponse.serviceInstance.id);
        res.setHeader('X-Service-Version', proxyResponse.serviceInstance.version);
      }

      res.status(proxyResponse.statusCode).json(proxyResponse.body);

    } catch (error) {
      if (error.status) {
        res.status(error.status).json({
          error: error.message,
          statusCode: error.status,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  // Health and Status Endpoints
  @Get('health')
  @ApiOperation({ summary: 'Get microservices system health' })
  @ApiResponse({ status: 200, description: 'System health retrieved successfully' })
  async getSystemHealth() {
    const services = await this.serviceRegistry.getAllServices();
    const routes = await this.apiGateway.getRoutes();
    const circuitBreakers = await this.apiGateway.getCircuitBreakerStatus();
    const meshConfig = this.serviceMesh.getMeshConfig();

    const totalInstances = Object.values(services).reduce((total, instances) => total + instances.length, 0);
    const healthyInstances = Object.values(services)
      .flat()
      .filter(instance => instance.status === 'healthy').length;

    const openCircuits = circuitBreakers.filter(cb => cb.state === 'open').length;

    return {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        totalServices: Object.keys(services).length,
        totalInstances,
        healthyInstances,
        healthyPercentage: totalInstances > 0 ? (healthyInstances / totalInstances) * 100 : 0,
      },
      gateway: {
        totalRoutes: routes.length,
        circuitBreakers: {
          total: circuitBreakers.length,
          open: openCircuits,
          closed: circuitBreakers.filter(cb => cb.state === 'closed').length,
          halfOpen: circuitBreakers.filter(cb => cb.state === 'half-open').length,
        },
      },
      serviceMesh: {
        config: meshConfig,
        features: {
          tracing: meshConfig.enableTracing ? 'enabled' : 'disabled',
          metrics: meshConfig.enableMetrics ? 'enabled' : 'disabled',
          security: meshConfig.enableSecurityPolicies ? 'enabled' : 'disabled',
          loadBalancing: meshConfig.enableLoadBalancing ? 'enabled' : 'disabled',
          mTLS: meshConfig.enableServiceToServiceAuth ? 'enabled' : 'disabled',
        },
      },
      recommendations: this.generateHealthRecommendations(services, circuitBreakers, meshConfig),
    };
  }

  private generateHealthRecommendations(
    services: Record<string, ServiceInstance[]>,
    circuitBreakers: any[],
    meshConfig: ServiceMeshConfig
  ): string[] {
    const recommendations: string[] = [];

    const totalInstances = Object.values(services).reduce((total, instances) => total + instances.length, 0);
    const healthyInstances = Object.values(services)
      .flat()
      .filter(instance => instance.status === 'healthy').length;

    if (totalInstances > 0 && (healthyInstances / totalInstances) < 0.8) {
      recommendations.push('Consider investigating unhealthy service instances');
    }

    const openCircuits = circuitBreakers.filter(cb => cb.state === 'open').length;
    if (openCircuits > 0) {
      recommendations.push(`${openCircuits} circuit breaker(s) are open - investigate service issues`);
    }

    if (!meshConfig.enableTracing) {
      recommendations.push('Enable distributed tracing for better observability');
    }

    if (!meshConfig.enableSecurityPolicies) {
      recommendations.push('Enable security policies for better service-to-service security');
    }

    Object.entries(services).forEach(([serviceName, instances]) => {
      if (instances.length === 1) {
        recommendations.push(`Consider adding more instances for ${serviceName} to improve availability`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Microservices architecture is healthy and well-configured');
    }

    return recommendations;
  }
}