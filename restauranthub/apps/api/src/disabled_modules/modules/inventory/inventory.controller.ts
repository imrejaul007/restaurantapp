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
  BadRequestException,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, StockMovementType } from '@prisma/client';
import { CreateStockMovementDto, BulkStockUpdateDto, CreateInventoryBatchDto } from './dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('stock-movement')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async recordStockMovement(
    @Body() createStockMovementDto: CreateStockMovementDto,
    @Request() req: any
  ) {
    return this.inventoryService.recordStockMovement(createStockMovementDto, req.user.id);
  }

  @Post('bulk-stock-update')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async bulkUpdateStock(
    @Body() bulkStockUpdateDto: BulkStockUpdateDto,
    @Request() req: any
  ) {
    return this.inventoryService.bulkUpdateStock(bulkStockUpdateDto.updates, req.user.id);
  }

  @Get('alerts')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async getInventoryAlerts(@Request() req: any) {
    const restaurantId = req.user.role === UserRole.RESTAURANT ? req.user.restaurant?.id : undefined;
    return this.inventoryService.getInventoryAlerts(restaurantId);
  }

  @Post('auto-reorders')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async generateAutomaticReorders(@Request() req: any) {
    const restaurantId = req.user.role === UserRole.RESTAURANT ? req.user.restaurant?.id : undefined;
    return this.inventoryService.generateAutomaticReorders(restaurantId);
  }

  @Get('report')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async getInventoryReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('supplierId') supplierId?: string,
    @Query('movementType') movementType?: StockMovementType,
    @Request() req?: any
  ) {
    const restaurantId = req.user.role === UserRole.RESTAURANT ? req.user.restaurant?.id : undefined;

    return this.inventoryService.getInventoryReport({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      supplierId,
      movementType,
      restaurantId
    });
  }

  @Post('batches')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async addInventoryBatch(@Body() createInventoryBatchDto: CreateInventoryBatchDto) {
    return this.inventoryService.addInventoryBatch(createInventoryBatchDto);
  }

  @Get('expiring-batches')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async getExpiringBatches(
    @Query('days') days?: string,
    @Request() req?: any
  ) {
    const restaurantId = req.user.role === UserRole.RESTAURANT ? req.user.restaurant?.id : undefined;
    return this.inventoryService.getExpiringBatches(
      days ? parseInt(days) : 30,
      restaurantId
    );
  }
}