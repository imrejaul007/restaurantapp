import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
@Public()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check() {
    return this.health.check([
      () => this.healthService.isHealthy('application'),
    ]);
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with system information' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async detailedCheck() {
    return this.healthService.getDetailedHealth();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  readiness() {
    return this.health.check([
      () => this.healthService.isHealthy('readiness'),
    ]);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Basic metrics for monitoring' })
  @ApiResponse({ status: 200, description: 'Service metrics' })
  async metrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      eventLoop: {
        // Add event loop lag measurement if needed
        lag: 0,
      },
    };
  }
}