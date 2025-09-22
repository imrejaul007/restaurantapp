import { Controller, Post, Body, UseGuards, Request, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService, RecommendationRequest, FraudDetectionRequest } from './ai.service';
import { ChatbotService, ChatbotContext } from './chatbot.service';

class ChatRequest {
  message: string;
  sessionId?: string;
  context?: any;
}

class RecommendationQuery {
  type: 'job' | 'product' | 'restaurant' | 'supplier';
  limit?: number = 10;
  context?: any;
}

class ContentGenerationRequest {
  type: 'job_description' | 'product_description' | 'email_template';
  context: any;
}

@ApiTags('ai')
@Controller('api/v1/ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly chatbotService: ChatbotService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI assistant' })
  @ApiResponse({ status: 200, description: 'AI response generated successfully' })
  async chat(@Body() request: ChatRequest, @Request() req: any) {
    const context: ChatbotContext = {
      userId: req.user.id,
      userRole: req.user.role,
      sessionId: request.sessionId || `session_${req.user.id}_${Date.now()}`,
      conversationHistory: [],
      userProfile: req.user,
      currentPage: request.context?.page,
    };

    // Get conversation history
    if (request.sessionId) {
      context.conversationHistory = await this.chatbotService.getConversationHistory(request.sessionId);
    }

    const response = await this.chatbotService.processMessage(request.message, context);

    return {
      sessionId: context.sessionId,
      response,
      timestamp: new Date(),
    };
  }

  @Get('chat/suggestions')
  @ApiOperation({ summary: 'Get suggested questions for chatbot' })
  @ApiResponse({ status: 200, description: 'Suggested questions retrieved successfully' })
  async getSuggestedQuestions(@Request() req: any, @Query('page') page?: string) {
    const context: ChatbotContext = {
      userId: req.user.id,
      userRole: req.user.role,
      sessionId: '',
      conversationHistory: [],
      userProfile: req.user,
      currentPage: page,
    };

    const suggestions = await this.chatbotService.getSuggestedQuestions(context);

    return {
      suggestions,
      userRole: req.user.role,
    };
  }

  @Post('chat/clear/:sessionId')
  @ApiOperation({ summary: 'Clear chat conversation history' })
  @ApiResponse({ status: 200, description: 'Conversation cleared successfully' })
  async clearConversation(@Param('sessionId') sessionId: string) {
    await this.chatbotService.clearConversation(sessionId);
    return { message: 'Conversation cleared successfully' };
  }

  @Post('recommendations')
  @ApiOperation({ summary: 'Get AI-powered recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations generated successfully' })
  async getRecommendations(@Body() query: RecommendationQuery, @Request() req: any) {
    const request: RecommendationRequest = {
      userId: req.user.id,
      userRole: req.user.role,
      context: {
        ...query.context,
        userProfile: req.user,
        timestamp: new Date(),
      },
      type: query.type,
    };

    const recommendations = await this.aiService.generateRecommendations(request);

    return {
      recommendations: recommendations.slice(0, query.limit || 10),
      type: query.type,
      generated_at: new Date(),
    };
  }

  @Post('fraud-detection')
  @ApiOperation({ summary: 'Analyze transaction for fraud risk' })
  @ApiResponse({ status: 200, description: 'Fraud analysis completed successfully' })
  async detectFraud(@Body() request: any, @Request() req: any) {
    const fraudRequest: FraudDetectionRequest = {
      transactionData: request.transactionData,
      userHistory: {
        ...request.userHistory,
        userId: req.user.id,
        accountAge: this.calculateAccountAge(req.user.createdAt),
      },
      contextData: {
        ...request.contextData,
        userRole: req.user.role,
        timestamp: new Date(),
      },
    };

    const result = await this.aiService.detectFraud(fraudRequest);

    return {
      analysis: result,
      analyzed_at: new Date(),
      user_id: req.user.id,
    };
  }

  @Post('analyze-behavior')
  @ApiOperation({ summary: 'Analyze user behavior patterns' })
  @ApiResponse({ status: 200, description: 'Behavior analysis completed successfully' })
  async analyzeBehavior(@Body() request: { activityData: any[] }, @Request() req: any) {
    const analysis = await this.aiService.analyzeUserBehavior(req.user.id, request.activityData);

    return {
      analysis,
      user_id: req.user.id,
      analyzed_at: new Date(),
    };
  }

  @Post('generate-content')
  @ApiOperation({ summary: 'Generate AI content' })
  @ApiResponse({ status: 200, description: 'Content generated successfully' })
  async generateContent(@Body() request: ContentGenerationRequest, @Request() req: any) {
    const enhancedContext = {
      ...request.context,
      userRole: req.user.role,
      userId: req.user.id,
      timestamp: new Date(),
    };

    const content = await this.aiService.generateContent(request.type, enhancedContext);

    return {
      content,
      type: request.type,
      generated_at: new Date(),
      user_id: req.user.id,
    };
  }

  @Get('insights/:type')
  @ApiOperation({ summary: 'Get AI insights for specific data type' })
  @ApiResponse({ status: 200, description: 'Insights generated successfully' })
  async getInsights(
    @Param('type') type: 'sales' | 'operations' | 'hiring' | 'inventory',
    @Request() req: any,
    @Query('period') period: string = '30d',
  ) {
    // This would typically fetch relevant data and analyze it
    const mockData = this.getMockDataForInsights(type, period);
    const analysis = await this.aiService.analyzeUserBehavior(req.user.id, mockData);

    return {
      type,
      period,
      insights: analysis,
      generated_at: new Date(),
    };
  }

  private calculateAccountAge(createdAt: Date | string): number {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getMockDataForInsights(type: string, period: string): any[] {
    // Mock data for demonstration
    switch (type) {
      case 'sales':
        return [
          { date: '2024-01-01', revenue: 1200, orders: 15 },
          { date: '2024-01-02', revenue: 1350, orders: 18 },
          { date: '2024-01-03', revenue: 1100, orders: 12 },
        ];

      case 'operations':
        return [
          { metric: 'table_turnover', value: 3.2, trend: 'up' },
          { metric: 'staff_efficiency', value: 0.85, trend: 'stable' },
          { metric: 'customer_satisfaction', value: 4.3, trend: 'up' },
        ];

      case 'hiring':
        return [
          { position: 'chef', applications: 25, hired: 2, time_to_hire: 14 },
          { position: 'waiter', applications: 40, hired: 5, time_to_hire: 8 },
        ];

      case 'inventory':
        return [
          { item: 'tomatoes', usage: 'high', waste: 'low', trend: 'increasing' },
          { item: 'beef', usage: 'medium', waste: 'medium', trend: 'stable' },
        ];

      default:
        return [];
    }
  }
}