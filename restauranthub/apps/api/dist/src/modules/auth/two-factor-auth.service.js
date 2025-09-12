"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TwoFactorAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const speakeasy = __importStar(require("speakeasy"));
const qrcode = __importStar(require("qrcode"));
let TwoFactorAuthService = TwoFactorAuthService_1 = class TwoFactorAuthService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(TwoFactorAuthService_1.name);
    }
    async generateTwoFactorSecret(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, twoFactorEnabled: true },
            });
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            if (user.twoFactorEnabled) {
                throw new common_1.BadRequestException('Two-factor authentication is already enabled');
            }
            const secret = speakeasy.generateSecret({
                name: `RestaurantHub (${user.email})`,
                issuer: 'RestaurantHub',
                length: 32,
            });
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorSecret: secret.base32,
                },
            });
            const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
            this.logger.log(`2FA secret generated for user ${userId}`);
            return {
                secret: secret.base32,
                qrCodeUrl,
                manualEntryKey: secret.base32,
            };
        }
        catch (error) {
            this.logger.error('Failed to generate 2FA secret', error);
            throw error;
        }
    }
    async enableTwoFactorAuth(userId, token) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    twoFactorSecret: true,
                    twoFactorEnabled: true
                },
            });
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            if (!user.twoFactorSecret) {
                throw new common_1.BadRequestException('Two-factor secret not found. Generate secret first.');
            }
            if (user.twoFactorEnabled) {
                throw new common_1.BadRequestException('Two-factor authentication is already enabled');
            }
            const isValidToken = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: token,
                window: 2,
            });
            if (!isValidToken) {
                throw new common_1.BadRequestException('Invalid verification code');
            }
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorEnabled: true,
                },
            });
            const backupCodes = this.generateBackupCodes();
            this.logger.log(`2FA enabled for user ${userId}`);
            return {
                enabled: true,
                backupCodes,
            };
        }
        catch (error) {
            this.logger.error('Failed to enable 2FA', error);
            throw error;
        }
    }
    async disableTwoFactorAuth(userId, token) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    twoFactorSecret: true,
                    twoFactorEnabled: true
                },
            });
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            if (!user.twoFactorEnabled) {
                throw new common_1.BadRequestException('Two-factor authentication is not enabled');
            }
            const isValidToken = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: token,
                window: 2,
            });
            if (!isValidToken) {
                throw new common_1.BadRequestException('Invalid verification code');
            }
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorEnabled: false,
                    twoFactorSecret: null,
                },
            });
            this.logger.log(`2FA disabled for user ${userId}`);
            return {
                disabled: true,
            };
        }
        catch (error) {
            this.logger.error('Failed to disable 2FA', error);
            throw error;
        }
    }
    async verifyTwoFactorToken(userId, token) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    twoFactorSecret: true,
                    twoFactorEnabled: true
                },
            });
            if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
                throw new common_1.UnauthorizedException('Two-factor authentication not enabled');
            }
            const isValidToken = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: token,
                window: 2,
            });
            if (isValidToken) {
                this.logger.debug(`2FA token verified for user ${userId}`);
            }
            else {
                this.logger.warn(`Invalid 2FA token for user ${userId}`);
            }
            return isValidToken;
        }
        catch (error) {
            this.logger.error('Failed to verify 2FA token', error);
            throw error;
        }
    }
    async getTwoFactorStatus(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    twoFactorEnabled: true,
                    email: true,
                },
            });
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            return {
                enabled: user.twoFactorEnabled,
                email: user.email,
            };
        }
        catch (error) {
            this.logger.error('Failed to get 2FA status', error);
            throw error;
        }
    }
    generateBackupCodes(count = 8) {
        const backupCodes = [];
        for (let i = 0; i < count; i++) {
            const code = Math.random().toString(10).substring(2, 10);
            backupCodes.push(code);
        }
        return backupCodes;
    }
    async validateBackupCode(userId, backupCode) {
        this.logger.warn(`Backup code validation not implemented for user ${userId}`);
        return false;
    }
};
exports.TwoFactorAuthService = TwoFactorAuthService;
exports.TwoFactorAuthService = TwoFactorAuthService = TwoFactorAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], TwoFactorAuthService);
//# sourceMappingURL=two-factor-auth.service.js.map