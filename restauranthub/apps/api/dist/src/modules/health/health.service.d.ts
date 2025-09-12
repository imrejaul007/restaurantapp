import { HealthIndicatorResult, HealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';
export declare class HealthService extends HealthIndicator {
    private prismaService;
    constructor(prismaService: PrismaService);
    isHealthy(key: string): Promise<HealthIndicatorResult>;
    private checkDatabase;
    private checkRedis;
    private checkMemoryUsage;
    private checkDiskSpace;
    private getCheckResult;
    getSystemInfo(): Promise<{
        nodeVersion: string;
        platform: NodeJS.Platform;
        architecture: NodeJS.Architecture;
        uptime: number;
        environment: string;
        timestamp: string;
        pid: number;
    }>;
    getDependenciesHealth(): Promise<{
        total: number;
        healthy: number;
        dependencies: {
            status: string;
            name?: string;
        }[];
    }>;
    getDetailedHealth(): Promise<{
        status: string;
        timestamp: string;
        system: {
            nodeVersion: string;
            platform: NodeJS.Platform;
            architecture: NodeJS.Architecture;
            uptime: number;
            environment: string;
            timestamp: string;
            pid: number;
        };
        dependencies: {
            total: number;
            healthy: number;
            dependencies: {
                status: string;
                name?: string;
            }[];
        };
        checks: any;
    }>;
}
