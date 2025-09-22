import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
// import { CartService } from './cart.service';
// import { CartController } from './cart.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebsocketModule],
  providers: [OrdersService /* CartService */],
  controllers: [OrdersController /* CartController */],
  exports: [OrdersService /* CartService */],
})
export class OrdersModule {}