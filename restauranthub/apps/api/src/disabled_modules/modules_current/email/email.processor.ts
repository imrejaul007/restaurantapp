import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from './email.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: Job) {
    this.logger.log(`Processing email job ${job.id}`);
    await this.emailService.processEmailQueue(job);
  }

  @Process('send-bulk-email')
  async handleSendBulkEmail(job: Job) {
    this.logger.log(`Processing bulk email job ${job.id}`);
    // TODO: Implement bulk email processing
    this.logger.warn('Bulk email processing not implemented');
  }
}