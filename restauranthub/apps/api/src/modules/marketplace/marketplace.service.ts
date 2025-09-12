import { Injectable, NotFoundException, ForbiddenException, Logger, Optional } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SearchService } from '../search/search.service';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    @Optional() private readonly searchService?: SearchService,
  ) {}

  async getMarketplaceOverview(userId: string) {
    try {
      // Get user to check role
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get featured products
      const featuredProducts = await this.databaseService.product.findMany({
        take: 12,
        where: {
          status: 'ACTIVE',
        },
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              rating: true,
              verificationStatus: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Get product categories
      const categories = await this.getProductCategories();

      // Get recent orders for restaurants
      let recentOrders: any[] = [];
      if (user.role === UserRole.RESTAURANT) {
        const restaurant = await this.databaseService.restaurant.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });

        if (restaurant) {
          recentOrders = await this.databaseService.order.findMany({
            where: {
              restaurantId: restaurant.id,
              vendorId: { not: null },
            },
            take: 5,
            include: {
              vendor: {
                select: {
                  companyName: true,
                },
              },
              items: {
                include: {
                  product: {
                    select: {
                      name: true,
                      images: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          });
        }
      }

      // Get marketplace statistics
      const stats = {
        totalProducts: await this.databaseService.product.count({
          where: { status: 'ACTIVE' },
        }),
        totalVendors: await this.databaseService.vendor.count({
          where: { verificationStatus: 'VERIFIED' },
        }),
        totalCategories: categories.length,
      };

      return {
        featuredProducts,
        categories,
        recentOrders,
        stats,
      };
    } catch (error) {
      this.logger.error('Failed to get marketplace overview', error);
      throw error;
    }
  }

  async searchProducts(params: {
    query?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    vendorId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        query,
        category,
        minPrice,
        maxPrice,
        vendorId,
        sortBy = 'relevance',
        sortOrder = 'desc',
        page = 1,
        limit = 20,
      } = params;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.ProductWhereInput = {
        status: 'ACTIVE',
      };

      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ];
      }

      if (category) {
        where.categoryId = category;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      if (vendorId) {
        where.vendorId = vendorId;
      }

      // Build order by clause
      let orderBy: Prisma.ProductOrderByWithRelationInput = {};
      switch (sortBy) {
        case 'price':
          orderBy.price = sortOrder;
          break;
        case 'rating':
          orderBy.rating = sortOrder;
          break;
        case 'popularity':
          orderBy.createdAt = 'desc'; // Fallback to newest for now
          break;
        case 'newest':
          orderBy.createdAt = 'desc';
          break;
        default:
          orderBy.createdAt = 'desc';
      }

      // Get products with pagination
      const [products, total] = await Promise.all([
        this.databaseService.product.findMany({
          where,
          include: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                rating: true,
                verificationStatus: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy,
        }),
        this.databaseService.product.count({ where }),
      ]);

      // Get available filters for the current search
      const filters = await this.getAvailableFilters(where);

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        filters,
      };
    } catch (error) {
      this.logger.error('Failed to search products', error);
      throw error;
    }
  }

  async getProduct(productId: string, userId?: string) {
    try {
      const product = await this.databaseService.product.findUnique({
        where: { id: productId, status: 'ACTIVE' },
        include: {
          vendor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
          reviews: {
            take: 5,
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Increment view count
      await this.databaseService.product.update({
        where: { id: productId },
        data: {
          viewCount: { increment: 1 },
        },
      });

      // Get related products
      const relatedProducts = await this.databaseService.product.findMany({
        where: {
          id: { not: productId },
          categoryId: product.categoryId,
          status: 'ACTIVE',
        },
        take: 8,
        include: {
          vendor: {
            select: {
              companyName: true,
              rating: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        ...product,
        relatedProducts,
      };
    } catch (error) {
      this.logger.error('Failed to get product', error);
      throw error;
    }
  }

  async addToCart(userId: string, productId: string, quantity: number) {
    try {
      // Verify user is a restaurant
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: {
          restaurant: {
            select: { id: true },
          },
        },
      });

      if (!user || !user.restaurant) {
        throw new ForbiddenException('Only restaurants can add products to cart');
      }

      // Verify product exists and is available
      const product = await this.databaseService.product.findUnique({
        where: { id: productId, status: 'ACTIVE' },
      });

      if (!product) {
        throw new NotFoundException('Product not found or not available');
      }

      // Check stock availability
      if (product.quantity < quantity) {
        throw new ForbiddenException('Insufficient stock available');
      }

      // Check if cart item already exists
      const existingCartItem = await this.databaseService.$queryRaw`
        SELECT * FROM cart_items 
        WHERE restaurant_id = ${user.restaurant.id} 
        AND product_id = ${productId}
      ` as any[];

      if (existingCartItem.length > 0) {
        // Update existing cart item
        await this.databaseService.$executeRaw`
          UPDATE cart_items 
          SET quantity = quantity + ${quantity}, 
              updated_at = NOW()
          WHERE restaurant_id = ${user.restaurant.id} 
          AND product_id = ${productId}
        `;
      } else {
        // Create new cart item
        await this.databaseService.$executeRaw`
          INSERT INTO cart_items (restaurant_id, product_id, quantity, unit_price, total_price, created_at, updated_at)
          VALUES (${user.restaurant.id}, ${productId}, ${quantity}, ${product.price}, ${quantity * product.price}, NOW(), NOW())
        `;
      }

      return {
        message: 'Product added to cart successfully',
        cartItemCount: await this.getCartItemCount(user.restaurant.id),
      };
    } catch (error) {
      this.logger.error('Failed to add to cart', error);
      throw error;
    }
  }

  async getCart(userId: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: {
          restaurant: {
            select: { id: true },
          },
        },
      });

      if (!user || !user.restaurant) {
        throw new ForbiddenException('Only restaurants can view cart');
      }

      const cartItems = await this.databaseService.$queryRaw`
        SELECT 
          ci.id,
          ci.quantity,
          ci.unit_price,
          ci.total_price,
          p.id as product_id,
          p.name as product_name,
          p.images,
          p.unit,
          p.min_order_quantity,
          p.max_order_quantity,
          p.quantity,
          vp.company_name as vendor_name,
          vp.id as vendor_id
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        JOIN vendors vp ON p.vendor_id = vp.id
        WHERE ci.restaurant_id = ${user.restaurant.id}
        AND p.status = 'ACTIVE'
        ORDER BY ci.created_at DESC
      ` as any[];

      // Calculate cart totals
      const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
      const taxRate = 0.18; // 18% GST
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      // Group items by vendor for separate orders
      const itemsByVendor = cartItems.reduce((acc, item) => {
        const vendorId = item.vendor_id;
        if (!acc[vendorId]) {
          acc[vendorId] = {
            vendorId,
            vendorName: item.vendor_name,
            items: [],
            subtotal: 0,
          };
        }
        acc[vendorId].items.push(item);
        acc[vendorId].subtotal += parseFloat(item.total_price);
        return acc;
      }, {});

      return {
        items: cartItems,
        itemsByVendor: Object.values(itemsByVendor),
        summary: {
          itemCount: cartItems.length,
          subtotal,
          taxAmount,
          total,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get cart', error);
      throw error;
    }
  }

  private async getProductCategories() {
    try {
      const categories = await this.databaseService.product.groupBy({
        by: ['categoryId'],
        where: {
          status: 'ACTIVE',
        },
        _count: {
          categoryId: true,
        },
        orderBy: {
          _count: {
            categoryId: 'desc',
          },
        },
      });

      return categories.map((cat: any) => ({
        name: cat.categoryId,
        count: cat._count.categoryId,
      }));
    } catch (error) {
      this.logger.error('Failed to get product categories', error);
      return [];
    }
  }

  private async getAvailableFilters(baseWhere: Prisma.ProductWhereInput) {
    try {
      const [priceRange, categories, vendors] = await Promise.all([
        this.databaseService.product.aggregate({
          where: baseWhere,
          _min: { price: true },
          _max: { price: true },
        }),
        this.databaseService.product.groupBy({
          by: ['categoryId'],
          where: baseWhere,
          _count: { categoryId: true },
          orderBy: { _count: { categoryId: 'desc' } },
        }),
        this.databaseService.product.findMany({
          where: baseWhere,
          select: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                rating: true,
              },
            },
          },
          distinct: ['vendorId'],
          take: 20,
        }),
      ]);

      return {
        priceRange: {
          min: priceRange._min.price || 0,
          max: priceRange._max.price || 0,
        },
        categories: categories.map((cat: any) => ({
          name: cat.categoryId,
          count: cat._count.categoryId,
        })),
        vendors: vendors.map((p: any) => p.vendor),
      };
    } catch (error) {
      this.logger.error('Failed to get available filters', error);
      return {
        priceRange: { min: 0, max: 0 },
        categories: [],
        vendors: [],
      };
    }
  }

  async updateCartItem(userId: string, cartItemId: string, quantity: number) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: { restaurant: { select: { id: true } } },
      });

      if (!user || !user.restaurant) {
        throw new ForbiddenException('Only restaurants can update cart items');
      }

      // Check if cart item exists and belongs to this restaurant
      const cartItem = await this.databaseService.$queryRaw`
        SELECT ci.*, p.price, p.quantity as stock_quantity 
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.id = ${cartItemId} 
        AND ci.restaurant_id = ${user.restaurant.id}
      ` as any[];

      if (cartItem.length === 0) {
        throw new NotFoundException('Cart item not found');
      }

      const item = cartItem[0];

      // Check stock availability
      if (item.stock_quantity < quantity) {
        throw new ForbiddenException('Insufficient stock available');
      }

      // Update cart item
      await this.databaseService.$executeRaw`
        UPDATE cart_items 
        SET quantity = ${quantity}, 
            total_price = ${quantity * item.price}, 
            updated_at = NOW()
        WHERE id = ${cartItemId}
      `;

      return {
        message: 'Cart item updated successfully',
        cartItemCount: await this.getCartItemCount(user.restaurant.id),
      };
    } catch (error) {
      this.logger.error('Failed to update cart item', error);
      throw error;
    }
  }

  async removeFromCart(userId: string, cartItemId: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: { restaurant: { select: { id: true } } },
      });

      if (!user || !user.restaurant) {
        throw new ForbiddenException('Only restaurants can remove cart items');
      }

      // Check if cart item exists and belongs to this restaurant
      const result = await this.databaseService.$executeRaw`
        DELETE FROM cart_items 
        WHERE id = ${cartItemId} 
        AND restaurant_id = ${user.restaurant.id}
      `;

      if (result === 0) {
        throw new NotFoundException('Cart item not found');
      }

      return {
        message: 'Item removed from cart successfully',
        cartItemCount: await this.getCartItemCount(user.restaurant.id),
      };
    } catch (error) {
      this.logger.error('Failed to remove from cart', error);
      throw error;
    }
  }

  async clearCart(userId: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: { restaurant: { select: { id: true } } },
      });

      if (!user || !user.restaurant) {
        throw new ForbiddenException('Only restaurants can clear cart');
      }

      await this.databaseService.$executeRaw`
        DELETE FROM cart_items 
        WHERE restaurant_id = ${user.restaurant.id}
      `;

      return {
        message: 'Cart cleared successfully',
        cartItemCount: 0,
      };
    } catch (error) {
      this.logger.error('Failed to clear cart', error);
      throw error;
    }
  }

  async getVendors(params: {
    category?: string;
    city?: string;
    state?: string;
    verified?: boolean;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        category,
        city,
        state,
        verified,
        page = 1,
        limit = 20,
      } = params;

      const skip = (page - 1) * limit;

      const where: Prisma.VendorWhereInput = {};

      if (verified !== undefined) {
        where.verificationStatus = verified ? 'VERIFIED' : 'PENDING';
      }

      if (city) {
        where.user = {
          profile: {
            city: { contains: city, mode: 'insensitive' },
          },
        };
      }

      if (state) {
        where.user = {
          profile: {
            state: { contains: state, mode: 'insensitive' },
          },
        };
      }

      // If category is specified, filter by vendors who have products in that category
      if (category) {
        where.products = {
          some: {
            categoryId: category,
            status: 'ACTIVE',
          },
        };
      }

      const [vendors, total] = await Promise.all([
        this.databaseService.vendor.findMany({
          where,
          include: {
            user: {
              select: {
                phone: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    city: true,
                    state: true,
                  },
                },
              },
            },
            _count: {
              select: {
                products: {
                  where: { status: 'ACTIVE' },
                },
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.databaseService.vendor.count({ where }),
      ]);

      return {
        vendors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get vendors', error);
      throw error;
    }
  }

  async getVendor(vendorId: string) {
    try {
      const vendor = await this.databaseService.vendor.findUnique({
        where: { id: vendorId },
        include: {
          user: {
            select: {
              phone: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  city: true,
                  state: true,
                },
              },
            },
          },
          products: {
            where: { status: 'ACTIVE' },
            take: 12,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              products: {
                where: { status: 'ACTIVE' },
              },
            },
          },
        },
      });

      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      // Get vendor statistics
      const stats = await this.databaseService.product.aggregate({
        where: { vendorId, status: 'ACTIVE' },
        _avg: { rating: true },
        _count: { id: true },
      });

      return {
        ...vendor,
        stats: {
          totalProducts: stats._count.id,
          averageRating: stats._avg.rating || 0,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get vendor', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const categories = await this.getProductCategories();
      return categories;
    } catch (error) {
      this.logger.error('Failed to get categories', error);
      throw error;
    }
  }

  private async getCartItemCount(restaurantId: string): Promise<number> {
    try {
      const result = await this.databaseService.$queryRaw`
        SELECT COUNT(*) as count 
        FROM cart_items 
        WHERE restaurant_id = ${restaurantId}
      ` as any[];

      return parseInt(result[0]?.count || '0');
    } catch (error) {
      this.logger.error('Failed to get cart item count', error);
      return 0;
    }
  }
}