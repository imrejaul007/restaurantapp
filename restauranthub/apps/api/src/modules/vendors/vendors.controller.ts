import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VendorsService } from './vendors.service';
import { UserRole } from '@prisma/client';

@ApiTags('vendors')
@Controller('vendors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Create vendor profile' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Vendor profile created successfully' })
  async create(@Request() req: any, @Body() createVendorDto: any) {
    const vendor = await this.vendorsService.create(req.user.id, createVendorDto);
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Vendor profile created successfully',
      data: vendor,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all vendors' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Vendors retrieved successfully' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('businessType') businessType?: string,
    @Query('verificationStatus') verificationStatus?: string,
  ) {
    const result = await this.vendorsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      {
        businessType,
        verificationStatus,
      }
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Vendors retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Vendor retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const vendor = await this.vendorsService.findOne(id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Vendor retrieved successfully',
      data: vendor,
    };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update vendor profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Vendor profile updated successfully' })
  async update(@Request() req: any, @Param('id') id: string, @Body() updateVendorDto: any) {
    const vendor = await this.vendorsService.update(id, req.user.id, req.user.role, updateVendorDto);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Vendor profile updated successfully',
      data: vendor,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete vendor profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Vendor profile deleted successfully' })
  async remove(@Request() req: any, @Param('id') id: string) {
    await this.vendorsService.remove(req.user.id, id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Vendor profile deleted successfully',
    };
  }

  @Get(':id/analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Get vendor analytics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Vendor analytics retrieved successfully' })
  async getAnalytics(@Request() req: any, @Param('id') id: string) {
    const analytics = await this.vendorsService.getAnalytics(req.user.id, id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Vendor analytics retrieved successfully',
      data: analytics,
    };
  }

  @Put(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Verify vendor profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Vendor profile verified successfully' })
  async verify(@Request() req: any, @Param('id') id: string) {
    const vendor = await this.vendorsService.verify(req.user.id, id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Vendor profile verified successfully',
      data: vendor,
    };
  }

  @Put(':id/suspend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Suspend vendor profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Vendor profile suspended successfully' })
  async suspend(@Request() req: any, @Param('id') id: string) {
    const vendor = await this.vendorsService.suspend(req.user.id, id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Vendor profile suspended successfully',
      data: vendor,
    };
  }
}