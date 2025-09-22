import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdvancedCacheService } from './advanced-cache.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('cache')
@Controller('api/v1/cache')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CacheController {
  constructor(private readonly cacheService: AdvancedCacheService) {}

  @Get('stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics and performance metrics' })
  getStats() {
    return this.cacheService.getStats();
  }

  @Get('info')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get cache information' })
  @ApiResponse({ status: 200, description: 'Cache configuration and status' })
  async getInfo() {
    return await this.cacheService.getInfo();
  }

  @Delete('flush')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Flush all cache' })
  @ApiResponse({ status: 200, description: 'Cache flushed successfully' })
  async flushAll() {
    await this.cacheService.flush();
    return { message: 'Cache flushed successfully' };
  }

  @Delete('flush/:namespace')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Flush cache by namespace' })
  @ApiResponse({ status: 200, description: 'Namespace cache flushed successfully' })
  async flushNamespace(@Param('namespace') namespace: string) {
    await this.cacheService.flush(namespace);
    return { message: `Cache namespace '${namespace}' flushed successfully` };
  }
}