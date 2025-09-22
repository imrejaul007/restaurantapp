import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(restaurantId: string, userId: string, createBranchDto: CreateBranchDto) {
    // Verify restaurant ownership
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, userId },
    });

    if (!restaurant) {
      throw new ForbiddenException('Access denied');
    }

    // For now, return the restaurant profile as a "branch" since Branch model doesn't exist yet
    // This is a stub implementation until proper Branch model is added to schema
    const branch = {
      id: restaurant.id,
      name: createBranchDto.name || restaurant.businessName || restaurant.name,
      address: 'N/A', // Restaurant model doesn't have address field
      city: 'N/A', // Restaurant model doesn't have city field
      state: 'N/A', // Restaurant model doesn't have state field
      zipCode: 'N/A', // Restaurant model doesn't have zipCode field
      phone: 'N/A', // Restaurant model doesn't have businessPhone field
      email: 'N/A', // Restaurant model doesn't have businessEmail field
      isActive: restaurant.isActive, // Use isActive instead of non-existent isOpen
      restaurantId: restaurant.id,
      restaurant,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return branch;
  }

  async findAll(restaurantId: string) {
    // Stub implementation: return the restaurant as a single branch
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        user: true,
      },
    });

    if (!restaurant) {
      return [];
    }

    const branch = {
      id: restaurant.id,
      name: restaurant.businessName || restaurant.name,
      address: 'N/A', // Restaurant model doesn't have address field
      city: 'N/A', // Restaurant model doesn't have city field
      state: 'N/A', // Restaurant model doesn't have state field
      zipCode: 'N/A', // Restaurant model doesn't have zipCode field
      phone: 'N/A', // Restaurant model doesn't have businessPhone field
      email: 'N/A', // Restaurant model doesn't have businessEmail field
      isActive: restaurant.isActive, // Use isActive instead of non-existent isOpen
      restaurantId: restaurant.id,
      restaurant,
      employees: [], // Stub: no employees data for now
      _count: { employees: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return [branch];
  }

  async findOne(id: string) {
    // Stub implementation: treat restaurant profile as branch
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Branch not found');
    }

    const branch = {
      id: restaurant.id,
      name: restaurant.businessName || restaurant.name,
      address: 'N/A', // Restaurant model doesn't have address field
      city: 'N/A', // Restaurant model doesn't have city field
      state: 'N/A', // Restaurant model doesn't have state field
      zipCode: 'N/A', // Restaurant model doesn't have zipCode field
      phone: 'N/A', // Restaurant model doesn't have businessPhone field
      email: 'N/A', // Restaurant model doesn't have businessEmail field
      isActive: restaurant.isActive, // Use isActive instead of non-existent isOpen
      restaurantId: restaurant.id,
      restaurant,
      employees: [], // Stub: no employees data for now
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return branch;
  }

  async update(id: string, userId: string, userRole: string, updateBranchDto: UpdateBranchDto) {
    const branch = await this.findOne(id);

    // Check permissions
    if (userRole !== UserRole.ADMIN && branch.restaurant.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Stub implementation: update restaurant profile instead of branch
    // Note: Restaurant model doesn't have address fields, so we only update what exists
    const updatedRestaurant = await this.prisma.restaurant.update({
      where: { id },
      data: {
        name: updateBranchDto.name || branch.name,
        // Note: Other fields don't exist in Restaurant model
      },
      include: {
        user: true,
      },
    });

    return {
      ...branch,
      name: updatedRestaurant.businessName || updatedRestaurant.name,
      address: 'N/A', // Restaurant model doesn't have address field
      city: 'N/A', // Restaurant model doesn't have city field
      state: 'N/A', // Restaurant model doesn't have state field
      zipCode: 'N/A', // Restaurant model doesn't have zipCode field
      phone: 'N/A', // Restaurant model doesn't have businessPhone field
      email: 'N/A', // Restaurant model doesn't have businessEmail field
      restaurant: updatedRestaurant,
      updatedAt: new Date(),
    };
  }

  async deactivate(id: string, userId: string, userRole: string) {
    const branch = await this.findOne(id);

    // Check permissions
    if (userRole !== UserRole.ADMIN && branch.restaurant.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Stub implementation: set restaurant as inactive instead of deactivating branch
    await this.prisma.restaurant.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Branch deactivated successfully' };
  }

  async activate(id: string, userId: string, userRole: string) {
    const branch = await this.findOne(id);

    // Check permissions
    if (userRole !== UserRole.ADMIN && branch.restaurant.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Stub implementation: set restaurant as active instead of activating branch
    await this.prisma.restaurant.update({
      where: { id },
      data: { isActive: true },
    });

    return { message: 'Branch activated successfully' };
  }

  async getBranchStats(id: string) {
    // Stub implementation: return empty stats since Employee model relationship might not exist
    return {
      employeeCount: 0,
      totalSalary: 0,
      activeEmployees: [],
    };
  }
}