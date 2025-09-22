import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateCustomerFeedbackDto,
  CustomerSearchDto
} from './dto';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN, UserRole.EMPLOYEE)
  async createCustomer(
    @Body() createCustomerDto: CreateCustomerDto,
    @Request() req: any
  ) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : req.user.employee?.restaurantId || createCustomerDto.restaurantId;

    return this.customerService.createCustomer({
      ...createCustomerDto,
      restaurantId
    });
  }

  @Get()
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN, UserRole.EMPLOYEE)
  async getCustomers(
    @Query('search') search?: string,
    @Query('loyaltyTier') loyaltyTier?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req?: any
  ) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : req.user.employee?.restaurantId;

    return this.customerService.getCustomers(restaurantId, {
      search,
      loyaltyTier,
      isActive: isActive === 'true',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
  }

  @Get('search')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN, UserRole.EMPLOYEE)
  async searchCustomers(
    @Query() searchDto: CustomerSearchDto,
    @Request() req: any
  ) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : req.user.employee?.restaurantId;

    return this.customerService.searchCustomers(searchDto.query, restaurantId);
  }

  @Get('analytics')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async getCustomerAnalytics(@Request() req: any) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : undefined;

    return this.customerService.getCustomerAnalytics(restaurantId);
  }

  @Get(':id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN, UserRole.EMPLOYEE)
  async getCustomerById(@Param('id') id: string) {
    return this.customerService.getCustomerById(id);
  }

  @Patch(':id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN, UserRole.EMPLOYEE)
  async updateCustomer(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto
  ) {
    return this.customerService.updateCustomer(id, updateCustomerDto);
  }

  @Post('find-or-create')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN, UserRole.EMPLOYEE)
  async findOrCreateCustomer(
    @Body() customerData: CreateCustomerDto,
    @Request() req: any
  ) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : req.user.employee?.restaurantId;

    return this.customerService.findOrCreateCustomer({
      ...customerData,
      restaurantId
    });
  }

  @Post(':id/feedback')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN, UserRole.EMPLOYEE)
  async addCustomerFeedback(
    @Param('id') customerId: string,
    @Body() feedbackDto: CreateCustomerFeedbackDto,
    @Request() req: any
  ) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : req.user.employee?.restaurantId;

    return this.customerService.addCustomerFeedback({
      ...feedbackDto,
      customerId,
      restaurantId
    });
  }

  @Get('feedback/all')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async getCustomerFeedback(
    @Query('customerId') customerId?: string,
    @Query('rating') rating?: string,
    @Query('category') category?: string,
    @Query('isPublic') isPublic?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req?: any
  ) {
    const restaurantId = req.user.role === UserRole.RESTAURANT
      ? req.user.restaurant?.id
      : undefined;

    return this.customerService.getCustomerFeedback(restaurantId, {
      customerId,
      rating: rating ? parseInt(rating) : undefined,
      category,
      isPublic: isPublic === 'true',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
  }
}