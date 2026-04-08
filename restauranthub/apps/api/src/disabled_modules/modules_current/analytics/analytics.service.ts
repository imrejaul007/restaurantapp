import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent?: string;
  connectionType?: string;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
  category?: 'navigation' | 'interaction' | 'resource' | 'custom';
  labels?: Record<string, string>;
}

interface PerformancePayload {
  sessionId: string;
  timestamp: number;
  url: string;
  userAgent: string;
  metrics: PerformanceMetric[];
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async processPerformanceMetrics(payload: PerformancePayload): Promise<void> {
    try {
      // In a real application, you might want to:
      // 1. Store in a time-series database like InfluxDB or TimescaleDB
      // 2. Send to analytics services like Google Analytics or Mixpanel
      // 3. Store in Redis for real-time monitoring
      // 4. Queue for batch processing

      // For now, we'll log and optionally store in a simple format
      console.log('Performance metrics received:', {
        sessionId: payload.sessionId,
        url: payload.url,
        metricsCount: payload.metrics.length,
        timestamp: new Date(payload.timestamp).toISOString(),
      });

      // Process Core Web Vitals
      const webVitals = payload.metrics.filter(m =>
        ['CLS', 'FID', 'LCP', 'FCP', 'TTFB'].includes(m.name)
      );

      if (webVitals.length > 0) {
        console.log('Core Web Vitals:', webVitals.map(v => ({
          name: v.name,
          value: v.value,
          rating: v.rating,
        })));
      }

      // Process custom metrics
      const customMetrics = payload.metrics.filter(m => m.category === 'custom');
      if (customMetrics.length > 0) {
        console.log('Custom metrics:', customMetrics.length);
      }

      // Process API calls
      const apiCalls = payload.metrics.filter(m => m.name === 'api-call');
      if (apiCalls.length > 0) {
        console.log('API calls tracked:', apiCalls.length);
      }

      // Process errors
      const errors = payload.metrics.filter(m =>
        m.name === 'javascript-error' || m.name === 'unhandled-promise-rejection'
      );

      if (errors.length > 0) {
        console.log('Errors tracked:', errors.length);
        // You might want to alert on errors
        this.processErrors(errors, payload);
      }

      // Store aggregated data (example - you'd want a proper analytics table)
      await this.storeAnalyticsData(payload);

    } catch (error) {
      console.error('Error processing performance metrics:', error);
      // Don't throw - analytics failures shouldn't break the app
    }
  }

  async processEvent(eventData: {
    event: string;
    properties: Record<string, any>;
    userId?: string;
    sessionId?: string;
    timestamp?: number;
  }): Promise<void> {
    try {
      console.log('Event tracked:', {
        event: eventData.event,
        userId: eventData.userId,
        sessionId: eventData.sessionId,
        timestamp: new Date(eventData.timestamp || Date.now()).toISOString(),
      });

      // Process specific events
      if (eventData.event === 'feature_usage') {
        await this.trackFeatureUsage(eventData);
      }

      // Store event data
      // In production, you'd use a proper analytics/events table
    } catch (error) {
      console.error('Error processing event:', error);
    }
  }

  async processError(errorData: {
    message: string;
    stack?: string;
    url: string;
    userAgent: string;
    userId?: string;
    sessionId?: string;
    timestamp?: number;
  }): Promise<void> {
    try {
      console.error('JavaScript error tracked:', {
        message: errorData.message,
        url: errorData.url,
        userId: errorData.userId,
        sessionId: errorData.sessionId,
        timestamp: new Date(errorData.timestamp || Date.now()).toISOString(),
      });

      // In production, you might:
      // 1. Send to error tracking service (Sentry, Bugsnag)
      // 2. Alert on critical errors
      // 3. Store for analysis
      // 4. Correlate with performance data

    } catch (error) {
      console.error('Error processing error data:', error);
    }
  }

  private async processErrors(errors: PerformanceMetric[], payload: PerformancePayload): Promise<void> {
    for (const error of errors) {
      console.error('Client-side error:', {
        type: error.name,
        message: error.labels?.message,
        filename: error.labels?.filename,
        url: payload.url,
        sessionId: payload.sessionId,
        timestamp: new Date(error.timestamp).toISOString(),
      });
    }
  }

  private async trackFeatureUsage(eventData: any): Promise<void> {
    // Track feature usage patterns
    console.log('Feature usage:', {
      feature: eventData.properties.feature,
      action: eventData.properties.action,
      userId: eventData.userId,
    });
  }

  private async storeAnalyticsData(payload: PerformancePayload): Promise<void> {
    // In a real application, you'd create proper analytics tables
    // For now, we'll just log summary data

    const summary = {
      sessionId: payload.sessionId,
      url: payload.url,
      userAgent: payload.userAgent,
      timestamp: new Date(payload.timestamp),
      metricsCount: payload.metrics.length,

      // Core Web Vitals summary
      webVitals: payload.metrics
        .filter(m => ['CLS', 'FID', 'LCP', 'FCP', 'TTFB'].includes(m.name))
        .reduce((acc, m) => {
          acc[m.name] = { value: m.value, rating: m.rating };
          return acc;
        }, {} as Record<string, any>),

      // Error count
      errorCount: payload.metrics.filter(m =>
        m.name === 'javascript-error' || m.name === 'unhandled-promise-rejection'
      ).length,

      // API call count
      apiCallCount: payload.metrics.filter(m => m.name === 'api-call').length,
    };

    console.log('Analytics summary:', summary);
  }

  // Analytics query methods (for dashboards)
  async getPerformanceSummary(
    startDate: Date,
    endDate: Date,
    url?: string
  ): Promise<any> {
    // In production, you'd query your analytics tables
    // Return mock data for now
    return {
      pageViews: 1250,
      uniqueVisitors: 890,
      averageLoadTime: 2.3,
      coreWebVitals: {
        LCP: { average: 2.1, rating: 'good' },
        FID: { average: 45, rating: 'good' },
        CLS: { average: 0.08, rating: 'good' },
      },
      errorRate: 0.2,
      topPages: [
        { url: '/dashboard', views: 450 },
        { url: '/jobs', views: 320 },
        { url: '/restaurants', views: 280 },
      ],
    };
  }

  async getWebVitalsTrends(days: number = 7): Promise<any> {
    // Return mock trend data
    return {
      LCP: [2.1, 2.3, 2.0, 2.2, 2.1, 2.4, 2.2],
      FID: [45, 48, 42, 46, 44, 50, 47],
      CLS: [0.08, 0.09, 0.07, 0.08, 0.08, 0.10, 0.09],
    };
  }

  async getErrorAnalytics(days: number = 7): Promise<any> {
    // Return mock error data
    return {
      totalErrors: 23,
      errorRate: 0.2,
      topErrors: [
        { message: 'Cannot read property of undefined', count: 8 },
        { message: 'Network request failed', count: 6 },
        { message: 'Unexpected token', count: 4 },
      ],
      errorsByPage: [
        { url: '/jobs/create', errors: 12 },
        { url: '/dashboard', errors: 7 },
        { url: '/profile', errors: 4 },
      ],
    };
  }

  async getFeatureUsageStats(): Promise<any> {
    // Return mock feature usage data
    return {
      totalFeatures: 15,
      activeFeatures: 12,
      topFeatures: [
        { name: 'job_search', usage: 450 },
        { name: 'restaurant_filter', usage: 320 },
        { name: 'user_profile', usage: 280 },
      ],
      featureAdoption: {
        daily: 75,
        weekly: 85,
        monthly: 90,
      },
    };
  }
}