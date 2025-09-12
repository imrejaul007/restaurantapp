import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
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
