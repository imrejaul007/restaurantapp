import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseArrayPipe,
  DefaultValuePipe,
  ParseIntPipe,
  ParseFloatPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService, SearchFilters } from './search.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('restaurants')
  @Public()
  @ApiOperation({ summary: 'Search restaurants with filters' })
  @ApiResponse({ status: 200, description: 'Restaurants found' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'category', required: false, type: [String], description: 'Cuisine categories' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price' })
  @ApiQuery({ name: 'lat', required: false, type: Number, description: 'Latitude for location search' })
  @ApiQuery({ name: 'lng', required: false, type: Number, description: 'Longitude for location search' })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Search radius in km' })
  @ApiQuery({ name: 'minRating', required: false, type: Number, description: 'Minimum rating' })
  @ApiQuery({ name: 'availableOnly', required: false, type: Boolean, description: 'Show only available restaurants' })
  @ApiQuery({ name: 'tags', required: false, type: [String], description: 'Filter by tags' })
  async searchRestaurants(
    @Query('q') query = '',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string,
    @Query('sortOrder', new DefaultValuePipe('desc')) sortOrder: 'asc' | 'desc',
    @Query('category', new DefaultValuePipe([]), new ParseArrayPipe({ items: String, separator: ',' })) category: string[],
    @Query('minPrice', new DefaultValuePipe(0), ParseFloatPipe) minPrice: number,
    @Query('maxPrice', new DefaultValuePipe(10000), ParseFloatPipe) maxPrice: number,
    @Query('lat', new DefaultValuePipe(null)) lat: number | null,
    @Query('lng', new DefaultValuePipe(null)) lng: number | null,
    @Query('radius', new DefaultValuePipe(10), ParseFloatPipe) radius: number,
    @Query('minRating', new DefaultValuePipe(0), ParseFloatPipe) minRating: number,
    @Query('availableOnly', new DefaultValuePipe(false)) availableOnly: boolean,
    @Query('tags', new DefaultValuePipe([]), new ParseArrayPipe({ items: String, separator: ',' })) tags: string[],
  ) {
    const filters: SearchFilters = {};

    if (category.length > 0) filters.category = category;
    if (minPrice > 0 || maxPrice < 10000) {
      filters.priceRange = { min: minPrice, max: maxPrice };
    }
    if (lat !== null && lng !== null) {
      filters.location = { lat, lng, radius: radius / 111 }; // Convert km to degrees (approximate)
    }
    if (minRating > 0) filters.rating = minRating;
    if (availableOnly) filters.availability = true;
    if (tags.length > 0) filters.tags = tags;

    const pagination: PaginationDto = { page, limit, sortBy, sortOrder, skip: ((page || 1) - 1) * (limit || 20) };

    return this.searchService.searchRestaurants(query, filters, pagination);
  }

  @Get('products')
  @Public()
  @ApiOperation({ summary: 'Search products with filters' })
  @ApiResponse({ status: 200, description: 'Products found' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'category', required: false, type: [String], description: 'Product categories' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price' })
  @ApiQuery({ name: 'availableOnly', required: false, type: Boolean, description: 'Show only available products' })
  @ApiQuery({ name: 'tags', required: false, type: [String], description: 'Filter by tags' })
  async searchProducts(
    @Query('q') query = '',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string,
    @Query('sortOrder', new DefaultValuePipe('desc')) sortOrder: 'asc' | 'desc',
    @Query('category', new DefaultValuePipe([]), new ParseArrayPipe({ items: String, separator: ',' })) category: string[],
    @Query('minPrice', new DefaultValuePipe(0), ParseFloatPipe) minPrice: number,
    @Query('maxPrice', new DefaultValuePipe(10000), ParseFloatPipe) maxPrice: number,
    @Query('availableOnly', new DefaultValuePipe(false)) availableOnly: boolean,
    @Query('tags', new DefaultValuePipe([]), new ParseArrayPipe({ items: String, separator: ',' })) tags: string[],
  ) {
    const filters: SearchFilters = {};

    if (category.length > 0) filters.category = category;
    if (minPrice > 0 || maxPrice < 10000) {
      filters.priceRange = { min: minPrice, max: maxPrice };
    }
    if (availableOnly) filters.availability = true;
    if (tags.length > 0) filters.tags = tags;

    const pagination: PaginationDto = { page, limit, sortBy, sortOrder, skip: ((page || 1) - 1) * (limit || 20) };

    return this.searchService.searchProducts(query, filters, pagination);
  }

  @Get('jobs')
  @Public()
  @ApiOperation({ summary: 'Search jobs with filters' })
  @ApiResponse({ status: 200, description: 'Jobs found' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'location', required: false, description: 'Job location' })
  @ApiQuery({ name: 'status', required: false, type: [String], description: 'Job status filter' })
  @ApiQuery({ name: 'from', required: false, description: 'Posted after date (ISO string)' })
  @ApiQuery({ name: 'to', required: false, description: 'Posted before date (ISO string)' })
  async searchJobs(
    @Query('q') query = '',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string,
    @Query('sortOrder', new DefaultValuePipe('desc')) sortOrder: 'asc' | 'desc',
    @Query('location') location: string,
    @Query('status', new DefaultValuePipe([]), new ParseArrayPipe({ items: String, separator: ',' })) status: string[],
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const filters: SearchFilters = {};

    if (status.length > 0) filters.status = status;
    if (from || to) {
      filters.dateRange = {
        from: from ? new Date(from) : new Date(0),
        to: to ? new Date(to) : new Date(),
      };
    }

    const pagination: PaginationDto = { page, limit, sortBy, sortOrder, skip: ((page || 1) - 1) * (limit || 20) };

    return this.searchService.searchJobs(query, filters, pagination);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search users (authenticated users only)' })
  @ApiResponse({ status: 200, description: 'Users found' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'role', required: false, type: [String], description: 'User roles filter' })
  @ApiQuery({ name: 'status', required: false, type: [String], description: 'User status filter' })
  async searchUsers(
    @Query('q') query = '',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string,
    @Query('sortOrder', new DefaultValuePipe('desc')) sortOrder: 'asc' | 'desc',
    @Query('role', new DefaultValuePipe([]), new ParseArrayPipe({ items: String, separator: ',' })) role: string[],
    @Query('status', new DefaultValuePipe([]), new ParseArrayPipe({ items: String, separator: ',' })) status: string[],
  ) {
    const filters: any = {};

    if (role.length > 0) filters.role = role;
    if (status.length > 0) filters.status = status;

    const pagination: PaginationDto = { page, limit, sortBy, sortOrder, skip: ((page || 1) - 1) * (limit || 20) };

    return this.searchService.searchUsers(query, filters, pagination);
  }

  @Get('global')
  @Public()
  @ApiOperation({ summary: 'Global search across all entities' })
  @ApiResponse({ status: 200, description: 'Search results from all categories' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  async globalSearch(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const pagination: PaginationDto = { page, limit, skip: ((page || 1) - 1) * (limit || 20) };
    return this.searchService.globalSearch(query, pagination);
  }

  @Get('suggestions')
  @Public()
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({ status: 200, description: 'Search suggestions' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (minimum 2 characters)' })
  @ApiQuery({ 
    name: 'type', 
    required: false, 
    enum: ['restaurants', 'products', 'jobs'],
    description: 'Type of suggestions to return',
  })
  async getSuggestions(
    @Query('q') query: string,
    @Query('type', new DefaultValuePipe('restaurants')) type: 'restaurants' | 'products' | 'jobs',
  ) {
    if (query.length < 2) {
      return [];
    }

    return this.searchService.getSearchSuggestions(query, type);
  }

  @Get('filters/categories')
  @Public()
  @ApiOperation({ summary: 'Get available filter categories' })
  @ApiResponse({ status: 200, description: 'Available categories for filtering' })
  async getFilterCategories() {
    // This would typically come from a configuration or database
    return {
      restaurants: {
        cuisineTypes: [
          'Indian', 'Chinese', 'Continental', 'Italian', 'Mexican', 
          'Japanese', 'Thai', 'Mediterranean', 'American', 'Fast Food',
          'Street Food', 'Desserts', 'Beverages',
        ],
        priceRanges: [
          { label: 'Budget (₹0-₹200)', min: 0, max: 200 },
          { label: 'Mid-range (₹200-₹500)', min: 200, max: 500 },
          { label: 'Premium (₹500-₹1000)', min: 500, max: 1000 },
          { label: 'Fine Dining (₹1000+)', min: 1000, max: 10000 },
        ],
        ratings: [1, 2, 3, 4, 5],
      },
      products: {
        categories: [
          'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Meat', 'Seafood',
          'Spices', 'Beverages', 'Snacks', 'Frozen Foods', 'Equipment',
          'Packaging', 'Cleaning Supplies',
        ],
        priceRanges: [
          { label: 'Under ₹100', min: 0, max: 100 },
          { label: '₹100-₹500', min: 100, max: 500 },
          { label: '₹500-₹1000', min: 500, max: 1000 },
          { label: '₹1000+', min: 1000, max: 10000 },
        ],
      },
      jobs: {
        departments: [
          'Kitchen', 'Service', 'Management', 'Administration', 
          'Marketing', 'Finance', 'HR', 'IT', 'Delivery',
        ],
        employmentTypes: [
          'Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship',
        ],
        experienceLevels: [
          'Entry Level', 'Mid Level', 'Senior Level', 'Executive',
        ],
      },
    };
  }
}