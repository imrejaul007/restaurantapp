import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerController, LoyaltyController],
  providers: [CustomerService, LoyaltyService],
  exports: [CustomerService, LoyaltyService],
})
export class CustomerModule {}