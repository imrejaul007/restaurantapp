import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  UseGuards, 
  Req,
  Patch 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('branches')
@Controller('restaurants/:restaurantId/branches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESTAURANT, UserRole.ADMIN)
@ApiBearerAuth()
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create restaurant branch' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  async create(
    @Param('restaurantId') restaurantId: string,
    @Req() req: any,
    @Body() createBranchDto: CreateBranchDto,
  ) {
    return this.branchesService.create(restaurantId, req.user.id, createBranchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches for restaurant' })
  @ApiResponse({ status: 200, description: 'Branches retrieved successfully' })
  async findAll(@Param('restaurantId') restaurantId: string) {
    return this.branchesService.findAll(restaurantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  @ApiResponse({ status: 200, description: 'Branch retrieved' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update branch' })
  @ApiResponse({ status: 200, description: 'Branch updated successfully' })
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.branchesService.update(id, req.user.id, req.user.role, updateBranchDto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate branch' })
  @ApiResponse({ status: 200, description: 'Branch deactivated' })
  async deactivate(@Param('id') id: string, @Req() req: any) {
    return this.branchesService.deactivate(id, req.user.id, req.user.role);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate branch' })
  @ApiResponse({ status: 200, description: 'Branch activated' })
  async activate(@Param('id') id: string, @Req() req: any) {
    return this.branchesService.activate(id, req.user.id, req.user.role);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get branch statistics' })
  @ApiResponse({ status: 200, description: 'Branch stats retrieved' })
  async getStats(@Param('id') id: string) {
    return this.branchesService.getBranchStats(id);
  }
}