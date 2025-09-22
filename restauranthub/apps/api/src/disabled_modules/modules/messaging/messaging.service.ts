import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  // Stub implementation - messaging service is temporarily disabled
  async getHealthStatus() {
    return { status: 'disabled', message: 'Messaging service is temporarily disabled' };
  }
}