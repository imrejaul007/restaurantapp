import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { SecurityService } from './security.service';

class BlockIPRequest {
  ip: string;
  reason: string;
  duration?: number; // in seconds
}

class SecurityConfigRequest {
  bruteForceEnabled: boolean;
  maxFailedAttempts: number;
  blockDuration: number;
  rateLimitEnabled: boolean;
  requestsPerWindow: number;
  windowSizeMs: number;
}

@ApiTags('security')
@Controller('api/v1/security')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('metrics')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get security metrics and statistics' })
  @ApiResponse({ status: 200, description: 'Security metrics retrieved successfully' })
  async getSecurityMetrics() {
    const metrics = await this.securityService.getSecurityMetrics();
    return {
      metrics,
      timestamp: new Date(),
    };
  }

  @Get('report')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get comprehensive security report' })
  @ApiResponse({ status: 200, description: 'Security report generated successfully' })
  async getSecurityReport() {
    const report = await this.securityService.getSecurityReport();
    return {
      report,
      generatedAt: new Date(),
    };
  }

  @Get('threats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get recent security threats' })
  @ApiResponse({ status: 200, description: 'Security threats retrieved successfully' })
  async getSecurityThreats(
    @Query('limit') limit: number = 50,
    @Query('severity') severity?: 'low' | 'medium' | 'high' | 'critical',
    @Query('type') type?: string,
  ) {
    const report = await this.securityService.getSecurityReport();

    let threats = report.recentThreats;

    // Filter by severity
    if (severity) {
      threats = threats.filter(threat => threat.severity === severity);
    }

    // Filter by type
    if (type) {
      threats = threats.filter(threat => threat.type === type);
    }

    // Limit results
    threats = threats.slice(0, limit);

    return {
      threats,
      total: threats.length,
      filters: { severity, type, limit },
    };
  }

  @Post('validate-input')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Validate input for security threats' })
  @ApiResponse({ status: 200, description: 'Input validation completed' })
  async validateInput(
    @Body() request: { input: any },
    @Request() req: any,
  ) {
    const validation = await this.securityService.validateInput(request.input, req);

    return {
      isValid: validation.isValid,
      threats: validation.threats,
      input: typeof request.input === 'string'
        ? request.input.substring(0, 100)
        : '[object]',
      analyzedAt: new Date(),
    };
  }

  @Post('analyze-request')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Analyze request pattern for security risks' })
  @ApiResponse({ status: 200, description: 'Request analysis completed' })
  async analyzeRequest(@Request() req: any) {
    const analysis = await this.securityService.analyzeRequestPattern(req);

    return {
      analysis,
      requestInfo: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      },
      analyzedAt: new Date(),
    };
  }

  @Post('block-ip')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Manually block an IP address' })
  @ApiResponse({ status: 200, description: 'IP address blocked successfully' })
  async blockIP(
    @Body() request: BlockIPRequest,
    @Request() req: any,
  ) {
    await this.securityService.blockIP(
      request.ip,
      `Manual block by admin ${req.user.email}: ${request.reason}`,
      request.duration || 3600 * 24, // Default 24 hours
    );

    return {
      message: `IP ${request.ip} blocked successfully`,
      blockedBy: req.user.email,
      reason: request.reason,
      duration: request.duration || 3600 * 24,
      blockedAt: new Date(),
    };
  }

  @Delete('unblock-ip/:ip')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Unblock an IP address' })
  @ApiResponse({ status: 200, description: 'IP address unblocked successfully' })
  async unblockIP(
    @Param('ip') ip: string,
    @Request() req: any,
  ) {
    await this.securityService.unblockIP(ip);

    return {
      message: `IP ${ip} unblocked successfully`,
      unblockedBy: req.user.email,
      unblockedAt: new Date(),
    };
  }

  @Get('blocked-ips')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get list of blocked IP addresses' })
  @ApiResponse({ status: 200, description: 'Blocked IPs retrieved successfully' })
  async getBlockedIPs() {
    const report = await this.securityService.getSecurityReport();

    return {
      blockedIPs: report.blockedIPs,
      total: report.blockedIPs.length,
      retrievedAt: new Date(),
    };
  }

  @Get('check-ip/:ip')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Check security status of an IP address' })
  @ApiResponse({ status: 200, description: 'IP status checked successfully' })
  async checkIPStatus(@Param('ip') ip: string) {
    // Create a mock request object for analysis
    const mockReq = {
      ip,
      get: () => 'Security-Check/1.0',
      path: '/security/check',
      url: '',
    };

    const analysis = await this.securityService.analyzeRequestPattern(mockReq);

    return {
      ip,
      analysis,
      checkedAt: new Date(),
    };
  }

  @Post('scan/sql-injection')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Test SQL injection detection' })
  @ApiResponse({ status: 200, description: 'SQL injection scan completed' })
  async testSQLInjectionDetection(@Body() request: { testInput: string }) {
    const detected = await this.securityService.detectSQLInjection(request.testInput);

    return {
      input: request.testInput,
      sqlInjectionDetected: detected,
      scannedAt: new Date(),
    };
  }

  @Post('scan/xss')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Test XSS detection' })
  @ApiResponse({ status: 200, description: 'XSS scan completed' })
  async testXSSDetection(@Body() request: { testInput: string }) {
    const detected = await this.securityService.detectXSS(request.testInput);

    return {
      input: request.testInput,
      xssDetected: detected,
      scannedAt: new Date(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get security system health status' })
  @ApiResponse({ status: 200, description: 'Security health status retrieved' })
  async getSecurityHealth() {
    const metrics = await this.securityService.getSecurityMetrics();

    const healthStatus = {
      status: metrics.riskScore < 0.5 ? 'healthy' :
              metrics.riskScore < 0.8 ? 'warning' : 'critical',
      riskScore: metrics.riskScore,
      systemsOperational: {
        bruteForceProtection: true,
        rateLimiting: true,
        inputValidation: true,
        ipFiltering: true,
        threatDetection: true,
      },
      lastUpdate: new Date(),
    };

    return healthStatus;
  }

  @Get('recommendations')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get security recommendations' })
  @ApiResponse({ status: 200, description: 'Security recommendations retrieved' })
  async getSecurityRecommendations() {
    const report = await this.securityService.getSecurityReport();

    return {
      recommendations: report.recommendations,
      basedOnMetrics: report.summary,
      generatedAt: new Date(),
    };
  }
}