import { HealthCheckService, HttpHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
export declare class HealthController {
    private health;
    private http;
    private memory;
    private disk;
    constructor(health: HealthCheckService, http: HttpHealthIndicator, memory: MemoryHealthIndicator, disk: DiskHealthIndicator);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    ready(): {
        status: string;
        timestamp: string;
    };
    live(): {
        status: string;
        timestamp: string;
    };
}
