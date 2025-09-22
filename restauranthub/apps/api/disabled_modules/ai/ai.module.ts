import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { ChatbotService } from './chatbot.service';
import { AIController } from './ai.controller';
import { AdvancedCacheModule } from '../cache/advanced-cache.module';

@Module({
  imports: [ConfigModule, AdvancedCacheModule],
  providers: [AIService, ChatbotService],
  controllers: [AIController],
  exports: [AIService, ChatbotService],
})
export class AIModule {}