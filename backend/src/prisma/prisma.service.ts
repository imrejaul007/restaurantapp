import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: any) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }

  // Helper methods for common queries
  async getUserById(id: string) {
    return this.user.findUnique({
      where: { id },
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
      },
    });
  }

  async getUserByEmail(email: string) {
    return this.user.findUnique({
      where: { email },
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
      },
    });
  }

  async createNotification(userId: string, title: string, message: string, type: string, actionUrl?: string) {
    return this.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        actionUrl,
      },
    });
  }

  async recordAnalyticsEvent(userId: string | null, eventType: string, eventData?: any, ipAddress?: string, userAgent?: string) {
    return this.analyticsEvent.create({
      data: {
        userId,
        eventType,
        eventData,
        ipAddress,
        userAgent,
      },
    });
  }
}