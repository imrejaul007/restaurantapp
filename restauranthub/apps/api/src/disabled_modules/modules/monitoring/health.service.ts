import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorResult, HealthIndicatorStatus } from '@nestjs/terminus';
import * as os from 'os';
import * as process from 'process';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async checkDatabaseConnections(): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      
      // Test database connectivity with a simple query
      await this.prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      // Get database stats
      const userCount = await this.prisma.user.count();
      const activeSessionsCount = await this.prisma.session.count({
        where: {
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      return {
        database_connection: {
          status: 'up',
          responseTime: `${responseTime}ms`,
          userCount,
          activeSessions: activeSessionsCount,
          lastChecked: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Database connection check failed:', error);
      return {
        database_connection: {
          status: 'down',
          error: (error as Error).message,
          lastChecked: new Date().toISOString(),
        },
      };
    }
  }

  async checkCriticalServices(): Promise<HealthIndicatorResult> {
    try {
      const checks = await Promise.allSettled([
        this.checkAuthenticationService(),
        this.checkNotificationService(),
        this.checkPaymentService(),
        this.checkFileUploadService(),
      ]);

      const results = checks.map((check, index) => {
        const serviceNames = ['auth', 'notifications', 'payments', 'file_upload'];
        return {
          service: serviceNames[index],
          status: check.status === 'fulfilled' ? 'up' : 'down',
          details: check.status === 'fulfilled' ? check.value : check.reason.message,
        };
      });

      const allHealthy = results.every(result => result.status === 'up');

      return {
        critical_services: {
          status: (allHealthy ? 'up' : 'degraded') as HealthIndicatorStatus,
          services: results,
          lastChecked: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        critical_services: {
          status: 'down',
          error: (error as Error).message,
          lastChecked: new Date().toISOString(),
        },
      };
    }
  }

  async getSystemMetrics() {
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get('environment'),
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        used: process.memoryUsage(),
        system: {
          total: os.totalmem(),
          free: os.freemem(),
          usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%',
        },
      },
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
        architecture: os.arch(),
        model: os.cpus()[0]?.model || 'Unknown',
      },
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
      },
    };

    // Get database metrics
    try {
      const dbMetrics = await this.getDatabaseMetrics();
      return {
        ...systemInfo,
        database: dbMetrics,
      };
    } catch (error) {
      this.logger.error('Failed to get database metrics:', error);
      return {
        ...systemInfo,
        database: {
          error: 'Failed to retrieve database metrics',
        },
      };
    }
  }

  async getServiceStatus() {
    const services = [
      { name: 'API Server', status: 'running', port: this.configService.get('port') },
      { name: 'Database', status: await this.getDatabaseStatus() },
      { name: 'Redis', status: await this.getRedisStatus() },
      { name: 'Email Service', status: await this.getEmailServiceStatus() },
      { name: 'File Storage', status: await this.getFileStorageStatus() },
      { name: 'Authentication', status: await this.getAuthServiceStatus() },
      { name: 'Notifications', status: await this.getNotificationServiceStatus() },
      { name: 'Payment Gateway', status: await this.getPaymentServiceStatus() },
    ];

    const healthyServices = services.filter(s => s.status === 'running' || s.status === 'connected').length;
    const totalServices = services.length;
    
    return {
      timestamp: new Date().toISOString(),
      overall: healthyServices === totalServices ? 'healthy' : 'degraded',
      healthyServices,
      totalServices,
      services,
    };
  }

  private async checkAuthenticationService(): Promise<any> {
    try {
      // Test JWT secret configuration
      const jwtSecret = this.configService.get('jwt.secret');
      if (!jwtSecret || jwtSecret.includes('your-') || jwtSecret.length < 32) {
        throw new Error('JWT secret not properly configured');
      }

      // Check for active sessions
      const activeSessionsCount = await this.prisma.session.count({
        where: {
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      return {
        jwtConfigured: true,
        activeSessions: activeSessionsCount,
      };
    } catch (error) {
      throw new Error(`Auth service check failed: ${(error as Error).message}`);
    }
  }

  private async checkNotificationService(): Promise<any> {
    try {
      // Check notification configuration and recent activity
      const recentNotifications = await this.prisma.notification.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      return {
        recentNotifications,
        configured: true,
      };
    } catch (error) {
      throw new Error(`Notification service check failed: ${(error as Error).message}`);
    }
  }

  private async checkPaymentService(): Promise<any> {
    try {
      const razorpayKeyId = this.configService.get('razorpay.keyId');
      
      // Check recent payment activity
      const recentPayments = await this.prisma.payment.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      return {
        configured: !!razorpayKeyId,
        recentPayments,
      };
    } catch (error) {
      throw new Error(`Payment service check failed: ${(error as Error).message}`);
    }
  }

  private async checkFileUploadService(): Promise<any> {
    try {
      const s3BucketName = this.configService.get('aws.s3.bucketName');
      
      return {
        configured: !!s3BucketName,
        bucket: s3BucketName,
      };
    } catch (error) {
      throw new Error(`File upload service check failed: ${(error as Error).message}`);
    }
  }

  private async getDatabaseMetrics() {
    const [
      totalUsers,
      totalRestaurants,
      totalVendors,
      totalEmployees,
      totalOrders,
      totalProducts,
      recentActivity,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.restaurant.count(),
      this.prisma.vendor.count(),
      this.prisma.employee.count(),
      this.prisma.order.count(),
      this.prisma.product.count(),
      this.prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      counts: {
        users: totalUsers,
        restaurants: totalRestaurants,
        vendors: totalVendors,
        employees: totalEmployees,
        orders: totalOrders,
        products: totalProducts,
      },
      recentActivity,
      lastUpdated: new Date().toISOString(),
    };
  }

  private async getDatabaseStatus(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }

  private async getRedisStatus(): Promise<string> {
    const redisUrl = this.configService.get('redis.url');
    return redisUrl ? 'configured' : 'not_configured';
  }

  private async getEmailServiceStatus(): Promise<string> {
    const smtpHost = this.configService.get('email.smtp.host');
    return smtpHost ? 'configured' : 'not_configured';
  }

  private async getFileStorageStatus(): Promise<string> {
    const s3BucketName = this.configService.get('aws.s3.bucketName');
    return s3BucketName ? 'configured' : 'not_configured';
  }

  private async getAuthServiceStatus(): Promise<string> {
    try {
      const jwtSecret = this.configService.get('jwt.secret');
      return jwtSecret && !jwtSecret.includes('your-') ? 'running' : 'misconfigured';
    } catch {
      return 'error';
    }
  }

  private async getNotificationServiceStatus(): Promise<string> {
    try {
      const notificationCount = await this.prisma.notification.count();
      return notificationCount >= 0 ? 'running' : 'error';
    } catch {
      return 'error';
    }
  }

  private async getPaymentServiceStatus(): Promise<string> {
    const razorpayKeyId = this.configService.get('razorpay.keyId');
    return razorpayKeyId ? 'configured' : 'not_configured';
  }
}