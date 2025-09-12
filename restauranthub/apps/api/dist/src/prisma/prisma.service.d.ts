import { INestApplication, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
export declare class PrismaService extends PrismaClient implements OnModuleInit {
    private configService;
    private readonly logger;
    private mockMode;
    private mockData;
    constructor(configService: ConfigService);
    private setupMockMethods;
    onModuleInit(): Promise<void>;
    private initializeMockData;
    get order(): any;
    get orderStatusHistory(): any;
    enableShutdownHooks(app: INestApplication): Promise<void>;
}
