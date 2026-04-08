import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmailService } from './email.service';
import { UserRole } from '@prisma/client';

@ApiTags('email')
@Controller('email')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Send email (Admin/Restaurant only)' })
  @ApiResponse({ status: 201, description: 'Email queued successfully' })
  async sendEmail(
    @CurrentUser('id') userId: string,
    @Body() emailData: {
      to: string | string[];
      subject: string;
      template?: string;
      templateData?: Record<string, any>;
      html?: string;
      text?: string;
      attachments?: any[];
    },
  ) {
    if (!emailData.template && !emailData.html && !emailData.text) {
      throw new BadRequestException('Either template, html, or text content is required');
    }

    return this.emailService.sendEmail({
      to: emailData.to,
      subject: emailData.subject,
      template: emailData.template,
      templateData: emailData.templateData,
      html: emailData.html,
      text: emailData.text,
      attachments: emailData.attachments,
    });
  }

  @Post('send/bulk')
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Send bulk email (Admin/Restaurant only)' })
  @ApiResponse({ status: 201, description: 'Bulk email queued successfully' })
  async sendBulkEmail(
    @CurrentUser('id') userId: string,
    @Body() bulkEmailData: {
      recipients: { email: string; data?: Record<string, any> }[];
      subject: string;
      template: string;
      batchSize?: number;
      delayBetweenBatches?: number;
    },
  ) {
    return this.emailService.sendBulkEmail({
      recipients: bulkEmailData.recipients,
      subject: bulkEmailData.subject,
      template: bulkEmailData.template,
      batchSize: bulkEmailData.batchSize,
    });
  }

  @Get('templates')
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Get available email templates' })
  @ApiResponse({ status: 200, description: 'Available templates listed' })
  async getAvailableTemplates() {
    return this.emailService.getAvailableTemplates();
  }

  @Get('queue/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get email queue status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Queue status retrieved' })
  async getQueueStatus() {
    return this.emailService.getQueueStatus();
  }

  @Get('logs')
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Get email sending logs' })
  @ApiResponse({ status: 200, description: 'Email logs retrieved' })
  async getEmailLogs(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('recipient') recipient?: string,
  ) {
    const filters: any = {};
    
    // Non-admin users can only see their own sent emails
    if (user.role !== UserRole.ADMIN) {
      filters.fromUserId = user.id;
    }
    
    if (status) filters.status = status;
    if (recipient) filters.recipient = recipient;

    return this.emailService.getEmailLogs({
      ...filters,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Post('test')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send test email (Admin only)' })
  @ApiResponse({ status: 201, description: 'Test email sent' })
  async sendTestEmail(
    @CurrentUser('email') adminEmail: string,
    @Body() testData: {
      template?: string;
      recipient?: string;
    },
  ) {
    const recipient = testData.recipient || adminEmail;
    const template = testData.template || 'test';

    return this.emailService.sendEmail({
      to: recipient,
      subject: 'Email Service Test',
      template,
      templateData: {
        adminEmail,
        timestamp: new Date().toISOString(),
        systemInfo: {
          environment: process.env.NODE_ENV,
          service: 'RestaurantHub API',
        },
      },
    });
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT)
  @ApiOperation({ summary: 'Get email sending statistics' })
  @ApiResponse({ status: 200, description: 'Email statistics retrieved' })
  async getEmailStats(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const filters: any = {};
    
    // Non-admin users can only see their own stats
    if (user.role !== UserRole.ADMIN) {
      filters.fromUserId = user.id;
    }
    
    if (from) filters.from = new Date(from);
    if (to) filters.to = new Date(to);

    return this.emailService.getEmailStats(filters);
  }
}