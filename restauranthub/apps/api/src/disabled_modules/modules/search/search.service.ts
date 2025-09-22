import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
// import { RedisService } from '../../redis/redis.service';
import { PaginationDto, createPaginatedResponse } from '../common/dto/pagination.dto';

export interface SearchFilters {
  category?: string[];
  priceRange?: { min: number; max: number };
  location?: { lat: number; lng: number; radius: number };
  rating?: number;
  availability?: boolean;
  tags?: string[];
  dateRange?: { from: Date; to: Date };
  status?: string[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private prisma: PrismaService,
    // private redisService: RedisService, // Temporarily disabled
  ) {}

  async searchRestaurants(
    query: string,
    filters: SearchFilters = {},
    pagination: PaginationDto,
  ) {
    const cacheKey = `search:restaurants:${JSON.stringify({ query, filters, pagination })}`;
    
    // Check cache first
    const cached = null; // await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const searchConditions: any = {
      AND: [
        { isActive: true },
        { status: 'ACTIVE' },
      ],
    };

    // Text search
    if (query && query.trim()) {
      searchConditions.AND.push({
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { cuisineType: { has: query } },
        ],
      });
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      searchConditions.AND.push({
        cuisineType: { hasSome: filters.category },
      });
    }

    // Price range filter - Restaurant model doesn't have averagePrice field
    // This would need to be implemented by calculating from products or menu items
    // if (filters.priceRange) {
    //   searchConditions.AND.push({
    //     // Would need custom implementation
    //   });
    // }

    // Location filter - Restaurant model doesn't have lat/lng, would need Branch model
    // if (filters.location) {
    //   searchConditions.AND.push({
    //     branches: {
    //       some: {
    //         AND: [
    //           { latitude: { gte: filters.location.lat - filters.location.radius } },
    //           { latitude: { lte: filters.location.lat + filters.location.radius } },
    //           { longitude: { gte: filters.location.lng - filters.location.radius } },
    //           { longitude: { lte: filters.location.lng + filters.location.radius } },
    //         ]
    //       }
    //     }
    //   });
    // }

    // Rating filter
    if (filters.rating) {
      searchConditions.AND.push({
        rating: { gte: filters.rating },
      });
    }

    // Availability filter - Restaurant model doesn't have isOpen field
    if (filters.availability) {
      searchConditions.AND.push({
        isActive: true,
      });
    }

    // Tags filter - Restaurant model doesn't have tags field
    // if (filters.tags && filters.tags.length > 0) {
    //   searchConditions.AND.push({
    //     tags: { hasSome: filters.tags },
    //   });
    // }

    // Sort options
    const orderBy = this.buildOrderBy(pagination.sortBy, pagination.sortOrder);

    const [restaurants, totalCount] = await Promise.all([
      this.prisma.restaurant.findMany({
        where: searchConditions,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy,
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.restaurant.count({ where: searchConditions }),
    ]);

    const result = createPaginatedResponse(
      restaurants,
      totalCount,
      pagination.page || 1,
      pagination.limit || 20,
    );

    // Cache for 5 minutes
    // await this.redisService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  async searchProducts(
    query: string,
    filters: SearchFilters = {},
    pagination: PaginationDto,
  ) {
    const cacheKey = `search:products:${JSON.stringify({ query, filters, pagination })}`;
    
    const cached = null; // await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const searchConditions: any = {
      AND: [
        { isActive: true },
      ],
    };

    // Text search
    if (query && query.trim()) {
      searchConditions.AND.push({
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
          { tags: { has: query } },
          { sku: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      searchConditions.AND.push({
        categoryId: { in: filters.category },
      });
    }

    // Price range filter
    if (filters.priceRange) {
      searchConditions.AND.push({
        AND: [
          { price: { gte: filters.priceRange.min } },
          { price: { lte: filters.priceRange.max } },
        ],
      });
    }

    // Availability filter
    if (filters.availability) {
      searchConditions.AND.push({
        quantity: { gt: 0 },
      });
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      searchConditions.AND.push({
        tags: { hasSome: filters.tags },
      });
    }

    const orderBy = this.buildOrderBy(pagination.sortBy, pagination.sortOrder);

    const [products, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where: searchConditions,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              user: {
                select: {
                  email: true,
                  restaurant: true,
                  employee: true,
                  vendor: true,
                },
              },
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
        orderBy,
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.product.count({ where: searchConditions }),
    ]);

    const result = createPaginatedResponse(
      products,
      totalCount,
      pagination.page || 1,
      pagination.limit || 20,
    );

    // await this.redisService.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  async searchJobs(
    query: string,
    filters: SearchFilters = {},
    pagination: PaginationDto,
  ) {
    const searchConditions: any = {
      AND: [
        { isActive: true },
        { status: 'OPEN' },
      ],
    };

    // Text search
    if (query && query.trim()) {
      searchConditions.AND.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { requirements: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          // { department: { contains: query, mode: 'insensitive' } }, // Job model doesn't have department field
          { skills: { has: query } },
        ],
      });
    }

    // Location filter
    if (filters.location) {
      searchConditions.AND.push({
        location: { contains: query, mode: 'insensitive' },
      });
    }

    // Date range filter
    if (filters.dateRange) {
      searchConditions.AND.push({
        createdAt: {
          gte: filters.dateRange.from,
          lte: filters.dateRange.to,
        },
      });
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      searchConditions.AND.push({
        status: { in: filters.status },
      });
    }

    const orderBy = this.buildOrderBy(pagination.sortBy, pagination.sortOrder);

    const [jobs, totalCount] = await Promise.all([
      this.prisma.job.findMany({
        where: searchConditions,
        include: {
          restaurant: {
            select: {
              id: true,
              businessName: true,
              // city: true, // Restaurant model doesn't have city field directly
              user: {
                select: {
                  restaurant: true,
                  employee: true,
                  vendor: true,
                },
              },
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy,
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.job.count({ where: searchConditions }),
    ]);

    return createPaginatedResponse(
      jobs,
      totalCount,
      pagination.page || 1,
      pagination.limit || 20,
    );
  }

  async searchUsers(
    query: string,
    filters: { role?: string[]; status?: string[] } = {},
    pagination: PaginationDto,
  ) {
    const searchConditions: any = {
      AND: [
        { isActive: true },
      ],
    };

    // Text search
    if (query && query.trim()) {
      searchConditions.AND.push({
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    // Role filter
    if (filters.role && filters.role.length > 0) {
      searchConditions.AND.push({
        role: { in: filters.role },
      });
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      searchConditions.AND.push({
        status: { in: filters.status },
      });
    }

    const orderBy = this.buildOrderBy(pagination.sortBy, pagination.sortOrder);

    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where: searchConditions,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          restaurant: {
            select: { id: true, businessName: true }
          },
          employee: {
            select: { id: true, designation: true }
          },
          vendor: {
            select: { id: true, businessName: true }
          },
        },
        orderBy,
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.user.count({ where: searchConditions }),
    ]);

    return createPaginatedResponse(
      users,
      totalCount,
      pagination.page || 1,
      pagination.limit || 20,
    );
  }

  async globalSearch(query: string, pagination: PaginationDto) {
    if (!query || query.trim().length < 2) {
      return {
        restaurants: { data: [], meta: { totalItems: 0 } },
        products: { data: [], meta: { totalItems: 0 } },
        jobs: { data: [], meta: { totalItems: 0 } },
      };
    }

    const searchPagination = { ...pagination, limit: Math.min(pagination.limit || 20, 10), skip: ((pagination.page || 1) - 1) * Math.min(pagination.limit || 20, 10) };

    const [restaurants, products, jobs] = await Promise.all([
      this.searchRestaurants(query, {}, searchPagination),
      this.searchProducts(query, {}, searchPagination),
      this.searchJobs(query, {}, searchPagination),
    ]);

    return {
      restaurants,
      products,
      jobs,
      totalResults: restaurants.meta.totalItems + products.meta.totalItems + jobs.meta.totalItems,
    };
  }

  async getSearchSuggestions(query: string, type: 'restaurants' | 'products' | 'jobs' = 'restaurants') {
    const cacheKey = `suggestions:${type}:${query}`;
    
    const cached = null; // await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let suggestions = [];

    switch (type) {
      case 'restaurants':
        suggestions = await this.getRestaurantSuggestions(query);
        break;
      case 'products':
        suggestions = await this.getProductSuggestions(query);
        break;
      case 'jobs':
        suggestions = await this.getJobSuggestions(query);
        break;
    }

    // Cache suggestions for 1 hour
    // await this.redisService.set(cacheKey, JSON.stringify(suggestions), 3600);
    return suggestions;
  }

  private async getRestaurantSuggestions(query: string) {
    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        OR: [
          { businessName: { contains: query, mode: 'insensitive' } },
          { cuisineType: { has: query } },
        ],
      },
      select: {
        id: true,
        businessName: true,
        cuisineType: true,
        rating: true,
      },
      take: 10,
      orderBy: [
        { rating: 'desc' },
        { businessName: 'asc' },
      ],
    });

    return restaurants.map((restaurant: any) => ({
      id: restaurant.id,
      title: restaurant.businessName,
      subtitle: `${restaurant.cuisineType?.join(', ') || 'Restaurant'}`,
      type: 'restaurant',
      rating: restaurant.rating,
    }));
  }

  private async getProductSuggestions(query: string) {
    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
          { tags: { has: query } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        category: {
          select: {
            name: true,
          },
        },
        price: true,
        vendor: {
          select: {
            businessName: true,
          },
        },
      },
      take: 10,
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    return products.map((product: any) => ({
      id: product.id,
      title: product.name,
      subtitle: `${product.category} • ₹${product.price} • ${product.vendor.businessName}`,
      type: 'product',
      price: product.price,
    }));
  }

  private async getJobSuggestions(query: string) {
    const jobs = await this.prisma.job.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          // { category: { contains: query, mode: 'insensitive' } }, // Job model doesn't have category field
          { location: { contains: query, mode: 'insensitive' } },
        ],
        status: 'OPEN',
      },
      include: {
        restaurant: {
          select: {
            businessName: true,
          },
        },
      },
      take: 10,
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    return jobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      subtitle: `${job.category} • ${job.location} • ${job.restaurant.businessName}`,
      type: 'job',
      salary: job.salaryRange,
    }));
  }

  private buildOrderBy(sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc') {
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'price', 'rating', 'title'];
    
    if (!allowedSortFields.includes(sortBy)) {
      sortBy = 'createdAt';
    }

    return { [sortBy]: sortOrder };
  }
}