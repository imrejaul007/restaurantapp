import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceRegistryService, ServiceInstance } from './service-registry.service';
import { AdvancedCacheService } from '../cache/advanced-cache.service';

export interface ServiceMeshConfig {
  enableTracing: boolean;
  enableMetrics: boolean;
  enableSecurityPolicies: boolean;
  enableLoadBalancing: boolean;
  enableServiceToServiceAuth: boolean;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  baggage?: Record<string, string>;
  sampled: boolean;
}

export interface ServiceMeshMetrics {
  serviceName: string;
  targetService: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  success: boolean;
  traceId?: string;
}

export interface SecurityPolicy {
  id: string;
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

export interface LoadBalancingPolicy {
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

@Injectable()
export class ServiceMeshService {
  private readonly logger = new Logger(ServiceMeshService.name);
  private securityPolicies: SecurityPolicy[] = [];
  private loadBalancingPolicies = new Map<string, LoadBalancingPolicy>();
  private meshConfig: ServiceMeshConfig;

  constructor(
    private configService: ConfigService,
    private serviceRegistry: ServiceRegistryService,
    private cacheService: AdvancedCacheService,
  ) {
    this.meshConfig = {
      enableTracing: this.configService.get('MESH_ENABLE_TRACING', 'true') === 'true',
      enableMetrics: this.configService.get('MESH_ENABLE_METRICS', 'true') === 'true',
      enableSecurityPolicies: this.configService.get('MESH_ENABLE_SECURITY', 'true') === 'true',
      enableLoadBalancing: this.configService.get('MESH_ENABLE_LB', 'true') === 'true',
      enableServiceToServiceAuth: this.configService.get('MESH_ENABLE_MTLS', 'false') === 'true',
    };

    this.initializeDefaultPolicies();
  }

  // Distributed Tracing
  generateTraceContext(parentContext?: TraceContext): TraceContext {
    const traceId = parentContext?.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    const sampled = this.shouldSample();

    return {
      traceId,
      spanId,
      parentSpanId: parentContext?.spanId,
      baggage: parentContext?.baggage || {},
      sampled,
    };
  }

  async startSpan(
    operationName: string,
    context: TraceContext,
    metadata?: Record<string, any>
  ): Promise<string> {
    if (!this.meshConfig.enableTracing || !context.sampled) {
      return context.spanId;
    }

    const span = {
      traceId: context.traceId,
      spanId: context.spanId,
      parentSpanId: context.parentSpanId,
      operationName,
      startTime: new Date(),
      metadata,
      status: 'started',
    };

    await this.cacheService.set(
      `trace:${context.traceId}:${context.spanId}`,
      span,
      { ttl: 3600, namespace: 'tracing' } // 1 hour
    );

    return context.spanId;
  }

  async finishSpan(
    spanId: string,
    traceId: string,
    status: 'success' | 'error',
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.meshConfig.enableTracing) {
      return;
    }

    const span = await this.cacheService.get(`trace:${traceId}:${spanId}`, 'tracing');
    if (span) {
      span.endTime = new Date();
      span.status = status;
      span.duration = new Date().getTime() - new Date(span.startTime).getTime();
      if (metadata) {
        span.metadata = { ...span.metadata, ...metadata };
      }

      await this.cacheService.set(
        `trace:${traceId}:${spanId}`,
        span,
        { ttl: 3600, namespace: 'tracing' }
      );
    }
  }

  async getTrace(traceId: string): Promise<any[]> {
    if (!this.meshConfig.enableTracing) {
      return [];
    }

    // In a real implementation, you'd query your tracing backend (Jaeger, Zipkin, etc.)
    // For now, we'll return a mock trace structure
    return [];
  }

  // Service Mesh Metrics
  async recordMetrics(metrics: ServiceMeshMetrics): Promise<void> {
    if (!this.meshConfig.enableMetrics) {
      return;
    }

    const metricsKey = `metrics:${metrics.serviceName}:${metrics.targetService}:${Date.now()}`;

    await this.cacheService.set(
      metricsKey,
      metrics,
      { ttl: 86400, namespace: 'metrics' } // 24 hours
    );

    // Update aggregated metrics
    await this.updateAggregatedMetrics(metrics);
  }

  async getServiceMetrics(
    serviceName: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<ServiceMeshMetrics[]> {
    if (!this.meshConfig.enableMetrics) {
      return [];
    }

    // In a real implementation, you'd query your metrics store (Prometheus, etc.)
    // For now, return mock metrics
    return this.generateMockMetrics(serviceName, timeRange);
  }

  // Security Policies
  async addSecurityPolicy(policy: Omit<SecurityPolicy, 'id'>): Promise<string> {
    const newPolicy: SecurityPolicy = {
      id: this.generateId(),
      ...policy,
    };

    this.securityPolicies.push(newPolicy);

    await this.cacheService.set(
      'security_policies',
      this.securityPolicies,
      { ttl: 86400, namespace: 'service-mesh' }
    );

    this.logger.log(`Security policy added: ${newPolicy.name}`);
    return newPolicy.id;
  }

  async evaluateSecurityPolicy(
    sourceService: string,
    targetService: string,
    method: string,
    endpoint: string,
    headers: Record<string, string>
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (!this.meshConfig.enableSecurityPolicies) {
      return { allowed: true };
    }

    const applicablePolicies = this.securityPolicies.filter(policy =>
      policy.enabled &&
      (policy.sourceService === '*' || policy.sourceService === sourceService) &&
      (policy.targetService === '*' || policy.targetService === targetService) &&
      (policy.methods.includes('*') || policy.methods.includes(method)) &&
      this.endpointMatches(endpoint, policy.endpoints)
    );

    // If no policies apply, default to allow
    if (applicablePolicies.length === 0) {
      return { allowed: true };
    }

    // Evaluate policies in order
    for (const policy of applicablePolicies) {
      const conditionsMet = await this.evaluatePolicyConditions(policy, headers);

      if (conditionsMet) {
        return {
          allowed: policy.action === 'allow',
          reason: policy.action === 'deny' ? `Denied by policy: ${policy.name}` : undefined,
        };
      }
    }

    // Default deny if policies exist but conditions aren't met
    return { allowed: false, reason: 'No matching policy conditions' };
  }

  // Load Balancing
  async setLoadBalancingPolicy(policy: LoadBalancingPolicy): Promise<void> {
    this.loadBalancingPolicies.set(policy.serviceName, policy);

    await this.cacheService.set(
      `lb_policy:${policy.serviceName}`,
      policy,
      { ttl: 86400, namespace: 'service-mesh' }
    );

    this.logger.log(`Load balancing policy set for service: ${policy.serviceName}`);
  }

  async selectServiceInstanceWithPolicy(
    serviceName: string,
    request?: { headers?: Record<string, string>; clientId?: string }
  ): Promise<ServiceInstance | null> {
    if (!this.meshConfig.enableLoadBalancing) {
      return this.serviceRegistry.selectServiceInstance(serviceName);
    }

    const policy = this.loadBalancingPolicies.get(serviceName);
    if (!policy) {
      return this.serviceRegistry.selectServiceInstance(serviceName);
    }

    const healthyInstances = await this.serviceRegistry.getHealthyServiceInstances(serviceName);

    if (healthyInstances.length === 0) {
      return null;
    }

    switch (policy.algorithm) {
      case 'round_robin':
        return this.serviceRegistry.selectServiceInstance(serviceName, 'round-robin');

      case 'weighted':
        return this.serviceRegistry.selectServiceInstance(serviceName, 'weighted');

      case 'least_connections':
        return this.selectLeastConnections(healthyInstances);

      case 'consistent_hash':
        return this.selectConsistentHash(healthyInstances, request);

      default:
        return healthyInstances[0];
    }
  }

  // Service-to-Service Authentication
  async generateServiceToken(sourceService: string, targetService: string): Promise<string> {
    if (!this.meshConfig.enableServiceToServiceAuth) {
      return '';
    }

    const tokenPayload = {
      sourceService,
      targetService,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    };

    // In a real implementation, you'd sign this with a proper certificate
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

    await this.cacheService.set(
      `service_token:${sourceService}:${targetService}`,
      token,
      { ttl: 3600, namespace: 'service-mesh' }
    );

    return token;
  }

  async validateServiceToken(
    token: string,
    sourceService: string,
    targetService: string
  ): Promise<boolean> {
    if (!this.meshConfig.enableServiceToServiceAuth) {
      return true;
    }

    try {
      const tokenPayload = JSON.parse(Buffer.from(token, 'base64').toString());

      return (
        tokenPayload.sourceService === sourceService &&
        tokenPayload.targetService === targetService &&
        new Date(tokenPayload.expiresAt) > new Date()
      );
    } catch (error) {
      this.logger.error('Error validating service token:', error);
      return false;
    }
  }

  // Configuration
  async updateMeshConfig(config: Partial<ServiceMeshConfig>): Promise<void> {
    this.meshConfig = { ...this.meshConfig, ...config };

    await this.cacheService.set(
      'mesh_config',
      this.meshConfig,
      { ttl: 86400, namespace: 'service-mesh' }
    );

    this.logger.log('Service mesh configuration updated');
  }

  getMeshConfig(): ServiceMeshConfig {
    return { ...this.meshConfig };
  }

  // Private helper methods
  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateSpanId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldSample(): boolean {
    // Simple sampling strategy - in production, you'd want more sophisticated sampling
    const samplingRate = this.configService.get('TRACING_SAMPLING_RATE', '0.1');
    return Math.random() < parseFloat(samplingRate);
  }

  private async updateAggregatedMetrics(metrics: ServiceMeshMetrics): Promise<void> {
    const aggregationKey = `agg_metrics:${metrics.serviceName}:${metrics.targetService}`;
    const currentHour = new Date().setMinutes(0, 0, 0);

    const existing = await this.cacheService.get<any>(aggregationKey, 'metrics') || {
      hour: currentHour,
      requestCount: 0,
      successCount: 0,
      totalResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
    };

    existing.requestCount++;
    if (metrics.success) {
      existing.successCount++;
    }
    existing.totalResponseTime += metrics.responseTime;
    existing.maxResponseTime = Math.max(existing.maxResponseTime, metrics.responseTime);
    existing.minResponseTime = Math.min(existing.minResponseTime, metrics.responseTime);

    await this.cacheService.set(
      aggregationKey,
      existing,
      { ttl: 7200, namespace: 'metrics' } // 2 hours
    );
  }

  private generateMockMetrics(serviceName: string, timeRange?: { start: Date; end: Date }): ServiceMeshMetrics[] {
    const metrics: ServiceMeshMetrics[] = [];
    const start = timeRange?.start || new Date(Date.now() - 3600000); // Last hour
    const end = timeRange?.end || new Date();

    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      metrics.push({
        serviceName,
        targetService: ['user-service', 'order-service', 'payment-service'][Math.floor(Math.random() * 3)],
        method: ['GET', 'POST', 'PUT'][Math.floor(Math.random() * 3)],
        endpoint: ['/api/users', '/api/orders', '/api/payments'][Math.floor(Math.random() * 3)],
        statusCode: [200, 201, 400, 404, 500][Math.floor(Math.random() * 5)],
        responseTime: Math.random() * 1000 + 50,
        timestamp,
        success: Math.random() > 0.1, // 90% success rate
        traceId: this.generateTraceId(),
      });
    }

    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private endpointMatches(endpoint: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      if (pattern === '*') return true;
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(endpoint);
      }
      return endpoint === pattern;
    });
  }

  private async evaluatePolicyConditions(
    policy: SecurityPolicy,
    headers: Record<string, string>
  ): Promise<boolean> {
    if (!policy.conditions || policy.conditions.length === 0) {
      return true;
    }

    for (const condition of policy.conditions) {
      let conditionMet = false;

      switch (condition.type) {
        case 'header':
          const headerValue = headers[condition.key.toLowerCase()];
          if (headerValue) {
            conditionMet = this.evaluateConditionValue(headerValue, condition.operator, condition.value);
          }
          break;

        case 'jwt_claim':
          // In a real implementation, you'd decode and validate the JWT
          conditionMet = true; // Simplified for demo
          break;

        case 'ip_range':
          // In a real implementation, you'd check IP ranges
          conditionMet = true; // Simplified for demo
          break;
      }

      if (!conditionMet) {
        return false;
      }
    }

    return true;
  }

  private evaluateConditionValue(
    actualValue: string,
    operator: string,
    expectedValue: string | string[]
  ): boolean {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'contains':
        return actualValue.includes(expectedValue as string);
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      case 'regex':
        const regex = new RegExp(expectedValue as string);
        return regex.test(actualValue);
      default:
        return false;
    }
  }

  private selectLeastConnections(instances: ServiceInstance[]): ServiceInstance {
    // Simplified least connections - in production, you'd track actual connections
    return instances[Math.floor(Math.random() * instances.length)];
  }

  private selectConsistentHash(
    instances: ServiceInstance[],
    request?: { headers?: Record<string, string>; clientId?: string }
  ): ServiceInstance {
    // Simple consistent hash based on client ID or IP
    const hashKey = request?.clientId || request?.headers?.['x-forwarded-for'] || 'default';
    const hash = this.simpleHash(hashKey);
    const index = hash % instances.length;
    return instances[index];
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private initializeDefaultPolicies(): void {
    this.securityPolicies = [
      {
        id: 'default_allow_all',
        name: 'Default Allow All',
        sourceService: '*',
        targetService: '*',
        methods: ['*'],
        endpoints: ['*'],
        action: 'allow',
        enabled: true,
      },
      {
        id: 'deny_admin_external',
        name: 'Deny External Admin Access',
        sourceService: 'external',
        targetService: '*',
        methods: ['*'],
        endpoints: ['/admin/*', '/internal/*'],
        action: 'deny',
        enabled: true,
      },
    ];

    // Set default load balancing policies
    const defaultPolicy: LoadBalancingPolicy = {
      serviceName: 'default',
      algorithm: 'weighted',
      healthCheckConfig: {
        enabled: true,
        interval: 30000, // 30 seconds
        timeout: 5000, // 5 seconds
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        baseDelayMs: 100,
        maxDelayMs: 5000,
      },
    };

    const services = ['user-service', 'restaurant-service', 'order-service', 'payment-service'];
    services.forEach(service => {
      this.loadBalancingPolicies.set(service, { ...defaultPolicy, serviceName: service });
    });
  }
}