import { Job } from 'bull';
import { EmailService } from './email.service';
export declare class EmailProcessor {
    private emailService;
    private readonly logger;
    constructor(emailService: EmailService);
    handleSendEmail(job: Job): Promise<void>;
    handleSendBulkEmail(job: Job): Promise<void>;
}
