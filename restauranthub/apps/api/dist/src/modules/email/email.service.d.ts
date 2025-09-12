import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export interface EmailTemplate {
    subject: string;
    html: string;
    text?: string;
}
export interface EmailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    template?: string;
    templateData?: Record<string, any>;
    attachments?: Array<{
        filename: string;
        content?: Buffer;
        path?: string;
        cid?: string;
    }>;
    priority?: 'high' | 'normal' | 'low';
    delay?: number;
}
export interface BulkEmailOptions {
    recipients: Array<{
        email: string;
        name?: string;
        customData?: Record<string, any>;
    }>;
    subject: string;
    template: string;
    globalData?: Record<string, any>;
    batchSize?: number;
}
export declare class EmailService {
    private configService;
    private prisma;
    private readonly logger;
    private transporter;
    private fromAddress;
    constructor(configService: ConfigService, prisma: PrismaService);
    private setupTransporter;
    sendEmail(options: EmailOptions): Promise<void>;
    sendBulkEmail(options: BulkEmailOptions): Promise<void>;
    private sendNow;
    private processTemplate;
    private getWelcomeTemplate;
    private getEmailVerificationTemplate;
    private getPasswordResetTemplate;
    private getOrderConfirmationTemplate;
    private getOrderStatusUpdateTemplate;
    private getPaymentSuccessTemplate;
    private getWeeklyReportTemplate;
    private getJobApplicationTemplate;
    private getJobApplicationStatusTemplate;
    private getRestaurantVerificationTemplate;
    private getVendorVerificationTemplate;
    private getTrainingReminderTemplate;
    private getReviewRequestTemplate;
    private getPaymentFailedTemplate;
    private getSubscriptionReminderTemplate;
    private getRoleFeatures;
    private stripHtml;
    private chunkArray;
    processEmailQueue(job: any): Promise<void>;
    getAvailableTemplates(): Promise<{
        templates: string[];
    }>;
    getQueueStatus(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    }>;
    getEmailLogs(params: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        status?: string;
    }): Promise<{
        logs: never[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    getEmailStats(params: {
        startDate?: string;
        endDate?: string;
    }): Promise<{
        totalSent: number;
        totalDelivered: number;
        totalFailed: number;
        totalBounced: number;
        totalOpened: number;
        totalClicked: number;
        deliveryRate: number;
        openRate: number;
        clickRate: number;
    }>;
    private sendDirectEmail;
}
