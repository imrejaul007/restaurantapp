import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CircuitBreakerService } from '../../common/circuit-breaker.service';
import { DatabaseCircuitBreaker, ExternalApiCircuitBreaker } from '../../decorators/circuit-breaker.decorator';
import { ResilientDatabaseService } from '../../services/resilient-database.service';
import { ResilientHttpService } from '../../services/resilient-http.service';
import { WebsocketService } from '../websocket/websocket.service';

export interface DeliveryAssignment {
  orderId: string;
  driverId: string;
  estimatedDeliveryTime: Date;
  pickupLocation: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  deliveryLocation: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
}

export interface DeliveryUpdate {
  orderId: string;
  status: 'assigned' | 'pickup' | 'in_transit' | 'delivered' | 'failed';
  location?: { lat: number; lng: number };
  notes?: string;
  estimatedDelivery?: Date;
}

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private prisma: PrismaService,
    private circuitBreaker: CircuitBreakerService,
    private resilientDb: ResilientDatabaseService,
    private resilientHttp: ResilientHttpService,
    private websocketService: WebsocketService,
  ) {}

  @ExternalApiCircuitBreaker('delivery-management')
  async assignDelivery(assignment: DeliveryAssignment) {
    this.logger.log(`Assigning delivery for order ${assignment.orderId} to driver ${assignment.driverId}`);

    try {
      const driverAvailability = await this.resilientHttp.get(
        `/drivers/${assignment.driverId}/availability`,
        {
          circuitBreakerName: 'driver-service',
          cacheKey: `driver:${assignment.driverId}:availability`,
          cacheTtl: 30000,
          retryAttempts: 2,
          timeoutMs: 5000,
          fallbackResponse: { available: false, message: 'Driver status unknown' }
        }
      );

      if (!driverAvailability.available) {
        throw new BadRequestException(`Driver ${assignment.driverId} is not available`);
      }

      const deliveryRecord = await this.resilientDb.executeWriteOperation(
        () => this.prisma.delivery.create({
          data: {
            orderId: assignment.orderId,
            driverId: assignment.driverId,
            status: 'assigned',
            estimatedDeliveryTime: assignment.estimatedDeliveryTime,
            pickupAddress: assignment.pickupLocation.address,
            pickupLatitude: assignment.pickupLocation.coordinates.lat,
            pickupLongitude: assignment.pickupLocation.coordinates.lng,
            deliveryAddress: assignment.deliveryLocation.address,
            deliveryLatitude: assignment.deliveryLocation.coordinates.lat,
            deliveryLongitude: assignment.deliveryLocation.coordinates.lng,
            trackingId: this.generateTrackingId(),
            assignedAt: new Date(),
          }
        }),
        { circuitBreakerName: 'delivery-creation' }
      );

      await this.resilientHttp.post(`/drivers/${assignment.driverId}/assign`, {
        deliveryId: deliveryRecord.id,
        orderId: assignment.orderId,
        pickupLocation: assignment.pickupLocation,
        deliveryLocation: assignment.deliveryLocation,
        estimatedTime: assignment.estimatedDeliveryTime
      }, {
        circuitBreakerName: 'driver-service',
        retryAttempts: 3,
        timeoutMs: 10000
      });

      await this.websocketService.sendDeliveryUpdate(assignment.orderId, {
        status: 'assigned',
        driverId: assignment.driverId,
        trackingId: deliveryRecord.trackingId,
        estimatedDelivery: assignment.estimatedDeliveryTime
      });

      this.logger.log(`Delivery assigned successfully for order ${assignment.orderId}`);
      return deliveryRecord;

    } catch (error) {
      this.logger.error(`Failed to assign delivery for order ${assignment.orderId}:`, error);
      throw new BadRequestException('Failed to assign delivery driver');
    }
  }

  @DatabaseCircuitBreaker()
  async updateDeliveryStatus(update: DeliveryUpdate) {
    const delivery = await this.resilientDb.executeReadOperation(
      () => this.prisma.delivery.findUnique({
        where: { orderId: update.orderId },
        include: { order: { select: { orderNumber: true } } }
      }),
      { cacheKey: `delivery:${update.orderId}`, cacheTtl: 30000 }
    );

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const updatedDelivery = await this.resilientDb.executeWriteOperation(
      () => this.prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          status: update.status,
          currentLatitude: update.location?.lat,
          currentLongitude: update.location?.lng,
          lastUpdated: new Date(),
          estimatedDeliveryTime: update.estimatedDelivery || delivery.estimatedDeliveryTime,
          deliveredAt: update.status === 'delivered' ? new Date() : undefined,
          notes: update.notes,
        }
      }),
      { circuitBreakerName: 'delivery-update' }
    );

    await this.resilientDb.executeWriteOperation(
      () => this.prisma.deliveryStatusHistory.create({
        data: {
          deliveryId: delivery.id,
          status: update.status,
          latitude: update.location?.lat,
          longitude: update.location?.lng,
          notes: update.notes,
          timestamp: new Date(),
        }
      }),
      { circuitBreakerName: 'delivery-history' }
    );

    await this.websocketService.sendDeliveryUpdate(update.orderId, {
      status: update.status,
      location: update.location,
      notes: update.notes,
      trackingId: delivery.trackingId,
      estimatedDelivery: updatedDelivery.estimatedDeliveryTime,
      lastUpdated: new Date()
    });

    if (update.status === 'delivered') {
      await this.handleDeliveryCompletion(delivery.orderId);
    }

    this.logger.log(`Delivery status updated for order ${update.orderId}: ${update.status}`);
    return updatedDelivery;
  }

  @DatabaseCircuitBreaker()
  async trackDelivery(orderId: string) {
    const delivery = await this.resilientDb.executeReadOperation(
      () => this.prisma.delivery.findUnique({
        where: { orderId },
        include: {
          order: { select: { orderNumber: true, totalAmount: true } },
          statusHistory: { orderBy: { timestamp: 'desc' }, take: 10 }
        }
      }),
      { cacheKey: `delivery:${orderId}:track`, cacheTtl: 30000 }
    );

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    let driverInfo = null;
    if (delivery.driverId) {
      try {
        driverInfo = await this.resilientHttp.get(
          `/drivers/${delivery.driverId}/info`,
          {
            circuitBreakerName: 'driver-service',
            cacheKey: `driver:${delivery.driverId}:info`,
            cacheTtl: 300000,
            retryAttempts: 1,
            timeoutMs: 3000,
            fallbackResponse: {
              name: 'Driver information unavailable',
              phone: 'N/A',
              vehicle: 'Unknown'
            }
          }
        );
      } catch (error) {
        this.logger.warn(`Failed to get driver info for ${delivery.driverId}:`, error);
      }
    }

    return {
      orderId,
      trackingId: delivery.trackingId,
      status: delivery.status,
      estimatedDeliveryTime: delivery.estimatedDeliveryTime,
      assignedAt: delivery.assignedAt,
      deliveredAt: delivery.deliveredAt,
      currentLocation: delivery.currentLatitude && delivery.currentLongitude ? {
        lat: delivery.currentLatitude,
        lng: delivery.currentLongitude
      } : null,
      pickupLocation: {
        address: delivery.pickupAddress,
        coordinates: {
          lat: delivery.pickupLatitude,
          lng: delivery.pickupLongitude
        }
      },
      deliveryLocation: {
        address: delivery.deliveryAddress,
        coordinates: {
          lat: delivery.deliveryLatitude,
          lng: delivery.deliveryLongitude
        }
      },
      driver: driverInfo,
      statusHistory: delivery.statusHistory,
      order: delivery.order
    };
  }

  @ExternalApiCircuitBreaker('route-optimization')
  async optimizeDeliveryRoute(deliveryIds: string[]) {
    if (deliveryIds.length === 0) {
      return { optimizedRoute: [], estimatedTime: 0, totalDistance: 0 };
    }

    const deliveries = await this.resilientDb.executeReadOperation(
      () => this.prisma.delivery.findMany({
        where: { id: { in: deliveryIds } },
        select: {
          id: true,
          deliveryLatitude: true,
          deliveryLongitude: true,
          deliveryAddress: true,
          estimatedDeliveryTime: true,
          priority: true
        }
      }),
      { cacheKey: `deliveries:${deliveryIds.join(',')}`, cacheTtl: 60000 }
    );

    try {
      const optimizationRequest = {
        deliveries: deliveries.map(d => ({
          id: d.id,
          location: { lat: d.deliveryLatitude, lng: d.deliveryLongitude },
          address: d.deliveryAddress,
          timeWindow: {
            earliest: new Date(),
            latest: d.estimatedDeliveryTime
          },
          priority: d.priority || 1
        }))
      };

      const optimizedRoute = await this.resilientHttp.post(
        '/route-optimization/optimize',
        optimizationRequest,
        {
          circuitBreakerName: 'route-optimizer',
          retryAttempts: 2,
          timeoutMs: 15000,
          fallbackResponse: {
            optimizedRoute: deliveries.map(d => ({ id: d.id, order: 1 })),
            estimatedTime: deliveries.length * 30,
            totalDistance: deliveries.length * 5
          }
        }
      );

      this.logger.log(`Route optimized for ${deliveries.length} deliveries`);
      return optimizedRoute;

    } catch (error) {
      this.logger.error('Route optimization failed:', error);
      return {
        optimizedRoute: deliveries.map((d, index) => ({ id: d.id, order: index + 1 })),
        estimatedTime: deliveries.length * 30,
        totalDistance: deliveries.length * 5,
        fallback: true
      };
    }
  }

  @DatabaseCircuitBreaker()
  async getDeliveryAnalytics(filterOptions: {
    startDate?: Date;
    endDate?: Date;
    driverId?: string;
    status?: string;
  }) {
    const { startDate, endDate, driverId, status } = filterOptions;

    const where: any = {};

    if (startDate || endDate) {
      where.assignedAt = {};
      if (startDate) where.assignedAt.gte = startDate;
      if (endDate) where.assignedAt.lte = endDate;
    }

    if (driverId) where.driverId = driverId;
    if (status) where.status = status;

    const [
      totalDeliveries,
      completedDeliveries,
      averageDeliveryTime,
      deliveryPerformance,
      driverStats
    ] = await Promise.all([
      this.resilientDb.executeReadOperation(
        () => this.prisma.delivery.count({ where }),
        { cacheKey: `analytics:deliveries:total:${JSON.stringify(where)}`, cacheTtl: 300000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.delivery.count({ where: { ...where, status: 'delivered' } }),
        { cacheKey: `analytics:deliveries:completed:${JSON.stringify(where)}`, cacheTtl: 300000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.delivery.aggregate({
          where: { ...where, status: 'delivered', deliveredAt: { not: null } },
          _avg: {
            deliveryDuration: true
          }
        }),
        { cacheKey: `analytics:deliveries:avg-time:${JSON.stringify(where)}`, cacheTtl: 300000 }
      ),
      this.resilientDb.executeReadOperation(
        () => this.prisma.delivery.groupBy({
          by: ['status'],
          where,
          _count: { status: true }
        }),
        { cacheKey: `analytics:deliveries:performance:${JSON.stringify(where)}`, cacheTtl: 300000 }
      ),
      this.getDriverPerformanceStats(where)
    ]);

    return {
      totalDeliveries,
      completedDeliveries,
      completionRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0,
      averageDeliveryTime: averageDeliveryTime._avg?.deliveryDuration || 0,
      deliveryPerformance,
      driverStats
    };
  }

  @ExternalApiCircuitBreaker('notification-service')
  async sendDeliveryNotifications(orderId: string, type: 'assigned' | 'pickup' | 'in_transit' | 'delivered') {
    const delivery = await this.resilientDb.executeReadOperation(
      () => this.prisma.delivery.findUnique({
        where: { orderId },
        include: {
          order: {
            include: {
              restaurant: { select: { name: true, email: true, phone: true } },
              vendor: { select: { companyName: true, email: true, phone: true } }
            }
          }
        }
      }),
      { cacheKey: `delivery:${orderId}:notification`, cacheTtl: 60000 }
    );

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const notificationData = {
      orderId,
      trackingId: delivery.trackingId,
      status: delivery.status,
      estimatedDelivery: delivery.estimatedDeliveryTime,
      type
    };

    try {
      const notifications = [];

      if (delivery.order.restaurant?.email) {
        notifications.push(
          this.resilientHttp.post('/notifications/email', {
            to: delivery.order.restaurant.email,
            template: `delivery_${type}_restaurant`,
            data: notificationData
          }, {
            circuitBreakerName: 'email-service',
            retryAttempts: 2,
            timeoutMs: 5000
          })
        );
      }

      if (delivery.order.vendor?.email) {
        notifications.push(
          this.resilientHttp.post('/notifications/email', {
            to: delivery.order.vendor.email,
            template: `delivery_${type}_vendor`,
            data: notificationData
          }, {
            circuitBreakerName: 'email-service',
            retryAttempts: 2,
            timeoutMs: 5000
          })
        );
      }

      await Promise.allSettled(notifications);

      this.logger.log(`Delivery notifications sent for order ${orderId}, type: ${type}`);
      return { success: true, notificationsSent: notifications.length };

    } catch (error) {
      this.logger.error(`Failed to send delivery notifications for order ${orderId}:`, error);
      return { success: false, error: error.message };
    }
  }

  private generateTrackingId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `TRK-${timestamp}-${random}`.toUpperCase();
  }

  private async handleDeliveryCompletion(orderId: string) {
    try {
      await this.resilientDb.executeWriteOperation(
        () => this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date()
          }
        }),
        { circuitBreakerName: 'order-completion' }
      );

      await this.sendDeliveryNotifications(orderId, 'delivered');

      this.logger.log(`Order ${orderId} marked as delivered`);
    } catch (error) {
      this.logger.error(`Failed to complete delivery for order ${orderId}:`, error);
    }
  }

  private async getDriverPerformanceStats(where: any) {
    if (!where.driverId) {
      return null;
    }

    return this.resilientDb.executeReadOperation(
      () => this.prisma.delivery.aggregate({
        where: { ...where, status: 'delivered' },
        _avg: {
          deliveryDuration: true
        },
        _count: {
          id: true
        }
      }),
      {
        cacheKey: `driver:${where.driverId}:stats:${JSON.stringify(where)}`,
        cacheTtl: 300000
      }
    );
  }
}