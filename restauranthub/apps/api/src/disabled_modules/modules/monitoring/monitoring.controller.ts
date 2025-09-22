import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MonitoringService, AlertRule, Alert } from './monitoring.service';
import { UserRole } from '@prisma/client';

@ApiTags('monitoring')
@Controller('monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('system/status')
  @ApiOperation({ summary: 'Get system status overview' })
  @ApiResponse({ status: 200, description: 'System status retrieved successfully' })
  @Roles('ADMIN')
  async getSystemStatus() {
    const [systemMetrics, databaseMetrics, applicationMetrics] = await Promise.all([
      this.monitoringService.getSystemMetrics(),
      this.monitoringService.getDatabaseMetrics(),
      this.monitoringService.getApplicationMetrics(),
    ]);

    return {
      statusCode: 200,
      message: 'System status retrieved successfully',
      data: {
        system: systemMetrics,
        database: databaseMetrics,
        application: applicationMetrics,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('system/metrics')
  @ApiOperation({ summary: 'Get detailed system metrics' })
  @ApiResponse({ status: 200, description: 'System metrics retrieved successfully' })
  @Roles('ADMIN')
  async getSystemMetrics() {
    const metrics = await this.monitoringService.getSystemMetrics();
    
    return {
      statusCode: 200,
      message: 'System metrics retrieved successfully',
      data: metrics,
    };
  }

  @Get('database/metrics')
  @ApiOperation({ summary: 'Get database metrics' })
  @ApiResponse({ status: 200, description: 'Database metrics retrieved successfully' })
  @Roles('ADMIN')
  async getDatabaseMetrics() {
    const metrics = await this.monitoringService.getDatabaseMetrics();
    
    return {
      statusCode: 200,
      message: 'Database metrics retrieved successfully',
      data: metrics,
    };
  }

  @Get('application/metrics')
  @ApiOperation({ summary: 'Get application metrics' })
  @ApiResponse({ status: 200, description: 'Application metrics retrieved successfully' })
  @Roles('ADMIN')
  async getApplicationMetrics() {
    const metrics = await this.monitoringService.getApplicationMetrics();
    
    return {
      statusCode: 200,
      message: 'Application metrics retrieved successfully',
      data: metrics,
    };
  }

  @Get('business/metrics')
  @ApiOperation({ summary: 'Get business metrics' })
  @ApiResponse({ status: 200, description: 'Business metrics retrieved successfully' })
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT)
  async getBusinessMetrics() {
    const metrics = await this.monitoringService.getBusinessMetrics();
    
    return {
      statusCode: 200,
      message: 'Business metrics retrieved successfully',
      data: metrics,
    };
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get alerts with optional filters' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  @Roles('ADMIN')
  async getAlerts(
    @Query('severity') severity?: string,
    @Query('acknowledged') acknowledged?: boolean,
    @Query('resolved') resolved?: boolean,
    @Query('limit') limit?: number,
  ) {
    const alerts = await this.monitoringService.getAlerts({
      severity,
      acknowledged,
      resolved,
      limit: limit ? parseInt(limit.toString()) : undefined,
    });

    return {
      statusCode: 200,
      message: 'Alerts retrieved successfully',
      data: alerts,
      meta: {
        total: alerts.length,
      },
    };
  }

  @Get('alerts/summary')
  @ApiOperation({ summary: 'Get alerts summary' })
  @ApiResponse({ status: 200, description: 'Alerts summary retrieved successfully' })
  @Roles('ADMIN')
  async getAlertsSummary() {
    const allAlerts = await this.monitoringService.getAlerts();
    
    const summary = {
      total: allAlerts.length,
      byStatus: {
        acknowledged: allAlerts.filter(a => a.acknowledged).length,
        unacknowledged: allAlerts.filter(a => !a.acknowledged).length,
        resolved: allAlerts.filter(a => a.resolved).length,
        active: allAlerts.filter(a => !a.resolved).length,
      },
      bySeverity: {
        critical: allAlerts.filter(a => a.severity === 'critical').length,
        high: allAlerts.filter(a => a.severity === 'high').length,
        medium: allAlerts.filter(a => a.severity === 'medium').length,
        low: allAlerts.filter(a => a.severity === 'low').length,
      },
    };

    return {
      statusCode: 200,
      message: 'Alerts summary retrieved successfully',
      data: summary,
    };
  }

  @Post('alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  async acknowledgeAlert(
    @Param('id') alertId: string,
    @Body('userId') userId: string,
  ) {
    await this.monitoringService.acknowledgeAlert(alertId, userId);
    
    return {
      statusCode: 200,
      message: 'Alert acknowledged successfully',
    };
  }

  @Post('alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  async resolveAlert(@Param('id') alertId: string) {
    await this.monitoringService.resolveAlert(alertId);
    
    return {
      statusCode: 200,
      message: 'Alert resolved successfully',
    };
  }

  @Get('alert-rules')
  @ApiOperation({ summary: 'Get all alert rules' })
  @ApiResponse({ status: 200, description: 'Alert rules retrieved successfully' })
  @Roles('ADMIN')
  async getAlertRules() {
    // This would need to be implemented in the service
    return {
      statusCode: 200,
      message: 'Alert rules retrieved successfully',
      data: [], // Placeholder
    };
  }

  @Post('alert-rules')
  @ApiOperation({ summary: 'Create a new alert rule' })
  @ApiResponse({ status: 201, description: 'Alert rule created successfully' })
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN')
  async createAlertRule(@Body() alertRuleData: Omit<AlertRule, 'id'>) {
    const rule = await this.monitoringService.createAlertRule(alertRuleData);
    
    return {
      statusCode: 201,
      message: 'Alert rule created successfully',
      data: rule,
    };
  }

  @Put('alert-rules/:id')
  @ApiOperation({ summary: 'Update an alert rule' })
  @ApiResponse({ status: 200, description: 'Alert rule updated successfully' })
  @Roles('ADMIN')
  async updateAlertRule(
    @Param('id') ruleId: string,
    @Body() updates: Partial<AlertRule>,
  ) {
    const rule = await this.monitoringService.updateAlertRule(ruleId, updates);
    
    return {
      statusCode: 200,
      message: 'Alert rule updated successfully',
      data: rule,
    };
  }

  @Delete('alert-rules/:id')
  @ApiOperation({ summary: 'Delete an alert rule' })
  @ApiResponse({ status: 200, description: 'Alert rule deleted successfully' })
  @Roles('ADMIN')
  async deleteAlertRule(@Param('id') ruleId: string) {
    await this.monitoringService.deleteAlertRule(ruleId);
    
    return {
      statusCode: 200,
      message: 'Alert rule deleted successfully',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get comprehensive health check' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getHealthCheck() {
    try {
      const [systemMetrics, databaseMetrics] = await Promise.all([
        this.monitoringService.getSystemMetrics().catch(() => null),
        this.monitoringService.getDatabaseMetrics().catch(() => null),
      ]);

      const isHealthy = systemMetrics && databaseMetrics;
      const status = isHealthy ? 'healthy' : 'unhealthy';

      return {
        statusCode: isHealthy ? 200 : 503,
        message: `System is ${status}`,
        data: {
          status,
          timestamp: new Date().toISOString(),
          checks: {
            system: systemMetrics ? 'healthy' : 'unhealthy',
            database: databaseMetrics ? 'healthy' : 'unhealthy',
          },
          uptime: process.uptime(),
          version: process.env.npm_package_version || '1.0.0',
        },
      };
    } catch (error) {
      return {
        statusCode: 503,
        message: 'Health check failed',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: (error as Error).message,
        },
      };
    }
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get monitoring dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  @Roles('ADMIN')
  async getDashboardData() {
    try {
      const [
        systemMetrics,
        databaseMetrics,
        applicationMetrics,
        businessMetrics,
        alerts,
      ] = await Promise.all([
        this.monitoringService.getSystemMetrics(),
        this.monitoringService.getDatabaseMetrics(),
        this.monitoringService.getApplicationMetrics(),
        this.monitoringService.getBusinessMetrics(),
        this.monitoringService.getAlerts({ limit: 10 }),
      ]);

      const activeAlerts = alerts.filter(alert => !alert.resolved);
      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && !alert.resolved);

      return {
        statusCode: 200,
        message: 'Dashboard data retrieved successfully',
        data: {
          metrics: {
            system: systemMetrics,
            database: databaseMetrics,
            application: applicationMetrics,
            business: businessMetrics,
          },
          alerts: {
            total: alerts.length,
            active: activeAlerts.length,
            critical: criticalAlerts.length,
            recent: alerts.slice(0, 5),
          },
          status: {
            overall: criticalAlerts.length === 0 ? 'healthy' : 'critical',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
          },
        },
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Failed to retrieve dashboard data',
        data: { error: (error as Error).message },
      };
    }
  }
}