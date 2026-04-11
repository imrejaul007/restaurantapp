import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { KdsModule } from '../kds/kds.module';

/**
 * Orders Module
 *
 * Provides order management functionality:
 * - Order creation with validation
 * - Order status tracking with state machine
 * - Integration with REZ Backend for attribution and coin awards
 * - REZ Backend webhook notifications for order events
 * - KDS (Kitchen Display System) real-time broadcast on order creation
 */
@Module({
  imports: [PrismaModule, forwardRef(() => KdsModule)],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
