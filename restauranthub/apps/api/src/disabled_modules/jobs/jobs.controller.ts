import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobStatus, UserRole } from '@prisma/client';

@ApiTags('jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new job posting' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Job posting created successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  async create(
    @Body() createJobDto: CreateJobDto,
    @Query('restaurantId') requestedRestaurantId: string,
    @Req() req: any
  ) {
    const { user } = req;

    // Get restaurant ID based on user role and permissions
    let restaurantId: string;

    if (user.role === UserRole.RESTAURANT) {
      // Restaurant owners create jobs for their own restaurant
      const restaurant = await this.jobsService.findRestaurantByUserId(user.id);
      if (!restaurant) {
        throw new Error('No restaurant found for this user');
      }
      restaurantId = restaurant.id;

      // If admin specified a different restaurant, verify ownership
      if (requestedRestaurantId && requestedRestaurantId !== restaurantId) {
        throw new Error('Restaurant owners can only create jobs for their own restaurant');
      }
    } else if (user.role === UserRole.ADMIN) {
      // Admins can create jobs for any restaurant, but must specify which one
      if (!requestedRestaurantId) {
        // Default to first available restaurant for demo purposes
        const restaurants = await this.jobsService.getAllRestaurants();
        if (restaurants.length === 0) {
          throw new Error('No restaurants available to create jobs for');
        }
        restaurantId = restaurants[0].id;
      } else {
        // Verify the requested restaurant exists
        const restaurant = await this.jobsService.findRestaurantById(requestedRestaurantId);
        if (!restaurant) {
          throw new Error('Restaurant not found');
        }
        restaurantId = requestedRestaurantId;
      }
    } else {
      throw new Error('Unauthorized role for job creation');
    }

    return this.jobsService.create(restaurantId, user.id, createJobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all job postings' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'location', required: false, type: 'string' })
  @ApiQuery({ name: 'jobType', required: false, type: 'string' })
  @ApiQuery({ name: 'skills', required: false, type: 'string' })
  @ApiQuery({ name: 'experienceMin', required: false, type: 'number' })
  @ApiQuery({ name: 'salaryMin', required: false, type: 'number' })
  @ApiQuery({ name: 'salaryMax', required: false, type: 'number' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Jobs retrieved successfully' })
  async findAll(@Query() filters: any) {
    const { page = 1, limit = 20, ...otherFilters } = filters;
    return this.jobsService.findAll(+page, +limit, otherFilters);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search job postings' })
  @ApiQuery({ name: 'q', required: true, type: 'string' })
  @ApiQuery({ name: 'location', required: false, type: 'string' })
  @ApiQuery({ name: 'jobType', required: false, type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results retrieved successfully' })
  async search(@Query('q') query: string, @Query() filters: any) {
    return this.jobsService.searchJobs(query, filters);
  }

  @Get('my-jobs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Get jobs posted by current restaurant' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'status', required: false, enum: JobStatus })
  @ApiResponse({ status: HttpStatus.OK, description: 'Restaurant jobs retrieved successfully' })
  async getMyJobs(@Query() filters: any, @Req() req: any) {
    const { user } = req;
    const { page = 1, limit = 20, ...otherFilters } = filters;
    
    const restaurant = await this.jobsService.findRestaurantByUserId(user.id);
    return this.jobsService.findByRestaurant(restaurant.id, +page, +limit, otherFilters);
  }

  @Get('recommended/:employeeId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get recommended jobs for an employee' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Recommended jobs retrieved successfully' })
  async getRecommendedJobs(@Param('employeeId') employeeId: string, @Req() req: any) {
    const { user } = req;
    
    // Users can only get recommendations for themselves unless they're admin
    if (user.role !== UserRole.ADMIN) {
      const employee = await this.jobsService.findEmployeeByUserId(user.id);
      if (employee.id !== employeeId) {
        throw new Error('Forbidden');
      }
    }
    
    return this.jobsService.getRecommendedJobs(employeeId);
  }

  @Get('stats/:restaurantId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get job statistics for a restaurant' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job statistics retrieved successfully' })
  async getJobStats(@Param('restaurantId') restaurantId: string, @Req() req: any) {
    const { user } = req;
    
    // Restaurant owners can only get stats for their own restaurant
    if (user.role === UserRole.RESTAURANT) {
      const restaurant = await this.jobsService.findRestaurantByUserId(user.id);
      if (restaurant.id !== restaurantId) {
        throw new Error('Forbidden');
      }
    }
    
    return this.jobsService.getJobStats(restaurantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific job posting' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job posting retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Job posting not found' })
  async findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a job posting' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job posting updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Job posting not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto, @Req() req: any) {
    const { user } = req;
    return this.jobsService.update(id, user.id, user.role, updateJobDto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update job posting status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job status updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Job posting not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: JobStatus,
    @Req() req: any
  ) {
    const { user } = req;
    return this.jobsService.updateStatus(id, status, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a job posting' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Job posting deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Job posting not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const { user } = req;
    return this.jobsService.updateStatus(id, JobStatus.CLOSED, user.id, user.role);
  }
}