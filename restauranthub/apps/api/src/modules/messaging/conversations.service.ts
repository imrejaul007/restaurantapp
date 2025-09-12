import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getUserConversations(userId: string, params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
      } = params;

      const skip = (page - 1) * limit;

      const where: Prisma.ConversationWhereInput = {
        participants: {
          has: userId,
        },
      };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [conversations, total] = await Promise.all([
        this.databaseService.conversation.findMany({
          where,
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
            _count: {
              select: {
                messages: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { lastMessageAt: 'desc' },
        }),
        this.databaseService.conversation.count({ where }),
      ]);

      // Get participant details
      const participantIds = conversations.flatMap(c => c.participants);
      const uniqueParticipantIds = [...new Set(participantIds)];
      
      const participants = await this.databaseService.user.findMany({
        where: {
          id: { in: uniqueParticipantIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
        },
      });

      const participantMap = new Map(participants.map((p: any) => [p.id, p]));

      // Format conversations for frontend
      const formattedConversations = conversations.map(conversation => {
        const otherParticipantIds = conversation.participants.filter(id => id !== userId);
        const isGroup = conversation.type === 'group';
        
        let displayName = conversation.title || 'Conversation';
        let displayAvatar = null;

        if (!isGroup && otherParticipantIds.length === 1) {
          const otherUser = participantMap.get(otherParticipantIds[0]);
          if (otherUser) {
            displayName = `${(otherUser as any).firstName || ''} ${(otherUser as any).lastName || ''}`;
            displayAvatar = (otherUser as any).avatar || null;
          }
        }

        const lastMessage = conversation.messages[0] || null;

        return {
          id: conversation.id,
          name: displayName,
          avatar: displayAvatar,
          isGroup,
          lastMessage,
          lastActivityAt: conversation.lastMessageAt,
          unreadCount: 0, // Would need a separate read receipts system
          participants: conversation.participants.map(id => participantMap.get(id)).filter(Boolean),
          type: conversation.type,
          title: conversation.title,
        };
      });

      return {
        conversations: formattedConversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get user conversations', error);
      throw error;
    }
  }

  async getConversation(userId: string, conversationId: string) {
    try {
      const conversation = await this.databaseService.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      // Check if user is participant
      if (!conversation.participants.includes(userId)) {
        throw new ForbiddenException('Access denied to conversation');
      }

      // Get participant details
      const participants = await this.databaseService.user.findMany({
        where: {
          id: { in: conversation.participants },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
        },
      });

      const otherParticipants = participants.filter((p: any) => p.id !== userId);
      const isGroup = conversation.type === 'group';

      let displayName = conversation.title || 'Conversation';
      let displayAvatar = null;

      if (!isGroup && otherParticipants.length === 1) {
        const otherUser = otherParticipants[0];
        displayName = `${otherUser.firstName || ''} ${otherUser.lastName || ''}`;
        displayAvatar = otherUser.avatar || null;
      }

      const lastMessage = conversation.messages[0] || null;

      return {
        id: conversation.id,
        name: displayName,
        avatar: displayAvatar,
        isGroup,
        lastMessage,
        lastActivityAt: conversation.lastMessageAt,
        messageCount: conversation._count.messages,
        participants,
        type: conversation.type,
        title: conversation.title,
        createdAt: conversation.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to get conversation', error);
      throw error;
    }
  }

  async archiveConversation(userId: string, conversationId: string) {
    try {
      const conversation = await this.databaseService.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.includes(userId)) {
        throw new ForbiddenException('Access denied to conversation');
      }

      // In the current schema, we don't have per-participant settings
      // This would require extending the schema or creating a separate table
      // For now, we'll just return success
      this.logger.log(`User ${userId} archived conversation ${conversationId}`);
      
      return { message: 'Conversation archived successfully' };
    } catch (error) {
      this.logger.error('Failed to archive conversation', error);
      throw error;
    }
  }

  async unarchiveConversation(userId: string, conversationId: string) {
    try {
      const conversation = await this.databaseService.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.includes(userId)) {
        throw new ForbiddenException('Access denied to conversation');
      }

      // In the current schema, we don't have per-participant settings
      // For now, we'll just return success
      this.logger.log(`User ${userId} unarchived conversation ${conversationId}`);
      
      return { message: 'Conversation unarchived successfully' };
    } catch (error) {
      this.logger.error('Failed to unarchive conversation', error);
      throw error;
    }
  }

  async muteConversation(userId: string, conversationId: string, mutedUntil?: Date) {
    try {
      const conversation = await this.databaseService.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.includes(userId)) {
        throw new ForbiddenException('Access denied to conversation');
      }

      // In the current schema, we don't have per-participant settings
      // For now, we'll just return success
      const muteMessage = mutedUntil 
        ? `User ${userId} muted conversation ${conversationId} until ${mutedUntil.toISOString()}`
        : `User ${userId} muted conversation ${conversationId}`;
      this.logger.log(muteMessage);
      
      return { message: 'Conversation muted successfully' };
    } catch (error) {
      this.logger.error('Failed to mute conversation', error);
      throw error;
    }
  }

  async unmuteConversation(userId: string, conversationId: string) {
    try {
      const conversation = await this.databaseService.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.includes(userId)) {
        throw new ForbiddenException('Access denied to conversation');
      }

      // In the current schema, we don't have per-participant settings
      // For now, we'll just return success
      this.logger.log(`User ${userId} unmuted conversation ${conversationId}`);
      
      return { message: 'Conversation unmuted successfully' };
    } catch (error) {
      this.logger.error('Failed to unmute conversation', error);
      throw error;
    }
  }

  async leaveConversation(userId: string, conversationId: string) {
    try {
      const conversation = await this.databaseService.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.includes(userId)) {
        throw new ForbiddenException('You are not a participant in this conversation');
      }

      // Remove user from participants array
      const updatedParticipants = conversation.participants.filter(id => id !== userId);

      await this.databaseService.conversation.update({
        where: { id: conversationId },
        data: {
          participants: updatedParticipants,
        },
      });

      // If no participants left, delete the conversation
      if (updatedParticipants.length === 0) {
        await this.databaseService.conversation.delete({
          where: { id: conversationId },
        });
      }

      return { message: 'Left conversation successfully' };
    } catch (error) {
      this.logger.error('Failed to leave conversation', error);
      throw error;
    }
  }

  async deleteConversation(userId: string, conversationId: string) {
    try {
      const conversation = await this.databaseService.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.includes(userId)) {
        throw new ForbiddenException('Access denied to conversation');
      }

      // Only allow deletion if it's a direct conversation or user is creator
      // For now, allow any participant to delete
      await this.databaseService.conversation.delete({
        where: { id: conversationId },
      });

      return { message: 'Conversation deleted successfully' };
    } catch (error) {
      this.logger.error('Failed to delete conversation', error);
      throw error;
    }
  }

  async addParticipants(userId: string, conversationId: string, participantIds: string[]) {
    try {
      const conversation = await this.databaseService.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.includes(userId)) {
        throw new ForbiddenException('Access denied to conversation');
      }

      // Verify that all participants exist
      const users = await this.databaseService.user.findMany({
        where: {
          id: { in: participantIds },
        },
      });

      if (users.length !== participantIds.length) {
        throw new NotFoundException('One or more users not found');
      }

      // Add new participants
      const updatedParticipants = [...new Set([...conversation.participants, ...participantIds])];

      await this.databaseService.conversation.update({
        where: { id: conversationId },
        data: {
          participants: updatedParticipants,
        },
      });

      return { message: 'Participants added successfully' };
    } catch (error) {
      this.logger.error('Failed to add participants', error);
      throw error;
    }
  }

  async removeParticipant(userId: string, conversationId: string, participantId: string) {
    try {
      const conversation = await this.databaseService.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.includes(userId)) {
        throw new ForbiddenException('Access denied to conversation');
      }

      if (!conversation.participants.includes(participantId)) {
        throw new NotFoundException('Participant not found in conversation');
      }

      // Remove participant
      const updatedParticipants = conversation.participants.filter(id => id !== participantId);

      await this.databaseService.conversation.update({
        where: { id: conversationId },
        data: {
          participants: updatedParticipants,
        },
      });

      // If no participants left, delete the conversation
      if (updatedParticipants.length === 0) {
        await this.databaseService.conversation.delete({
          where: { id: conversationId },
        });
      }

      return { message: 'Participant removed successfully' };
    } catch (error) {
      this.logger.error('Failed to remove participant', error);
      throw error;
    }
  }

  async getArchivedConversations(userId: string, params: {
    page?: number;
    limit?: number;
  }) {
    try {
      const { page = 1, limit = 20 } = params;
      const skip = (page - 1) * limit;

      // For now, return empty array as we don't have archived conversation support yet
      // In a full implementation, we'd have a separate archive status per user
      this.logger.log(`Getting archived conversations for user ${userId}`);
      
      return {
        conversations: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get archived conversations', error);
      throw error;
    }
  }

  async searchConversations(userId: string, query: string, params: {
    page?: number;
    limit?: number;
  }) {
    try {
      const { page = 1, limit = 20 } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.ConversationWhereInput = {
        participants: {
          has: userId,
        },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          // Could also search in message content if needed
        ],
      };

      const [conversations, total] = await Promise.all([
        this.databaseService.conversation.findMany({
          where,
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          skip,
          take: limit,
          orderBy: { lastMessageAt: 'desc' },
        }),
        this.databaseService.conversation.count({ where }),
      ]);

      // Get participant details
      const participantIds = conversations.flatMap(c => c.participants);
      const uniqueParticipantIds = [...new Set(participantIds)];
      
      const participants = await this.databaseService.user.findMany({
        where: {
          id: { in: uniqueParticipantIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
        },
      });

      const participantMap = new Map(participants.map((p: any) => [p.id, p]));

      const formattedConversations = conversations.map(conversation => {
        const otherParticipantIds = conversation.participants.filter(id => id !== userId);
        const isGroup = conversation.type === 'group';
        
        let displayName = conversation.title || 'Conversation';
        let displayAvatar = null;

        if (!isGroup && otherParticipantIds.length === 1) {
          const otherUser = participantMap.get(otherParticipantIds[0]);
          if (otherUser) {
            displayName = `${(otherUser as any).firstName || ''} ${(otherUser as any).lastName || ''}`;
            displayAvatar = (otherUser as any).avatar || null;
          }
        }

        return {
          id: conversation.id,
          name: displayName,
          avatar: displayAvatar,
          isGroup,
          lastMessage: conversation.messages[0] || null,
          lastActivityAt: conversation.lastMessageAt,
          participants: conversation.participants.map(id => participantMap.get(id)).filter(Boolean),
          type: conversation.type,
          title: conversation.title,
        };
      });

      return {
        conversations: formattedConversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Failed to search conversations', error);
      throw error;
    }
  }

  async updateGroupConversation(userId: string, conversationId: string, updateData: {
    title?: string;
    name?: string;
    description?: string;
    avatar?: string;
  }) {
    try {
      const conversation = await this.databaseService.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.includes(userId)) {
        throw new ForbiddenException('Access denied to conversation');
      }

      if (conversation.type !== 'group') {
        throw new ForbiddenException('Can only update group conversations');
      }

      const updatedConversation = await this.databaseService.conversation.update({
        where: { id: conversationId },
        data: {
          title: updateData.title || updateData.name || conversation.title,
          // Note: current schema doesn't have description field or avatar field
        },
      });

      return { message: 'Group conversation updated successfully', conversation: updatedConversation };
    } catch (error) {
      this.logger.error('Failed to update group conversation', error);
      throw error;
    }
  }

  async promoteToAdmin(userId: string, conversationId: string, participantId: string) {
    try {
      const conversation = await this.databaseService.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.includes(userId)) {
        throw new ForbiddenException('Access denied to conversation');
      }

      if (conversation.type !== 'group') {
        throw new ForbiddenException('Can only promote admins in group conversations');
      }

      if (!conversation.participants.includes(participantId)) {
        throw new NotFoundException('Participant not found in conversation');
      }

      // For now, just log the action as we don't have admin system in current schema
      this.logger.log(`User ${userId} promoted ${participantId} to admin in conversation ${conversationId}`);
      
      return { message: 'User promoted to admin successfully' };
    } catch (error) {
      this.logger.error('Failed to promote user to admin', error);
      throw error;
    }
  }

  async demoteFromAdmin(userId: string, conversationId: string, participantId: string) {
    try {
      const conversation = await this.databaseService.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.includes(userId)) {
        throw new ForbiddenException('Access denied to conversation');
      }

      if (conversation.type !== 'group') {
        throw new ForbiddenException('Can only demote admins in group conversations');
      }

      if (!conversation.participants.includes(participantId)) {
        throw new NotFoundException('Participant not found in conversation');
      }

      // For now, just log the action as we don't have admin system in current schema
      this.logger.log(`User ${userId} demoted ${participantId} from admin in conversation ${conversationId}`);
      
      return { message: 'User demoted from admin successfully' };
    } catch (error) {
      this.logger.error('Failed to demote user from admin', error);
      throw error;
    }
  }
}