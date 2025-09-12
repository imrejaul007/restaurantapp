import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthService {
    private prisma;
    private usersService;
    private jwtService;
    private configService;
    private emailService;
    private readonly logger;
    constructor(prisma: PrismaService, usersService: UsersService, jwtService: JwtService, configService: ConfigService, emailService: EmailService);
    signUp(signUpDto: SignUpDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType: string;
        user: any;
    }>;
    signIn(signInDto: SignInDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType: string;
        user: any;
    }>;
    refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType: string;
    }>;
    logout(userId: string, logoutAll?: boolean): Promise<{
        message: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    validateUser(email: string, password: string): Promise<any>;
    private generateTokens;
    private parseExpirationTime;
    private updateRefreshToken;
    private createSession;
    private createRoleProfile;
    private generateEmployeeCode;
    private sanitizeUser;
    private sendVerificationEmail;
    private sendPasswordResetEmail;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    resendVerificationEmail(email: string): Promise<{
        message: string;
    }>;
    isTokenBlacklisted(token: string): Promise<boolean>;
    getUserSessions(userId: string): Promise<{
        id: string;
        createdAt: Date;
        ipAddress: string | null;
        userAgent: string | null;
        expiresAt: Date;
    }[]>;
    revokeSession(userId: string, sessionId: string): Promise<{
        message: string;
    }>;
}
