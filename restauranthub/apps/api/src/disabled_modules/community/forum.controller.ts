import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ForumService } from './forum.service';
import { UserRole } from '@prisma/client';
import { CreateForumDto, UpdateForumDto } from './dto/create-forum.dto';

@ApiTags('forums')
@Controller('forums')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get()
  @ApiOperation({ summary: 'Get all forums' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Forums retrieved successfully' })
  async getForums(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const forums = await this.forumService.getForums();

    return {
      statusCode: HttpStatus.OK,
      message: 'Forums retrieved successfully',
      data: forums,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get forum by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Forum retrieved successfully' })
  async getForum(@Request() req: any, @Param('id') forumId: string) {
    const forum = await this.forumService.getForum(forumId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Forum retrieved successfully',
      data: forum,
    };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Create new forum' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Forum created successfully' })
  async createForum(
    @Request() req: any,
    @Body() createForumDto: CreateForumDto,
  ) {
    const forum = await this.forumService.createForum(req.user.id, createForumDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Forum created successfully',
      data: forum,
    };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Update forum' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Forum updated successfully' })
  async updateForum(
    @Request() req: any,
    @Param('id') forumId: string,
    @Body() updateForumDto: UpdateForumDto,
  ) {
    const forum = await this.forumService.updateForum(req.user.id, forumId, updateForumDto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Forum updated successfully',
      data: forum,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete forum' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Forum deleted successfully' })
  async deleteForum(@Request() req: any, @Param('id') forumId: string) {
    const result = await this.forumService.deleteForum(req.user.id, forumId);
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join forum' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Joined forum successfully' })
  async joinForum(@Request() req: any, @Param('id') forumId: string) {
    const membership = await this.forumService.joinForum(req.user.id, forumId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Joined forum successfully',
      data: membership,
    };
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Leave forum' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Left forum successfully' })
  async leaveForum(@Request() req: any, @Param('id') forumId: string) {
    const result = await this.forumService.leaveForum(req.user.id, forumId);
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get forum members' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Forum members retrieved successfully' })
  async getForumMembers(
    @Param('id') forumId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const members = await this.forumService.getForumMembers(forumId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Forum members retrieved successfully',
      data: members,
    };
  }

  @Post(':id/moderators')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Add forum moderator' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Moderator added successfully' })
  async addModerator(
    @Request() req: any,
    @Param('id') forumId: string,
    @Body('userId') userId: string,
    @Body('permissions') permissions: string[],
  ) {
    const moderator = await this.forumService.addModerator(req.user.id, forumId, userId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Moderator added successfully',
      data: moderator,
    };
  }

  @Delete(':id/moderators/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Remove forum moderator' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Moderator removed successfully' })
  async removeModerator(
    @Request() req: any,
    @Param('id') forumId: string,
    @Param('userId') userId: string,
  ) {
    const result = await this.forumService.removeModerator(req.user.id, forumId, userId);
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}