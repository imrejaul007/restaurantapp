import { Injectable, Logger, NotFoundException, ForbiddenException, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WebsocketService } from '../websocket/websocket.service';
import { UserRole, Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prismaService: PrismaService,
    @Optional() private readonly websocketService?: WebsocketService,
  ) {}

  async getDashboardData() {
    try {
      // Temporary mock data for testing
      const totalUsers = 17;
      const totalRestaurants = 6;
      const totalVendors = 2;
      const totalEmployees = 4;
      const pendingVerifications = 0;
      const totalOrders = 6;
      const monthlyRevenue = { _sum: { total: 15000 } };
      const activeUsers = 12;

      // Get growth metrics (mock data)
      const userGrowth = 3;
      const restaurantGrowth = 1;
      const orderGrowth = 25;

      return {
        overview: {
          totalUsers,
          totalRestaurants,
          totalVendors,
          totalEmployees,
          pendingVerifications,
          totalOrders,
          monthlyRevenue: monthlyRevenue._sum?.total || 0,
          activeUsers,
        },
        growth: {
          userGrowth,
          restaurantGrowth,
          orderGrowth,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get dashboard data', error);
      throw error;
    }
  }

  async getUsers(params: {
    role?: UserRole;
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    try {
      const {
        role,
        status,
        page = 1,
        limit = 20,
        search,
      } = params;

      const skip = (page - 1) * limit;

      const where: Prisma.UserWhereInput = {};

      if (role) {
        where.role = role;
      }

      if (status) {
        where.isActive = status === 'active';
      }

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { profile: { firstName: { contains: search, mode: 'insensitive' } } },
          { profile: { lastName: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [users, total] = await Promise.all([
        this.prismaService.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            emailVerifiedAt: true,
            createdAt: true,
            lastLoginAt: true,
            firstName: true,
            lastName: true,
            restaurant: {
              select: {
                businessName: true,
                verifiedAt: true,
              },
            },
            vendor: {
              select: {
                businessName: true,
                verifiedAt: true,
              },
            },
            employee: {
              select: {
                employeeCode: true,
                restaurant: {
                  select: { businessName: true },
                },
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prismaService.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get users', error);
      throw error;
    }
  }

  async getUserById(userId: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        include: {
          restaurant: {
            include: {
              employees: true,
            },
          },
          vendor: {
            include: {
              products: true,
            },
          },
          employee: {
            include: {
              restaurant: true,
            },
          },
          sessions: true,
          // documents: true, // Field doesn't exist in schema
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      this.logger.error('Failed to get user by ID', error);
      throw error;
    }
  }

  async updateUserStatus(userId: string, status: string, reason?: string) {
    try {
      const userStatus = status === 'active' ? 'ACTIVE' : 'SUSPENDED';

      const user = await this.prismaService.user.update({
        where: { id: userId },
        data: { status: userStatus },
      });

      // Log the action
      await this.prismaService.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'User',
          resource: 'User',
          entityId: userId,
          newData: { status: userStatus, reason },
        },
      });

      // Notify user if deactivated
      if (userStatus !== 'ACTIVE') {
        this.websocketService?.sendMessageToUser(userId, 'accountStatusChanged', {
          status: 'deactivated',
          reason,
        });
      }

      return user;
    } catch (error) {
      this.logger.error('Failed to update user status', error);
      throw error;
    }
  }

  async getPendingRestaurants(params: {
    page?: number;
    limit?: number;
  }) {
    try {
      const { page = 1, limit = 20 } = params;
      const skip = (page - 1) * limit;

      const [restaurants, total] = await Promise.all([
        this.prismaService.restaurant.findMany({
          where: { verificationStatus: 'PENDING' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'asc' },
        }),
        this.prismaService.restaurant.count({
          where: { verificationStatus: 'PENDING' },
        }),
      ]);

      return {
        restaurants,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get pending restaurants', error);
      throw error;
    }
  }

  async approveRestaurant(restaurantId: string, notes?: string) {
    try {
      const restaurant = await this.prismaService.restaurant.update({
        where: { id: restaurantId },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
        },
        include: { user: true },
      });

      // Log the action
      await this.prismaService.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Restaurant',
          resource: 'Restaurant',
          entityId: restaurantId,
          newData: { notes },
        },
      });

      // Notify restaurant owner
      this.websocketService?.sendMessageToUser(restaurant.userId, 'verificationStatusChanged', {
        status: 'approved',
        message: 'Your restaurant has been verified and approved!',
        notes,
      });

      return restaurant;
    } catch (error) {
      this.logger.error('Failed to approve restaurant', error);
      throw error;
    }
  }

  async rejectRestaurant(restaurantId: string, reason: string) {
    try {
      const restaurant = await this.prismaService.restaurant.update({
        where: { id: restaurantId },
        data: {
          verificationStatus: 'REJECTED',
        },
        include: { user: true },
      });

      // Log the action
      await this.prismaService.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Restaurant',
          resource: 'Restaurant',
          entityId: restaurantId,
          newData: { reason },
        },
      });

      // Notify restaurant owner
      this.websocketService?.sendMessageToUser(restaurant.userId, 'verificationStatusChanged', {
        status: 'rejected',
        message: 'Your restaurant verification has been rejected',
        reason,
      });

      return restaurant;
    } catch (error) {
      this.logger.error('Failed to reject restaurant', error);
      throw error;
    }
  }

  async getPendingVendors(params: {
    page?: number;
    limit?: number;
  }) {
    try {
      const { page = 1, limit = 20 } = params;
      const skip = (page - 1) * limit;

      const [vendors, total] = await Promise.all([
        this.prismaService.vendor.findMany({
          where: { verificationStatus: 'PENDING' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'asc' },
        }),
        this.prismaService.vendor.count({
          where: { verificationStatus: 'PENDING' },
        }),
      ]);

      return {
        vendors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get pending vendors', error);
      throw error;
    }
  }

  async approveVendor(vendorId: string, notes?: string) {
    try {
      const vendor = await this.prismaService.vendor.update({
        where: { id: vendorId },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
        },
        include: { user: true },
      });

      // Log the action
      await this.prismaService.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Vendor',
          resource: 'Vendor',
          entityId: vendorId,
          newData: { notes },
        },
      });

      // Notify vendor
      this.websocketService?.sendMessageToUser(vendor.userId, 'verificationStatusChanged', {
        status: 'approved',
        message: 'Your vendor account has been verified and approved!',
        notes,
      });

      return vendor;
    } catch (error) {
      this.logger.error('Failed to approve vendor', error);
      throw error;
    }
  }

  async rejectVendor(vendorId: string, reason: string) {
    try {
      const vendor = await this.prismaService.vendor.update({
        where: { id: vendorId },
        data: {
          verificationStatus: 'REJECTED',
        },
        include: { user: true },
      });

      // Log the action
      await this.prismaService.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Vendor',
          resource: 'Vendor',
          entityId: vendorId,
          newData: { reason },
        },
      });

      // Notify vendor
      this.websocketService?.sendMessageToUser(vendor.userId, 'verificationStatusChanged', {
        status: 'rejected',
        message: 'Your vendor verification has been rejected',
        reason,
      });

      return vendor;
    } catch (error) {
      this.logger.error('Failed to reject vendor', error);
      throw error;
    }
  }

  async getAnalytics(params: {
    startDate?: Date;
    endDate?: Date;
    type?: string;
  }) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        type,
      } = params;

      const where = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      const [
        userStats,
        orderStats,
        revenueStats,
        topRestaurants,
        topProducts,
      ] = await Promise.all([
        this.prismaService.user.groupBy({
          by: ['role'],
          where,
          _count: true,
        }),
        this.prismaService.order.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        this.prismaService.order.aggregate({
          where: { ...where, status: 'DELIVERED' },
          _sum: { total: true },
          _avg: { total: true },
        }),
        this.prismaService.restaurant.findMany({
          include: {
            _count: {
              select: { orders: true },
            },
          },
          orderBy: {
            orders: { _count: 'desc' },
          },
          take: 10,
        }),
        this.prismaService.product.findMany({
          include: {
            _count: {
              select: { orderItems: true },
            },
          },
          orderBy: {
            orderItems: { _count: 'desc' },
          },
          take: 10,
        }),
      ]);

      return {
        period: { startDate, endDate },
        userStats,
        orderStats,
        revenue: {
          total: revenueStats._sum?.total || 0,
          average: 0, // _avg not available in mock mode
        },
        topRestaurants,
        topProducts,
      };
    } catch (error) {
      this.logger.error('Failed to get analytics', error);
      throw error;
    }
  }

  async getFlaggedReviews(params: {
    page?: number;
    limit?: number;
  }) {
    try {
      const { page = 1, limit = 20 } = params;
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        this.prismaService.review.findMany({
          where: {},
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prismaService.review.count({}),
      ]);

      return {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get flagged reviews', error);
      throw error;
    }
  }

  async reviewAction(reviewId: string, action: 'approve' | 'hide' | 'delete', reason?: string) {
    try {
      let updateData: any = {};

      switch (action) {
        case 'approve':
          updateData = { status: 'ACTIVE' };
          break;
        case 'hide':
          updateData = { status: 'HIDDEN' };
          break;
        case 'delete':
          updateData = { status: 'DELETED' };
          break;
      }

      const review = await this.prismaService.review.update({
        where: { id: reviewId },
        data: updateData,
        include: { user: true },
      });

      // Log the action
      await this.prismaService.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Review',
          resource: 'Review',
          entityId: reviewId,
          newData: { action, reason },
        },
      });

      return review;
    } catch (error) {
      this.logger.error('Failed to perform review action', error);
      throw error;
    }
  }

  // Temporarily disabled - SupportTicket model doesn't exist in schema
  // async getSupportTickets(params: {
  //   status?: string;
  //   priority?: string;
  //   page?: number;
  //   limit?: number;
  // }) {
  //   try {
  //     const {
  //       status,
  //       priority,
  //       page = 1,
  //       limit = 20,
  //     } = params;

  //     const skip = (page - 1) * limit;

  //     const where: any = {};

  //     if (status) {
  //       where.status = status;
  //     }

  //     if (priority) {
  //       where.priority = priority;
  //     }

  //     const [tickets, total] = await Promise.all([
  //       this.prismaService.supportTicket.findMany({
  //         where,
  //         include: {
  //           user: {
  //             select: {
  //               firstName: true,
  //               lastName: true,
  //               email: true,
  //               role: true,
  //             },
  //           },
  //         },
  //         skip,
  //         take: limit,
  //         orderBy: { createdAt: 'desc' },
  //       }),
  //       this.prismaService.supportTicket.count({ where }),
  //     ]);

  //     return {
  //       tickets,
  //       pagination: {
  //         page,
  //         limit,
  //         total,
  //         totalPages: Math.ceil(total / limit),
  //       },
  //     };
  //   } catch (error) {
  //     this.logger.error('Failed to get support tickets', error);
  //     throw error;
  //   }
  // }

  // Temporarily disabled - SupportTicket model doesn't exist in schema
  // async assignTicket(ticketId: string, assigneeId: string) {
  //   try {
  //     const ticket = await this.prismaService.supportTicket.update({
  //       where: { id: ticketId },
  //       data: {
  //         assignedTo: assigneeId,
  //         status: 'OPEN',
  //         // assignedAt: new Date(), // Field doesn't exist in schema
  //       },
  //       include: {
  //         user: true,
  //       },
  //     });

  //     // Notify assignee
  //     this.websocketService?.sendMessageToUser(assigneeId, 'ticketAssigned', {
  //       ticket,
  //       message: `You have been assigned a new support ticket #${ticket.id}`,
  //     });

  //     return ticket;
  //   } catch (error) {
  //     this.logger.error('Failed to assign ticket', error);
  //     throw error;
  //   }
  // }

  async getAuditLogs(params: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        userId,
        action,
        resource,
        startDate,
        endDate,
        page = 1,
        limit = 50,
      } = params;

      const skip = (page - 1) * limit;

      const where: any = {};

      if (userId) {
        where.userId = userId;
      }

      if (action) {
        where.action = action;
      }

      if (resource) {
        where.resource = resource;
      }

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }

      const [logs, total] = await Promise.all([
        this.prismaService.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prismaService.auditLog.count({ where }),
      ]);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get audit logs', error);
      throw error;
    }
  }

  async toggleMaintenance(enabled: boolean, message?: string) {
    try {
      // TODO: Add systemConfig model to schema for maintenance mode configuration
      this.logger.log(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}: ${message || ''}`);
      
      // Broadcast to all users if enabling maintenance
      if (enabled) {
        this.websocketService?.broadcastSystemMaintenance(
          message || 'System is under maintenance. Please try again later.'
        );
      }

      return { enabled, message, timestamp: new Date() };
    } catch (error) {
      this.logger.error('Failed to toggle maintenance mode', error);
      throw error;
    }
  }

  async getSystemConfig() {
    try {
      // TODO: Add systemConfig model to schema for system configuration storage
      const defaultConfig = {
        maintenance_mode: { enabled: false, message: '' },
        max_upload_size: '10MB',
        allowed_file_types: ['jpg', 'jpeg', 'png', 'pdf'],
        payment_enabled: true
      };
      
      return defaultConfig;
    } catch (error) {
      this.logger.error('Failed to get system config', error);
      throw error;
    }
  }

  async updateSystemConfig(config: any) {
    try {
      const updates = Object.keys(config).map(key => ({
        key,
        value: typeof config[key] === 'string' ? config[key] : JSON.stringify(config[key]),
      }));

      const results = await Promise.all(
        updates.map(update =>
          // systemConfig table doesn't exist - skip for now
          Promise.resolve({ key: update.key, value: update.value })
        )
      );

      return results;
    } catch (error) {
      this.logger.error('Failed to update system config', error);
      throw error;
    }
  }
}