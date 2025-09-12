import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { PrismaModule } from '../../prisma/prisma.module';
// import { RedisModule } from '../../redis/redis.module'; // Temporarily disabled

@Module({
  imports: [ConfigModule, PrismaModule], // RedisModule temporarily disabled
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}