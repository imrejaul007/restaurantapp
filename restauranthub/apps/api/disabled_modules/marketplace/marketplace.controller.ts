import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MarketplaceService } from './marketplace.service';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('marketplace')
@Controller('marketplace')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Public()
  @Get('test')
  @ApiOperation({ summary: 'Test marketplace data (no auth)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Test data retrieved successfully' })
  async testMarketplaceData() {
    const data = await this.marketplaceService.getMarketplaceOverview('mock-admin-1');
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Test data retrieved successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get marketplace overview' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Marketplace overview retrieved successfully' })
  async getMarketplaceOverview(@Request() req: any) {
    const data = await this.marketplaceService.getMarketplaceOverview(req.user.id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Marketplace overview retrieved successfully',
      data,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products in marketplace' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Products retrieved successfully' })
  async searchProducts(
    @Query('query') query?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('vendorId') vendorId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const products = await this.marketplaceService.searchProducts({
      query,
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      vendorId,
      sortBy,
      sortOrder,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Products retrieved successfully',
      data: products,
    };
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product retrieved successfully' })
  async getProduct(@Param('id') productId: string, @Request() req: any) {
    const product = await this.marketplaceService.getProduct(productId, req.user?.id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Product retrieved successfully',
      data: product,
    };
  }

  @Post('cart/add')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Add product to cart' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product added to cart successfully' })
  async addToCart(
    @Request() req: any,
    @Body('productId') productId: string,
    @Body('quantity') quantity: number,
  ) {
    const result = await this.marketplaceService.addToCart(req.user.id, productId, quantity);
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: { cartItemCount: result.cartItemCount },
    };
  }

  @Get('cart')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Get shopping cart' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cart retrieved successfully' })
  async getCart(@Request() req: any) {
    const cart = await this.marketplaceService.getCart(req.user.id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Cart retrieved successfully',
      data: cart,
    };
  }

  @Put('cart/item/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cart item updated successfully' })
  async updateCartItem(
    @Request() req: any,
    @Param('id') cartItemId: string,
    @Body('quantity') quantity: number,
  ) {
    const result = await this.marketplaceService.updateCartItem(req.user.id, cartItemId, quantity);
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: { cartItemCount: result.cartItemCount },
    };
  }

  @Delete('cart/item/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item removed from cart successfully' })
  async removeFromCart(@Request() req: any, @Param('id') cartItemId: string) {
    const result = await this.marketplaceService.removeFromCart(req.user.id, cartItemId);
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: { cartItemCount: result.cartItemCount },
    };
  }

  @Delete('cart/clear')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Clear shopping cart' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cart cleared successfully' })
  async clearCart(@Request() req: any) {
    const result = await this.marketplaceService.clearCart(req.user.id);
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: { cartItemCount: result.cartItemCount },
    };
  }

  @Get('vendors')
  @ApiOperation({ summary: 'Get marketplace vendors' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Vendors retrieved successfully' })
  async getVendors(
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('verified') verified?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const vendors = await this.marketplaceService.getVendors({
      category,
      city,
      state,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Vendors retrieved successfully',
      data: vendors,
    };
  }

  @Get('vendors/:id')
  @ApiOperation({ summary: 'Get vendor details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Vendor retrieved successfully' })
  async getVendor(@Param('id') vendorId: string) {
    const vendor = await this.marketplaceService.getVendor(vendorId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Vendor retrieved successfully',
      data: vendor,
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get product categories' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Categories retrieved successfully' })
  async getCategories() {
    const categories = await this.marketplaceService.getCategories();
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }

  @Post('orders')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Order created successfully' })
  async createOrder(
    @Request() req: any,
    @Body('deliveryAddress') deliveryAddress: any,
    @Body('paymentMethod') paymentMethod: string,
    @Body('notes') notes?: string,
  ) {
    // This method would need to be implemented in the service
    return {
      statusCode: HttpStatus.OK,
      message: 'Order created successfully',
      data: { orderId: 'order_id' },
    };
  }

  @Get('orders')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.VENDOR)
  @ApiOperation({ summary: 'Get marketplace orders' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Orders retrieved successfully' })
  async getOrders(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // This method would need to be implemented in the service
    return {
      statusCode: HttpStatus.OK,
      message: 'Orders retrieved successfully',
      data: {
        orders: [],
        pagination: {
          page: parseInt(page || '1'),
          limit: parseInt(limit || '20'),
          total: 0,
          totalPages: 0,
        },
      },
    };
  }

  @Get('orders/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.VENDOR)
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Order retrieved successfully' })
  async getOrder(@Request() req: any, @Param('id') orderId: string) {
    // This method would need to be implemented in the service
    return {
      statusCode: HttpStatus.OK,
      message: 'Order retrieved successfully',
      data: {},
    };
  }

  @Put('orders/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Order status updated successfully' })
  async updateOrderStatus(
    @Request() req: any,
    @Param('id') orderId: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    // This method would need to be implemented in the service
    return {
      statusCode: HttpStatus.OK,
      message: 'Order status updated successfully',
    };
  }
}