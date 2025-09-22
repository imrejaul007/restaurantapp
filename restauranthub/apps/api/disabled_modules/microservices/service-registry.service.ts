import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdvancedCacheService } from '../cache/advanced-cache.service';

export interface ServiceInstance {
  id: string;
  name: string;
  version: string;
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'grpc';
  healthCheckUrl: string;
  metadata: Record<string, any>;
  registeredAt: Date;
  lastHeartbeat: Date;
  status: 'healthy' | 'unhealthy' | 'unknown';
  tags: string[];
  weight: number; // For load balancing
}

export interface ServiceDiscoveryConfig {
  serviceName: string;
  version: string;
  host: string;
  port: number;
  healthCheckInterval: number; // seconds
  deregistrationDelay: number; // seconds
  tags: string[];
  metadata: Record<string, any>;
}

@Injectable()
export class ServiceRegistryService {
  private readonly logger = new Logger(ServiceRegistryService.name);
  private localServiceInstance: ServiceInstance | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(
    private configService: ConfigService,
    private cacheService: AdvancedCacheService,
  ) {}

  async registerService(config: ServiceDiscoveryConfig): Promise<string> {
    try {
      const serviceId = this.generateServiceId(config.serviceName, config.host, config.port);

      const instance: ServiceInstance = {
        id: serviceId,
        name: config.serviceName,
        version: config.version,
        host: config.host,
        port: config.port,
        protocol: 'http',
        healthCheckUrl: `http://${config.host}:${config.port}/health`,
        metadata: config.metadata,
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        status: 'healthy',
        tags: config.tags,
        weight: 100, // Default weight
      };

      // Store in registry
      await this.cacheService.set(
        `service:${serviceId}`,
        instance,
        { ttl: config.deregistrationDelay + 60, namespace: 'service-registry' }
      );

      // Add to service list
      const serviceKey = `services:${config.serviceName}`;
      const existingServices = await this.cacheService.get<string[]>(serviceKey, 'service-registry') || [];
      if (!existingServices.includes(serviceId)) {
        existingServices.push(serviceId);
        await this.cacheService.set(
          serviceKey,
          existingServices,
          { ttl: 86400, namespace: 'service-registry' }
        );
      }

      this.localServiceInstance = instance;

      // Start heartbeat
      this.startHeartbeat(config.healthCheckInterval);

      this.logger.log(`Service registered: ${config.serviceName} (${serviceId})`);
      return serviceId;

    } catch (error) {
      this.logger.error('Error registering service:', error);
      throw error;
    }
  }

  async deregisterService(serviceId: string): Promise<boolean> {
    try {
      const instance = await this.cacheService.get<ServiceInstance>(`service:${serviceId}`, 'service-registry');
      if (!instance) {
        return false;
      }

      // Remove from service list
      const serviceKey = `services:${instance.name}`;
      const existingServices = await this.cacheService.get<string[]>(serviceKey, 'service-registry') || [];
      const updatedServices = existingServices.filter(id => id !== serviceId);

      await this.cacheService.set(
        serviceKey,
        updatedServices,
        { ttl: 86400, namespace: 'service-registry' }
      );

      // Remove service instance
      await this.cacheService.delete(`service:${serviceId}`, 'service-registry');

      // Stop heartbeat if this is the local service
      if (this.localServiceInstance?.id === serviceId) {
        this.stopHeartbeat();
        this.localServiceInstance = null;
      }

      this.logger.log(`Service deregistered: ${serviceId}`);
      return true;

    } catch (error) {
      this.logger.error('Error deregistering service:', error);
      return false;
    }
  }

  async discoverServices(serviceName: string): Promise<ServiceInstance[]> {
    try {
      const serviceKey = `services:${serviceName}`;
      const serviceIds = await this.cacheService.get<string[]>(serviceKey, 'service-registry') || [];

      const services: ServiceInstance[] = [];

      for (const serviceId of serviceIds) {
        const instance = await this.cacheService.get<ServiceInstance>(`service:${serviceId}`, 'service-registry');
        if (instance && instance.status === 'healthy') {
          services.push(instance);
        }
      }

      return services;

    } catch (error) {
      this.logger.error(`Error discovering services for ${serviceName}:`, error);
      return [];
    }
  }

  async getServiceInstance(serviceId: string): Promise<ServiceInstance | null> {
    try {
      return await this.cacheService.get<ServiceInstance>(`service:${serviceId}`, 'service-registry');
    } catch (error) {
      this.logger.error(`Error getting service instance ${serviceId}:`, error);
      return null;
    }
  }

  async getAllServices(): Promise<Record<string, ServiceInstance[]>> {
    try {
      const allServices: Record<string, ServiceInstance[]> = {};

      // Get all service names from cache keys
      const serviceNames = await this.getRegisteredServiceNames();

      for (const serviceName of serviceNames) {
        allServices[serviceName] = await this.discoverServices(serviceName);
      }

      return allServices;

    } catch (error) {
      this.logger.error('Error getting all services:', error);
      return {};
    }
  }

  async updateServiceHealth(serviceId: string, status: 'healthy' | 'unhealthy'): Promise<boolean> {
    try {
      const instance = await this.cacheService.get<ServiceInstance>(`service:${serviceId}`, 'service-registry');
      if (!instance) {
        return false;
      }

      instance.status = status;
      instance.lastHeartbeat = new Date();

      await this.cacheService.set(
        `service:${serviceId}`,
        instance,
        { ttl: 300, namespace: 'service-registry' } // 5 minutes TTL
      );

      return true;

    } catch (error) {
      this.logger.error(`Error updating service health for ${serviceId}:`, error);
      return false;
    }
  }

  async getHealthyServiceInstances(serviceName: string): Promise<ServiceInstance[]> {
    const allInstances = await this.discoverServices(serviceName);
    return allInstances.filter(instance =>
      instance.status === 'healthy' &&
      this.isInstanceRecentlyActive(instance)
    );
  }

  async selectServiceInstance(
    serviceName: string,
    strategy: 'round-robin' | 'weighted' | 'least-connections' | 'random' = 'weighted'
  ): Promise<ServiceInstance | null> {
    try {
      const healthyInstances = await this.getHealthyServiceInstances(serviceName);

      if (healthyInstances.length === 0) {
        return null;
      }

      if (healthyInstances.length === 1) {
        return healthyInstances[0];
      }

      switch (strategy) {
        case 'round-robin':
          return this.selectRoundRobin(serviceName, healthyInstances);

        case 'weighted':
          return this.selectWeighted(healthyInstances);

        case 'random':
          return healthyInstances[Math.floor(Math.random() * healthyInstances.length)];

        case 'least-connections':
          // For now, fall back to weighted selection
          return this.selectWeighted(healthyInstances);

        default:
          return healthyInstances[0];
      }

    } catch (error) {
      this.logger.error(`Error selecting service instance for ${serviceName}:`, error);
      return null;
    }
  }

  private async selectRoundRobin(serviceName: string, instances: ServiceInstance[]): Promise<ServiceInstance> {
    const roundRobinKey = `round-robin:${serviceName}`;
    const currentIndex = await this.cacheService.get<number>(roundRobinKey, 'service-registry') || 0;

    const nextIndex = (currentIndex + 1) % instances.length;
    await this.cacheService.set(
      roundRobinKey,
      nextIndex,
      { ttl: 3600, namespace: 'service-registry' }
    );

    return instances[currentIndex];
  }

  private selectWeighted(instances: ServiceInstance[]): ServiceInstance {
    const totalWeight = instances.reduce((sum, instance) => sum + instance.weight, 0);
    let random = Math.random() * totalWeight;

    for (const instance of instances) {
      random -= instance.weight;
      if (random <= 0) {
        return instance;
      }
    }

    return instances[0]; // Fallback
  }

  private isInstanceRecentlyActive(instance: ServiceInstance): boolean {
    const now = Date.now();
    const lastHeartbeat = new Date(instance.lastHeartbeat).getTime();
    const maxInactiveTime = 300000; // 5 minutes

    return (now - lastHeartbeat) <= maxInactiveTime;
  }

  private async getRegisteredServiceNames(): Promise<string[]> {
    // This is a simplified implementation
    // In a real service registry, you'd have a better way to list service names
    const knownServices = [
      'api-gateway',
      'user-service',
      'restaurant-service',
      'order-service',
      'payment-service',
      'notification-service',
      'analytics-service',
      'auth-service',
    ];

    const activeServices: string[] = [];

    for (const serviceName of knownServices) {
      const instances = await this.discoverServices(serviceName);
      if (instances.length > 0) {
        activeServices.push(serviceName);
      }
    }

    return activeServices;
  }

  private startHeartbeat(intervalSeconds: number): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      if (this.localServiceInstance) {
        await this.updateServiceHealth(this.localServiceInstance.id, 'healthy');
      }
    }, intervalSeconds * 1000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private generateServiceId(serviceName: string, host: string, port: number): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${serviceName}-${host}-${port}-${timestamp}-${random}`;
  }

  // Cleanup method to be called on service shutdown
  async cleanup(): Promise<void> {
    if (this.localServiceInstance) {
      await this.deregisterService(this.localServiceInstance.id);
    }
    this.stopHeartbeat();
  }
}