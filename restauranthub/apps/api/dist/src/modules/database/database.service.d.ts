import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class DatabaseService extends PrismaService {
    constructor(configService: ConfigService);
}
