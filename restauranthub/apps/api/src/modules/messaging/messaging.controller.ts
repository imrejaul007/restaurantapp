import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';

@ApiTags('messaging')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('health')
  @ApiOperation({ summary: 'Messaging service health check' })
  async health() {
    return this.messagingService.getHealthStatus();
  }
}