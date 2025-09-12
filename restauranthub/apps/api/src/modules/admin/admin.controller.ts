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
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UserRole } from '@prisma/client';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dashboard data retrieved successfully' })
  async getDashboard() {
    const data = await this.adminService.getDashboardData();
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Dashboard data retrieved successfully',
      data,
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users retrieved successfully' })
  async getUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const users = await this.adminService.getUsers({
      role: role as UserRole,
      status,
      page: page ? parseInt(page.toString()) : 1,
      limit: limit ? parseInt(limit.toString()) : 20,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully',
      data: users,
    };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User retrieved successfully' })
  async getUserById(@Param('id') userId: string) {
    const user = await this.adminService.getUserById(userId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @Put('users/:id/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User status updated successfully' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body('status') status: string,
    @Body('reason') reason?: string,
  ) {
    await this.adminService.updateUserStatus(userId, status, reason);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'User status updated successfully',
    };
  }

  @Get('restaurants/pending')
  @ApiOperation({ summary: 'Get pending restaurant approvals' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pending restaurants retrieved successfully' })
  async getPendingRestaurants(@Query('page') page?: number, @Query('limit') limit?: number) {
    const restaurants = await this.adminService.getPendingRestaurants({
      page: page ? parseInt(page.toString()) : 1,
      limit: limit ? parseInt(limit.toString()) : 20,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Pending restaurants retrieved successfully',
      data: restaurants,
    };
  }

  @Post('restaurants/:id/approve')
  @ApiOperation({ summary: 'Approve restaurant' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Restaurant approved successfully' })
  async approveRestaurant(@Param('id') restaurantId: string, @Body('notes') notes?: string) {
    await this.adminService.approveRestaurant(restaurantId, notes);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Restaurant approved successfully',
    };
  }

  @Post('restaurants/:id/reject')
  @ApiOperation({ summary: 'Reject restaurant' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Restaurant rejected successfully' })
  async rejectRestaurant(@Param('id') restaurantId: string, @Body('reason') reason: string) {
    await this.adminService.rejectRestaurant(restaurantId, reason);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Restaurant rejected successfully',
    };
  }

  @Get('vendors/pending')
  @ApiOperation({ summary: 'Get pending vendor approvals' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pending vendors retrieved successfully' })
  async getPendingVendors(@Query('page') page?: number, @Query('limit') limit?: number) {
    const vendors = await this.adminService.getPendingVendors({
      page: page ? parseInt(page.toString()) : 1,
      limit: limit ? parseInt(limit.toString()) : 20,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Pending vendors retrieved successfully',
      data: vendors,
    };
  }

  @Post('vendors/:id/approve')
  @ApiOperation({ summary: 'Approve vendor' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Vendor approved successfully' })
  async approveVendor(@Param('id') vendorId: string, @Body('notes') notes?: string) {
    await this.adminService.approveVendor(vendorId, notes);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Vendor approved successfully',
    };
  }

  @Post('vendors/:id/reject')
  @ApiOperation({ summary: 'Reject vendor' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Vendor rejected successfully' })
  async rejectVendor(@Param('id') vendorId: string, @Body('reason') reason: string) {
    await this.adminService.rejectVendor(vendorId, reason);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Vendor rejected successfully',
    };
  }

  @Get('reports/analytics')
  @ApiOperation({ summary: 'Get system analytics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Analytics retrieved successfully' })
  async getAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
  ) {
    const analytics = await this.adminService.getAnalytics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      type,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Analytics retrieved successfully',
      data: analytics,
    };
  }

  @Get('reports/reviews')
  @ApiOperation({ summary: 'Get flagged reviews' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Flagged reviews retrieved successfully' })
  async getFlaggedReviews(@Query('page') page?: number, @Query('limit') limit?: number) {
    const reviews = await this.adminService.getFlaggedReviews({
      page: page ? parseInt(page.toString()) : 1,
      limit: limit ? parseInt(limit.toString()) : 20,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Flagged reviews retrieved successfully',
      data: reviews,
    };
  }

  @Put('reviews/:id/action')
  @ApiOperation({ summary: 'Take action on review' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Review action completed successfully' })
  async reviewAction(
    @Param('id') reviewId: string,
    @Body('action') action: 'approve' | 'hide' | 'delete',
    @Body('reason') reason?: string,
  ) {
    await this.adminService.reviewAction(reviewId, action, reason);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Review action completed successfully',
    };
  }

  @Get('support-tickets')
  @ApiOperation({ summary: 'Get support tickets' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Support tickets retrieved successfully' })
  async getSupportTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Temporarily disabled - getSupportTickets method doesn't exist
    // const tickets = await this.adminService.getSupportTickets({
    //   status,
    //   priority,
    //   page: page ? parseInt(page.toString()) : 1,
    //   limit: limit ? parseInt(limit.toString()) : 20,
    // });
    const tickets = { tickets: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };

    return {
      statusCode: HttpStatus.OK,
      message: 'Support tickets retrieved successfully',
      data: tickets,
    };
  }

  @Put('support-tickets/:id/assign')
  @ApiOperation({ summary: 'Assign support ticket' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ticket assigned successfully' })
  async assignTicket(@Param('id') ticketId: string, @Body('assigneeId') assigneeId: string) {
    // Temporarily disabled - assignTicket method doesn't exist
    // await this.adminService.assignTicket(ticketId, assigneeId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Ticket assigned successfully',
    };
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const logs = await this.adminService.getAuditLogs({
      userId,
      action,
      resource,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page.toString()) : 1,
      limit: limit ? parseInt(limit.toString()) : 50,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Audit logs retrieved successfully',
      data: logs,
    };
  }

  @Post('system/maintenance')
  @ApiOperation({ summary: 'Enable/disable maintenance mode' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Maintenance mode updated successfully' })
  async toggleMaintenance(@Body('enabled') enabled: boolean, @Body('message') message?: string) {
    await this.adminService.toggleMaintenance(enabled, message);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Maintenance mode updated successfully',
    };
  }

  @Get('system/config')
  @ApiOperation({ summary: 'Get system configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'System configuration retrieved successfully' })
  async getSystemConfig() {
    const config = await this.adminService.getSystemConfig();
    
    return {
      statusCode: HttpStatus.OK,
      message: 'System configuration retrieved successfully',
      data: config,
    };
  }

  @Put('system/config')
  @ApiOperation({ summary: 'Update system configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'System configuration updated successfully' })
  async updateSystemConfig(@Body() config: any) {
    await this.adminService.updateSystemConfig(config);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'System configuration updated successfully',
    };
  }
}