import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('performance')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackPerformance(@Body() payload: PerformancePayload): Promise<void> {
    try {
      await this.analyticsService.processPerformanceMetrics(payload);
    } catch (error) {
      // Log error but don't fail the request - analytics shouldn't break user experience
      console.error('Failed to process performance metrics:', error);
    }
  }

  @Post('events')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackEvent(@Body() eventData: {
    event: string;
    properties: Record<string, any>;
    userId?: string;
    sessionId?: string;
    timestamp?: number;
  }): Promise<void> {
    try {
      await this.analyticsService.processEvent(eventData);
    } catch (error) {
      console.error('Failed to process event:', error);
    }
  }

  @Post('errors')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackError(@Body() errorData: {
    message: string;
    stack?: string;
    url: string;
    userAgent: string;
    userId?: string;
    sessionId?: string;
    timestamp?: number;
  }): Promise<void> {
    try {
      await this.analyticsService.processError(errorData);
    } catch (error) {
      console.error('Failed to process error:', error);
    }
  }
}