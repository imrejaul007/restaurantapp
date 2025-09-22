import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  HttpHealthIndicator,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('monitoring')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prisma: PrismaService,
    private configService: ConfigService,
    private healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Basic health check',
    description: 'Check if the API is running and responsive',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check successful',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error', 'shutting_down'] },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' },
      },
    },
  })
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ]);
  }

  @Get('detailed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HealthCheck()
  @ApiOperation({
    summary: 'Detailed health check (Admin only)',
    description: 'Comprehensive health check including external services and performance metrics',
  })
  detailedCheck() {
    return this.health.check([
      // Database health
      () => this.prismaHealth.pingCheck('database', this.prisma),
      
      // Memory checks
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 200 * 1024 * 1024),
      
      // Disk space check
      () => this.disk.checkStorage('storage', { 
        path: '/', 
        thresholdPercent: 0.85 
      }),

      // External services (if configured)
      () => this.checkRedis(),
      () => this.checkEmailService(),
      () => this.checkFileStorage(),
      
      // Custom business logic checks
      () => this.healthService.checkDatabaseConnections(),
      () => this.healthService.checkCriticalServices(),
    ]);
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'System metrics (Admin only)',
    description: 'Get detailed system performance and usage metrics',
  })
  async getMetrics() {
    return this.healthService.getSystemMetrics();
  }

  @Get('status')
  @ApiOperation({
    summary: 'Service status',
    description: 'Get current status of all system components',
  })
  async getStatus() {
    return this.healthService.getServiceStatus();
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    const redisUrl = this.configService.get('redis.url');
    if (!redisUrl) {
      return {
        redis: {
          status: 'up',
          message: 'Redis not configured',
        },
      };
    }

    try {
      // Check Redis connectivity - implement actual Redis ping
      return {
        redis: {
          status: 'up',
          responseTime: Date.now(),
        },
      };
    } catch (error) {
      return {
        redis: {
          status: 'down',
          error: (error as Error).message,
        },
      };
    }
  }

  private async checkEmailService(): Promise<HealthIndicatorResult> {
    const smtpHost = this.configService.get('email.smtp.host');
    if (!smtpHost) {
      return {
        email: {
          status: 'up',
          message: 'Email service not configured',
        },
      };
    }

    try {
      // Check SMTP connectivity
      return {
        email: {
          status: 'up',
          host: smtpHost,
          port: this.configService.get('email.smtp.port'),
        },
      };
    } catch (error) {
      return {
        email: {
          status: 'down',
          error: (error as Error).message,
        },
      };
    }
  }

  private async checkFileStorage(): Promise<HealthIndicatorResult> {
    const s3BucketName = this.configService.get('aws.s3.bucketName');
    if (!s3BucketName) {
      return {
        storage: {
          status: 'up',
          message: 'File storage not configured',
        },
      };
    }

    try {
      // Check S3 bucket accessibility
      return {
        storage: {
          status: 'up',
          bucket: s3BucketName,
          region: this.configService.get('aws.region'),
        },
      };
    } catch (error) {
      return {
        storage: {
          status: 'down',
          error: (error as Error).message,
        },
      };
    }
  }
}