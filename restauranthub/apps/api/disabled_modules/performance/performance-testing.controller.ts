import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import {
  PerformanceTestingService,
  LoadTestConfig,
  PerformanceTestResult,
  PerformanceRecommendation,
} from './performance-testing.service';

class CreateLoadTestDto {
  targetUrl: string;
  concurrentUsers: number;
  duration: number;
  rampUpTime: number;
  testType: 'stress' | 'load' | 'spike' | 'volume' | 'endurance';
  requestsPerSecond?: number;
  scenarios?: Array<{
    name: string;
    weight: number;
    endpoints: Array<{
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      path: string;
      headers?: Record<string, string>;
      body?: any;
      expectedStatusCode?: number;
    }>;
  }>;
}

class ScheduleTestDto extends CreateLoadTestDto {
  schedule: {
    cron: string;
    timezone?: string;
  };
}

@ApiTags('performance-testing')
@Controller('api/v1/performance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PerformanceTestingController {
  constructor(private readonly performanceTestingService: PerformanceTestingService) {}

  @Post('load-test')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Start a new load test' })
  @ApiResponse({ status: 201, description: 'Load test started successfully' })
  async startLoadTest(
    @Body() createTestDto: CreateLoadTestDto,
    @Request() req: any,
  ) {
    const config: LoadTestConfig = {
      targetUrl: createTestDto.targetUrl,
      concurrentUsers: createTestDto.concurrentUsers,
      duration: createTestDto.duration,
      rampUpTime: createTestDto.rampUpTime,
      testType: createTestDto.testType,
      requestsPerSecond: createTestDto.requestsPerSecond,
      scenarios: createTestDto.scenarios,
    };

    const testId = await this.performanceTestingService.runLoadTest(config);

    return {
      testId,
      message: 'Load test started successfully',
      config,
      startedBy: req.user.email,
      startedAt: new Date(),
      estimatedDuration: config.duration + config.rampUpTime,
    };
  }

  @Get('load-test/:testId/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get load test status' })
  @ApiResponse({ status: 200, description: 'Test status retrieved successfully' })
  async getTestStatus(@Param('testId') testId: string) {
    const status = await this.performanceTestingService.getTestStatus(testId);

    return {
      testId,
      status: status.status,
      progress: status.progress,
      currentMetrics: status.currentMetrics,
      retrievedAt: new Date(),
    };
  }

  @Get('load-test/:testId/results')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get load test results' })
  @ApiResponse({ status: 200, description: 'Test results retrieved successfully' })
  async getTestResults(@Param('testId') testId: string): Promise<{
    testId: string;
    results: PerformanceTestResult | null;
    retrievedAt: Date;
  }> {
    const results = await this.performanceTestingService.getTestResults(testId);

    return {
      testId,
      results,
      retrievedAt: new Date(),
    };
  }

  @Get('recommendations')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get performance optimization recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  async getOptimizationRecommendations(): Promise<{
    recommendations: PerformanceRecommendation[];
    generatedAt: Date;
    totalRecommendations: number;
    priorityBreakdown: Record<string, number>;
  }> {
    const recommendations = await this.performanceTestingService.getOptimizationRecommendations();

    const priorityBreakdown = recommendations.reduce((acc, rec) => {
      acc[rec.priority] = (acc[rec.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      recommendations,
      generatedAt: new Date(),
      totalRecommendations: recommendations.length,
      priorityBreakdown,
    };
  }

  @Post('schedule-test')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Schedule a recurring performance test' })
  @ApiResponse({ status: 201, description: 'Performance test scheduled successfully' })
  async schedulePerformanceTest(
    @Body() scheduleDto: ScheduleTestDto,
    @Request() req: any,
  ) {
    const config: LoadTestConfig = {
      targetUrl: scheduleDto.targetUrl,
      concurrentUsers: scheduleDto.concurrentUsers,
      duration: scheduleDto.duration,
      rampUpTime: scheduleDto.rampUpTime,
      testType: scheduleDto.testType,
      requestsPerSecond: scheduleDto.requestsPerSecond,
      scenarios: scheduleDto.scenarios,
    };

    const scheduleId = await this.performanceTestingService.schedulePerformanceTest(
      config,
      scheduleDto.schedule
    );

    return {
      scheduleId,
      message: 'Performance test scheduled successfully',
      config,
      schedule: scheduleDto.schedule,
      scheduledBy: req.user.email,
      scheduledAt: new Date(),
    };
  }

  @Get('test-templates')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get predefined test templates' })
  @ApiResponse({ status: 200, description: 'Test templates retrieved successfully' })
  async getTestTemplates() {
    const templates = [
      {
        name: 'Basic Load Test',
        description: 'Standard load test for general API testing',
        config: {
          concurrentUsers: 50,
          duration: 300, // 5 minutes
          rampUpTime: 60, // 1 minute
          testType: 'load' as const,
          requestsPerSecond: 50,
        },
        scenarios: [
          {
            name: 'User Authentication Flow',
            weight: 30,
            endpoints: [
              { method: 'POST' as const, path: '/api/v1/auth/login', expectedStatusCode: 200 },
              { method: 'GET' as const, path: '/api/v1/users/profile', expectedStatusCode: 200 },
            ],
          },
          {
            name: 'Restaurant Browsing',
            weight: 50,
            endpoints: [
              { method: 'GET' as const, path: '/api/v1/restaurants', expectedStatusCode: 200 },
              { method: 'GET' as const, path: '/api/v1/restaurants/1', expectedStatusCode: 200 },
            ],
          },
          {
            name: 'Job Search',
            weight: 20,
            endpoints: [
              { method: 'GET' as const, path: '/api/v1/jobs', expectedStatusCode: 200 },
              { method: 'GET' as const, path: '/api/v1/jobs/search', expectedStatusCode: 200 },
            ],
          },
        ],
      },
      {
        name: 'Stress Test',
        description: 'High-load stress test to find breaking points',
        config: {
          concurrentUsers: 200,
          duration: 600, // 10 minutes
          rampUpTime: 120, // 2 minutes
          testType: 'stress' as const,
          requestsPerSecond: 200,
        },
        scenarios: [
          {
            name: 'Heavy API Usage',
            weight: 100,
            endpoints: [
              { method: 'GET' as const, path: '/api/v1/restaurants', expectedStatusCode: 200 },
              { method: 'GET' as const, path: '/api/v1/jobs', expectedStatusCode: 200 },
              { method: 'GET' as const, path: '/api/v1/marketplace/products', expectedStatusCode: 200 },
            ],
          },
        ],
      },
      {
        name: 'Spike Test',
        description: 'Test system behavior under sudden traffic spikes',
        config: {
          concurrentUsers: 100,
          duration: 300, // 5 minutes
          rampUpTime: 30, // 30 seconds
          testType: 'spike' as const,
          requestsPerSecond: 150,
        },
        scenarios: [
          {
            name: 'Flash Sale Simulation',
            weight: 80,
            endpoints: [
              { method: 'GET' as const, path: '/api/v1/marketplace/products', expectedStatusCode: 200 },
              { method: 'POST' as const, path: '/api/v1/orders', expectedStatusCode: 201 },
            ],
          },
          {
            name: 'Normal Operations',
            weight: 20,
            endpoints: [
              { method: 'GET' as const, path: '/api/v1/restaurants', expectedStatusCode: 200 },
              { method: 'GET' as const, path: '/api/v1/jobs', expectedStatusCode: 200 },
            ],
          },
        ],
      },
      {
        name: 'Endurance Test',
        description: 'Long-running test to check for memory leaks and stability',
        config: {
          concurrentUsers: 75,
          duration: 3600, // 1 hour
          rampUpTime: 300, // 5 minutes
          testType: 'endurance' as const,
          requestsPerSecond: 75,
        },
        scenarios: [
          {
            name: 'Sustained Operations',
            weight: 100,
            endpoints: [
              { method: 'GET' as const, path: '/api/v1/restaurants', expectedStatusCode: 200 },
              { method: 'GET' as const, path: '/api/v1/jobs', expectedStatusCode: 200 },
              { method: 'GET' as const, path: '/api/v1/users/profile', expectedStatusCode: 200 },
              { method: 'GET' as const, path: '/api/v1/analytics/dashboard', expectedStatusCode: 200 },
            ],
          },
        ],
      },
    ];

    return {
      templates,
      totalTemplates: templates.length,
      retrievedAt: new Date(),
    };
  }

  @Get('metrics/current')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get current system performance metrics' })
  @ApiResponse({ status: 200, description: 'Current metrics retrieved successfully' })
  async getCurrentMetrics() {
    // This would integrate with your monitoring service
    const metrics = {
      systemHealth: {
        cpu: {
          usage: Math.random() * 80 + 10, // 10-90%
          cores: 4,
          loadAverage: Math.random() * 2 + 0.5,
        },
        memory: {
          used: Math.random() * 70 + 20, // 20-90%
          total: 8192, // MB
          available: Math.random() * 3000 + 1000,
        },
        disk: {
          usage: Math.random() * 50 + 30, // 30-80%
          total: 100, // GB
          available: Math.random() * 40 + 20,
        },
        network: {
          inbound: Math.random() * 100 + 50, // Mbps
          outbound: Math.random() * 50 + 25,
          connections: Math.floor(Math.random() * 1000) + 500,
        },
      },
      applicationHealth: {
        responseTime: {
          average: Math.random() * 200 + 50, // 50-250ms
          p95: Math.random() * 400 + 200,
          p99: Math.random() * 800 + 400,
        },
        throughput: Math.random() * 100 + 50, // requests/second
        errorRate: Math.random() * 0.05, // 0-5%
        activeConnections: Math.floor(Math.random() * 500) + 100,
      },
      databaseHealth: {
        connections: {
          active: Math.floor(Math.random() * 20) + 10,
          idle: Math.floor(Math.random() * 10) + 5,
          max: 50,
        },
        queryPerformance: {
          averageTime: Math.random() * 50 + 10, // 10-60ms
          slowQueries: Math.floor(Math.random() * 5),
          deadlocks: Math.floor(Math.random() * 2),
        },
        cacheHitRate: Math.random() * 0.3 + 0.7, // 70-100%
      },
      recommendations: [
        {
          type: 'warning',
          message: 'Database connection pool is approaching limit',
          action: 'Consider increasing pool size or optimizing queries',
        },
        {
          type: 'info',
          message: 'Cache hit rate is optimal',
          action: 'Current caching strategy is performing well',
        },
      ],
    };

    return {
      metrics,
      timestamp: new Date(),
      uptime: process.uptime(),
      version: process.version,
    };
  }

  @Get('reports/summary')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get performance testing summary report' })
  @ApiResponse({ status: 200, description: 'Summary report generated successfully' })
  async getPerformanceSummary(
    @Query('days') days: string = '7',
  ) {
    const daysCount = parseInt(days, 10) || 7;

    // Mock summary data - in real implementation, this would aggregate historical test data
    const summary = {
      period: `Last ${daysCount} days`,
      totalTests: Math.floor(Math.random() * 20) + 5,
      averagePerformance: {
        responseTime: Math.random() * 100 + 80, // 80-180ms
        throughput: Math.random() * 50 + 100, // 100-150 rps
        errorRate: Math.random() * 0.02, // 0-2%
        successRate: Math.random() * 0.05 + 0.95, // 95-100%
      },
      trends: {
        responseTime: {
          trend: Math.random() > 0.5 ? 'improving' : 'degrading',
          change: (Math.random() * 20 - 10).toFixed(1), // -10% to +10%
        },
        errorRate: {
          trend: Math.random() > 0.7 ? 'improving' : 'stable',
          change: (Math.random() * 2 - 1).toFixed(2), // -1% to +1%
        },
      },
      criticalIssues: Math.floor(Math.random() * 3),
      resolvedIssues: Math.floor(Math.random() * 8) + 2,
      upcomingTests: Math.floor(Math.random() * 5) + 1,
    };

    return {
      summary,
      generatedAt: new Date(),
      reportPeriod: {
        start: new Date(Date.now() - daysCount * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
    };
  }
}