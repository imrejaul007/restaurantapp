import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Health check successful' })
  @ApiResponse({ status: 503, description: 'Health check failed' })
  check() {
    return this.health.check([
      // Check if the database is healthy
      () => this.http.pingCheck('database', 'http://localhost:5432'),
      
      // Check if Redis is healthy
      () => this.http.pingCheck('redis', 'http://localhost:6379'),
      
      // Check memory usage
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      
      // Check disk usage
      () => this.disk.checkStorage('storage', { 
        path: '/', 
        thresholdPercent: 90 
      }),
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  ready() {
    return { status: 'ready', timestamp: new Date().toISOString() };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check' })
  @ApiResponse({ status: 200, description: 'Service is live' })
  live() {
    return { status: 'live', timestamp: new Date().toISOString() };
  }
}