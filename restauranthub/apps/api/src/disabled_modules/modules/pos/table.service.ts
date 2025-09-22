import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateTableData {
  restaurantId: string;
  branchId?: string;
  tableNumber: string;
  capacity: number;
}

export interface CreateReservationData {
  tableId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  reservationTime: Date;
  notes?: string;
}

@Injectable()
export class TableService {
  private readonly logger = new Logger(TableService.name);

  constructor(private prisma: PrismaService) {}

  async createTable(tableData: CreateTableData) {
    this.logger.log(`Creating table ${tableData.tableNumber} for restaurant: ${tableData.restaurantId}`);

    // Check if table number already exists for this restaurant
    const existingTable = await this.prisma.table.findFirst({
      where: {
        restaurantId: tableData.restaurantId,
        tableNumber: tableData.tableNumber,
        isActive: true
      }
    });

    if (existingTable) {
      throw new BadRequestException(`Table ${tableData.tableNumber} already exists`);
    }

    // Generate QR code string (in real implementation, this would be a proper QR code)
    const qrCode = `TABLE-${tableData.restaurantId}-${tableData.tableNumber}-${Date.now()}`;

    return this.prisma.table.create({
      data: {
        ...tableData,
        qrCode
      }
    });
  }

  async getTables(restaurantId: string, branchId?: string) {
    const where: any = {
      restaurantId,
      isActive: true
    };

    if (branchId) {
      where.branchId = branchId;
    }

    return this.prisma.table.findMany({
      where,
      include: {
        reservations: {
          where: {
            status: { in: ['confirmed', 'arrived'] },
            reservationTime: {
              gte: new Date(),
              lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
            }
          },
          orderBy: { reservationTime: 'asc' },
          take: 1
        },
        orders: {
          where: { status: { in: ['pending', 'confirmed', 'preparing', 'ready'] } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { tableNumber: 'asc' }
    });
  }

  async getTableById(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        reservations: {
          where: { status: { not: 'cancelled' } },
          orderBy: { reservationTime: 'asc' }
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return table;
  }

  async updateTable(id: string, data: Partial<CreateTableData>) {
    const table = await this.prisma.table.findUnique({
      where: { id }
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    // Check for duplicate table number if updating
    if (data.tableNumber && data.tableNumber !== table.tableNumber) {
      const existingTable = await this.prisma.table.findFirst({
        where: {
          restaurantId: table.restaurantId,
          tableNumber: data.tableNumber,
          isActive: true,
          id: { not: id }
        }
      });

      if (existingTable) {
        throw new BadRequestException(`Table ${data.tableNumber} already exists`);
      }
    }

    return this.prisma.table.update({
      where: { id },
      data
    });
  }

  async updateTableStatus(id: string, status: string) {
    const table = await this.prisma.table.findUnique({
      where: { id }
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return this.prisma.table.update({
      where: { id },
      data: { status }
    });
  }

  async deleteTable(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        reservations: { where: { status: { in: ['confirmed', 'arrived'] } } },
        orders: { where: { status: { in: ['pending', 'confirmed', 'preparing'] } } }
      }
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.reservations.length > 0 || table.orders.length > 0) {
      throw new BadRequestException('Cannot delete table with active reservations or orders');
    }

    return this.prisma.table.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async createReservation(reservationData: CreateReservationData) {
    this.logger.log(`Creating reservation for table: ${reservationData.tableId}`);

    const table = await this.prisma.table.findUnique({
      where: { id: reservationData.tableId }
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.capacity < reservationData.partySize) {
      throw new BadRequestException(`Table capacity (${table.capacity}) is less than party size (${reservationData.partySize})`);
    }

    // Check for conflicting reservations (within 2 hours)
    const conflictStart = new Date(reservationData.reservationTime.getTime() - 2 * 60 * 60 * 1000);
    const conflictEnd = new Date(reservationData.reservationTime.getTime() + 2 * 60 * 60 * 1000);

    const conflictingReservations = await this.prisma.tableReservation.findMany({
      where: {
        tableId: reservationData.tableId,
        status: { in: ['confirmed', 'arrived'] },
        reservationTime: {
          gte: conflictStart,
          lte: conflictEnd
        }
      }
    });

    if (conflictingReservations.length > 0) {
      throw new BadRequestException('Table is already reserved for this time slot');
    }

    return this.prisma.tableReservation.create({
      data: reservationData,
      include: {
        table: { select: { tableNumber: true, capacity: true } }
      }
    });
  }

  async getReservations(restaurantId: string, filters: {
    date?: Date;
    status?: string;
    tableId?: string;
  }) {
    const { date, status, tableId } = filters;

    const where: any = {
      table: { restaurantId }
    };

    if (status) where.status = status;
    if (tableId) where.tableId = tableId;

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.reservationTime = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    return this.prisma.tableReservation.findMany({
      where,
      include: {
        table: { select: { tableNumber: true, capacity: true } },
        customer: { select: { firstName: true, lastName: true } }
      },
      orderBy: { reservationTime: 'asc' }
    });
  }

  async updateReservationStatus(id: string, status: string) {
    const reservation = await this.prisma.tableReservation.findUnique({
      where: { id },
      include: { table: true }
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const updatedReservation = await this.prisma.tableReservation.update({
      where: { id },
      data: { status }
    });

    // Update table status based on reservation status
    if (status === 'arrived' && reservation.table.status === 'available') {
      await this.prisma.table.update({
        where: { id: reservation.tableId },
        data: { status: 'occupied' }
      });
    } else if (['completed', 'cancelled', 'no_show'].includes(status)) {
      // Check if there are other active reservations or orders before freeing table
      const activeReservations = await this.prisma.tableReservation.count({
        where: {
          tableId: reservation.tableId,
          status: { in: ['confirmed', 'arrived'] },
          id: { not: id }
        }
      });

      const activeOrders = await this.prisma.posOrder.count({
        where: {
          tableId: reservation.tableId,
          status: { in: ['pending', 'confirmed', 'preparing', 'ready'] }
        }
      });

      if (activeReservations === 0 && activeOrders === 0) {
        await this.prisma.table.update({
          where: { id: reservation.tableId },
          data: { status: 'available' }
        });
      }
    }

    this.logger.log(`Reservation ${id} status updated to ${status}`);
    return updatedReservation;
  }

  async cancelReservation(id: string, reason?: string) {
    return this.updateReservationStatus(id, 'cancelled');
  }

  async getTableLayout(restaurantId: string, branchId?: string) {
    const tables = await this.getTables(restaurantId, branchId);

    // Group tables by status for layout display
    const layout = {
      available: tables.filter(t => t.status === 'available'),
      occupied: tables.filter(t => t.status === 'occupied'),
      reserved: tables.filter(t => t.status === 'reserved'),
      cleaning: tables.filter(t => t.status === 'cleaning'),
      outOfOrder: tables.filter(t => !t.isActive)
    };

    return {
      tables: layout,
      summary: {
        total: tables.length,
        available: layout.available.length,
        occupied: layout.occupied.length,
        reserved: layout.reserved.length,
        cleaning: layout.cleaning.length,
        outOfOrder: layout.outOfOrder.length
      }
    };
  }

  async generateQRCode(tableId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId }
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    // In a real implementation, this would generate an actual QR code image
    // For now, return the QR code string and a URL
    const qrCodeUrl = `${process.env.FRONTEND_URL}/menu?table=${table.qrCode}`;

    return {
      qrCode: table.qrCode,
      qrCodeUrl,
      tableNumber: table.tableNumber
    };
  }
}