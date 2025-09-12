import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorResult } from '@nestjs/terminus';
export declare class HealthService {
    private prisma;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    checkDatabaseConnections(): Promise<HealthIndicatorResult>;
    checkCriticalServices(): Promise<HealthIndicatorResult>;
    getSystemMetrics(): Promise<{
        database: {
            counts: {
                users: number;
                restaurants: number;
                vendors: number;
                employees: number;
                orders: any;
                products: number;
            };
            recentActivity: number;
            lastUpdated: string;
        };
        timestamp: string;
        uptime: number;
        environment: any;
        node: {
            version: string;
            platform: NodeJS.Platform;
            arch: NodeJS.Architecture;
        };
        memory: {
            used: NodeJS.MemoryUsage;
            system: {
                total: number;
                free: number;
                usage: string;
            };
        };
        cpu: {
            cores: number;
            loadAverage: number[];
            architecture: string;
            model: string;
        };
        system: {
            hostname: string;
            platform: NodeJS.Platform;
            release: string;
            type: string;
        };
    } | {
        database: {
            error: string;
        };
        timestamp: string;
        uptime: number;
        environment: any;
        node: {
            version: string;
            platform: NodeJS.Platform;
            arch: NodeJS.Architecture;
        };
        memory: {
            used: NodeJS.MemoryUsage;
            system: {
                total: number;
                free: number;
                usage: string;
            };
        };
        cpu: {
            cores: number;
            loadAverage: number[];
            architecture: string;
            model: string;
        };
        system: {
            hostname: string;
            platform: NodeJS.Platform;
            release: string;
            type: string;
        };
    }>;
    getServiceStatus(): Promise<{
        timestamp: string;
        overall: string;
        healthyServices: number;
        totalServices: number;
        services: ({
            name: string;
            status: string;
            port: any;
        } | {
            name: string;
            status: string;
            port?: undefined;
        })[];
    }>;
    private checkAuthenticationService;
    private checkNotificationService;
    private checkPaymentService;
    private checkFileUploadService;
    private getDatabaseMetrics;
    private getDatabaseStatus;
    private getRedisStatus;
    private getEmailServiceStatus;
    private getFileStorageStatus;
    private getAuthServiceStatus;
    private getNotificationServiceStatus;
    private getPaymentServiceStatus;
}
