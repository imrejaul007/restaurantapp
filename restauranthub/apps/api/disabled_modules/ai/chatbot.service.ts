import { Injectable, Logger } from '@nestjs/common';
import { AIService, ChatMessage } from './ai.service';
import { AdvancedCacheService } from '../cache/advanced-cache.service';

export interface ChatbotContext {
  userId: string;
  userRole: 'admin' | 'restaurant' | 'employee' | 'vendor';
  sessionId: string;
  conversationHistory: ChatMessage[];
  userProfile?: any;
  currentPage?: string;
}

export interface ChatbotResponse {
  message: string;
  suggestions?: string[];
  actions?: Array<{
    type: 'navigate' | 'search' | 'filter' | 'contact';
    label: string;
    data: any;
  }>;
  followUpQuestions?: string[];
  confidence: number;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private aiService: AIService,
    private cacheService: AdvancedCacheService,
  ) {}

  async processMessage(
    message: string,
    context: ChatbotContext
  ): Promise<ChatbotResponse> {
    try {
      // Build conversation context
      const systemPrompt = this.buildSystemPrompt(context);
      const conversationMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...context.conversationHistory,
        { role: 'user', content: message, timestamp: new Date() },
      ];

      // Get AI response
      const aiResponse = await this.aiService.chatCompletion(conversationMessages);

      // Parse and enhance response
      const response = await this.enhanceResponse(aiResponse, message, context);

      // Cache conversation
      await this.cacheConversation(context.sessionId, conversationMessages, response);

      return response;
    } catch (error) {
      this.logger.error('Chatbot processing error:', error);
      return this.getErrorResponse();
    }
  }

  async getConversationHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      return await this.cacheService.get<ChatMessage[]>(`conversation_${sessionId}`, 'chatbot') || [];
    } catch (error) {
      this.logger.error('Error retrieving conversation history:', error);
      return [];
    }
  }

  async clearConversation(sessionId: string): Promise<void> {
    try {
      await this.cacheService.del(`conversation_${sessionId}`, 'chatbot');
    } catch (error) {
      this.logger.error('Error clearing conversation:', error);
    }
  }

  async getSuggestedQuestions(context: ChatbotContext): Promise<string[]> {
    const cacheKey = `suggested_questions_${context.userRole}_${context.currentPage || 'general'}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.generateSuggestedQuestions(context);
      },
      { ttl: 3600, namespace: 'chatbot' }
    );
  }

  private buildSystemPrompt(context: ChatbotContext): string {
    const basePrompt = `
You are RestaurantHub AI Assistant, a helpful chatbot for a comprehensive B2B/B2C restaurant management platform.

Platform Features:
- Multi-role system (Admin, Restaurant Owner, Employee, Vendor)
- Job portal and hiring management
- B2B marketplace for restaurant supplies
- Real-time messaging and notifications
- Order management and fulfillment
- Analytics and reporting
- Community features and networking

User Context:
- Role: ${context.userRole}
- Current Page: ${context.currentPage || 'unknown'}
- User Profile: ${JSON.stringify(context.userProfile || {})}

Guidelines:
1. Be helpful, friendly, and professional
2. Provide specific, actionable advice
3. Suggest relevant platform features
4. Keep responses concise but informative
5. Offer to help with specific tasks
6. Use restaurant industry terminology appropriately
7. Always consider the user's role when providing advice

Response Format:
- Provide a clear, helpful response
- Suggest 2-3 follow-up actions when appropriate
- Include relevant platform navigation hints
- Ask clarifying questions if needed
    `;

    // Add role-specific context
    switch (context.userRole) {
      case 'restaurant':
        return basePrompt + `
Role-Specific Focus:
- Staff management and hiring
- Supplier relationships and ordering
- Menu management and pricing
- Customer engagement
- Operations optimization
- Compliance and regulations
        `;

      case 'employee':
        return basePrompt + `
Role-Specific Focus:
- Job search and applications
- Career development
- Skills training
- Workplace communication
- Industry networking
- Benefits and compensation
        `;

      case 'vendor':
        return basePrompt + `
Role-Specific Focus:
- Product catalog management
- Order fulfillment
- Customer acquisition
- Inventory management
- Pricing strategies
- Quality assurance
        `;

      case 'admin':
        return basePrompt + `
Role-Specific Focus:
- Platform management
- User verification and moderation
- Analytics and insights
- System configuration
- Security and compliance
- Feature development
        `;

      default:
        return basePrompt;
    }
  }

  private async enhanceResponse(
    aiResponse: string,
    userMessage: string,
    context: ChatbotContext
  ): Promise<ChatbotResponse> {
    const response: ChatbotResponse = {
      message: aiResponse,
      confidence: 0.8,
    };

    // Add contextual suggestions and actions
    response.suggestions = await this.generateSuggestions(userMessage, context);
    response.actions = this.generateActions(userMessage, context);
    response.followUpQuestions = this.generateFollowUpQuestions(userMessage, context);

    return response;
  }

  private async generateSuggestions(message: string, context: ChatbotContext): Promise<string[]> {
    const suggestions: string[] = [];

    // Job-related suggestions
    if (this.isJobRelated(message)) {
      if (context.userRole === 'restaurant') {
        suggestions.push('Post a new job listing', 'Review recent applications', 'Browse candidate profiles');
      } else if (context.userRole === 'employee') {
        suggestions.push('Search for jobs', 'Update your profile', 'Check application status');
      }
    }

    // Marketplace suggestions
    if (this.isMarketplaceRelated(message)) {
      if (context.userRole === 'restaurant') {
        suggestions.push('Browse suppliers', 'Check order history', 'Manage favorite vendors');
      } else if (context.userRole === 'vendor') {
        suggestions.push('Update product catalog', 'View recent orders', 'Manage inventory');
      }
    }

    // Analytics suggestions
    if (this.isAnalyticsRelated(message)) {
      suggestions.push('View dashboard', 'Generate reports', 'Set up alerts');
    }

    return suggestions.slice(0, 3);
  }

  private generateActions(message: string, context: ChatbotContext): Array<{
    type: 'navigate' | 'search' | 'filter' | 'contact';
    label: string;
    data: any;
  }> {
    const actions: any[] = [];

    if (this.isJobRelated(message)) {
      actions.push({
        type: 'navigate',
        label: 'Go to Jobs',
        data: { url: '/jobs' },
      });
    }

    if (this.isMarketplaceRelated(message)) {
      actions.push({
        type: 'navigate',
        label: 'Browse Marketplace',
        data: { url: '/marketplace' },
      });
    }

    if (this.isSupportRelated(message)) {
      actions.push({
        type: 'contact',
        label: 'Contact Support',
        data: { type: 'support' },
      });
    }

    return actions.slice(0, 2);
  }

  private generateFollowUpQuestions(message: string, context: ChatbotContext): string[] {
    const questions: string[] = [];

    if (this.isJobRelated(message)) {
      questions.push('What type of position are you looking for?');
      questions.push('Do you need help with the application process?');
    }

    if (this.isMarketplaceRelated(message)) {
      questions.push('What products are you interested in?');
      questions.push('Would you like help finding specific suppliers?');
    }

    return questions.slice(0, 2);
  }

  private generateSuggestedQuestions(context: ChatbotContext): string[] {
    const baseQuestions = [
      'How do I get started?',
      'What features are available?',
      'How can I contact support?',
    ];

    const roleSpecificQuestions: Record<string, string[]> = {
      restaurant: [
        'How do I post a job listing?',
        'How can I find reliable suppliers?',
        'What analytics are available for my restaurant?',
        'How do I manage my team?',
        'How can I improve my restaurant\'s efficiency?',
      ],
      employee: [
        'How do I search for jobs?',
        'How can I improve my profile?',
        'What career resources are available?',
        'How do I track my applications?',
        'What skills are in demand?',
      ],
      vendor: [
        'How do I list my products?',
        'How can I manage orders?',
        'How do I get more restaurant customers?',
        'What pricing strategies work best?',
        'How can I improve my ratings?',
      ],
      admin: [
        'How do I manage user verifications?',
        'What security features are available?',
        'How can I view platform analytics?',
        'How do I handle disputes?',
        'What configuration options exist?',
      ],
    };

    return [...baseQuestions, ...(roleSpecificQuestions[context.userRole] || [])];
  }

  private async cacheConversation(
    sessionId: string,
    messages: ChatMessage[],
    response: ChatbotResponse
  ): Promise<void> {
    try {
      const conversationData = {
        messages: [...messages, { role: 'assistant', content: response.message, timestamp: new Date() }],
        lastActivity: new Date(),
      };

      await this.cacheService.set(
        `conversation_${sessionId}`,
        conversationData,
        { ttl: 3600 * 24, namespace: 'chatbot' } // 24 hours
      );
    } catch (error) {
      this.logger.error('Error caching conversation:', error);
    }
  }

  private getErrorResponse(): ChatbotResponse {
    return {
      message: "I apologize, but I'm experiencing some technical difficulties right now. Please try again in a moment, or contact our support team if the issue persists.",
      suggestions: ['Try again', 'Contact support', 'Visit help center'],
      confidence: 0.9,
    };
  }

  // Helper methods for message classification
  private isJobRelated(message: string): boolean {
    const jobKeywords = ['job', 'hire', 'position', 'career', 'apply', 'candidate', 'resume', 'interview'];
    return jobKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private isMarketplaceRelated(message: string): boolean {
    const marketplaceKeywords = ['supplier', 'product', 'order', 'inventory', 'vendor', 'buy', 'sell', 'marketplace'];
    return marketplaceKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private isAnalyticsRelated(message: string): boolean {
    const analyticsKeywords = ['analytics', 'report', 'dashboard', 'data', 'metrics', 'insights', 'statistics'];
    return analyticsKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private isSupportRelated(message: string): boolean {
    const supportKeywords = ['help', 'support', 'problem', 'issue', 'bug', 'error', 'trouble'];
    return supportKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }
}