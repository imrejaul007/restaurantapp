import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Orders Module
 *
 * Provides order management functionality:
 * - Order creation with validation
 * - Order status tracking with state machine
 * - Integration with REZ Backend for attribution and coin awards
 * - REZ Backend webhook notifications for order events
 */
@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
