import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServiceRegistryService } from './service-registry.service';
import { ApiGatewayService } from './api-gateway.service';
import { ServiceMeshService } from './service-mesh.service';
import { MicroservicesController } from './microservices.controller';
import { AdvancedCacheModule } from '../cache/advanced-cache.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, AdvancedCacheModule, PrismaModule],
  providers: [ServiceRegistryService, ApiGatewayService, ServiceMeshService],
  controllers: [MicroservicesController],
  exports: [ServiceRegistryService, ApiGatewayService, ServiceMeshService],
})
export class MicroservicesModule {}