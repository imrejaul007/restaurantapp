import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, context, SpanStatusCode, SpanKind, Span } from '@opentelemetry/api';

export interface TracingContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  baggage?: Record<string, string>;
}

export interface SpanData {
  operationName: string;
  spanKind?: SpanKind;
  attributes?: Record<string, string | number | boolean>;
  events?: Array<{
    name: string;
    attributes?: Record<string, string | number | boolean>;
    timestamp?: number;
  }>;
}

@Injectable()
export class TracingService {
  private readonly logger = new Logger(TracingService.name);
  private sdk: NodeSDK;
  private readonly tracer = trace.getTracer('restopapa-api');
  private isInitialized = false;

  constructor(private configService: ConfigService) {}

  /**
   * Initialize OpenTelemetry tracing
   */
  initializeTracing(): void {
    if (this.isInitialized) {
      this.logger.warn('Tracing already initialized');
      return;
    }

    try {
      const jaegerEndpoint = this.configService.get<string>('JAEGER_ENDPOINT', 'http://localhost:14268/api/traces');
      const serviceName = this.configService.get<string>('SERVICE_NAME', 'restopapa-api');
      const serviceVersion = this.configService.get<string>('SERVICE_VERSION', '1.0.0');
      const environment = this.configService.get<string>('NODE_ENV', 'development');

      // Configure Jaeger exporter
      const jaegerExporter = new JaegerExporter({
        endpoint: jaegerEndpoint,
      });

      // Configure resource
      const resource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
      });

      // Initialize SDK
      this.sdk = new NodeSDK({
        resource,
        traceExporter: jaegerExporter,
        instrumentations: [
          getNodeAutoInstrumentations({
            // Disable automatic instrumentations that might conflict
            '@opentelemetry/instrumentation-fs': {
              enabled: false,
            },
            '@opentelemetry/instrumentation-http': {
              enabled: true,
              requestHook: (span, request) => {
                span.setAttributes({
                  'http.request.body.size': request.headers['content-length'] || 0,
                  'http.user_agent': request.headers['user-agent'] || '',
                });
              },
              responseHook: (span, response) => {
                span.setAttributes({
                  'http.response.body.size': response.headers['content-length'] || 0,
                });
              },
            },
            '@opentelemetry/instrumentation-express': {
              enabled: true,
            },
            '@opentelemetry/instrumentation-nestjs-core': {
              enabled: true,
            },
          }),
        ],
      });

      this.sdk.start();
      this.isInitialized = true;

      this.logger.log('✅ OpenTelemetry tracing initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize OpenTelemetry tracing', error);
    }
  }

  /**
   * Create a new span
   */
  createSpan(name: string, spanData?: SpanData): Span {
    const span = this.tracer.startSpan(name, {
      kind: spanData?.spanKind || SpanKind.INTERNAL,
      attributes: spanData?.attributes || {},
    });

    // Add events if provided
    if (spanData?.events) {
      spanData.events.forEach(event => {
        span.addEvent(event.name, event.attributes, event.timestamp);
      });
    }

    return span;
  }

  /**
   * Create a child span
   */
  createChildSpan(parentSpan: Span, name: string, spanData?: SpanData): Span {
    return trace.setSpan(context.active(), parentSpan).with(() => {
      return this.createSpan(name, spanData);
    });
  }

  /**
   * Execute function with tracing context
   */
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T> | T,
    spanData?: SpanData,
  ): Promise<T> {
    const span = this.createSpan(name, spanData);

    try {
      const result = await context.with(trace.setSpan(context.active(), span), async () => {
        return await fn(span);
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });

      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Trace HTTP request
   */
  async traceHttpRequest<T>(
    method: string,
    url: string,
    fn: (span: Span) => Promise<T> | T,
    userId?: string,
    userRole?: string,
  ): Promise<T> {
    return this.withSpan(
      `HTTP ${method.toUpperCase()} ${url}`,
      fn,
      {
        spanKind: SpanKind.SERVER,
        attributes: {
          'http.method': method.toUpperCase(),
          'http.url': url,
          'http.scheme': 'https',
          'user.id': userId || '',
          'user.role': userRole || 'anonymous',
        },
      },
    );
  }

  /**
   * Trace database operation
   */
  async traceDatabaseOperation<T>(
    operation: string,
    table: string,
    fn: (span: Span) => Promise<T> | T,
    query?: string,
  ): Promise<T> {
    return this.withSpan(
      `DB ${operation.toUpperCase()} ${table}`,
      fn,
      {
        spanKind: SpanKind.CLIENT,
        attributes: {
          'db.system': 'postgresql',
          'db.operation': operation.toUpperCase(),
          'db.name': this.configService.get<string>('POSTGRES_DB', 'restopapa'),
          'db.sql.table': table,
          'db.statement': query ? this.sanitizeQuery(query) : '',
        },
      },
    );
  }

  /**
   * Trace cache operation
   */
  async traceCacheOperation<T>(
    operation: string,
    key: string,
    fn: (span: Span) => Promise<T> | T,
    cacheType = 'redis',
  ): Promise<T> {
    return this.withSpan(
      `CACHE ${operation.toUpperCase()} ${key}`,
      fn,
      {
        spanKind: SpanKind.CLIENT,
        attributes: {
          'cache.system': cacheType,
          'cache.operation': operation.toUpperCase(),
          'cache.key': this.sanitizeCacheKey(key),
        },
      },
    );
  }

  /**
   * Trace external API call
   */
  async traceExternalApiCall<T>(
    service: string,
    endpoint: string,
    method: string,
    fn: (span: Span) => Promise<T> | T,
  ): Promise<T> {
    return this.withSpan(
      `EXT_API ${method.toUpperCase()} ${service}`,
      fn,
      {
        operationName: `EXT_API ${method.toUpperCase()} ${service}`,
        spanKind: SpanKind.CLIENT,
        attributes: {
          'http.method': method.toUpperCase(),
          'http.url': endpoint,
          'service.name': service,
          'service.type': 'external_api',
        },
      },
    );
  }

  /**
   * Trace business operation
   */
  async traceBusinessOperation<T>(
    operation: string,
    entity: string,
    fn: (span: Span) => Promise<T> | T,
    metadata?: Record<string, string | number | boolean>,
  ): Promise<T> {
    return this.withSpan(
      `BIZ ${operation.toUpperCase()} ${entity}`,
      fn,
      {
        operationName: `BIZ ${operation.toUpperCase()} ${entity}`,
        spanKind: SpanKind.INTERNAL,
        attributes: {
          'business.operation': operation,
          'business.entity': entity,
          ...metadata,
        },
      },
    );
  }

  /**
   * Trace email operation
   */
  async traceEmailOperation<T>(
    operation: string,
    recipient: string,
    template: string,
    fn: (span: Span) => Promise<T> | T,
  ): Promise<T> {
    return this.withSpan(
      `EMAIL ${operation.toUpperCase()}`,
      fn,
      {
        operationName: `EMAIL ${operation.toUpperCase()}`,
        spanKind: SpanKind.CLIENT,
        attributes: {
          'email.operation': operation,
          'email.recipient': this.sanitizeEmail(recipient),
          'email.template': template,
          'service.name': 'email',
        },
      },
    );
  }

  /**
   * Trace file operation
   */
  async traceFileOperation<T>(
    operation: string,
    filePath: string,
    fn: (span: Span) => Promise<T> | T,
    fileSize?: number,
  ): Promise<T> {
    return this.withSpan(
      `FILE ${operation.toUpperCase()}`,
      fn,
      {
        operationName: `FILE ${operation.toUpperCase()}`,
        spanKind: SpanKind.INTERNAL,
        attributes: {
          'file.operation': operation,
          'file.path': this.sanitizeFilePath(filePath),
          'file.size': fileSize || 0,
        },
      },
    );
  }

  /**
   * Trace payment operation
   */
  async tracePaymentOperation<T>(
    operation: string,
    provider: string,
    amount: number,
    currency: string,
    fn: (span: Span) => Promise<T> | T,
  ): Promise<T> {
    return this.withSpan(
      `PAYMENT ${operation.toUpperCase()}`,
      fn,
      {
        operationName: `PAYMENT ${operation.toUpperCase()}`,
        spanKind: SpanKind.CLIENT,
        attributes: {
          'payment.operation': operation,
          'payment.provider': provider,
          'payment.amount': amount,
          'payment.currency': currency,
          'service.name': 'payment',
        },
      },
    );
  }

  /**
   * Add event to current span
   */
  addEvent(
    name: string,
    attributes?: Record<string, string | number | boolean>,
    timestamp?: number,
  ): void {
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.addEvent(name, attributes, timestamp);
    }
  }

  /**
   * Add attribute to current span
   */
  addAttribute(key: string, value: string | number | boolean): void {
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.setAttribute(key, value);
    }
  }

  /**
   * Add attributes to current span
   */
  addAttributes(attributes: Record<string, string | number | boolean>): void {
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.setAttributes(attributes);
    }
  }

  /**
   * Record exception in current span
   */
  recordException(error: Error): void {
    const currentSpan = trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.recordException(error);
      currentSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Get current tracing context
   */
  getCurrentContext(): TracingContext | null {
    const currentSpan = trace.getActiveSpan();
    if (!currentSpan) return null;

    const spanContext = currentSpan.spanContext();
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    };
  }

  /**
   * Create tracing headers for outgoing requests
   */
  getTracingHeaders(): Record<string, string> {
    const currentSpan = trace.getActiveSpan();
    if (!currentSpan) return {};

    const spanContext = currentSpan.spanContext();
    return {
      'x-trace-id': spanContext.traceId,
      'x-span-id': spanContext.spanId,
    };
  }

  /**
   * Sanitize database query for tracing
   */
  private sanitizeQuery(query: string): string {
    // Remove sensitive data from queries
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password = '[REDACTED]'")
      .replace(/email\s*=\s*'[^@]*@[^']*'/gi, "email = '[REDACTED]@[REDACTED]'")
      .substring(0, 1000); // Limit query length
  }

  /**
   * Sanitize cache key for tracing
   */
  private sanitizeCacheKey(key: string): string {
    // Remove sensitive parts of cache keys
    return key
      .replace(/user:\d+/g, 'user:[ID]')
      .replace(/email:[^:]+/g, 'email:[EMAIL]')
      .substring(0, 100); // Limit key length
  }

  /**
   * Sanitize email for tracing
   */
  private sanitizeEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '[INVALID_EMAIL]';
    return `${local.substring(0, 2)}***@${domain}`;
  }

  /**
   * Sanitize file path for tracing
   */
  private sanitizeFilePath(filePath: string): string {
    // Remove sensitive path information
    return filePath
      .replace(/\/home\/[^\/]+/g, '/home/[USER]')
      .replace(/\/users\/[^\/]+/gi, '/users/[USER]')
      .substring(0, 200); // Limit path length
  }

  /**
   * Get performance timing for current span
   */
  getSpanDuration(): number {
    const currentSpan = trace.getActiveSpan();
    if (!currentSpan) return 0;

    // This is a simplified implementation
    // In practice, you'd need to track span start times
    return performance.now();
  }

  /**
   * Force flush all spans
   */
  async flush(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
    }
  }

  /**
   * Shutdown tracing
   */
  async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
      this.isInitialized = false;
      this.logger.log('🛑 OpenTelemetry tracing shutdown completed');
    }
  }
}