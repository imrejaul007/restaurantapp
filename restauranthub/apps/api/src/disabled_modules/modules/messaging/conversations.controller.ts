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
import { ConversationsService } from './conversations.service';

@ApiTags('conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Conversations retrieved successfully' })
  async getUserConversations(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const conversations = await this.conversationsService.getUserConversations(req.user.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Conversations retrieved successfully',
      data: conversations,
    };
  }

  @Get('archived')
  @ApiOperation({ summary: 'Get archived conversations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Archived conversations retrieved successfully' })
  async getArchivedConversations(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const conversations = await this.conversationsService.getArchivedConversations(req.user.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Archived conversations retrieved successfully',
      data: conversations,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search conversations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results retrieved successfully' })
  async searchConversations(
    @Request() req: any,
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const results = await this.conversationsService.searchConversations(req.user.id, query, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Search results retrieved successfully',
      data: results,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Conversation retrieved successfully' })
  async getConversation(@Request() req: any, @Param('id') conversationId: string) {
    const conversation = await this.conversationsService.getConversation(req.user.id, conversationId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Conversation retrieved successfully',
      data: conversation,
    };
  }

  @Put(':id/archive')
  @ApiOperation({ summary: 'Archive conversation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Conversation archived successfully' })
  async archiveConversation(@Request() req: any, @Param('id') conversationId: string) {
    const result = await this.conversationsService.archiveConversation(req.user.id, conversationId);

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Put(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive conversation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Conversation unarchived successfully' })
  async unarchiveConversation(@Request() req: any, @Param('id') conversationId: string) {
    const result = await this.conversationsService.unarchiveConversation(req.user.id, conversationId);

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Put(':id/mute')
  @ApiOperation({ summary: 'Mute conversation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Conversation muted successfully' })
  async muteConversation(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Body('mutedUntil') mutedUntil?: string,
  ) {
    const result = await this.conversationsService.muteConversation(
      req.user.id,
      conversationId,
      mutedUntil ? new Date(mutedUntil) : undefined,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Put(':id/unmute')
  @ApiOperation({ summary: 'Unmute conversation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Conversation unmuted successfully' })
  async unmuteConversation(@Request() req: any, @Param('id') conversationId: string) {
    const result = await this.conversationsService.unmuteConversation(req.user.id, conversationId);

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update group conversation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Group conversation updated successfully' })
  async updateGroupConversation(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Body('name') name?: string,
    @Body('description') description?: string,
    @Body('avatar') avatar?: string,
  ) {
    const conversation = await this.conversationsService.updateGroupConversation(req.user.id, conversationId, {
      name,
      description,
      avatar,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Group conversation updated successfully',
      data: conversation,
    };
  }

  @Delete(':id/participants/:participantId')
  @ApiOperation({ summary: 'Remove participant from group' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Participant removed successfully' })
  async removeParticipant(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Param('participantId') participantId: string,
  ) {
    const result = await this.conversationsService.removeParticipant(req.user.id, conversationId, participantId);

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Put(':id/participants/:participantId/promote')
  @ApiOperation({ summary: 'Promote participant to admin' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Participant promoted successfully' })
  async promoteToAdmin(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Param('participantId') participantId: string,
  ) {
    const participant = await this.conversationsService.promoteToAdmin(req.user.id, conversationId, participantId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Participant promoted successfully',
      data: participant,
    };
  }

  @Put(':id/participants/:participantId/demote')
  @ApiOperation({ summary: 'Demote participant from admin' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Participant demoted successfully' })
  async demoteFromAdmin(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Param('participantId') participantId: string,
  ) {
    const participant = await this.conversationsService.demoteFromAdmin(req.user.id, conversationId, participantId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Participant demoted successfully',
      data: participant,
    };
  }
}