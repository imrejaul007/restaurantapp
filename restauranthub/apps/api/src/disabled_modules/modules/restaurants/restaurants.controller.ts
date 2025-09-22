import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Req,
  Patch,
  ParseIntPipe,
  DefaultValuePipe 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create restaurant profile' })
  @ApiResponse({ status: 201, description: 'Restaurant created successfully' })
  async create(@Req() req: any, @Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantsService.create(req.user.id, createRestaurantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all restaurants' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'isVerified', required: false, description: 'Filter by verification status (true/false)' })
  @ApiQuery({ name: 'cuisineType', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiResponse({ status: 200, description: 'Restaurants retrieved successfully' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('isVerified') isVerified?: string,
    @Query('cuisineType') cuisineType?: string,
    @Query('city') city?: string,
  ) {
    const filters = { isVerified: isVerified ? isVerified === 'true' : undefined, cuisineType, city };
    return this.restaurantsService.findAll(page, limit, filters);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search restaurants' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiQuery({ name: 'cuisineType', required: false })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Query('q') query: string,
    @Query('cuisineType') cuisineType?: string,
  ) {
    const filters = { cuisineType };
    return this.restaurantsService.searchRestaurants(query, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get restaurant by ID' })
  @ApiResponse({ status: 200, description: 'Restaurant retrieved' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update restaurant' })
  @ApiResponse({ status: 200, description: 'Restaurant updated successfully' })
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.update(id, req.user.id, req.user.role, updateRestaurantDto);
  }

  @Get(':id/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get restaurant dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getDashboard(@Param('id') id: string, @Req() req: any) {
    return this.restaurantsService.getDashboard(id, req.user.id);
  }

  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiQuery({ name: 'period', required: false, example: '30d' })
  @ApiOperation({ summary: 'Get restaurant analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data retrieved' })
  async getAnalytics(
    @Param('id') id: string,
    @Query('period') period?: string,
  ) {
    return this.restaurantsService.getRestaurantAnalytics(id, period);
  }

  @Get(':id/menu')
  @ApiOperation({ summary: 'Get restaurant menu' })
  @ApiResponse({ status: 200, description: 'Menu retrieved' })
  async getMenu(@Param('id') id: string) {
    return this.restaurantsService.getMenu(id);
  }

  @Post(':id/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload restaurant documents' })
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  async uploadDocument(
    @Param('id') id: string,
    @Body() body: { type: string; url: string; name: string },
  ) {
    return this.restaurantsService.uploadDocument(id, body.type, body.url, body.name);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify restaurant (Admin only)' })
  @ApiResponse({ status: 200, description: 'Restaurant verification updated' })
  async verify(
    @Param('id') id: string,
    @Body() body: { isVerified: boolean; notes?: string },
  ) {
    return this.restaurantsService.verifyRestaurant(id, body.isVerified, body.notes);
  }
}