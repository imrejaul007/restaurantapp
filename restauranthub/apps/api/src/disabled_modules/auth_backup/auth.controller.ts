import { Controller, Post, Get, Delete, Body, UseGuards, Req, HttpCode, HttpStatus, Query, Param, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
// import { RedisHealthService } from '../../redis/redis-health.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { BruteForceGuard } from './guards/brute-force.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly bruteForceGuard: BruteForceGuard,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  @UseGuards(BruteForceGuard)  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiQuery({ name: 'all', required: false, description: 'Logout from all devices' })
  async logout(@Req() req: AuthenticatedRequest, @Query('all') logoutAll?: string) {
    return this.authService.logout(req.user!.id, logoutAll === 'true');
  }

  @Post('forgot-password')
  @UseGuards(BruteForceGuard)  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset link sent if email exists' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @UseGuards(BruteForceGuard)  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  async changePassword(@Req() req: AuthenticatedRequest, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user!.id, changePasswordDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification token' })
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 400, description: 'Email already verified or rate limited' })
  async resendVerificationEmail(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user active sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getUserSessions(@Req() req: AuthenticatedRequest) {
    return this.authService.getUserSessions(req.user!.id);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  @ApiResponse({ status: 400, description: 'Session not found' })
  async revokeSession(@Req() req: AuthenticatedRequest, @Param('sessionId') sessionId: string) {
    return this.authService.revokeSession(req.user!.id, sessionId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Get('demo-credentials')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get demo credentials (development only, requires authentication)' })
  @ApiResponse({ status: 200, description: 'Demo credentials retrieved' })
  @ApiResponse({ status: 403, description: 'Not available in production or unauthorized' })
  async getDemoCredentials(@Req() req: AuthenticatedRequest, @Query('role') role: string) {
    // Only available in development
    if (process.env.NODE_ENV !== 'development') {
      throw new ForbiddenException('Demo credentials not available in production');
    }

    // Only allow authenticated users to access demo credentials
    if (!req.user) {
      throw new ForbiddenException('Authentication required to access demo credentials');
    }

    // Only allow admin users to access demo credentials
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required to retrieve demo credentials');
    }

    // Ensure all demo credentials are properly set in environment variables
    if (!process.env.DEMO_ADMIN_EMAIL || !process.env.DEMO_ADMIN_PASSWORD ||
        !process.env.DEMO_RESTAURANT_EMAIL || !process.env.DEMO_RESTAURANT_PASSWORD ||
        !process.env.DEMO_EMPLOYEE_EMAIL || !process.env.DEMO_EMPLOYEE_PASSWORD ||
        !process.env.DEMO_VENDOR_EMAIL || !process.env.DEMO_VENDOR_PASSWORD) {
      throw new ForbiddenException('Demo credentials must be properly configured in environment variables');
    }

    const demoCredentials = {
      admin: {
        email: process.env.DEMO_ADMIN_EMAIL,
        password: process.env.DEMO_ADMIN_PASSWORD
      },
      restaurant: {
        email: process.env.DEMO_RESTAURANT_EMAIL,
        password: process.env.DEMO_RESTAURANT_PASSWORD
      },
      employee: {
        email: process.env.DEMO_EMPLOYEE_EMAIL,
        password: process.env.DEMO_EMPLOYEE_PASSWORD
      },
      vendor: {
        email: process.env.DEMO_VENDOR_EMAIL,
        password: process.env.DEMO_VENDOR_PASSWORD
      }
    };

    return demoCredentials[role as keyof typeof demoCredentials] || { message: 'Invalid role' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Auth service health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth',
      dependencies: {
        redis: { status: 'unknown', message: 'Redis health checks disabled in mock mode' }
      }
    };
  }

  @Get('redis-health')
  @ApiOperation({ summary: 'Redis health check' })
  @ApiResponse({ status: 200, description: 'Redis health status' })
  async redisHealthCheck() {
    return { status: 'disabled', message: 'Redis health checks disabled in mock mode' };
  }
}