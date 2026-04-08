import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MonitoringService, SystemMetrics, DatabaseMetrics, ApplicationMetrics, BusinessMetrics } from './monitoring.service';
import { PerformanceService } from './performance.service';
import { MetricsService } from './metrics.service';
import { AlertService } from './alert.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PerformanceMiddleware } from './performance.middleware';

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

export interface PerformanceReport {
  timeRange: {
    start: Date;
    end: Date;
  };
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  endpoints: Array<{
    path: string;
    method: string;
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
  errors: Array<{
    timestamp: Date;
    method: string;
    path: string;
    statusCode: number;
    message: string;
  }>;
}

@ApiTags('monitoring')
@Controller('monitoring')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MonitoringController {
  private readonly logger = new Logger(MonitoringController.name);

  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly performanceService: PerformanceService,
    private readonly metricsService: MetricsService,
    private readonly alertService: AlertService,
    private readonly performanceMiddleware: PerformanceMiddleware,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health status' })
  @HttpCode(HttpStatus.OK)
  async getHealth() {
    try {
      const isHealthy = await this.monitoringService.isHealthy();
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error) {
      this.logger.error('Health check failed', error.stack);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @Get('metrics/system')
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'System metrics data' })
  async getSystemMetrics(): Promise<SystemMetrics> {
    return this.monitoringService.getSystemMetrics();
  }

  @Get('metrics/database')
  @ApiOperation({ summary: 'Get database metrics' })
  @ApiResponse({ status: 200, description: 'Database metrics data' })
  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    return this.monitoringService.getDatabaseMetrics();
  }

  @Get('metrics/application')
  @ApiOperation({ summary: 'Get application metrics' })
  @ApiResponse({ status: 200, description: 'Application metrics data' })
  async getApplicationMetrics(): Promise<ApplicationMetrics> {
    return this.monitoringService.getApplicationMetrics();
  }

  @Get('metrics/business')
  @ApiOperation({ summary: 'Get business metrics' })
  @ApiResponse({ status: 200, description: 'Business metrics data' })
  async getBusinessMetrics(): Promise<BusinessMetrics> {
    return this.monitoringService.getBusinessMetrics();
  }

  @Get('metrics/all')
  @ApiOperation({ summary: 'Get all metrics' })
  @ApiResponse({ status: 200, description: 'All metrics data' })
  async getAllMetrics() {
    try {
      const [system, database, application, business] = await Promise.all([
        this.monitoringService.getSystemMetrics(),
        this.monitoringService.getDatabaseMetrics(),
        this.monitoringService.getApplicationMetrics(),
        this.monitoringService.getBusinessMetrics(),
      ]);

      return {
        timestamp: new Date().toISOString(),
        system,
        database,
        application,
        business,
      };
    } catch (error) {
      this.logger.error('Failed to collect all metrics', error.stack);
      throw error;
    }
  }

  @Get('performance/summary')
  @ApiOperation({ summary: 'Get performance summary' })
  @ApiResponse({ status: 200, description: 'Performance summary data' })
  async getPerformanceSummary() {
    return this.performanceMiddleware.getPerformanceSummary();
  }

  @Get('performance/active-requests')
  @ApiOperation({ summary: 'Get active requests' })
  @ApiResponse({ status: 200, description: 'Active requests data' })
  async getActiveRequests() {
    return {
      count: this.performanceMiddleware.getActiveRequestsCount(),
      requests: this.performanceMiddleware.getActiveRequests(),
    };
  }

  @Get('performance/report')
  @ApiOperation({ summary: 'Get performance report' })
  @ApiResponse({ status: 200, description: 'Performance report data' })
  async getPerformanceReport(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('limit') limit?: string,
  ): Promise<PerformanceReport> {
    const startDate = start ? new Date(start) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();
    const maxLimit = limit ? parseInt(limit, 10) : 100;

    return this.performanceService.generateReport(startDate, endDate, maxLimit);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get alerts' })
  @ApiResponse({ status: 200, description: 'Alerts data' })
  async getAlerts(
    @Query('severity') severity?: string,
    @Query('acknowledged') acknowledged?: string,
    @Query('resolved') resolved?: string,
    @Query('limit') limit?: string,
  ): Promise<Alert[]> {
    const filter: any = {};

    if (severity) filter.severity = severity;
    if (acknowledged !== undefined) filter.acknowledged = acknowledged === 'true';
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    if (limit) filter.limit = parseInt(limit, 10);

    return this.alertService.getAlerts(filter);
  }

  @Post('alerts/rules')
  @ApiOperation({ summary: 'Create alert rule' })
  @ApiResponse({ status: 201, description: 'Alert rule created' })
  async createAlertRule(@Body() rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    return this.alertService.createAlertRule(rule);
  }

  @Put('alerts/rules/:id')
  @ApiOperation({ summary: 'Update alert rule' })
  @ApiResponse({ status: 200, description: 'Alert rule updated' })
  async updateAlertRule(
    @Param('id') id: string,
    @Body() updates: Partial<AlertRule>,
  ): Promise<AlertRule> {
    return this.alertService.updateAlertRule(id, updates);
  }

  @Delete('alerts/rules/:id')
  @ApiOperation({ summary: 'Delete alert rule' })
  @ApiResponse({ status: 204, description: 'Alert rule deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAlertRule(@Param('id') id: string): Promise<void> {
    return this.alertService.deleteAlertRule(id);
  }

  @Post('alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged' })
  async acknowledgeAlert(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ): Promise<void> {
    return this.alertService.acknowledgeAlert(id, userId);
  }

  @Post('alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved' })
  async resolveAlert(@Param('id') id: string): Promise<void> {
    return this.alertService.resolveAlert(id);
  }

  @Get('dashboard/data')
  @ApiOperation({ summary: 'Get dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboardData() {
    try {
      const [
        systemMetrics,
        databaseMetrics,
        businessMetrics,
        performanceSummary,
        activeRequests,
        recentAlerts,
      ] = await Promise.all([
        this.monitoringService.getSystemMetrics(),
        this.monitoringService.getDatabaseMetrics(),
        this.monitoringService.getBusinessMetrics(),
        this.performanceMiddleware.getPerformanceSummary(),
        this.performanceMiddleware.getActiveRequests(),
        this.alertService.getAlerts({ limit: 10 }),
      ]);

      return {
        timestamp: new Date().toISOString(),
        system: {
          cpuUsage: systemMetrics.cpu.usage,
          memoryUsage: systemMetrics.memory.usage,
          diskUsage: systemMetrics.disk.usage,
          uptime: systemMetrics.process.uptime,
        },
        database: {
          activeConnections: databaseMetrics.connections.active,
          averageResponseTime: databaseMetrics.queries.averageResponseTime,
          slowQueries: databaseMetrics.queries.slow,
        },
        business: {
          totalUsers: businessMetrics.users.total,
          activeUsers: businessMetrics.users.active,
          totalRestaurants: businessMetrics.restaurants.total,
          totalJobs: businessMetrics.jobs.total,
        },
        performance: {
          activeRequests: performanceSummary.activeRequests,
          averageResponseTime: performanceSummary.averageResponseTime,
          slowRequests: performanceSummary.slowRequests,
        },
        alerts: {
          total: recentAlerts.length,
          unacknowledged: recentAlerts.filter(a => !a.acknowledged).length,
          critical: recentAlerts.filter(a => a.severity === 'critical').length,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get dashboard data', error.stack);
      throw error;
    }
  }

  @Post('test/alert')
  @ApiOperation({ summary: 'Test alert system' })
  @ApiResponse({ status: 200, description: 'Test alert sent' })
  async testAlert(): Promise<void> {
    await this.alertService.createTestAlert();
  }

  @Get('export/metrics')
  @ApiOperation({ summary: 'Export metrics data' })
  @ApiResponse({ status: 200, description: 'Metrics data exported' })
  async exportMetrics(
    @Query('format') format: 'json' | 'csv' = 'json',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const startDate = start ? new Date(start) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();

    return this.metricsService.exportMetrics(format, startDate, endDate);
  }
}