import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('monitoring')
@Controller('api/v1/monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MonitoringController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('metrics')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics in text format' })
  getMetrics(): string {
    return this.performanceService.getMetrics();
  }

  @Get('health')
  @ApiOperation({ summary: 'Get application health metrics' })
  @ApiResponse({ status: 200, description: 'Application health information' })
  async getHealth() {
    return await this.performanceService.getHealthMetrics();
  }

  @Get('performance')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get performance report' })
  @ApiResponse({ status: 200, description: 'Performance metrics and statistics' })
  async getPerformanceReport() {
    return await this.performanceService.getPerformanceReport();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get application status' })
  @ApiResponse({ status: 200, description: 'Basic application status' })
  getStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}