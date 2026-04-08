import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RezClientModule } from '../../../../../packages/rez-client/src/rez-client.module';
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
