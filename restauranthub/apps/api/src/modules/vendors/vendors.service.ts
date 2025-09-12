import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
// import { RedisService } from '../../redis/redis.service';
import { UserRole, VerificationStatus } from '@prisma/client';

interface CreateVendorDto {
  businessName: string;
  businessType: string;
  businessAddress: string;
  city: string;
  state: string;
  zipCode: string;
  businessPhone?: string;
  businessEmail?: string;
  description?: string;
  categories: string[];
  minOrderValue?: number;
  deliveryAreas: string[];
}

interface UpdateVendorDto {
  businessName?: string;
  businessType?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  businessPhone?: string;
  businessEmail?: string;
  description?: string;
  categories?: string[];
  minOrderValue?: number;
  deliveryAreas?: string[];
}

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    // private redisService: RedisService, // Temporarily disabled // Temporarily disabled
  ) {}

  async create(userId: string, createVendorDto: CreateVendorDto) {
    const vendor = await this.prisma.vendor.create({
      data: {
        ...createVendorDto,
        companyName: createVendorDto.businessName, // Map businessName to companyName for schema requirement
        userId,
      },
      include: {
        user: {
          include: {
            restaurant: true,
            employee: true,
            vendor: true,
          },
        },
      },
    });

    return vendor;
  }

  async findAll(page = 1, limit = 20, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    if (filters?.verificationStatus) {
      where.verificationStatus = filters.verificationStatus;
    }

    if (filters?.businessType) {
      where.businessType = {
        contains: filters.businessType,
        mode: 'insensitive',
      };
    }

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            include: {
              restaurant: true,
            employee: true,
            vendor: true,
            },
          },
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return {
      data: vendors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            restaurant: true,
            employee: true,
            vendor: true,
          },
        },
        products: {
          where: { isActive: true },
          take: 10,
        },
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async update(id: string, userId: string, userRole: string, updateVendorDto: UpdateVendorDto) {
    const vendor = await this.findOne(id);

    if (userRole !== UserRole.ADMIN && vendor.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedVendor = await this.prisma.vendor.update({
      where: { id },
      data: updateVendorDto,
      include: {
        user: {
          include: {
            restaurant: true,
            employee: true,
            vendor: true,
          },
        },
      },
    });

    // await // this.redisService.del(`vendor:${id}`);

    return updatedVendor;
  }

  async getDashboard(vendorId: string, userId: string) {
    const vendor = await this.findOne(vendorId);

    if (vendor.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const [
      productCount,
      activeProductCount,
      totalOrdersCount,
      pendingOrdersCount,
      totalRevenue,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      this.prisma.product.count({ where: { vendorId } }),
      this.prisma.product.count({ where: { vendorId, isActive: true } }),
      this.prisma.order.count({ where: { vendorId } }),
      this.prisma.order.count({ where: { vendorId, status: 'PENDING' } }),
      this.prisma.order.aggregate({
        where: { vendorId, status: 'DELIVERED' },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        where: { vendorId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      }),
      this.prisma.$queryRaw`
        SELECT p.name, p.id, SUM(oi.quantity) as total_sold, SUM(oi.total_amount) as revenue
        FROM "Product" p
        JOIN "OrderItem" oi ON p.id = oi.product_id
        JOIN "Order" o ON oi.order_id = o.id
        WHERE p.vendor_id = ${vendorId}
        GROUP BY p.id, p.name
        ORDER BY total_sold DESC
        LIMIT 5
      `,
    ]);

    return {
      stats: {
        products: productCount,
        activeProducts: activeProductCount,
        totalOrders: totalOrdersCount,
        pendingOrders: pendingOrdersCount,
        totalRevenue: totalRevenue._sum?.total || 0,
      },
      recentOrders,
      topProducts,
    };
  }

  async verifyVendor(id: string, status: VerificationStatus, notes?: string) {
    // TODO: Vendor model not implemented yet
    // const vendor = await this.prisma.vendor.update({
    //   where: { id },
    //   data: {
    //     verificationStatus: status,
    //     verifiedAt: status === VerificationStatus.VERIFIED ? new Date() : null,
    //   },
    // });

    await this.createAuditLog('Vendor', 'UPDATE', id, { status, notes });

    // return vendor;
    return { id, verificationStatus: status }; // placeholder return
  }

  async remove(userId: string, id: string) {
    // Check if the user owns this vendor profile
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    await this.prisma.vendor.delete({
      where: { id },
    });

    return { message: 'Vendor removed successfully' };
  }

  async getAnalytics(userId: string, id: string): Promise<any> {
    // Check if the user owns this vendor profile
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return this.getAnalytics(vendor.userId, id);
  }

  async verify(userId: string, id: string) {
    return this.verifyVendor(id, VerificationStatus.VERIFIED);
  }

  async suspend(userId: string, id: string) {
    // Check if the user owns this vendor profile
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const updatedVendor = await this.prisma.vendor.update({
      where: { id },
      data: { verificationStatus: 'REJECTED' },
    });

    await this.createAuditLog('Vendor', 'UPDATE', id, { suspended: true });

    return updatedVendor;
  }

  private async createAuditLog(entity: string, action: string, entityId: string, data: any) {
    await this.prisma.auditLog.create({
      data: {
        entity,
        resource: entity,
        action,
        entityId,
        newData: data,
      },
    });
  }
}