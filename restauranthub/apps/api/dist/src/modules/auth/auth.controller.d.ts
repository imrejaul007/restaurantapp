import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Request } from 'express';
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
    };
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signUp(signUpDto: SignUpDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType: string;
        user: any;
    }>;
    signIn(signInDto: SignInDto, req: AuthenticatedRequest): Promise<{
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
    logout(req: AuthenticatedRequest, logoutAll?: string): Promise<{
        message: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(req: AuthenticatedRequest, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    resendVerificationEmail(email: string): Promise<{
        message: string;
    }>;
    getUserSessions(req: AuthenticatedRequest): Promise<{
        id: string;
        createdAt: Date;
        ipAddress: string | null;
        userAgent: string | null;
        expiresAt: Date;
    }[]>;
    revokeSession(req: AuthenticatedRequest, sessionId: string): Promise<{
        message: string;
    }>;
    getProfile(req: AuthenticatedRequest): Promise<{
        id: string;
        email: string;
        role: string;
    }>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
        service: string;
    }>;
}
export {};
