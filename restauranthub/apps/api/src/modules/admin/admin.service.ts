import { Injectable, Logger, NotFoundException, ForbiddenException, Optional } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { WebsocketService } from '../websocket/websocket.service';
import { UserRole, Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    @Optional() private readonly websocketService?: WebsocketService,
  ) {}

  async getDashboardData() {
    try {
      const [
        totalUsers,
        totalRestaurants,
        totalVendors,
        totalEmployees,
        pendingVerifications,
        totalOrders,
        monthlyRevenue,
        activeUsers,
      ] = await Promise.all([
        this.databaseService.user.count(),
        this.databaseService.restaurant.count(),
        this.databaseService.vendor.count(),
        this.databaseService.employee.count(),
        Promise.all([
          this.databaseService.restaurant.count({
            where: { verificationStatus: 'PENDING' },
          }),
          this.databaseService.vendor.count({
            where: { verificationStatus: 'PENDING' },
          })
        ]).then(([restaurantCount, vendorCount]) => restaurantCount + vendorCount),
        this.databaseService.order.count(),
        this.databaseService.order.aggregate({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
            status: 'DELIVERED',
          },
          _sum: { subtotal: true },
        }),
        this.databaseService.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]);

      // Get growth metrics
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const [userGrowth, restaurantGrowth, orderGrowth] = await Promise.all([
        this.databaseService.user.count({
          where: { createdAt: { gte: lastMonth } },
        }),
        this.databaseService.restaurant.count({
          where: { createdAt: { gte: lastMonth } },
        }),
        this.databaseService.order.count({
          where: { createdAt: { gte: lastMonth } },
        }),
      ]);

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
        this.databaseService.user.findMany({
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
        this.databaseService.user.count({ where }),
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
      const user = await this.databaseService.user.findUnique({
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

      const user = await this.databaseService.user.update({
        where: { id: userId },
        data: { status: userStatus },
      });

      // Log the action
      await this.databaseService.auditLog.create({
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
        this.databaseService.restaurant.findMany({
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
        this.databaseService.restaurant.count({
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
      const restaurant = await this.databaseService.restaurant.update({
        where: { id: restaurantId },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
        },
        include: { user: true },
      });

      // Log the action
      await this.databaseService.auditLog.create({
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
      const restaurant = await this.databaseService.restaurant.update({
        where: { id: restaurantId },
        data: {
          verificationStatus: 'REJECTED',
        },
        include: { user: true },
      });

      // Log the action
      await this.databaseService.auditLog.create({
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
        this.databaseService.vendor.findMany({
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
        this.databaseService.vendor.count({
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
      const vendor = await this.databaseService.vendor.update({
        where: { id: vendorId },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
        },
        include: { user: true },
      });

      // Log the action
      await this.databaseService.auditLog.create({
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
      const vendor = await this.databaseService.vendor.update({
        where: { id: vendorId },
        data: {
          verificationStatus: 'REJECTED',
        },
        include: { user: true },
      });

      // Log the action
      await this.databaseService.auditLog.create({
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
        this.databaseService.user.groupBy({
          by: ['role'],
          where,
          _count: true,
        }),
        this.databaseService.order.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        this.databaseService.order.aggregate({
          where: { ...where, status: 'DELIVERED' },
          _sum: { total: true },
          _avg: { total: true },
        }),
        this.databaseService.restaurant.findMany({
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
        this.databaseService.product.findMany({
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
        this.databaseService.review.findMany({
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
        this.databaseService.review.count({}),
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

      const review = await this.databaseService.review.update({
        where: { id: reviewId },
        data: updateData,
        include: { user: true },
      });

      // Log the action
      await this.databaseService.auditLog.create({
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
  //       this.databaseService.supportTicket.findMany({
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
  //       this.databaseService.supportTicket.count({ where }),
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
  //     const ticket = await this.databaseService.supportTicket.update({
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
        this.databaseService.auditLog.findMany({
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
        this.databaseService.auditLog.count({ where }),
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