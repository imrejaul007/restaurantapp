import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface RecommendationRequest {
  userId: string;
  userRole: 'restaurant' | 'employee' | 'vendor';
  context: Record<string, any>;
  type: 'job' | 'product' | 'restaurant' | 'supplier';
}

export interface FraudDetectionRequest {
  transactionData: Record<string, any>;
  userHistory: Record<string, any>;
  contextData: Record<string, any>;
}

export interface FraudDetectionResult {
  riskScore: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  blockedReasons?: string[];
  recommendations: string[];
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI | null = null;

  constructor(private configService: ConfigService) {
    this.initializeOpenAI();
  }

  private initializeOpenAI(): void {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
      });
      this.logger.log('OpenAI client initialized');
    } else {
      this.logger.warn('OpenAI API key not found. AI features will use mock responses.');
    }
  }

  async chatCompletion(messages: ChatMessage[]): Promise<string> {
    if (!this.openai) {
      return this.getMockChatResponse(messages);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: 1000,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'I apologize, but I cannot process that request right now.';
    } catch (error) {
      this.logger.error('OpenAI chat completion error:', error);
      return this.getMockChatResponse(messages);
    }
  }

  async generateRecommendations(request: RecommendationRequest): Promise<any[]> {
    if (!this.openai) {
      return this.getMockRecommendations(request);
    }

    try {
      const prompt = this.buildRecommendationPrompt(request);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant for RestoPapa, a B2B platform for the restaurant industry. Provide helpful recommendations based on user data and context.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.6,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return this.parseRecommendationsResponse(content, request.type);
      }

      return this.getMockRecommendations(request);
    } catch (error) {
      this.logger.error('AI recommendations error:', error);
      return this.getMockRecommendations(request);
    }
  }

  async detectFraud(request: FraudDetectionRequest): Promise<FraudDetectionResult> {
    if (!this.openai) {
      return this.getMockFraudDetection(request);
    }

    try {
      const prompt = this.buildFraudDetectionPrompt(request);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a fraud detection AI for RestoPapa. Analyze transaction data and provide risk assessment. Respond only with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch (parseError) {
          this.logger.error('Failed to parse fraud detection response:', parseError);
        }
      }

      return this.getMockFraudDetection(request);
    } catch (error) {
      this.logger.error('AI fraud detection error:', error);
      return this.getMockFraudDetection(request);
    }
  }

  async analyzeUserBehavior(userId: string, activityData: any[]): Promise<{
    insights: string[];
    recommendations: string[];
    patterns: string[];
  }> {
    if (!this.openai) {
      return this.getMockBehaviorAnalysis();
    }

    try {
      const prompt = `
        Analyze user behavior data for user ${userId} in RestoPapa platform:

        Activity Data: ${JSON.stringify(activityData, null, 2)}

        Provide insights about:
        1. User engagement patterns
        2. Peak activity times
        3. Feature usage patterns
        4. Potential areas for improvement
        5. Personalized recommendations

        Respond with a JSON object containing insights, recommendations, and patterns arrays.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a user behavior analyst for RestoPapa. Provide actionable insights based on user activity data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 600,
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch (parseError) {
          this.logger.error('Failed to parse behavior analysis response:', parseError);
        }
      }

      return this.getMockBehaviorAnalysis();
    } catch (error) {
      this.logger.error('AI behavior analysis error:', error);
      return this.getMockBehaviorAnalysis();
    }
  }

  async generateContent(type: 'job_description' | 'product_description' | 'email_template', context: any): Promise<string> {
    if (!this.openai) {
      return this.getMockContent(type, context);
    }

    try {
      const prompt = this.buildContentGenerationPrompt(type, context);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a content generator for RestoPapa. Create professional, engaging content for the restaurant industry.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || this.getMockContent(type, context);
    } catch (error) {
      this.logger.error('AI content generation error:', error);
      return this.getMockContent(type, context);
    }
  }

  // Private helper methods

  private buildRecommendationPrompt(request: RecommendationRequest): string {
    const { userId, userRole, context, type } = request;

    return `
      Generate ${type} recommendations for a ${userRole} user (ID: ${userId}) in RestoPapa platform.

      User Context: ${JSON.stringify(context, null, 2)}

      Provide 5-10 relevant recommendations with brief explanations.
      Consider user preferences, location, industry trends, and platform data.

      Respond with a JSON array of recommendation objects with id, title, description, score (0-1), and reasoning fields.
    `;
  }

  private buildFraudDetectionPrompt(request: FraudDetectionRequest): string {
    return `
      Analyze this transaction for fraud risk:

      Transaction Data: ${JSON.stringify(request.transactionData, null, 2)}
      User History: ${JSON.stringify(request.userHistory, null, 2)}
      Context: ${JSON.stringify(request.contextData, null, 2)}

      Respond with JSON containing:
      - riskScore (0-1)
      - riskLevel ("low", "medium", "high", "critical")
      - reasons (array of risk factors found)
      - recommendations (array of suggested actions)
    `;
  }

  private buildContentGenerationPrompt(type: string, context: any): string {
    switch (type) {
      case 'job_description':
        return `Create a professional job description for: ${JSON.stringify(context)}`;
      case 'product_description':
        return `Create an engaging product description for: ${JSON.stringify(context)}`;
      case 'email_template':
        return `Create an email template for: ${JSON.stringify(context)}`;
      default:
        return `Create content for ${type}: ${JSON.stringify(context)}`;
    }
  }

  private parseRecommendationsResponse(content: string, type: string): any[] {
    try {
      return JSON.parse(content);
    } catch (error) {
      // Fallback parsing logic
      const lines = content.split('\n').filter(line => line.trim());
      return lines.slice(0, 5).map((line, index) => ({
        id: `ai-rec-${index}`,
        title: line.replace(/^\d+\.?\s*/, '').trim(),
        description: `AI-generated ${type} recommendation`,
        score: 0.7 + (Math.random() * 0.3),
        reasoning: 'Based on AI analysis of user data and preferences',
      }));
    }
  }

  // Mock response methods for when OpenAI is not available

  private getMockChatResponse(messages: ChatMessage[]): string {
    const lastMessage = messages[messages.length - 1];

    if (lastMessage.content.toLowerCase().includes('hello') ||
        lastMessage.content.toLowerCase().includes('hi')) {
      return "Hello! I'm the RestoPapa AI assistant. How can I help you with your restaurant operations today?";
    }

    if (lastMessage.content.toLowerCase().includes('job')) {
      return "I can help you with job-related queries! Are you looking to post a job, find candidates, or get advice on hiring in the restaurant industry?";
    }

    if (lastMessage.content.toLowerCase().includes('order') ||
        lastMessage.content.toLowerCase().includes('supplier')) {
      return "I can assist with supplier management and ordering. What specific information do you need about your supply chain or marketplace?";
    }

    return "I'm here to help with your restaurant management needs. You can ask me about jobs, suppliers, operations, or any other RestoPapa features.";
  }

  private getMockRecommendations(request: RecommendationRequest): any[] {
    const { type, userRole } = request;

    switch (type) {
      case 'job':
        return [
          {
            id: 'job-1',
            title: 'Head Chef Position',
            description: 'High-end restaurant seeking experienced chef',
            score: 0.9,
            reasoning: 'Matches your experience and location preferences',
          },
          {
            id: 'job-2',
            title: 'Restaurant Manager',
            description: 'Leadership role in growing restaurant chain',
            score: 0.8,
            reasoning: 'Aligns with your management background',
          },
        ];

      case 'product':
        return [
          {
            id: 'product-1',
            title: 'Premium Kitchen Equipment',
            description: 'Professional-grade cooking equipment',
            score: 0.85,
            reasoning: 'Based on your recent equipment searches',
          },
          {
            id: 'product-2',
            title: 'Organic Ingredients Supplier',
            description: 'Fresh, locally-sourced organic produce',
            score: 0.8,
            reasoning: 'Matches your sustainable dining preferences',
          },
        ];

      default:
        return [];
    }
  }

  private getMockFraudDetection(request: FraudDetectionRequest): FraudDetectionResult {
    const amount = request.transactionData?.amount || 0;
    const userAge = request.userHistory?.accountAge || 30;

    let riskScore = 0.1;
    const reasons: string[] = [];

    if (amount > 10000) {
      riskScore += 0.3;
      reasons.push('High transaction amount');
    }

    if (userAge < 7) {
      riskScore += 0.2;
      reasons.push('New account');
    }

    const riskLevel = riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low';

    return {
      riskScore: Math.min(riskScore, 1),
      riskLevel,
      reasons,
      recommendations: [
        'Monitor transaction patterns',
        'Verify user identity if needed',
        'Set up alerts for similar transactions',
      ],
    };
  }

  private getMockBehaviorAnalysis(): {
    insights: string[];
    recommendations: string[];
    patterns: string[];
  } {
    return {
      insights: [
        'User is most active during business hours (9-5 PM)',
        'High engagement with marketplace features',
        'Frequent job posting activity indicates hiring needs',
      ],
      recommendations: [
        'Consider premium marketplace features',
        'Explore bulk hiring tools',
        'Set up automated inventory alerts',
      ],
      patterns: [
        'Weekly peak activity on Mondays',
        'Seasonal hiring spikes in summer',
        'Preference for local suppliers',
      ],
    };
  }

  private getMockContent(type: string, context: any): string {
    switch (type) {
      case 'job_description':
        return `We are seeking a ${context.position || 'team member'} to join our restaurant team. This role offers competitive compensation and growth opportunities in a dynamic restaurant environment.`;

      case 'product_description':
        return `High-quality ${context.name || 'product'} designed for professional restaurant use. Features excellent durability and performance to meet demanding kitchen requirements.`;

      case 'email_template':
        return `Subject: ${context.subject || 'Important Update from RestoPapa'}\n\nDear [Name],\n\nWe hope this message finds you well. [Content will be customized based on your specific needs]\n\nBest regards,\nThe RestoPapa Team`;

      default:
        return 'AI-generated content based on your requirements.';
    }
  }
}