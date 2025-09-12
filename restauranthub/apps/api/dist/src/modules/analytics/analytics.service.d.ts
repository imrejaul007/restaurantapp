import { PrismaService } from '../../prisma/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMetrics(): Promise<{
        message: string;
        timestamp: string;
    }>;
    getUserMetrics(): Promise<{
        userCount: number;
    }>;
    getOrderMetrics(): Promise<{
        totalOrders: number;
        completedOrders: number;
        pendingOrders: number;
    }>;
}
