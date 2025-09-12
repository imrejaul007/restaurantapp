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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const argon2 = __importStar(require("argon2"));
const prisma_service_1 = require("../../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
const email_service_1 = require("../email/email.service");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const common_2 = require("@nestjs/common");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, usersService, jwtService, configService, emailService) {
        this.prisma = prisma;
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailService = emailService;
        this.logger = new common_2.Logger(AuthService_1.name);
    }
    async signUp(signUpDto) {
        const { email, password, role, firstName, lastName, phone } = signUpDto;
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { phone: phone || undefined },
                ],
            },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email or phone already exists');
        }
        const passwordHash = await argon2.hash(password);
        const user = await this.prisma.user.create({
            data: {
                email,
                phone,
                passwordHash,
                role: role,
            },
        });
        await this.prisma.profile.create({
            data: {
                userId: user.id,
                firstName,
                lastName,
            },
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        await this.sendVerificationEmail(user.email, firstName || 'User');
        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    async signIn(signInDto) {
        const { email, password } = signInDto;
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const passwordValid = await argon2.verify(user.passwordHash, password);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: await argon2.hash(tokens.refreshToken),
                lastLoginAt: new Date(),
            },
        });
        this.logger.log(`User ${user.email} logged in successfully`);
        await this.createSession(user.id, tokens.accessToken);
        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    async refreshTokens(refreshTokenDto) {
        const { refreshToken } = refreshTokenDto;
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user || !user.refreshToken) {
                this.logger.debug('User not found or no refresh token stored');
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            this.logger.debug('Verifying refresh token hash...');
            this.logger.debug(`Stored hash: ${user.refreshToken?.substring(0, 20)}...`);
            this.logger.debug(`Provided token: ${refreshToken.substring(0, 20)}...`);
            const refreshTokenMatches = await argon2.verify(user.refreshToken, refreshToken);
            if (!refreshTokenMatches) {
                this.logger.debug('Refresh token hash does not match');
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            this.logger.debug('Refresh token validated successfully');
            const tokens = await this.generateTokens(user.id, user.email, user.role);
            await this.updateRefreshToken(user.id, tokens.refreshToken);
            return tokens;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(userId, logoutAll = false) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
        if (logoutAll) {
            await this.prisma.session.deleteMany({
                where: { userId },
            });
            const sessions = await this.prisma.session.findMany({
                where: { userId },
                select: { token: true },
            });
            for (const session of sessions) {
            }
        }
        else {
            const currentSession = await this.prisma.session.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            if (currentSession) {
                await this.prisma.session.delete({
                    where: { id: currentSession.id },
                });
            }
        }
        this.logger.log(`User ${userId} logged out${logoutAll ? ' from all devices' : ''}`);
        return { message: 'Logged out successfully' };
    }
    async forgotPassword(forgotPasswordDto) {
        const { email } = forgotPasswordDto;
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return { message: 'If the email exists, a reset link has been sent' };
        }
        const resetToken = this.jwtService.sign({ sub: user.id, email: user.email, type: 'password-reset' }, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: '1h',
        });
        await this.sendPasswordResetEmail(user.email, resetToken, user.firstName || 'User');
        return { message: 'If the email exists, a reset link has been sent' };
    }
    async resetPassword(resetPasswordDto) {
        const { token, newPassword } = resetPasswordDto;
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            if (payload.type !== 'password-reset') {
                throw new common_1.BadRequestException('Invalid reset token');
            }
            const storedToken = null;
            if (storedToken !== token) {
                throw new common_1.BadRequestException('Invalid or expired reset token');
            }
            const passwordHash = await argon2.hash(newPassword);
            await this.prisma.user.update({
                where: { id: payload.sub },
                data: { passwordHash },
            });
            await this.prisma.session.deleteMany({
                where: { userId: payload.sub },
            });
            return { message: 'Password reset successfully' };
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
    }
    async changePassword(userId, changePasswordDto) {
        const { oldPassword, newPassword } = changePasswordDto;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const passwordValid = await argon2.verify(user.passwordHash, oldPassword);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        const passwordHash = await argon2.hash(newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
        await this.prisma.session.deleteMany({
            where: {
                userId,
                token: { not: '' },
            },
        });
        return { message: 'Password changed successfully' };
    }
    async validateUser(email, password) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return null;
        }
        const passwordValid = await argon2.verify(user.passwordHash, password);
        if (!passwordValid) {
            return null;
        }
        if (!user.isActive || user.status !== 'ACTIVE') {
            return null;
        }
        return this.sanitizeUser(user);
    }
    async generateTokens(userId, email, role) {
        const jti = crypto.randomUUID();
        const now = Math.floor(Date.now() / 1000);
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.sign({
                sub: userId,
                email,
                role,
                jti,
                iat: now,
                type: 'access'
            }, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRES_IN'),
            }),
            this.jwtService.sign({
                sub: userId,
                email,
                role,
                jti: crypto.randomUUID(),
                iat: now,
                type: 'refresh'
            }, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
            }),
        ]);
        return {
            accessToken,
            refreshToken,
            expiresIn: this.parseExpirationTime(this.configService.get('JWT_EXPIRES_IN') || '15m'),
            tokenType: 'Bearer',
        };
    }
    parseExpirationTime(timeString) {
        const match = timeString.match(/(\d+)(\w+)/);
        if (!match)
            return 900;
        const [, value, unit] = match;
        const multipliers = {
            's': 1,
            'm': 60,
            'h': 3600,
            'd': 86400,
        };
        return parseInt(value) * (multipliers[unit] || 60);
    }
    async updateRefreshToken(userId, refreshToken) {
        const hashedRefreshToken = await argon2.hash(refreshToken);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: hashedRefreshToken },
        });
    }
    async createSession(userId, token) {
        await this.prisma.session.create({
            data: {
                userId,
                token,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            },
        });
    }
    async createRoleProfile(userId, role, data) {
        switch (role) {
            case client_1.UserRole.RESTAURANT:
                await this.prisma.restaurant.create({
                    data: {
                        userId,
                        name: data.restaurantName || data.firstName + "'s Restaurant",
                        businessName: data.restaurantName || data.firstName + "'s Restaurant",
                        description: data.description || '',
                    },
                });
                break;
            case client_1.UserRole.VENDOR:
                await this.prisma.vendor.create({
                    data: {
                        userId,
                        companyName: data.companyName || data.firstName + "'s Company",
                        businessName: data.companyName || data.firstName + "'s Company",
                        businessType: data.businessType || 'General',
                        description: data.description || '',
                    },
                });
                break;
            case client_1.UserRole.EMPLOYEE:
                if (data.restaurantId) {
                    await this.prisma.employee.create({
                        data: {
                            userId,
                            restaurantId: data.restaurantId,
                            employeeCode: await this.generateEmployeeCode(),
                            designation: data.designation || 'Staff',
                            joiningDate: new Date(),
                        },
                    });
                }
                break;
        }
    }
    async generateEmployeeCode() {
        const count = await this.prisma.employee.count();
        return `EMP${String(count + 1).padStart(6, '0')}`;
    }
    sanitizeUser(user) {
        const { passwordHash, refreshToken, twoFactorSecret, ...sanitized } = user;
        return sanitized;
    }
    async sendVerificationEmail(email, firstName) {
        const verificationToken = this.jwtService.sign({ email, type: 'email-verification' }, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: '24h',
        });
        const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`;
        try {
            await this.emailService.sendEmail({
                to: email,
                subject: 'Verify Your Email Address',
                template: 'welcome',
                templateData: {
                    firstName,
                    verificationUrl,
                    supportEmail: 'support@restauranthub.com',
                },
            });
            this.logger.log(`Verification email sent to ${email}`);
        }
        catch (error) {
            this.logger.error(`Failed to send verification email to ${email}:`, error);
        }
    }
    async sendPasswordResetEmail(email, token, firstName) {
        const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
        try {
            await this.emailService.sendEmail({
                to: email,
                subject: 'Reset Your Password',
                template: 'passwordReset',
                templateData: {
                    firstName,
                    resetUrl,
                    expiryTime: '1 hour',
                    supportEmail: 'support@restauranthub.com',
                },
            });
            this.logger.log(`Password reset email sent to ${email}`);
        }
        catch (error) {
            this.logger.error(`Failed to send password reset email to ${email}:`, error);
        }
    }
    async verifyEmail(token) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            if (payload.type !== 'email-verification') {
                throw new common_1.BadRequestException('Invalid verification token');
            }
            const user = await this.prisma.user.findUnique({
                where: { email: payload.email },
            });
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            if (user.emailVerifiedAt) {
                return { message: 'Email already verified' };
            }
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerifiedAt: new Date(),
                    status: 'ACTIVE',
                    isActive: true,
                },
            });
            this.logger.log(`Email verified for user ${user.email}`);
            return { message: 'Email verified successfully' };
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid or expired verification token');
        }
    }
    async resendVerificationEmail(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.emailVerifiedAt) {
            throw new common_1.BadRequestException('Email already verified');
        }
        const lastSent = null;
        if (lastSent) {
            throw new common_1.BadRequestException('Verification email was sent recently. Please wait before requesting again.');
        }
        await this.sendVerificationEmail(user.email, user.firstName || 'User');
        return { message: 'Verification email sent' };
    }
    async isTokenBlacklisted(token) {
        try {
            const revokedToken = await this.prisma.revokedToken.findUnique({
                where: { token },
            });
            return !!revokedToken;
        }
        catch (error) {
            this.logger.error('Token blacklist check failed:', error);
            return true;
        }
    }
    async getUserSessions(userId) {
        const sessions = await this.prisma.session.findMany({
            where: {
                userId,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                createdAt: true,
                expiresAt: true,
                ipAddress: true,
                userAgent: true,
            },
        });
        return sessions;
    }
    async revokeSession(userId, sessionId) {
        const session = await this.prisma.session.findFirst({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new common_1.BadRequestException('Session not found');
        }
        await this.prisma.session.delete({
            where: { id: sessionId },
        });
        this.logger.log(`Session ${sessionId} revoked for user ${userId}`);
        return { message: 'Session revoked successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map