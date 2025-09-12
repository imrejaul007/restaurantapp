import { PrismaService } from '../../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getBusinessMetrics(): Promise<{
        totalUsers: number;
        totalOrders: any;
        totalRevenue: any;
        totalRestaurants: number;
        totalVendors: number;
        activeOrders: any;
    }>;
    getUserGrowth(days?: number): Promise<{
        date: any;
        count: any;
    }[]>;
    getOrderAnalytics(): Promise<{
        totalOrders: any;
        completedOrders: any;
        cancelledOrders: any;
        completionRate: number;
        cancellationRate: number;
    }>;
}
