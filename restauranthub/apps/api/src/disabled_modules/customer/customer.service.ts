import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateCustomerData {
  restaurantId?: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName?: string;
  dateOfBirth?: Date;
  anniversary?: Date;
  gender?: string;
  preferences?: any;
  notes?: string;
}

export interface CustomerFeedbackData {
  customerId: string;
  restaurantId: string;
  orderId?: string;
  rating: number;
  comment?: string;
  category?: string;
  isPublic?: boolean;
}

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(private prisma: PrismaService) {}

  async createCustomer(customerData: CreateCustomerData) {
    this.logger.log(`Creating customer: ${customerData.firstName} ${customerData.lastName}`);

    // Check for existing customer by email or phone
    if (customerData.email || customerData.phone) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          OR: [
            customerData.email ? { email: customerData.email } : {},
            customerData.phone ? { phone: customerData.phone } : {}
          ].filter(condition => Object.keys(condition).length > 0)
        }
      });

      if (existingCustomer) {
        return existingCustomer;
      }
    }

    return this.prisma.customer.create({
      data: customerData
    });
  }

  async getCustomers(restaurantId?: string, filters: {
    search?: string;
    loyaltyTier?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const { search, loyaltyTier, isActive, limit = 50, offset = 0 } = filters;

    const where: any = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (loyaltyTier) {
      where.loyaltyTier = loyaltyTier;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: {
              orders: true,
              feedback: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      this.prisma.customer.count({ where })
    ]);

    return {
      customers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  async getCustomerById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: {
              include: {
                menuItem: { select: { name: true } }
              }
            }
          }
        },
        reservations: {
          orderBy: { reservationTime: 'desc' },
          take: 10,
          include: {
            table: { select: { tableNumber: true } }
          }
        },
        feedback: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        loyaltyHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async updateCustomer(id: string, data: Partial<CreateCustomerData>) {
    const customer = await this.prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.customer.update({
      where: { id },
      data
    });
  }

  async updateCustomerStats(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        orders: {
          where: { status: { not: 'cancelled' } }
        }
      }
    });

    if (!customer) return;

    const totalOrders = customer.orders.length;
    const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrderDate = customer.orders.length > 0
      ? customer.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
      : null;

    // Calculate loyalty tier based on total spent
    let loyaltyTier = 'bronze';
    if (totalSpent >= 50000) loyaltyTier = 'platinum';
    else if (totalSpent >= 15000) loyaltyTier = 'gold';
    else if (totalSpent >= 5000) loyaltyTier = 'silver';

    return this.prisma.customer.update({
      where: { id: customerId },
      data: {
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate,
        loyaltyTier
      }
    });
  }

  async addCustomerFeedback(feedbackData: CustomerFeedbackData) {
    this.logger.log(`Adding feedback for customer: ${feedbackData.customerId}`);

    const feedback = await this.prisma.customerFeedback.create({
      data: feedbackData,
      include: {
        customer: { select: { firstName: true, lastName: true } }
      }
    });

    // Update restaurant rating if applicable
    if (feedbackData.isPublic !== false) {
      await this.updateRestaurantRating(feedbackData.restaurantId);
    }

    return feedback;
  }

  async getCustomerFeedback(restaurantId: string, filters: {
    customerId?: string;
    rating?: number;
    category?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const { customerId, rating, category, isPublic, limit = 50, offset = 0 } = filters;

    const where: any = { restaurantId };

    if (customerId) where.customerId = customerId;
    if (rating) where.rating = rating;
    if (category) where.category = category;
    if (isPublic !== undefined) where.isPublic = isPublic;

    const [feedback, total] = await Promise.all([
      this.prisma.customerFeedback.findMany({
        where,
        include: {
          customer: { select: { firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      this.prisma.customerFeedback.count({ where })
    ]);

    return {
      feedback,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  async getCustomerAnalytics(restaurantId?: string) {
    const where = restaurantId ? { restaurantId } : {};

    const [
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      customersByTier,
      topCustomers,
      averageOrderValue,
      feedbackStats
    ] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.count({
        where: {
          ...where,
          isActive: true,
          lastOrderDate: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        }
      }),
      this.prisma.customer.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      this.prisma.customer.groupBy({
        by: ['loyaltyTier'],
        where,
        _count: true
      }),
      this.prisma.customer.findMany({
        where,
        orderBy: { totalSpent: 'desc' },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          totalSpent: true,
          totalOrders: true,
          loyaltyTier: true
        }
      }),
      this.prisma.customer.aggregate({
        where,
        _avg: { averageOrderValue: true }
      }),
      this.prisma.customerFeedback.groupBy({
        by: ['rating'],
        where: { restaurantId: restaurantId || undefined },
        _count: true
      })
    ]);

    return {
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      customersByTier,
      topCustomers,
      averageOrderValue: averageOrderValue._avg.averageOrderValue || 0,
      feedbackStats
    };
  }

  async findOrCreateCustomer(data: {
    email?: string;
    phone?: string;
    firstName: string;
    lastName?: string;
    restaurantId?: string;
  }) {
    if (!data.email && !data.phone) {
      return this.createCustomer(data);
    }

    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        OR: [
          data.email ? { email: data.email } : {},
          data.phone ? { phone: data.phone } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    });

    if (existingCustomer) {
      // Update name if provided and different
      if (data.firstName !== existingCustomer.firstName || data.lastName !== existingCustomer.lastName) {
        return this.updateCustomer(existingCustomer.id, {
          firstName: data.firstName,
          lastName: data.lastName
        });
      }
      return existingCustomer;
    }

    return this.createCustomer(data);
  }

  async searchCustomers(query: string, restaurantId?: string) {
    const where: any = {
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    return this.prisma.customer.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        loyaltyTier: true,
        totalOrders: true,
        totalSpent: true
      },
      take: 20
    });
  }

  private async updateRestaurantRating(restaurantId: string) {
    const avgRating = await this.prisma.customerFeedback.aggregate({
      where: {
        restaurantId,
        isPublic: true
      },
      _avg: { rating: true },
      _count: true
    });

    if (avgRating._count > 0) {
      await this.prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          rating: avgRating._avg.rating || 0,
          totalReviews: avgRating._count
        }
      });
    }
  }
}