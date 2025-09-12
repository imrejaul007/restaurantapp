import { HealthCheckService } from '@nestjs/terminus';
import { HealthService } from './health.service';
export declare class HealthController {
    private health;
    private healthService;
    constructor(health: HealthCheckService, healthService: HealthService);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    detailedCheck(): Promise<{
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
    liveness(): {
        status: string;
        timestamp: string;
        uptime: number;
    };
    readiness(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    metrics(): Promise<{
        timestamp: string;
        uptime: number;
        memory: {
            heapUsed: number;
            heapTotal: number;
            rss: number;
            external: number;
        };
        cpu: {
            user: number;
            system: number;
        };
        eventLoop: {
            lag: number;
        };
    }>;
}
