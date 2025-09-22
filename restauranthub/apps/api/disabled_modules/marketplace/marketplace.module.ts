import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LoggingModule } from '../logging/logging.module';
// import { SearchModule } from '../search/search.module'; // Temporarily disabled
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [DatabaseModule, LoggingModule], // SearchModule temporarily disabled
  providers: [MarketplaceService, ProductsService, CategoriesService],
  controllers: [MarketplaceController, ProductsController, CategoriesController],
  exports: [MarketplaceService, ProductsService, CategoriesService],
})
export class MarketplaceModule {}