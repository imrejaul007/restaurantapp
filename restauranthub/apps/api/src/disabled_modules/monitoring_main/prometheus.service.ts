import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as promClient from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly logger = new Logger(PrometheusService.name);
  private readonly register: promClient.Registry;

  // System Metrics
  private readonly httpRequestsTotal: promClient.Counter<string>;
  private readonly httpRequestDuration: promClient.Histogram<string>;
  private readonly httpRequestsInFlight: promClient.Gauge<string>;
  private readonly nodeMemoryUsage: promClient.Gauge<string>;
  private readonly nodeCpuUsage: promClient.Gauge<string>;
  private readonly eventLoopDelay: promClient.Histogram<string>;
  private readonly eventLoopUtilization: promClient.Gauge<string>;

  // Database Metrics
  private readonly dbOperationsTotal: promClient.Counter<string>;
  private readonly dbOperationDuration: promClient.Histogram<string>;
  private readonly dbConnectionsActive: promClient.Gauge<string>;
  private readonly dbConnectionsIdle: promClient.Gauge<string>;
  private readonly dbQueryErrors: promClient.Counter<string>;

  // Cache Metrics
  private readonly cacheOperationsTotal: promClient.Counter<string>;
  private readonly cacheHitRatio: promClient.Gauge<string>;
  private readonly cacheSize: promClient.Gauge<string>;
  private readonly cacheEvictions: promClient.Counter<string>;

  // Business Metrics
  private readonly userRegistrations: promClient.Counter<string>;
  private readonly userLogins: promClient.Counter<string>;
  private readonly jobPostings: promClient.Counter<string>;
  private readonly jobApplications: promClient.Counter<string>;
  private readonly orderCreations: promClient.Counter<string>;
  private readonly paymentTransactions: promClient.Counter<string>;
  private readonly restaurantRegistrations: promClient.Counter<string>;
  private readonly vendorRegistrations: promClient.Counter<string>;

  // Error Metrics
  private readonly errorTotal: promClient.Counter<string>;
  private readonly uncaughtExceptions: promClient.Counter<string>;
  private readonly unhandledRejections: promClient.Counter<string>;

  // Custom Business KPIs
  private readonly activeUsers: promClient.Gauge<string>;
  private readonly conversionRate: promClient.Gauge<string>;
  private readonly customerSatisfactionScore: promClient.Gauge<string>;
  private readonly revenueTotal: promClient.Counter<string>;

  // Frontend Performance Metrics
  private readonly frontendMetrics: promClient.Gauge<string>;
  private readonly frontendCounters: promClient.Counter<string>;

  constructor(private configService: ConfigService) {
    this.register = new promClient.Registry();

    // Set default labels for all metrics
    this.register.setDefaultLabels({
      app: 'restopapa-api',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      instance: process.env.HOSTNAME || 'localhost',
    });

    // Initialize all metrics
    this.initializeSystemMetrics();
    this.initializeDatabaseMetrics();
    this.initializeCacheMetrics();
    this.initializeBusinessMetrics();
    this.initializeErrorMetrics();
    this.initializeFrontendMetrics();

    // Collect default Node.js metrics
    promClient.collectDefaultMetrics({
      register: this.register,
      prefix: 'nodejs_',
    });

    this.logger.log('✅ Prometheus metrics initialized successfully');
  }

  /**
   * Initialize system-level metrics
   */
  private initializeSystemMetrics(): void {
    this.httpRequestsTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'user_role'],
      registers: [this.register],
    });

    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'user_role'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    this.httpRequestsInFlight = new promClient.Gauge({
      name: 'http_requests_in_flight',
      help: 'Current number of HTTP requests being processed',
      registers: [this.register],
    });

    this.nodeMemoryUsage = new promClient.Gauge({
      name: 'node_memory_usage_bytes',
      help: 'Node.js memory usage in bytes',
      labelNames: ['type'],
      registers: [this.register],
    });

    this.nodeCpuUsage = new promClient.Gauge({
      name: 'node_cpu_usage_seconds_total',
      help: 'Node.js CPU usage in seconds',
      labelNames: ['type'],
      registers: [this.register],
    });

    this.eventLoopDelay = new promClient.Histogram({
      name: 'event_loop_delay_seconds',
      help: 'Event loop delay in seconds',
      buckets: [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1],
      registers: [this.register],
    });

    this.eventLoopUtilization = new promClient.Gauge({
      name: 'event_loop_utilization_ratio',
      help: 'Event loop utilization ratio',
      registers: [this.register],
    });
  }

  /**
   * Initialize database metrics
   */
  private initializeDatabaseMetrics(): void {
    this.dbOperationsTotal = new promClient.Counter({
      name: 'db_operations_total',
      help: 'Total number of database operations',
      labelNames: ['operation', 'table', 'status'],
      registers: [this.register],
    });

    this.dbOperationDuration = new promClient.Histogram({
      name: 'db_operation_duration_seconds',
      help: 'Duration of database operations in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.register],
    });

    this.dbConnectionsActive = new promClient.Gauge({
      name: 'db_connections_active',
      help: 'Number of active database connections',
      registers: [this.register],
    });

    this.dbConnectionsIdle = new promClient.Gauge({
      name: 'db_connections_idle',
      help: 'Number of idle database connections',
      registers: [this.register],
    });

    this.dbQueryErrors = new promClient.Counter({
      name: 'db_query_errors_total',
      help: 'Total number of database query errors',
      labelNames: ['error_type', 'table'],
      registers: [this.register],
    });
  }

  /**
   * Initialize cache metrics
   */
  private initializeCacheMetrics(): void {
    this.cacheOperationsTotal = new promClient.Counter({
      name: 'cache_operations_total',
      help: 'Total number of cache operations',
      labelNames: ['operation', 'result'],
      registers: [this.register],
    });

    this.cacheHitRatio = new promClient.Gauge({
      name: 'cache_hit_ratio',
      help: 'Cache hit ratio',
      labelNames: ['cache_type'],
      registers: [this.register],
    });

    this.cacheSize = new promClient.Gauge({
      name: 'cache_size_bytes',
      help: 'Current cache size in bytes',
      labelNames: ['cache_type'],
      registers: [this.register],
    });

    this.cacheEvictions = new promClient.Counter({
      name: 'cache_evictions_total',
      help: 'Total number of cache evictions',
      labelNames: ['cache_type', 'reason'],
      registers: [this.register],
    });
  }

  /**
   * Initialize business metrics
   */
  private initializeBusinessMetrics(): void {
    this.userRegistrations = new promClient.Counter({
      name: 'user_registrations_total',
      help: 'Total number of user registrations',
      labelNames: ['user_type', 'registration_source'],
      registers: [this.register],
    });

    this.userLogins = new promClient.Counter({
      name: 'user_logins_total',
      help: 'Total number of user logins',
      labelNames: ['user_type', 'login_method'],
      registers: [this.register],
    });

    this.jobPostings = new promClient.Counter({
      name: 'job_postings_total',
      help: 'Total number of job postings',
      labelNames: ['job_type', 'company_size'],
      registers: [this.register],
    });

    this.jobApplications = new promClient.Counter({
      name: 'job_applications_total',
      help: 'Total number of job applications',
      labelNames: ['job_type', 'application_status'],
      registers: [this.register],
    });

    this.orderCreations = new promClient.Counter({
      name: 'order_creations_total',
      help: 'Total number of orders created',
      labelNames: ['order_type', 'customer_type'],
      registers: [this.register],
    });

    this.paymentTransactions = new promClient.Counter({
      name: 'payment_transactions_total',
      help: 'Total number of payment transactions',
      labelNames: ['payment_method', 'status', 'currency'],
      registers: [this.register],
    });

    this.restaurantRegistrations = new promClient.Counter({
      name: 'restaurant_registrations_total',
      help: 'Total number of restaurant registrations',
      labelNames: ['restaurant_type', 'plan_type'],
      registers: [this.register],
    });

    this.vendorRegistrations = new promClient.Counter({
      name: 'vendor_registrations_total',
      help: 'Total number of vendor registrations',
      labelNames: ['vendor_category', 'verification_status'],
      registers: [this.register],
    });

    this.activeUsers = new promClient.Gauge({
      name: 'active_users_current',
      help: 'Current number of active users',
      labelNames: ['user_type', 'time_period'],
      registers: [this.register],
    });

    this.conversionRate = new promClient.Gauge({
      name: 'conversion_rate_percent',
      help: 'Conversion rate percentage',
      labelNames: ['funnel_stage', 'user_segment'],
      registers: [this.register],
    });

    this.customerSatisfactionScore = new promClient.Gauge({
      name: 'customer_satisfaction_score',
      help: 'Customer satisfaction score (1-10)',
      labelNames: ['service_category'],
      registers: [this.register],
    });

    this.revenueTotal = new promClient.Counter({
      name: 'revenue_total_cents',
      help: 'Total revenue in cents',
      labelNames: ['revenue_type', 'currency', 'plan_type'],
      registers: [this.register],
    });
  }

  /**
   * Initialize error metrics
   */
  private initializeErrorMetrics(): void {
    this.errorTotal = new promClient.Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['error_type', 'severity', 'module'],
      registers: [this.register],
    });

    this.uncaughtExceptions = new promClient.Counter({
      name: 'uncaught_exceptions_total',
      help: 'Total number of uncaught exceptions',
      registers: [this.register],
    });

    this.unhandledRejections = new promClient.Counter({
      name: 'unhandled_rejections_total',
      help: 'Total number of unhandled promise rejections',
      registers: [this.register],
    });
  }

  /**
   * Initialize frontend performance metrics
   */
  private initializeFrontendMetrics(): void {
    this.frontendMetrics = new promClient.Gauge({
      name: 'frontend_performance_metrics',
      help: 'Frontend performance metrics including Core Web Vitals',
      labelNames: ['metric_name', 'page', 'rating', 'component', 'endpoint', 'status'],
      registers: [this.register],
    });

    this.frontendCounters = new promClient.Counter({
      name: 'frontend_events_total',
      help: 'Total frontend events and interactions',
      labelNames: ['event_type', 'component', 'page'],
      registers: [this.register],
    });
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    userRole?: string,
  ): void {
    const labels = {
      method: method.toUpperCase(),
      route,
      status_code: statusCode.toString(),
      user_role: userRole || 'anonymous',
    };

    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe(labels, duration / 1000);
  }

  /**
   * Track HTTP requests in flight
   */
  incrementHttpRequestsInFlight(): void {
    this.httpRequestsInFlight.inc();
  }

  decrementHttpRequestsInFlight(): void {
    this.httpRequestsInFlight.dec();
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics(memoryUsage: NodeJS.MemoryUsage, cpuUsage: NodeJS.CpuUsage): void {
    // Memory metrics
    this.nodeMemoryUsage.set({ type: 'heap_used' }, memoryUsage.heapUsed);
    this.nodeMemoryUsage.set({ type: 'heap_total' }, memoryUsage.heapTotal);
    this.nodeMemoryUsage.set({ type: 'external' }, memoryUsage.external);
    this.nodeMemoryUsage.set({ type: 'rss' }, memoryUsage.rss);

    // CPU metrics
    this.nodeCpuUsage.set({ type: 'user' }, cpuUsage.user / 1000000); // Convert to seconds
    this.nodeCpuUsage.set({ type: 'system' }, cpuUsage.system / 1000000); // Convert to seconds
  }

  /**
   * Record event loop metrics
   */
  recordEventLoopDelay(delay: number): void {
    this.eventLoopDelay.observe(delay / 1000); // Convert to seconds
  }

  recordEventLoopUtilization(utilization: number): void {
    this.eventLoopUtilization.set(utilization);
  }

  /**
   * Record database operation
   */
  recordDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
  ): void {
    const status = success ? 'success' : 'error';

    this.dbOperationsTotal.inc({ operation, table, status });
    this.dbOperationDuration.observe({ operation, table }, duration / 1000);

    if (!success) {
      this.dbQueryErrors.inc({ error_type: 'execution_error', table });
    }
  }

  /**
   * Update database connection metrics
   */
  updateDatabaseConnections(active: number, idle: number): void {
    this.dbConnectionsActive.set(active);
    this.dbConnectionsIdle.set(idle);
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(operation: string, hit: boolean, cacheType = 'redis'): void {
    const result = hit ? 'hit' : 'miss';
    this.cacheOperationsTotal.inc({ operation, result });

    // Update hit ratio
    const totalHits = this.cacheOperationsTotal
      .get()
      .values?.find(v => v.labels.operation === operation && v.labels.result === 'hit')?.value || 0;

    const totalMisses = this.cacheOperationsTotal
      .get()
      .values?.find(v => v.labels.operation === operation && v.labels.result === 'miss')?.value || 0;

    const hitRatio = totalHits / (totalHits + totalMisses) || 0;
    this.cacheHitRatio.set({ cache_type: cacheType }, hitRatio);
  }

  /**
   * Record business metrics
   */
  recordUserRegistration(userType: string, source: string): void {
    this.userRegistrations.inc({ user_type: userType, registration_source: source });
  }

  recordUserLogin(userType: string, method: string): void {
    this.userLogins.inc({ user_type: userType, login_method: method });
  }

  recordJobPosting(jobType: string, companySize: string): void {
    this.jobPostings.inc({ job_type: jobType, company_size: companySize });
  }

  recordJobApplication(jobType: string, status: string): void {
    this.jobApplications.inc({ job_type: jobType, application_status: status });
  }

  recordOrderCreation(orderType: string, customerType: string): void {
    this.orderCreations.inc({ order_type: orderType, customer_type: customerType });
  }

  recordPaymentTransaction(
    paymentMethod: string,
    status: string,
    currency: string,
    amount?: number,
  ): void {
    this.paymentTransactions.inc({ payment_method: paymentMethod, status, currency });

    if (amount && status === 'success') {
      this.revenueTotal.inc({ revenue_type: 'payment', currency, plan_type: 'standard' }, amount);
    }
  }

  recordRestaurantRegistration(restaurantType: string, planType: string): void {
    this.restaurantRegistrations.inc({ restaurant_type: restaurantType, plan_type: planType });
  }

  recordVendorRegistration(category: string, verificationStatus: string): void {
    this.vendorRegistrations.inc({ vendor_category: category, verification_status: verificationStatus });
  }

  /**
   * Update KPI metrics
   */
  updateActiveUsers(userType: string, timePeriod: string, count: number): void {
    this.activeUsers.set({ user_type: userType, time_period: timePeriod }, count);
  }

  updateConversionRate(funnelStage: string, userSegment: string, rate: number): void {
    this.conversionRate.set({ funnel_stage: funnelStage, user_segment: userSegment }, rate);
  }

  updateCustomerSatisfactionScore(serviceCategory: string, score: number): void {
    this.customerSatisfactionScore.set({ service_category: serviceCategory }, score);
  }

  /**
   * Record error metrics
   */
  recordError(errorType: string, severity: string, module: string): void {
    this.errorTotal.inc({ error_type: errorType, severity, module });
  }

  recordUncaughtException(): void {
    this.uncaughtExceptions.inc();
  }

  recordUnhandledRejection(): void {
    this.unhandledRejections.inc();
  }

  /**
   * Get metrics for Prometheus scraping
   */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Get metrics registry
   */
  getRegistry(): promClient.Registry {
    return this.register;
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clearMetrics(): void {
    this.register.clear();
  }

  /**
   * Record custom metric (for frontend and other custom metrics)
   */
  recordCustomMetric(metricName: string, value: number, labels: Record<string, string> = {}): void {
    // Determine if this is a counter or gauge metric
    const isCounter = metricName.includes('_total') ||
                     metricName.includes('_count') ||
                     metricName.includes('_errors') ||
                     metricName.includes('events_');

    if (isCounter) {
      this.frontendCounters.inc(
        {
          event_type: metricName,
          component: labels.component || 'unknown',
          page: labels.page || 'unknown',
        },
        value
      );
    } else {
      this.frontendMetrics.set(
        {
          metric_name: metricName,
          page: labels.page || 'unknown',
          rating: labels.rating || 'unknown',
          component: labels.component || 'unknown',
          endpoint: labels.endpoint || 'unknown',
          status: labels.status || 'unknown',
        },
        value
      );
    }
  }

  /**
   * Get metric by name
   */
  getMetric(name: string): promClient.Metric<string> | undefined {
    return this.register.getSingleMetric(name);
  }
}