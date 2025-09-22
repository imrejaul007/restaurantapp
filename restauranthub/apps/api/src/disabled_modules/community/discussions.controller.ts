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
import { DiscussionsService } from './discussions.service';

@ApiTags('discussions')
@Controller('discussions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get discussions' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Discussions retrieved successfully' })
  async getDiscussions(
    @Request() req: any,
    @Query('type') type?: 'private' | 'group' | 'public',
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'archived',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const discussions = await this.discussionsService.getAllDiscussions({
      type,
      search,
      status,
      userId: req.user.id,
    }, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Discussions retrieved successfully',
      data: discussions,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discussion by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Discussion retrieved successfully' })
  async getDiscussion(@Request() req: any, @Param('id') discussionId: string) {
    const discussion = await this.discussionsService.getDiscussionById(discussionId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Discussion retrieved successfully',
      data: discussion,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new discussion' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Discussion created successfully' })
  async createDiscussion(
    @Request() req: any,
    @Body('title') title: string,
    @Body('description') description?: string,
    @Body('type') type?: 'private' | 'group' | 'public',
    @Body('participantIds') participantIds?: string[],
    @Body('maxParticipants') maxParticipants?: number,
  ) {
    const discussion = await this.discussionsService.createDiscussion(req.user.id, {
      title,
      description,
      type: type || 'public',
      participantIds,
      maxParticipants,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Discussion created successfully',
      data: discussion,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update discussion' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Discussion updated successfully' })
  async updateDiscussion(
    @Request() req: any,
    @Param('id') discussionId: string,
    @Body('title') title?: string,
    @Body('description') description?: string,
    @Body('maxParticipants') maxParticipants?: number,
    @Body('isActive') isActive?: boolean,
  ) {
    const discussion = await this.discussionsService.updateDiscussion(req.user.id, discussionId, {
      title,
      description,
      maxParticipants,
      isActive,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Discussion updated successfully',
      data: discussion,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete discussion' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Discussion deleted successfully' })
  async deleteDiscussion(@Request() req: any, @Param('id') discussionId: string) {
    const result = await this.discussionsService.deleteDiscussion(req.user.id, discussionId);
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join discussion' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Joined discussion successfully' })
  async joinDiscussion(@Request() req: any, @Param('id') discussionId: string) {
    const participant = await this.discussionsService.joinDiscussion(req.user.id, discussionId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Joined discussion successfully',
      data: participant,
    };
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Leave discussion' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Left discussion successfully' })
  async leaveDiscussion(@Request() req: any, @Param('id') discussionId: string) {
    const result = await this.discussionsService.leaveDiscussion(req.user.id, discussionId);
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send message to discussion' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Message sent successfully' })
  async sendMessage(
    @Request() req: any,
    @Param('id') discussionId: string,
    @Body('content') content: string,
    @Body('type') type?: 'text' | 'image' | 'file',
    @Body('attachments') attachments?: any[],
  ) {
    const message = await this.discussionsService.sendMessage(req.user.id, discussionId, {
      content,
      type,
      attachments,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Message sent successfully',
      data: message,
    };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get discussion messages' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Messages retrieved successfully' })
  async getMessages(
    @Request() req: any,
    @Param('id') discussionId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    const messages = await this.discussionsService.getMessages(discussionId, {
      before,
    }, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Messages retrieved successfully',
      data: messages,
    };
  }
}