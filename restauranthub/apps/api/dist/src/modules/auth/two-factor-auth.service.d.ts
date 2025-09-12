import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class TwoFactorAuthService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    generateTwoFactorSecret(userId: string): Promise<{
        secret: string;
        qrCodeUrl: string;
        manualEntryKey: string;
    }>;
    enableTwoFactorAuth(userId: string, token: string): Promise<{
        enabled: boolean;
        backupCodes: string[];
    }>;
    disableTwoFactorAuth(userId: string, token: string): Promise<{
        disabled: boolean;
    }>;
    verifyTwoFactorToken(userId: string, token: string): Promise<boolean>;
    getTwoFactorStatus(userId: string): Promise<{
        enabled: boolean;
        email: string;
    }>;
    private generateBackupCodes;
    validateBackupCode(userId: string, backupCode: string): Promise<boolean>;
}
