import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { EmailController } from './email.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    // BullModule.registerQueue({
    //   name: 'email',
    //   redis: {
    //     host: process.env.REDIS_HOST || 'localhost',
    //     port: parseInt(process.env.REDIS_PORT || '6379'),
    //     password: process.env.REDIS_PASSWORD || undefined,
    //   },
    // }), // Temporarily disabled
  ],
  providers: [EmailService], // Removed EmailProcessor temporarily
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}