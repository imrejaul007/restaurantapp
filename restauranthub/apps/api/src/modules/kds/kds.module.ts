import { Module, forwardRef } from '@nestjs/common';
import { KdsGateway } from './kds.gateway';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    forwardRef(() => OrdersModule),
  ],
  providers: [KdsGateway],
  exports: [KdsGateway],
})
export class KdsModule {}
