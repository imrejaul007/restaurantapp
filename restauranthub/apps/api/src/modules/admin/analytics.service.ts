import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getBusinessMetrics() {
    try {
      const [totalUsers, totalOrders, totalRevenue] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.order.count(),
        this.prisma.order.aggregate({
          _sum: { total: true }
        })
      ]);

      return {
        totalUsers,
        totalOrders,
        totalRevenue: totalRevenue._sum?.total || 0,
        totalRestaurants: await this.prisma.restaurant.count(),
        totalVendors: await this.prisma.vendor.count(),
        activeOrders: await this.prisma.order.count({
          where: {
            status: { not: 'DELIVERED' }
          }
        })
      };
    } catch (error) {
      console.error('Error fetching business metrics:', error);
      return {
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalRestaurants: 0,
        totalVendors: 0,
        activeOrders: 0
      };
    }
  }

  async getUserGrowth(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const userGrowth = await this.prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate
          }
        },
        _count: true
      });

      return userGrowth.map((item: any) => ({
        date: item.createdAt,
        count: item._count
      }));
    } catch (error) {
      console.error('Error fetching user growth:', error);
      return [];
    }
  }

  async getOrderAnalytics() {
    try {
      const [totalOrders, completedOrders, cancelledOrders] = await Promise.all([
        this.prisma.order.count(),
        this.prisma.order.count({ where: { status: 'DELIVERED' } }),
        this.prisma.order.count({ where: { status: 'CANCELLED' } })
      ]);

      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
      const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

      return {
        totalOrders,
        completedOrders,
        cancelledOrders,
        completionRate,
        cancellationRate
      };
    } catch (error) {
      console.error('Error fetching order analytics:', error);
      return {
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        completionRate: 0,
        cancellationRate: 0
      };
    }
  }
}