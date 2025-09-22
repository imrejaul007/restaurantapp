import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CircuitBreakerService, CircuitState } from '../../common/circuit-breaker.service';
import { LoggerService } from '../../common/logger.service';

interface CircuitBreakerHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  circuits: {
    total: number;
    closed: number;
    open: number;
    halfOpen: number;
  };
  details: Array<{
    name: string;
    state: CircuitState;
    failureCount: number;
    successCount: number;
    totalCalls: number;
    totalFailures: number;
    totalSuccesses: number;
    uptime: number;
    lastFailureTime?: string;
    nextAttemptTime?: string;
    failureRate: number;
    successRate: number;
  }>;
}

@ApiTags('Health')
@Controller('health')
export class CircuitBreakerHealthController {
  constructor(
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly logger: LoggerService,
  ) {}

  @Get('circuit-breakers')
  @ApiOperation({ summary: 'Get circuit breaker health status' })
  @ApiResponse({
    status: 200,
    description: 'Circuit breaker health information',
    type: Object,
  })
  getCircuitBreakerHealth(): CircuitBreakerHealthResponse {
    const allStats = this.circuitBreakerService.getAllCircuitStats();

    let closedCount = 0;
    let openCount = 0;
    let halfOpenCount = 0;

    const details = Object.entries(allStats).map(([name, stats]) => {
      // Count states
      switch (stats.state) {
        case CircuitState.CLOSED:
          closedCount++;
          break;
        case CircuitState.OPEN:
          openCount++;
          break;
        case CircuitState.HALF_OPEN:
          halfOpenCount++;
          break;
      }

      // Calculate rates
      const failureRate = stats.totalCalls > 0
        ? (stats.totalFailures / stats.totalCalls) * 100
        : 0;
      const successRate = stats.totalCalls > 0
        ? (stats.totalSuccesses / stats.totalCalls) * 100
        : 0;

      return {
        name,
        state: stats.state,
        failureCount: stats.failureCount,
        successCount: stats.successCount,
        totalCalls: stats.totalCalls,
        totalFailures: stats.totalFailures,
        totalSuccesses: stats.totalSuccesses,
        uptime: stats.uptime,
        lastFailureTime: stats.lastFailureTime?.toISOString(),
        nextAttemptTime: stats.nextAttemptTime?.toISOString(),
        failureRate: Math.round(failureRate * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
      };
    });

    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (openCount > 0) {
      status = openCount > closedCount ? 'unhealthy' : 'degraded';
    } else if (halfOpenCount > 0) {
      status = 'degraded';
    }

    const response: CircuitBreakerHealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      circuits: {
        total: Object.keys(allStats).length,
        closed: closedCount,
        open: openCount,
        halfOpen: halfOpenCount,
      },
      details,
    };

    // Log health check
    this.logger.log(`Circuit breaker health check`, {
      operation: 'CIRCUIT_BREAKER_HEALTH_CHECK',
      status,
      totalCircuits: Object.keys(allStats).length,
      openCircuits: openCount,
      halfOpenCircuits: halfOpenCount,
    });

    return response;
  }

  @Get('circuit-breakers/summary')
  @ApiOperation({ summary: 'Get circuit breaker summary' })
  @ApiResponse({
    status: 200,
    description: 'Circuit breaker summary',
  })
  getCircuitBreakerSummary() {
    const allStats = this.circuitBreakerService.getAllCircuitStats();

    const summary = {
      totalCircuits: Object.keys(allStats).length,
      healthyCircuits: 0,
      unhealthyCircuits: 0,
      totalCalls: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      overallFailureRate: 0,
      overallSuccessRate: 0,
      circuitsByState: {
        closed: 0,
        open: 0,
        halfOpen: 0,
      },
      topFailingCircuits: [] as Array<{ name: string; failureRate: number; totalFailures: number }>,
      mostUsedCircuits: [] as Array<{ name: string; totalCalls: number; successRate: number }>,
    };

    Object.entries(allStats).forEach(([name, stats]) => {
      // Count by state
      summary.circuitsByState[stats.state.toLowerCase()]++;

      // Health counters
      if (stats.state === CircuitState.CLOSED) {
        summary.healthyCircuits++;
      } else {
        summary.unhealthyCircuits++;
      }

      // Totals
      summary.totalCalls += stats.totalCalls;
      summary.totalFailures += stats.totalFailures;
      summary.totalSuccesses += stats.totalSuccesses;

      // Collect data for top lists
      if (stats.totalCalls > 0) {
        const failureRate = (stats.totalFailures / stats.totalCalls) * 100;
        const successRate = (stats.totalSuccesses / stats.totalCalls) * 100;

        summary.topFailingCircuits.push({
          name,
          failureRate: Math.round(failureRate * 100) / 100,
          totalFailures: stats.totalFailures,
        });

        summary.mostUsedCircuits.push({
          name,
          totalCalls: stats.totalCalls,
          successRate: Math.round(successRate * 100) / 100,
        });
      }
    });

    // Calculate overall rates
    if (summary.totalCalls > 0) {
      summary.overallFailureRate = Math.round((summary.totalFailures / summary.totalCalls) * 10000) / 100;
      summary.overallSuccessRate = Math.round((summary.totalSuccesses / summary.totalCalls) * 10000) / 100;
    }

    // Sort top lists
    summary.topFailingCircuits.sort((a, b) => b.failureRate - a.failureRate).slice(0, 5);
    summary.mostUsedCircuits.sort((a, b) => b.totalCalls - a.totalCalls).slice(0, 5);

    return summary;
  }

  @Get('circuit-breakers/:name')
  @ApiOperation({ summary: 'Get specific circuit breaker details' })
  getCircuitBreakerDetails(name: string) {
    const stats = this.circuitBreakerService.getCircuitStats(name);

    if (!stats) {
      return {
        error: 'Circuit breaker not found',
        name,
        available: Object.keys(this.circuitBreakerService.getAllCircuitStats()),
      };
    }

    const failureRate = stats.totalCalls > 0
      ? (stats.totalFailures / stats.totalCalls) * 100
      : 0;
    const successRate = stats.totalCalls > 0
      ? (stats.totalSuccesses / stats.totalCalls) * 100
      : 0;

    return {
      name,
      ...stats,
      failureRate: Math.round(failureRate * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      uptimeHours: Math.round(stats.uptime / (1000 * 60 * 60) * 100) / 100,
      lastFailureTime: stats.lastFailureTime?.toISOString(),
      nextAttemptTime: stats.nextAttemptTime?.toISOString(),
    };
  }
}