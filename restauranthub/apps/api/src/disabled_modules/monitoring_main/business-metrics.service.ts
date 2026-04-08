import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrometheusService } from './prometheus.service';
import { PrismaService } from '../prisma/prisma.service';

export interface BusinessKPIs {
  userMetrics: {
    totalUsers: number;
    activeUsersLast30Days: number;
    newRegistrationsToday: number;
    userRetentionRate: number;
    averageSessionDuration: number;
  };
  restaurantMetrics: {
    totalRestaurants: number;
    activeRestaurants: number;
    newRestaurantsToday: number;
    averageMenuItems: number;
    restaurantOnboardingRate: number;
  };
  vendorMetrics: {
    totalVendors: number;
    activeVendors: number;
    newVendorsToday: number;
    vendorVerificationRate: number;
    averageVendorRating: number;
  };
  jobMetrics: {
    totalJobPostings: number;
    activeJobPostings: number;
    newJobsToday: number;
    totalApplications: number;
    applicationSuccessRate: number;
    averageTimeToHire: number;
  };
  orderMetrics: {
    totalOrders: number;
    ordersToday: number;
    averageOrderValue: number;
    orderCompletionRate: number;
    customerSatisfactionScore: number;
  };
  financialMetrics: {
    totalRevenue: number;
    revenueToday: number;
    averageRevenuePerUser: number;
    monthlyRecurringRevenue: number;
    churnRate: number;
  };
  performanceMetrics: {
    averageApiResponseTime: number;
    systemUptime: number;
    errorRate: number;
    throughputPerSecond: number;
  };
}

@Injectable()
export class BusinessMetricsService {
  private readonly logger = new Logger(BusinessMetricsService.name);
  private metricsCollectionInterval: NodeJS.Timeout;

  constructor(
    private configService: ConfigService,
    private prometheusService: PrometheusService,
    private prismaService: PrismaService,
  ) {}

  /**
   * Start business metrics collection
   */
  startMetricsCollection(): void {
    const interval = this.configService.get<number>('BUSINESS_METRICS_INTERVAL', 300000); // 5 minutes

    this.metricsCollectionInterval = setInterval(async () => {
      await this.collectAndUpdateBusinessMetrics();
    }, interval);

    // Collect metrics immediately
    this.collectAndUpdateBusinessMetrics();

    this.logger.log('✅ Business metrics collection started');
  }

  /**
   * Collect comprehensive business metrics
   */
  async collectBusinessKPIs(): Promise<BusinessKPIs> {
    try {
      const [
        userMetrics,
        restaurantMetrics,
        vendorMetrics,
        jobMetrics,
        orderMetrics,
        financialMetrics,
        performanceMetrics,
      ] = await Promise.all([
        this.collectUserMetrics(),
        this.collectRestaurantMetrics(),
        this.collectVendorMetrics(),
        this.collectJobMetrics(),
        this.collectOrderMetrics(),
        this.collectFinancialMetrics(),
        this.collectPerformanceMetrics(),
      ]);

      return {
        userMetrics,
        restaurantMetrics,
        vendorMetrics,
        jobMetrics,
        orderMetrics,
        financialMetrics,
        performanceMetrics,
      };
    } catch (error) {
      this.logger.error('Error collecting business KPIs', error);
      throw error;
    }
  }

  /**
   * Collect user-related metrics
   */
  private async collectUserMetrics(): Promise<BusinessKPIs['userMetrics']> {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      userSessions,
    ] = await Promise.all([
      this.prismaService.user.count(),
      this.prismaService.user.count({
        where: {
          lastLoginAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      this.prismaService.user.count({
        where: {
          createdAt: {
            gte: startOfDay,
          },
        },
      }),
      // Assuming you have a UserSession model
      this.prismaService.userSession?.count() || 0,
    ]);

    // Calculate retention rate (simplified)
    const totalUsersLastMonth = await this.prismaService.user.count({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    const retentionRate = totalUsersLastMonth > 0 ? (activeUsers / totalUsersLastMonth) * 100 : 0;

    return {
      totalUsers,
      activeUsersLast30Days: activeUsers,
      newRegistrationsToday: newUsersToday,
      userRetentionRate: retentionRate,
      averageSessionDuration: 0, // Would need session tracking
    };
  }

  /**
   * Collect restaurant-related metrics
   */
  private async collectRestaurantMetrics(): Promise<BusinessKPIs['restaurantMetrics']> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalRestaurants,
      activeRestaurants,
      newRestaurantsToday,
      menuItemsCount,
    ] = await Promise.all([
      this.prismaService.restaurant?.count() || 0,
      this.prismaService.restaurant?.count({
        where: {
          updatedAt: {
            gte: thirtyDaysAgo,
          },
        },
      }) || 0,
      this.prismaService.restaurant?.count({
        where: {
          createdAt: {
            gte: startOfDay,
          },
        },
      }) || 0,
      this.prismaService.menuItem?.count() || 0,
    ]);

    const averageMenuItems = totalRestaurants > 0 ? menuItemsCount / totalRestaurants : 0;
    const restaurantOnboardingRate = totalRestaurants > 0 ? (newRestaurantsToday / totalRestaurants) * 100 : 0;

    return {
      totalRestaurants,
      activeRestaurants,
      newRestaurantsToday,
      averageMenuItems,
      restaurantOnboardingRate,
    };
  }

  /**
   * Collect vendor-related metrics
   */
  private async collectVendorMetrics(): Promise<BusinessKPIs['vendorMetrics']> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalVendors,
      activeVendors,
      newVendorsToday,
      verifiedVendors,
    ] = await Promise.all([
      this.prismaService.vendor?.count() || 0,
      this.prismaService.vendor?.count({
        where: {
          updatedAt: {
            gte: thirtyDaysAgo,
          },
        },
      }) || 0,
      this.prismaService.vendor?.count({
        where: {
          createdAt: {
            gte: startOfDay,
          },
        },
      }) || 0,
      this.prismaService.vendor?.count({
        where: {
          isVerified: true,
        },
      }) || 0,
    ]);

    const vendorVerificationRate = totalVendors > 0 ? (verifiedVendors / totalVendors) * 100 : 0;

    return {
      totalVendors,
      activeVendors,
      newVendorsToday,
      vendorVerificationRate,
      averageVendorRating: 0, // Would need rating system
    };
  }

  /**
   * Collect job-related metrics
   */
  private async collectJobMetrics(): Promise<BusinessKPIs['jobMetrics']> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [
      totalJobPostings,
      activeJobPostings,
      newJobsToday,
      totalApplications,
      successfulApplications,
    ] = await Promise.all([
      this.prismaService.job.count(),
      this.prismaService.job.count({
        where: {
          status: 'ACTIVE',
        },
      }),
      this.prismaService.job.count({
        where: {
          createdAt: {
            gte: startOfDay,
          },
        },
      }),
      this.prismaService.jobApplication?.count() || 0,
      this.prismaService.jobApplication?.count({
        where: {
          status: 'ACCEPTED',
        },
      }) || 0,
    ]);

    const applicationSuccessRate = totalApplications > 0 ? (successfulApplications / totalApplications) * 100 : 0;

    return {
      totalJobPostings,
      activeJobPostings,
      newJobsToday,
      totalApplications,
      applicationSuccessRate,
      averageTimeToHire: 0, // Would need application tracking
    };
  }

  /**
   * Collect order-related metrics
   */
  private async collectOrderMetrics(): Promise<BusinessKPIs['orderMetrics']> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [
      totalOrders,
      ordersToday,
      completedOrders,
      orderValues,
    ] = await Promise.all([
      this.prismaService.order?.count() || 0,
      this.prismaService.order?.count({
        where: {
          createdAt: {
            gte: startOfDay,
          },
        },
      }) || 0,
      this.prismaService.order?.count({
        where: {
          status: 'COMPLETED',
        },
      }) || 0,
      this.prismaService.order?.aggregate({
        _avg: {
          totalAmount: true,
        },
      }) || { _avg: { totalAmount: 0 } },
    ]);

    const orderCompletionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const averageOrderValue = orderValues._avg.totalAmount || 0;

    return {
      totalOrders,
      ordersToday,
      averageOrderValue,
      orderCompletionRate,
      customerSatisfactionScore: 0, // Would need review system
    };
  }

  /**
   * Collect financial metrics
   */
  private async collectFinancialMetrics(): Promise<BusinessKPIs['financialMetrics']> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalRevenue,
      revenueToday,
      revenueThisMonth,
      totalUsers,
    ] = await Promise.all([
      this.prismaService.payment?.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: 'COMPLETED',
        },
      }) || { _sum: { amount: 0 } },
      this.prismaService.payment?.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: startOfDay,
          },
        },
      }) || { _sum: { amount: 0 } },
      this.prismaService.payment?.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: startOfMonth,
          },
        },
      }) || { _sum: { amount: 0 } },
      this.prismaService.user.count(),
    ]);

    const totalRevenueAmount = totalRevenue._sum.amount || 0;
    const revenueTodayAmount = revenueToday._sum.amount || 0;
    const monthlyRecurringRevenue = revenueThisMonth._sum.amount || 0;
    const averageRevenuePerUser = totalUsers > 0 ? totalRevenueAmount / totalUsers : 0;

    return {
      totalRevenue: totalRevenueAmount,
      revenueToday: revenueTodayAmount,
      averageRevenuePerUser,
      monthlyRecurringRevenue,
      churnRate: 0, // Would need subscription tracking
    };
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(): Promise<BusinessKPIs['performanceMetrics']> {
    // These would typically come from your monitoring service
    return {
      averageApiResponseTime: 0, // From PerformanceService
      systemUptime: process.uptime(),
      errorRate: 0, // From error tracking
      throughputPerSecond: 0, // From request tracking
    };
  }

  /**
   * Update Prometheus metrics with business KPIs
   */
  private async collectAndUpdateBusinessMetrics(): Promise<void> {
    try {
      const kpis = await this.collectBusinessKPIs();

      // Update user metrics
      this.prometheusService.updateActiveUsers('all', 'last_30_days', kpis.userMetrics.activeUsersLast30Days);
      this.prometheusService.updateActiveUsers('all', 'total', kpis.userMetrics.totalUsers);

      // Update conversion rates
      if (kpis.userMetrics.totalUsers > 0) {
        const registrationRate = (kpis.userMetrics.newRegistrationsToday / kpis.userMetrics.totalUsers) * 100;
        this.prometheusService.updateConversionRate('registration', 'daily', registrationRate);
      }

      this.prometheusService.updateConversionRate('user_retention', 'monthly', kpis.userMetrics.userRetentionRate);
      this.prometheusService.updateConversionRate('job_application', 'success', kpis.jobMetrics.applicationSuccessRate);
      this.prometheusService.updateConversionRate('order_completion', 'rate', kpis.orderMetrics.orderCompletionRate);

      // Update satisfaction scores
      this.prometheusService.updateCustomerSatisfactionScore('overall', kpis.orderMetrics.customerSatisfactionScore);
      this.prometheusService.updateCustomerSatisfactionScore('vendor', kpis.vendorMetrics.averageVendorRating);

      this.logger.debug('Business metrics updated successfully', {
        totalUsers: kpis.userMetrics.totalUsers,
        totalRestaurants: kpis.restaurantMetrics.totalRestaurants,
        totalOrders: kpis.orderMetrics.totalOrders,
        totalRevenue: kpis.financialMetrics.totalRevenue,
      });
    } catch (error) {
      this.logger.error('Error updating business metrics', error);
    }
  }

  /**
   * Record user registration
   */
  recordUserRegistration(userType: string, source: string): void {
    this.prometheusService.recordUserRegistration(userType, source);
  }

  /**
   * Record user login
   */
  recordUserLogin(userType: string, method: string): void {
    this.prometheusService.recordUserLogin(userType, method);
  }

  /**
   * Record job posting
   */
  recordJobPosting(jobType: string, companySize: string): void {
    this.prometheusService.recordJobPosting(jobType, companySize);
  }

  /**
   * Record job application
   */
  recordJobApplication(jobType: string, status: string): void {
    this.prometheusService.recordJobApplication(jobType, status);
  }

  /**
   * Record order creation
   */
  recordOrderCreation(orderType: string, customerType: string): void {
    this.prometheusService.recordOrderCreation(orderType, customerType);
  }

  /**
   * Record payment transaction
   */
  recordPaymentTransaction(method: string, status: string, currency: string, amount?: number): void {
    this.prometheusService.recordPaymentTransaction(method, status, currency, amount);
  }

  /**
   * Record restaurant registration
   */
  recordRestaurantRegistration(type: string, plan: string): void {
    this.prometheusService.recordRestaurantRegistration(type, plan);
  }

  /**
   * Record vendor registration
   */
  recordVendorRegistration(category: string, status: string): void {
    this.prometheusService.recordVendorRegistration(category, status);
  }

  /**
   * Get current business metrics snapshot
   */
  async getBusinessMetricsSnapshot(): Promise<BusinessKPIs> {
    return this.collectBusinessKPIs();
  }

  /**
   * Stop metrics collection
   */
  stopMetricsCollection(): void {
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
      this.logger.log('🛑 Business metrics collection stopped');
    }
  }
}