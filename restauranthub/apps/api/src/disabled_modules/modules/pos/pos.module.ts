import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebSocketModule],
  controllers: [PosController, TableController],
  providers: [PosService, TableService],
  exports: [PosService, TableService],
})
export class PosModule {}