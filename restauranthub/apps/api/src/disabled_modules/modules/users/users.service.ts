import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
// import { RedisService } from '../../redis/redis.service'; // Temporarily disabled

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    // private redisService: RedisService, // Temporarily disabled
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
      },
    });

    return user ? this.sanitizeUser(user) : null;
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const { firstName, lastName, avatar, address, city, state, country, pincode, dateOfBirth } = updateUserDto;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
      },
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
        profile: true,
      },
    });

    // Update or create profile with dateOfBirth and other fields
    if (dateOfBirth || address || city || state || country || pincode || avatar) {
      await this.prisma.profile.upsert({
        where: { userId },
        create: {
          userId,
          firstName: firstName || updatedUser.firstName || '',
          lastName: lastName || updatedUser.lastName || '',
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          avatar,
          address,
          city,
          state,
          country,
          pincode,
        },
        update: {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          avatar,
          address,
          city,
          state,
          country,
          pincode,
        },
      });
    }

    // Clear cache
    // await this.redisService.del(`user:${userId}`); // Temporarily disabled

    return this.sanitizeUser(updatedUser);
  }

  async updateUser(id: string, updateData: Partial<UpdateUserDto>) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
      },
    });

    // Clear cache
    // await this.redisService.del(`user:${id}`); // Temporarily disabled

    return this.sanitizeUser(user);
  }

  async deactivateUser(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { 
        status: 'SUSPENDED',
      },
    });

    // Clear cache
    // await this.redisService.del(`user:${id}`); // Temporarily disabled

    return { message: 'User deactivated successfully' };
  }

  async activateUser(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { 
        status: 'ACTIVE',
      },
    });

    // Clear cache
    // await this.redisService.del(`user:${id}`); // Temporarily disabled

    return { message: 'User activated successfully' };
  }

  async verifyEmail(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
      },
    });

    // Clear cache
    // await this.redisService.del(`user:${userId}`); // Temporarily disabled

    return { message: 'Email verified successfully' };
  }

  async getUserStats(userId: string) {
    const user = await this.findById(userId);
    
    let stats = {};

    switch (user.role) {
      case 'RESTAURANT':
        stats = await this.getRestaurantStats(user.restaurant.id);
        break;
      case 'VENDOR':
        stats = await this.getVendorStats(user.vendor.id);
        break;
      case 'EMPLOYEE':
        stats = await this.getEmployeeStats(user.employee.id);
        break;
    }

    return stats;
  }

  private async getRestaurantStats(restaurantId: string) {
    const [employeeCount, jobCount, orderCount] = await Promise.all([
      this.prisma.employee.count({ where: { restaurantId } }),
      this.prisma.job.count({ where: { restaurantId } }),
      this.prisma.order.count({ where: { restaurantId } }),
    ]);

    return {
      employees: employeeCount,
      jobs: jobCount,
      orders: orderCount,
    };
  }

  private async getVendorStats(vendorId: string) {
    const [productCount, orderCount] = await Promise.all([
      this.prisma.product.count({ where: { vendorId } }),
      this.prisma.order.count({ where: { vendorId } }),
    ]);

    return {
      products: productCount,
      orders: orderCount,
    };
  }

  private async getEmployeeStats(employeeId: string) {
    const [applicationCount, attendanceCount] = await Promise.all([
      this.prisma.jobApplication.count({ where: { employeeId: employeeId } }),
      // Temporarily disabled - AttendanceRecord model doesn't exist in current schema
      // this.prisma.attendanceRecord.count({ where: { employeeId } }),
      Promise.resolve(0),
    ]);

    return {
      applications: applicationCount,
      attendance: attendanceCount,
    };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, refreshToken, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }
}