import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';

@Module({
  imports: [DatabaseModule, WebsocketModule],
  providers: [MessagingService, ConversationsService],
  controllers: [MessagingController, ConversationsController],
  exports: [MessagingService, ConversationsService],
})
export class MessagingModule {}