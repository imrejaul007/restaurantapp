import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class GlobalAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(GlobalAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // For protected routes, use JWT authentication
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Get request object
    const request = context.switchToHttp().getRequest();

    // Log authentication attempts
    if (err || !user) {
      this.logger.warn('Authentication failed', {
        error: err?.message,
        info: info?.message,
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        path: request.path,
        method: request.method,
      });

      throw err || new UnauthorizedException('Authentication required');
    }

    // Log successful authentication
    this.logger.debug('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: request.ip,
      path: request.path,
    });

    return user;
  }
}