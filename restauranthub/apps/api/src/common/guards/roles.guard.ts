import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { UserPayload } from '../../modules/auth/types/user.types';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as UserPayload;

    if (!user) {
      this.logger.warn('RolesGuard: No user found in request');
      throw new ForbiddenException('User not authenticated');
    }

    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      this.logger.warn(`Access denied for user ${user.id} with role ${user.role}. Required roles: ${requiredRoles.join(', ')}`);
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    // Additional role-specific checks
    switch (user.role) {
      case UserRole.EMPLOYEE:
        // Temporarily disabled - Employee role checks
        // if (!user.employee || !user.employee.restaurantId) {
        //   this.logger.warn(`Employee ${user.id} has no restaurant assigned`);
        //   throw new ForbiddenException('Employee must be assigned to a restaurant');
        // }
        break;

      case UserRole.RESTAURANT:
        // Temporarily disabled - Restaurant role checks  
        // if (!user.restaurant) {
        //   this.logger.warn(`Restaurant user ${user.id} has no restaurant profile`);
        //   throw new ForbiddenException('Restaurant profile not found');
        // }
        break;

      case UserRole.VENDOR:
        // Temporarily disabled - Vendor role checks
        // if (!user.vendor) {
        //   this.logger.warn(`Vendor user ${user.id} has no vendor profile`);
        //   throw new ForbiddenException('Vendor profile not found');
        // }
        break;
    }

    return true;
  }
}