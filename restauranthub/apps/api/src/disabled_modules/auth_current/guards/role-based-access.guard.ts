import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const RESOURCE_KEY = 'resource';

export interface Permission {
  action: string; // 'create', 'read', 'update', 'delete', 'manage'
  resource: string; // 'user', 'restaurant', 'order', 'menu', etc.
  conditions?: any; // Additional conditions for fine-grained access
}

export interface AccessContext {
  user: any;
  resource?: string;
  resourceId?: string;
  action: string;
  data?: any;
}

@Injectable()
export class RoleBasedAccessGuard implements CanActivate {
  private readonly logger = new Logger(RoleBasedAccessGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request context');
      return false;
    }

    // Get required roles and permissions from decorators
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const resource = this.reflector.getAllAndOverride<string>(RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or permissions are specified, allow access
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    try {
      // Check role-based access
      if (requiredRoles && !this.checkRoles(user.role, requiredRoles)) {
        this.logAccessDenied(user, 'INSUFFICIENT_ROLE', {
          userRole: user.role,
          requiredRoles
        });
        throw new ForbiddenException('Insufficient role permissions');
      }

      // Check permission-based access
      if (requiredPermissions && !await this.checkPermissions(user, requiredPermissions, request)) {
        this.logAccessDenied(user, 'INSUFFICIENT_PERMISSIONS', {
          requiredPermissions
        });
        throw new ForbiddenException('Insufficient permissions');
      }

      // Check resource ownership and isolation
      if (resource && !await this.checkResourceAccess(user, resource, request)) {
        this.logAccessDenied(user, 'RESOURCE_ACCESS_DENIED', {
          resource,
          resourceId: request.params.id
        });
        throw new ForbiddenException('Access denied to this resource');
      }

      // Log successful access for audit
      this.logAccessGranted(user, {
        resource,
        action: request.method,
        path: request.route?.path
      });

      return true;
    } catch (error) {
      this.logger.error('Access control error:', error);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Access denied');
    }
  }

  private checkRoles(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    if (!userRole || !requiredRoles?.length) {
      return false;
    }

    // Admin has access to everything (super admin pattern)
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    return requiredRoles.includes(userRole);
  }

  private async checkPermissions(
    user: any,
    requiredPermissions: Permission[],
    request: any
  ): Promise<boolean> {
    for (const permission of requiredPermissions) {
      if (!await this.hasPermission(user, permission, request)) {
        return false;
      }
    }
    return true;
  }

  private async hasPermission(user: any, permission: Permission, request: any): Promise<boolean> {
    const { action, resource, conditions } = permission;

    // Define role-based permissions matrix
    const rolePermissions = this.getRolePermissions(user.role);

    // Check if user's role has the required permission
    const hasRolePermission = rolePermissions.some(perm =>
      (perm.resource === '*' || perm.resource === resource) &&
      (perm.action === '*' || perm.action === action)
    );

    if (!hasRolePermission) {
      return false;
    }

    // Apply additional conditions if specified
    if (conditions && !await this.evaluateConditions(user, conditions, request)) {
      return false;
    }

    return true;
  }

  private getRolePermissions(role: UserRole): Permission[] {
    const permissionMatrix: Record<UserRole, Permission[]> = {
      [UserRole.ADMIN]: [
        { action: '*', resource: '*' }, // Full access
      ],
      [UserRole.RESTAURANT]: [
        { action: '*', resource: 'restaurant' },
        { action: '*', resource: 'menu' },
        { action: '*', resource: 'order' },
        { action: '*', resource: 'employee' },
        { action: '*', resource: 'customer' },
        { action: 'read', resource: 'vendor' },
        { action: 'create', resource: 'vendor-order' },
        { action: 'read', resource: 'product' },
        { action: 'read', resource: 'analytics' },
      ],
      [UserRole.VENDOR]: [
        { action: '*', resource: 'vendor' },
        { action: '*', resource: 'product' },
        { action: 'read', resource: 'order' },
        { action: 'update', resource: 'order' },
        { action: 'read', resource: 'restaurant' },
        { action: 'read', resource: 'analytics' },
      ],
      [UserRole.EMPLOYEE]: [
        { action: 'read', resource: 'restaurant' },
        { action: 'read', resource: 'menu' },
        { action: 'create', resource: 'order' },
        { action: 'update', resource: 'order' },
        { action: 'read', resource: 'customer' },
        { action: 'read', resource: 'employee' },
        { action: 'update', resource: 'profile' },
      ],
      [UserRole.CUSTOMER]: [
        { action: 'read', resource: 'restaurant' },
        { action: 'read', resource: 'menu' },
        { action: 'create', resource: 'order' },
        { action: 'read', resource: 'order' },
        { action: 'update', resource: 'profile' },
        { action: 'create', resource: 'review' },
      ],
    };

    return permissionMatrix[role] || [];
  }

  private async checkResourceAccess(user: any, resource: string, request: any): Promise<boolean> {
    const resourceId = request.params.id;
    const userId = user.id;
    const userRole = user.role;

    // Admin can access all resources
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    switch (resource) {
      case 'restaurant':
        return this.checkRestaurantAccess(userId, userRole, resourceId);

      case 'vendor':
        return this.checkVendorAccess(userId, userRole, resourceId);

      case 'employee':
        return this.checkEmployeeAccess(userId, userRole, resourceId);

      case 'order':
        return this.checkOrderAccess(userId, userRole, resourceId);

      case 'user':
        return this.checkUserAccess(userId, userRole, resourceId);

      default:
        return true; // Allow access to unspecified resources
    }
  }

  private async checkRestaurantAccess(
    userId: string,
    userRole: UserRole,
    restaurantId?: string
  ): Promise<boolean> {
    if (!restaurantId) return true;

    try {
      switch (userRole) {
        case UserRole.RESTAURANT:
          // Restaurant owners can only access their own restaurant
          const restaurant = await this.prisma.restaurant.findFirst({
            where: { id: restaurantId, userId },
          });
          return !!restaurant;

        case UserRole.EMPLOYEE:
          // Employees can only access their employer's restaurant
          const employee = await this.prisma.employee.findFirst({
            where: { userId, restaurantId },
          });
          return !!employee;

        case UserRole.VENDOR:
          // Vendors can access restaurants they have orders with
          const vendorOrders = await this.prisma.order.findFirst({
            where: {
              restaurantId,
              vendor: { userId },
            },
          });
          return !!vendorOrders;

        default:
          return false;
      }
    } catch (error) {
      this.logger.error('Error checking restaurant access:', error);
      return false;
    }
  }

  private async checkVendorAccess(
    userId: string,
    userRole: UserRole,
    vendorId?: string
  ): Promise<boolean> {
    if (!vendorId) return true;

    try {
      switch (userRole) {
        case UserRole.VENDOR:
          // Vendors can only access their own vendor profile
          const vendor = await this.prisma.vendor.findFirst({
            where: { id: vendorId, userId },
          });
          return !!vendor;

        case UserRole.RESTAURANT:
          // Restaurants can access vendors they have ordered from
          const restaurantOrders = await this.prisma.order.findFirst({
            where: {
              vendorId,
              restaurant: { userId },
            },
          });
          return !!restaurantOrders;

        default:
          return false;
      }
    } catch (error) {
      this.logger.error('Error checking vendor access:', error);
      return false;
    }
  }

  private async checkEmployeeAccess(
    userId: string,
    userRole: UserRole,
    employeeId?: string
  ): Promise<boolean> {
    if (!employeeId) return true;

    try {
      switch (userRole) {
        case UserRole.EMPLOYEE:
          // Employees can only access their own profile
          const employee = await this.prisma.employee.findFirst({
            where: { id: employeeId, userId },
          });
          return !!employee;

        case UserRole.RESTAURANT:
          // Restaurant owners can access their employees
          const restaurantEmployee = await this.prisma.employee.findFirst({
            where: {
              id: employeeId,
              restaurant: { userId },
            },
          });
          return !!restaurantEmployee;

        default:
          return false;
      }
    } catch (error) {
      this.logger.error('Error checking employee access:', error);
      return false;
    }
  }

  private async checkOrderAccess(
    userId: string,
    userRole: UserRole,
    orderId?: string
  ): Promise<boolean> {
    if (!orderId) return true;

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          restaurant: true,
          vendor: true,
        },
      });

      if (!order) return false;

      switch (userRole) {
        case UserRole.RESTAURANT:
          return order.restaurant.userId === userId;

        case UserRole.VENDOR:
          return order.vendor?.userId === userId;

        case UserRole.EMPLOYEE:
          // Employees can access orders from their restaurant
          const employee = await this.prisma.employee.findFirst({
            where: { userId, restaurantId: order.restaurantId },
          });
          return !!employee;

        default:
          return false;
      }
    } catch (error) {
      this.logger.error('Error checking order access:', error);
      return false;
    }
  }

  private async checkUserAccess(
    userId: string,
    userRole: UserRole,
    targetUserId?: string
  ): Promise<boolean> {
    if (!targetUserId) return true;

    // Users can always access their own profile
    if (userId === targetUserId) {
      return true;
    }

    // Additional role-based checks can be added here
    return false;
  }

  private async evaluateConditions(user: any, conditions: any, request: any): Promise<boolean> {
    // Implement custom condition evaluation logic
    // This could include time-based access, IP-based restrictions, etc.

    if (conditions.onlyOwner && request.params.id !== user.id) {
      return false;
    }

    if (conditions.timeRestriction) {
      const currentHour = new Date().getHours();
      const { startHour, endHour } = conditions.timeRestriction;
      if (currentHour < startHour || currentHour > endHour) {
        return false;
      }
    }

    return true;
  }

  private logAccessGranted(user: any, context: any): void {
    this.logger.debug(`Access granted for user ${user.id}`, {
      userId: user.id,
      role: user.role,
      ...context,
    });
  }

  private logAccessDenied(user: any, reason: string, context: any): void {
    this.logger.warn(`Access denied for user ${user.id}: ${reason}`, {
      userId: user.id,
      role: user.role,
      reason,
      ...context,
    });

    // Create audit log for access denial
    this.createAccessAuditLog(user, reason, context).catch(error => {
      this.logger.error('Failed to create access audit log:', error);
    });
  }

  private async createAccessAuditLog(user: any, reason: string, context: any): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'ACCESS_DENIED',
          entityType: 'Security',
          entityId: user.id,
          details: {
            reason,
            userRole: user.role,
            ...context,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to create access audit log:', error);
    }
  }
}