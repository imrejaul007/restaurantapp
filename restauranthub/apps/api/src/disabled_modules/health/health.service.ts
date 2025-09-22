import { Injectable } from '@nestjs/common';
import { 
  HealthIndicatorResult, 
  HealthIndicator, 
  HealthCheckError 
} from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';
// import { RedisService } from '../../redis/redis.service';

@Injectable()
export class HealthService extends HealthIndicator {
  constructor(
    private prismaService: PrismaService,
    // private redisService: RedisService, // Temporarily disabled // Temporarily disabled
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemoryUsage(),
      this.checkDiskSpace(),
    ]);

    const results = {
      database: this.getCheckResult(checks[0]),
      redis: this.getCheckResult(checks[1]),
      memory: this.getCheckResult(checks[2]),
      disk: this.getCheckResult(checks[3]),
    };

    const isHealthy = Object.values(results).every(result => result.status === 'up');

    if (isHealthy) {
      return this.getStatus(key, true, results);
    }

    throw new HealthCheckError('Health check failed', results);
  }

  private async checkDatabase(): Promise<{ status: string; responseTime?: number; error?: string }> {
    try {
      const start = Date.now();
      await this.prismaService.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;
      
      return {
        status: 'up',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'down',
        error: (error as Error).message,
      };
    }
  }

  private async checkRedis(): Promise<{ status: string; responseTime?: number; error?: string }> {
    try {
      const start = Date.now();
      // await // this.redisService.set('health:check', 'ok', 10);
      const value = null; // await this.redisService.get('health:check');
      const responseTime = Date.now() - start;
      
      if (value === 'ok') {
        // await // this.redisService.del('health:check');
        return {
          status: 'up',
          responseTime,
        };
      }
      
      return {
        status: 'down',
        error: 'Redis check value mismatch',
      };
    } catch (error) {
      return {
        status: 'down',
        error: (error as Error).message,
      };
    }
  }

  private async checkMemoryUsage(): Promise<{ status: string; usage?: any; error?: string }> {
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      return {
        status: memoryUsagePercent < 90 ? 'up' : 'down',
        usage: {
          heapUsed: `${Math.round(usedMemory / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(totalMemory / 1024 / 1024)}MB`,
          usagePercent: `${memoryUsagePercent.toFixed(2)}%`,
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        },
      };
    } catch (error) {
      return {
        status: 'down',
        error: (error as Error).message,
      };
    }
  }

  private async checkDiskSpace(): Promise<{ status: string; usage?: any; error?: string }> {
    try {
      const { execSync } = require('child_process');
      
      // This is a simplified check - in production, you might want to use a more robust solution
      const diskUsage = execSync('df -h /', { encoding: 'utf8' });
      const lines = diskUsage.split('\n');
      const dataLine = lines[1];
      const columns = dataLine.split(/\s+/);
      
      const usagePercent = parseInt(columns[4].replace('%', ''));
      
      return {
        status: usagePercent < 90 ? 'up' : 'down',
        usage: {
          total: columns[1],
          used: columns[2],
          available: columns[3],
          usagePercent: `${usagePercent}%`,
        },
      };
    } catch (error) {
      // If we can't check disk space, assume it's okay
      return {
        status: 'up',
        error: 'Could not check disk space: ' + (error as Error).message,
      };
    }
  }

  private getCheckResult(settledResult: PromiseSettledResult<any>): any {
    if (settledResult.status === 'fulfilled') {
      return settledResult.value;
    }
    return {
      status: 'down',
      error: settledResult.reason?.message || 'Unknown error',
    };
  }

  async getSystemInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      pid: process.pid,
    };
  }

  async getDependenciesHealth() {
    const dependencies: Array<{ status: string; name?: string }> = [];

    // Check external APIs if any
    // Example: Payment gateways, email services, etc.
    
    return {
      total: dependencies.length,
      healthy: dependencies.filter(d => d.status === 'up').length,
      dependencies,
    };
  }

  async getDetailedHealth() {
    const [systemInfo, dependenciesHealth, mainHealth] = await Promise.all([
      this.getSystemInfo(),
      this.getDependenciesHealth(),
      this.isHealthy('application').catch(error => (error as any).causes || error),
    ]);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      system: systemInfo,
      dependencies: dependenciesHealth,
      checks: mainHealth,
    };
  }
}