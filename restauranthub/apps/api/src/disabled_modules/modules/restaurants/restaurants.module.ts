import { Module } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RestaurantsService, BranchesService],
  controllers: [RestaurantsController, BranchesController],
  exports: [RestaurantsService, BranchesService],
})
export class RestaurantsModule {}