import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { VerificationGuard } from './guards/verification.guard';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VerificationService, VerificationGuard],
  controllers: [VerificationController],
  exports: [VerificationService, VerificationGuard],
})
export class VerificationModule {}