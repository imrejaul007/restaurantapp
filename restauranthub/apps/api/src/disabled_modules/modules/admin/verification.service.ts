import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  async verifyRestaurant(restaurantId: string) {
    try {
      await this.prisma.restaurant.update({
        where: { id: restaurantId },
        data: { 
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date()
        }
      });
      return { success: true, message: 'Restaurant verified successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to verify restaurant' };
    }
  }

  async verifyVendor(vendorId: string) {
    try {
      await this.prisma.vendor.update({
        where: { id: vendorId },
        data: { 
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date()
        }
      });
      return { success: true, message: 'Vendor verified successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to verify vendor' };
    }
  }

  async getPendingVerifications() {
    const pendingRestaurants = await this.prisma.restaurant.findMany({
      where: { verificationStatus: 'PENDING' },
      include: { user: true }
    });

    const pendingVendors = await this.prisma.vendor.findMany({
      where: { verificationStatus: 'PENDING' },
      include: { user: true }
    });

    return {
      restaurants: pendingRestaurants,
      vendors: pendingVendors
    };
  }
}