import { Controller, Post, Body, Get, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: any) {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: any) {
    return this.authService.signIn(signInDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: any) {
    return this.authService.logout(req.user.id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return {
      user: req.user,
      message: 'Profile retrieved successfully'
    };
  }

  @Get('test')
  async test() {
    return {
      message: 'Auth endpoints are working!',
      timestamp: new Date().toISOString(),
      endpoints: {
        signup: 'POST /api/v1/auth/signup',
        signin: 'POST /api/v1/auth/signin',
        logout: 'POST /api/v1/auth/logout (requires JWT)',
        profile: 'GET /api/v1/auth/profile (requires JWT)'
      }
    };
  }
}