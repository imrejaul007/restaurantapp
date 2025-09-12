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
import { CategoriesService } from './categories.service';
import { UserRole } from '@prisma/client';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Categories retrieved successfully' })
  async getCategories(
    @Query('includeStats') includeStats?: string,
    @Query('parentId') parentId?: string,
  ) {
    const categories = await this.categoriesService.getCategories({
      includeStats: includeStats === 'true',
      parentId,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Category retrieved successfully' })
  async getCategory(@Param('id') categoryId: string) {
    const category = await this.categoriesService.getCategoryById(categoryId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Create new category' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Category created successfully' })
  async createCategory(
    @Request() req: any,
    @Body('name') name: string,
    @Body('description') description?: string,
    @Body('parentId') parentId?: string,
    @Body('icon') icon?: string,
    @Body('color') color?: string,
  ) {
    const category = await this.categoriesService.createCategory(req.user.id, {
      name,
      description,
      parentId,
      icon,
      color,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Category created successfully',
      data: category,
    };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Category updated successfully' })
  async updateCategory(
    @Request() req: any,
    @Param('id') categoryId: string,
    @Body('name') name?: string,
    @Body('description') description?: string,
    @Body('parentId') parentId?: string,
    @Body('icon') icon?: string,
    @Body('color') color?: string,
    @Body('isActive') isActive?: boolean,
  ) {
    const category = await this.categoriesService.updateCategory(req.user.id, categoryId, {
      name,
      description,
      parentId,
      icon,
      color,
      isActive,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Category updated successfully',
      data: category,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Category deleted successfully' })
  async deleteCategory(@Request() req: any, @Param('id') categoryId: string) {
    await this.categoriesService.deleteCategory(req.user.id, categoryId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Category deleted successfully',
    };
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Category products retrieved successfully' })
  async getCategoryProducts(
    @Param('id') categoryId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const products = await this.categoriesService.getCategoryProducts(categoryId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy,
      sortOrder,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Category products retrieved successfully',
      data: products,
    };
  }

  @Get(':id/subcategories')
  @ApiOperation({ summary: 'Get subcategories' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subcategories retrieved successfully' })
  async getSubcategories(@Param('id') categoryId: string) {
    const subcategories = await this.categoriesService.getSubcategories(categoryId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Subcategories retrieved successfully',
      data: subcategories,
    };
  }

  @Get('tree/hierarchy')
  @ApiOperation({ summary: 'Get category tree hierarchy' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Category hierarchy retrieved successfully' })
  async getCategoryTree() {
    const tree = await this.categoriesService.getCategoryTree();
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Category hierarchy retrieved successfully',
      data: tree,
    };
  }

  @Get(':id/analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Get category analytics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Category analytics retrieved successfully' })
  async getCategoryAnalytics(
    @Request() req: any,
    @Param('id') categoryId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const analytics = await this.categoriesService.getCategoryAnalytics(req.user.id, categoryId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Category analytics retrieved successfully',
      data: analytics,
    };
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update category status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Category status updated successfully' })
  async updateCategoryStatus(
    @Request() req: any,
    @Param('id') categoryId: string,
    @Body('isActive') isActive: boolean,
  ) {
    await this.categoriesService.updateCategoryStatus(req.user.id, categoryId, isActive);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Category status updated successfully',
    };
  }

  @Post(':id/merge')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Merge categories' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Categories merged successfully' })
  async mergeCategories(
    @Request() req: any,
    @Param('id') targetCategoryId: string,
    @Body('sourceCategoryIds') sourceCategoryIds: string[],
  ) {
    await this.categoriesService.mergeCategories(req.user.id, targetCategoryId, sourceCategoryIds);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Categories merged successfully',
    };
  }
}