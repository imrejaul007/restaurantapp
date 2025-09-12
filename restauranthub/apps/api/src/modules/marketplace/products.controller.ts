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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductsService } from './products.service';
import { UserRole } from '@prisma/client';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get products (for vendors to manage their products)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Products retrieved successfully' })
  async getProducts(
    @Request() req: any,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const products = await this.productsService.getProducts(req.user.id, {
      categoryId: category,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Products retrieved successfully',
      data: products,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product retrieved successfully' })
  async getProduct(@Request() req: any, @Param('id') productId: string) {
    const product = await this.productsService.getProductById(req.user.id, productId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Product retrieved successfully',
      data: product,
    };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Product created successfully' })
  async createProduct(
    @Request() req: any,
    @Body() productData: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const product = await this.productsService.createProduct(req.user.id, {
      ...productData,
      price: parseFloat(productData.price),
      stockQuantity: parseInt(productData.stockQuantity),
      minOrderQty: productData.minOrderQty ? parseInt(productData.minOrderQty) : 1,
      maxOrderQty: productData.maxOrderQty ? parseInt(productData.maxOrderQty) : null,
    }, files);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Product created successfully',
      data: product,
    };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product updated successfully' })
  async updateProduct(
    @Request() req: any,
    @Param('id') productId: string,
    @Body() productData: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const product = await this.productsService.updateProduct(req.user.id, productId, {
      ...productData,
      price: productData.price ? parseFloat(productData.price) : undefined,
      stockQuantity: productData.stockQuantity ? parseInt(productData.stockQuantity) : undefined,
      minOrderQty: productData.minOrderQty ? parseInt(productData.minOrderQty) : undefined,
      maxOrderQty: productData.maxOrderQty ? parseInt(productData.maxOrderQty) : undefined,
    }, files);

    return {
      statusCode: HttpStatus.OK,
      message: 'Product updated successfully',
      data: product,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product deleted successfully' })
  async deleteProduct(@Request() req: any, @Param('id') productId: string) {
    await this.productsService.deleteProduct(req.user.id, productId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Product deleted successfully',
    };
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Update product status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product status updated successfully' })
  async updateProductStatus(
    @Request() req: any,
    @Param('id') productId: string,
    @Body('status') status: 'active' | 'inactive' | 'out_of_stock',
  ) {
    await this.productsService.updateProductStatus(req.user.id, productId, status);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Product status updated successfully',
    };
  }

  @Put(':id/availability')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Update product availability' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product availability updated successfully' })
  async updateProductAvailability(
    @Request() req: any,
    @Param('id') productId: string,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    await this.productsService.updateProductAvailability(req.user.id, productId, isAvailable);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Product availability updated successfully',
    };
  }

  @Put(':id/stock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Update product stock' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product stock updated successfully' })
  async updateStock(
    @Request() req: any,
    @Param('id') productId: string,
    @Body('stockQuantity') stockQuantity: number,
    @Body('operation') operation: 'set' | 'add' | 'subtract' = 'set',
  ) {
    await this.productsService.updateStock(req.user.id, productId, stockQuantity, operation);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Product stock updated successfully',
    };
  }

  @Get(':id/analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Get product analytics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product analytics retrieved successfully' })
  async getProductAnalytics(
    @Request() req: any,
    @Param('id') productId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const analytics = await this.productsService.getProductAnalytics(req.user.id, productId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Product analytics retrieved successfully',
      data: analytics,
    };
  }

  @Post(':id/images')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add product images' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Images added successfully' })
  async addImages(
    @Request() req: any,
    @Param('id') productId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    await this.productsService.addProductImages(req.user.id, productId, files);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Images added successfully',
    };
  }

  @Delete(':id/images/:imageId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Remove product image' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Image removed successfully' })
  async removeImage(
    @Request() req: any,
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
  ) {
    await this.productsService.removeProductImage(req.user.id, productId, imageId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Image removed successfully',
    };
  }

  @Post(':id/reviews')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Add product review' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Review added successfully' })
  async addReview(
    @Request() req: any,
    @Param('id') productId: string,
    @Body('rating') rating: number,
    @Body('comment') comment: string,
    @Body('orderId') orderId?: string,
  ) {
    const review = await this.productsService.addProductReview(req.user.id, productId, {
      rating,
      comment,
      orderId,
    });
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Review added successfully',
      data: review,
    };
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get product reviews' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Reviews retrieved successfully' })
  async getReviews(
    @Param('id') productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const reviews = await this.productsService.getProductReviews(productId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Reviews retrieved successfully',
      data: reviews,
    };
  }

  @Put('reviews/:reviewId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Update product review' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Review updated successfully' })
  async updateReview(
    @Request() req: any,
    @Param('reviewId') reviewId: string,
    @Body('rating') rating?: number,
    @Body('comment') comment?: string,
  ) {
    const review = await this.productsService.updateProductReview(req.user.id, reviewId, {
      rating,
      comment,
    });
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Review updated successfully',
      data: review,
    };
  }

  @Delete('reviews/:reviewId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete product review' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Review deleted successfully' })
  async deleteReview(@Request() req: any, @Param('reviewId') reviewId: string) {
    await this.productsService.deleteProductReview(req.user.id, reviewId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Review deleted successfully',
    };
  }
}