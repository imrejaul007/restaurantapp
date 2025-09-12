import { Controller, Get, Post, Delete, Query, Param, Body, UseGuards, Request } from '@nestjs/common';
import { NetworkingService } from './networking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// GroupType not available in Prisma client, using local type
type GroupType = 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';

@Controller('community/networking')
@UseGuards(JwtAuthGuard)
export class NetworkingController {
  constructor(private readonly networkingService: NetworkingService) {}

  // Following endpoints
  @Post('follow/:userId')
  async followUser(
    @Request() req: any,
    @Param('userId') userId: string,
  ) {
    return this.networkingService.followUser(req.user.id, userId);
  }

  @Delete('follow/:userId')
  async unfollowUser(
    @Request() req: any,
    @Param('userId') userId: string,
  ) {
    return this.networkingService.unfollowUser(req.user.id, userId);
  }

  @Get('followers/:userId?')
  async getUserFollowers(
    @Request() req: any,
    @Param('userId') targetUserId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = targetUserId || req.user.id;
    return this.networkingService.getUserFollowers(userId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('following/:userId?')
  async getUserFollowing(
    @Request() req: any,
    @Param('userId') targetUserId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = targetUserId || req.user.id;
    return this.networkingService.getUserFollowing(userId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('stats/:userId?')
  async getUserNetworkStats(
    @Request() req: any,
    @Param('userId') targetUserId?: string,
  ) {
    const userId = targetUserId || req.user.id;
    return this.networkingService.getUserNetworkStats(userId);
  }

  @Get('suggestions')
  async getSuggestedConnections(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    return this.networkingService.getSuggestedConnections(
      req.user.id,
      limit ? parseInt(limit) : 10,
    );
  }

  // Group endpoints
  @Post('groups')
  async createGroup(
    @Request() req: any,
    @Body() body: {
      name: string;
      description?: string;
      type: GroupType;
      isPrivate: boolean;
      city?: string;
      category?: string;
      rules?: string[];
      maxMembers?: number;
      icon?: string;
      banner?: string;
    },
  ) {
    return this.networkingService.createGroup(req.user.id, body);
  }

  @Get('groups')
  async getGroups(
    @Query('type') type?: GroupType,
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('isPrivate') isPrivate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.networkingService.getGroups({
      type,
      city,
      category,
      search,
      isPrivate: isPrivate ? isPrivate === 'true' : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('groups/:groupId')
  async getGroupDetails(
    @Request() req: any,
    @Param('groupId') groupId: string,
  ) {
    return this.networkingService.getGroupDetails(groupId, req.user.id);
  }

  @Post('groups/:groupId/join')
  async joinGroup(
    @Request() req: any,
    @Param('groupId') groupId: string,
  ) {
    return this.networkingService.joinGroup(req.user.id, groupId);
  }
}