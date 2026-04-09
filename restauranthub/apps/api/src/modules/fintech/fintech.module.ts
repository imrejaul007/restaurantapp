import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RezClientModule } from '@restauranthub/rez-client';
import { FintechController } from './fintech.controller';
import { FintechService } from './fintech.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    RezClientModule,
  ],
  controllers: [FintechController],
  providers: [FintechService],
  exports: [FintechService],
})
export class FintechModule {}
