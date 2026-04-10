import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReservationsService } from './reservations.service';
import {
  CreateTableDto,
  UpdateTableDto,
  CreateReservationDto,
  UpdateReservationDto,
  ReservationsQueryDto,
} from './reservations.dto';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  private readonly logger = new Logger(ReservationsController.name);

  constructor(private readonly reservationsService: ReservationsService) {}

  private getRestaurantId(req: any): string {
    const restaurantId = req?.user?.restaurantId;
    if (!restaurantId) {
      throw new ForbiddenException('User does not have an associated restaurant');
    }
    return restaurantId;
  }

  // ── Tables ─────────────────────────────────────────────────────────────────

  @Get('tables')
  async getTables(@Request() req: any) {
    const restaurantId = this.getRestaurantId(req);
    this.logger.log(`Fetching tables for restaurant ${restaurantId}`);
    return this.reservationsService.getTables(restaurantId);
  }

  @Post('tables')
  @HttpCode(HttpStatus.CREATED)
  async createTable(@Body() dto: CreateTableDto, @Request() req: any) {
    const restaurantId = this.getRestaurantId(req);
    this.logger.log(`Creating table for restaurant ${restaurantId}`);
    return this.reservationsService.createTable(dto, restaurantId);
  }

  @Patch('tables/:id')
  async updateTable(
    @Param('id') id: string,
    @Body() dto: UpdateTableDto,
    @Request() req: any,
  ) {
    const restaurantId = this.getRestaurantId(req);
    this.logger.log(`Updating table ${id} for restaurant ${restaurantId}`);
    return this.reservationsService.updateTable(id, dto, restaurantId);
  }

  @Delete('tables/:id')
  async deleteTable(@Param('id') id: string, @Request() req: any) {
    const restaurantId = this.getRestaurantId(req);
    this.logger.log(`Deleting table ${id} for restaurant ${restaurantId}`);
    return this.reservationsService.deleteTable(id, restaurantId);
  }

  // ── Reservations ──────────────────────────────────────────────────────────

  @Get()
  async getReservations(@Query() query: ReservationsQueryDto, @Request() req: any) {
    const restaurantId = this.getRestaurantId(req);
    this.logger.log(`Fetching reservations for restaurant ${restaurantId}`);
    return this.reservationsService.getReservations(restaurantId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReservation(@Body() dto: CreateReservationDto, @Request() req: any) {
    const restaurantId = this.getRestaurantId(req);
    this.logger.log(`Creating reservation for restaurant ${restaurantId}`);
    return this.reservationsService.createReservation(dto, restaurantId);
  }

  @Get(':id')
  async getReservation(@Param('id') id: string, @Request() req: any) {
    const restaurantId = this.getRestaurantId(req);
    return this.reservationsService.getReservation(id, restaurantId);
  }

  @Patch(':id')
  async updateReservation(
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
    @Request() req: any,
  ) {
    const restaurantId = this.getRestaurantId(req);
    this.logger.log(`Updating reservation ${id} for restaurant ${restaurantId}`);
    return this.reservationsService.updateReservation(id, dto, restaurantId);
  }

  @Delete(':id')
  async cancelReservation(@Param('id') id: string, @Request() req: any) {
    const restaurantId = this.getRestaurantId(req);
    this.logger.log(`Cancelling reservation ${id} for restaurant ${restaurantId}`);
    return this.reservationsService.cancelReservation(id, restaurantId);
  }
}
