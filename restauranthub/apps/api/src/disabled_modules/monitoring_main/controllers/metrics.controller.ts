import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PrometheusService } from '../prometheus.service';
import { PerformanceService } from '../performance.service';
import { BusinessMetricsService } from '../business-metrics.service';
import { TracingService } from '../tracing.service';

@ApiTags('monitoring')
@Controller('metrics')
export class MetricsController {
  constructor(
    private prometheusService: PrometheusService,
    private performanceService: PerformanceService,
    private businessMetricsService: BusinessMetricsService,
    private tracingService: TracingService,
  ) {}

  /**
   * Prometheus metrics endpoint
   */
  @Get('')
  @ApiOperation({
    summary: 'Get Prometheus metrics',
    description: 'Returns metrics in Prometheus format for scraping',
  })
  @ApiResponse({
    status: 200,
    description: 'Prometheus metrics in text format',
    content: {
      'text/plain': {
        example: `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/health",status_code="200"} 42`,
      },
    },
  })
  async getPrometheusMetrics(): Promise<string> {
    return this.prometheusService.getMetrics();
  }

  /**
   * Performance metrics endpoint
   */
  @Get('performance')
  @ApiOperation({
    summary: 'Get performance metrics',
    description: 'Returns detailed performance metrics in JSON format',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics object',
  })
  async getPerformanceMetrics() {
    return this.performanceService.collectMetrics();
  }

  /**
   * Business KPIs endpoint
   */
  @Get('business')
  @ApiOperation({
    summary: 'Get business KPIs',
    description: 'Returns business key performance indicators',
  })
  @ApiResponse({
    status: 200,
    description: 'Business KPIs object',
  })
  async getBusinessKPIs() {
    return this.businessMetricsService.getBusinessMetricsSnapshot();
  }

  /**
   * Health status endpoint with performance data
   */
  @Get('health')
  @ApiOperation({
    summary: 'Get system health status',
    description: 'Returns system health status with performance indicators',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status object',
  })
  async getHealthStatus() {
    return this.performanceService.getHealthStatus();
  }

  /**
   * Tracing context endpoint
   */
  @Get('tracing')
  @ApiOperation({
    summary: 'Get current tracing context',
    description: 'Returns current distributed tracing context information',
  })
  @ApiResponse({
    status: 200,
    description: 'Tracing context object',
  })
  getTracingContext() {
    const context = this.tracingService.getCurrentContext();
    return {
      context,
      headers: this.tracingService.getTracingHeaders(),
      timestamp: Date.now(),
    };
  }

  /**
   * Custom metrics endpoint
   */
  @Get('custom')
  @ApiOperation({
    summary: 'Get custom metrics',
    description: 'Returns custom application metrics',
  })
  @ApiQuery({
    name: 'metric',
    required: false,
    description: 'Specific metric name to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'Custom metrics object',
  })
  async getCustomMetrics(@Query('metric') metricName?: string) {
    const performanceMetrics = await this.performanceService.collectMetrics();

    if (metricName) {
      return {
        metric: metricName,
        value: performanceMetrics.customMetrics.get(metricName) || 0,
        timestamp: Date.now(),
      };
    }

    // Convert Map to object for JSON serialization
    const customMetrics = Object.fromEntries(performanceMetrics.customMetrics.entries());

    return {
      metrics: customMetrics,
      timestamp: Date.now(),
      count: performanceMetrics.customMetrics.size,
    };
  }

  /**
   * System information endpoint
   */
  @Get('system')
  @ApiOperation({
    summary: 'Get system information',
    description: 'Returns detailed system information and resource usage',
  })
  @ApiResponse({
    status: 200,
    description: 'System information object',
  })
  async getSystemInfo() {
    const performanceMetrics = await this.performanceService.collectMetrics();

    return {
      system: {
        platform: process.platform,
        architecture: process.arch,
        nodeVersion: process.version,
        uptime: process.uptime(),
        pid: process.pid,
        title: process.title,
        versions: process.versions,
      },
      memory: performanceMetrics.memoryUsage,
      cpu: performanceMetrics.cpuUsage,
      eventLoop: {
        delay: performanceMetrics.eventLoopDelay,
        utilization: performanceMetrics.eventLoopUtilization,
      },
      http: performanceMetrics.httpMetrics,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Frontend performance metrics endpoint
   */
  @Post('frontend')
  @ApiOperation({
    summary: 'Submit frontend performance metrics',
    description: 'Receives performance metrics from the frontend including Core Web Vitals',
  })
  @ApiBody({
    description: 'Frontend performance data',
    schema: {
      type: 'object',
      properties: {
        metric: { type: 'string' },
        value: { type: 'number' },
        metadata: { type: 'object' },
        context: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics received successfully',
  })
  receiveFrontendMetrics(@Body() data: any) {
    try {
      // Process individual metric
      if (data.metric && typeof data.value === 'number') {
        this.processFrontendMetric(data);
        return { status: 'success', message: 'Metric received' };
      }

      // Process batch metrics
      if (data.cls !== undefined || data.fid !== undefined || data.lcp !== undefined) {
        this.processFrontendMetricsBatch(data);
        return { status: 'success', message: 'Metrics batch received' };
      }

      return { status: 'error', message: 'Invalid metrics data' };
    } catch (error) {
      console.error('Error processing frontend metrics:', error);
      return { status: 'error', message: 'Failed to process metrics' };
    }
  }

  /**
   * Process individual frontend metric
   */
  private processFrontendMetric(data: any) {
    const { metric, value, metadata, context } = data;

    // Record in Prometheus based on metric type
    switch (metric) {
      case 'cls':
        this.prometheusService.recordCustomMetric('frontend_cls_value', value, {
          rating: metadata?.rating || 'unknown',
          page: context?.pathname || 'unknown',
        });
        break;

      case 'fid':
        this.prometheusService.recordCustomMetric('frontend_fid_ms', value, {
          rating: metadata?.rating || 'unknown',
          page: context?.pathname || 'unknown',
        });
        break;

      case 'lcp':
        this.prometheusService.recordCustomMetric('frontend_lcp_ms', value, {
          rating: metadata?.rating || 'unknown',
          page: context?.pathname || 'unknown',
        });
        break;

      case 'fcp':
        this.prometheusService.recordCustomMetric('frontend_fcp_ms', value, {
          rating: metadata?.rating || 'unknown',
          page: context?.pathname || 'unknown',
        });
        break;

      case 'ttfb':
        this.prometheusService.recordCustomMetric('frontend_ttfb_ms', value, {
          rating: metadata?.rating || 'unknown',
          page: context?.pathname || 'unknown',
        });
        break;

      case 'page-load':
        this.prometheusService.recordCustomMetric('frontend_page_load_ms', value, {
          page: context?.pathname || 'unknown',
        });
        break;

      case 'api-call-success':
        this.prometheusService.recordCustomMetric('frontend_api_call_duration_ms', value, {
          endpoint: metadata?.endpoint || 'unknown',
          status: 'success',
        });
        break;

      case 'api-call-error':
        this.prometheusService.recordCustomMetric('frontend_api_call_duration_ms', value, {
          endpoint: metadata?.endpoint || 'unknown',
          status: 'error',
        });
        this.prometheusService.recordError('frontend_api_error', 'warning', 'frontend');
        break;

      case 'component-render':
        this.prometheusService.recordCustomMetric('frontend_component_render_ms', value, {
          component: metadata?.component || 'unknown',
        });
        break;

      case 'slow-render':
        this.prometheusService.recordCustomMetric('frontend_slow_renders_total', 1, {
          component: metadata?.component || 'unknown',
        });
        break;

      case 'long-task':
        this.prometheusService.recordCustomMetric('frontend_long_tasks_total', 1);
        this.prometheusService.recordCustomMetric('frontend_long_task_duration_ms', value);
        break;

      case 'layout-shift':
        this.prometheusService.recordCustomMetric('frontend_layout_shifts_total', 1);
        this.prometheusService.recordCustomMetric('frontend_layout_shift_value', value);
        break;

      case 'javascript-error':
      case 'unhandled-rejection':
      case 'resource-error':
        this.prometheusService.recordError('frontend_error', 'error', 'frontend');
        break;

      default:
        // Generic custom metric
        this.prometheusService.recordCustomMetric(`frontend_${metric}`, value);
    }

    // Record in performance service for detailed tracking
    this.performanceService.recordCustomMetric(`frontend_${metric}`, value);
  }

  /**
   * Process batch of frontend metrics
   */
  private processFrontendMetricsBatch(data: any) {
    const {
      cls, fid, lcp, fcp, ttfb,
      pageLoadTime, domContentLoadedTime,
      sessionId, userId, url, pathname,
      events = []
    } = data;

    // Record Core Web Vitals
    if (cls !== null && cls !== undefined) {
      this.processFrontendMetric({
        metric: 'cls',
        value: cls,
        metadata: { rating: this.getCLSRating(cls) },
        context: { pathname, url, sessionId, userId }
      });
    }

    if (fid !== null && fid !== undefined) {
      this.processFrontendMetric({
        metric: 'fid',
        value: fid,
        metadata: { rating: this.getFIDRating(fid) },
        context: { pathname, url, sessionId, userId }
      });
    }

    if (lcp !== null && lcp !== undefined) {
      this.processFrontendMetric({
        metric: 'lcp',
        value: lcp,
        metadata: { rating: this.getLCPRating(lcp) },
        context: { pathname, url, sessionId, userId }
      });
    }

    if (fcp !== null && fcp !== undefined) {
      this.processFrontendMetric({
        metric: 'fcp',
        value: fcp,
        metadata: { rating: this.getFCPRating(fcp) },
        context: { pathname, url, sessionId, userId }
      });
    }

    if (ttfb !== null && ttfb !== undefined) {
      this.processFrontendMetric({
        metric: 'ttfb',
        value: ttfb,
        metadata: { rating: this.getTTFBRating(ttfb) },
        context: { pathname, url, sessionId, userId }
      });
    }

    // Record page load metrics
    if (pageLoadTime) {
      this.processFrontendMetric({
        metric: 'page-load-time',
        value: pageLoadTime,
        context: { pathname, url, sessionId, userId }
      });
    }

    if (domContentLoadedTime) {
      this.processFrontendMetric({
        metric: 'dom-content-loaded',
        value: domContentLoadedTime,
        context: { pathname, url, sessionId, userId }
      });
    }

    // Process events
    events.forEach((event: any) => {
      this.processFrontendMetric({
        metric: event.name,
        value: event.duration || 1,
        metadata: event.metadata,
        context: { pathname, url, sessionId, userId, eventType: event.type }
      });
    });

    // Record session metrics
    this.businessMetricsService.recordBusinessOperation('frontend_session', 1);

    if (userId) {
      this.businessMetricsService.recordBusinessOperation('frontend_user_session', 1);
    }
  }

  /**
   * Core Web Vitals rating functions
   */
  private getCLSRating(value: number): string {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  private getFIDRating(value: number): string {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  private getLCPRating(value: number): string {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  private getFCPRating(value: number): string {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  private getTTFBRating(value: number): string {
    if (value <= 800) return 'good';
    if (value <= 1800) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Reset metrics endpoint (for testing/development)
   */
  @Get('reset')
  @ApiOperation({
    summary: 'Reset metrics',
    description: 'Reset all metrics (development only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics reset confirmation',
  })
  resetMetrics() {
    if (process.env.NODE_ENV === 'production') {
      return {
        error: 'Metrics reset not allowed in production',
        status: 403,
      };
    }

    this.prometheusService.clearMetrics();

    return {
      message: 'Metrics reset successfully',
      timestamp: Date.now(),
    };
  }

  /**
   * Detailed business analytics endpoint
   */
  @Get('analytics')
  @ApiOperation({
    summary: 'Get detailed analytics',
    description: 'Returns comprehensive analytics and insights',
  })
  @ApiQuery({
    name: 'timeRange',
    required: false,
    enum: ['1h', '24h', '7d', '30d'],
    description: 'Time range for analytics',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics object',
  })
  async getAnalytics(@Query('timeRange') timeRange: string = '24h') {
    const [businessKPIs, performanceMetrics] = await Promise.all([
      this.businessMetricsService.getBusinessMetricsSnapshot(),
      this.performanceService.collectMetrics(),
    ]);

    return {
      timeRange,
      summary: {
        totalUsers: businessKPIs.userMetrics.totalUsers,
        activeUsers: businessKPIs.userMetrics.activeUsersLast30Days,
        totalRevenue: businessKPIs.financialMetrics.totalRevenue,
        systemUptime: performanceMetrics.uptime,
        errorRate: this.calculateErrorRate(performanceMetrics),
      },
      performance: {
        averageResponseTime: performanceMetrics.httpMetrics.averageResponseTime,
        memoryUsage: performanceMetrics.memoryUsage,
        eventLoopHealth: {
          delay: performanceMetrics.eventLoopDelay,
          utilization: performanceMetrics.eventLoopUtilization,
        },
      },
      business: businessKPIs,
      insights: this.generateInsights(businessKPIs, performanceMetrics),
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate error rate from performance metrics
   */
  private calculateErrorRate(performanceMetrics: any): number {
    const totalRequests = performanceMetrics.httpMetrics.totalRequests;
    const errorRequests = performanceMetrics.customMetrics.get('http_responses_4xx_total') || 0;
    const serverErrors = performanceMetrics.customMetrics.get('http_responses_5xx_total') || 0;

    if (totalRequests === 0) return 0;

    return ((errorRequests + serverErrors) / totalRequests) * 100;
  }

  /**
   * Generate insights from metrics
   */
  private generateInsights(businessKPIs: any, performanceMetrics: any): string[] {
    const insights: string[] = [];

    // Performance insights
    if (performanceMetrics.eventLoopDelay > 10) {
      insights.push('High event loop delay detected - consider optimizing CPU-intensive operations');
    }

    if (performanceMetrics.memoryUsage.heapUsed / performanceMetrics.memoryUsage.heapTotal > 0.8) {
      insights.push('High memory usage detected - monitor for potential memory leaks');
    }

    // Business insights
    if (businessKPIs.userMetrics.userRetentionRate < 70) {
      insights.push('User retention rate is below 70% - consider improving user experience');
    }

    if (businessKPIs.jobMetrics.applicationSuccessRate < 10) {
      insights.push('Low job application success rate - review job matching algorithm');
    }

    if (businessKPIs.orderMetrics.orderCompletionRate < 90) {
      insights.push('Order completion rate below 90% - investigate fulfillment issues');
    }

    if (insights.length === 0) {
      insights.push('All metrics are within normal ranges');
    }

    return insights;
  }
}