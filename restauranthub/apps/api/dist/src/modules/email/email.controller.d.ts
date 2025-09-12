import { EmailService } from './email.service';
export declare class EmailController {
    private readonly emailService;
    constructor(emailService: EmailService);
    sendEmail(userId: string, emailData: {
        to: string | string[];
        subject: string;
        template?: string;
        templateData?: Record<string, any>;
        html?: string;
        text?: string;
        attachments?: any[];
    }): Promise<void>;
    sendBulkEmail(userId: string, bulkEmailData: {
        recipients: {
            email: string;
            data?: Record<string, any>;
        }[];
        subject: string;
        template: string;
        batchSize?: number;
        delayBetweenBatches?: number;
    }): Promise<void>;
    getAvailableTemplates(): Promise<{
        templates: string[];
    }>;
    getQueueStatus(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    }>;
    getEmailLogs(user: any, page?: string, limit?: string, status?: string, recipient?: string): Promise<{
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
    sendTestEmail(adminEmail: string, testData: {
        template?: string;
        recipient?: string;
    }): Promise<void>;
    getEmailStats(user: any, from?: string, to?: string): Promise<{
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
}
