import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();
    
    if (err || !user) {
      // Log the authentication failure
      console.warn('JWT Authentication failed:', {
        error: err?.message,
        info: info?.message,
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        path: request.path,
      });
      
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }
    
    return user;
  }
}