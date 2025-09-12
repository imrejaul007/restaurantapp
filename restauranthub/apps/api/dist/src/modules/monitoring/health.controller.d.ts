import { HealthCheckService, HttpHealthIndicator, PrismaHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
export declare class HealthController {
    private health;
    private http;
    private prismaHealth;
    private memory;
    private disk;
    private prisma;
    private configService;
    private healthService;
    constructor(health: HealthCheckService, http: HttpHealthIndicator, prismaHealth: PrismaHealthIndicator, memory: MemoryHealthIndicator, disk: DiskHealthIndicator, prisma: PrismaService, configService: ConfigService, healthService: HealthService);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    detailedCheck(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    getMetrics(): Promise<{
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
    getStatus(): Promise<{
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
    private checkRedis;
    private checkEmailService;
    private checkFileStorage;
}
