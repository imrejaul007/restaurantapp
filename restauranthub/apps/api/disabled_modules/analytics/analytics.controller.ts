import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('metrics')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get general metrics' })
  async getMetrics() {
    return this.analyticsService.getMetrics();
  }

  @Get('users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user metrics' })
  async getUserMetrics() {
    return this.analyticsService.getUserMetrics();
  }

  @Get('orders')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get order metrics' })
  async getOrderMetrics() {
    return this.analyticsService.getOrderMetrics();
  }
}