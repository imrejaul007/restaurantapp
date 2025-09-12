import { DatabaseService } from '../database/database.service';
import { ReportStatus } from '@prisma/client';
export declare class ModerationService {
    private readonly databaseService;
    private readonly logger;
    private readonly spamPatterns;
    private readonly profanityList;
    constructor(databaseService: DatabaseService);
    reportContent(reporterId: string, contentId: string, contentType: 'POST' | 'COMMENT' | 'USER' | 'GROUP', reason: string, description?: string, category?: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'MISINFORMATION' | 'COPYRIGHT' | 'OTHER'): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.ReportStatus;
        description: string | null;
        postId: string;
        reason: string;
        reviewedAt: Date | null;
        reporterId: string;
        reviewedBy: string | null;
    }>;
    getReports(params: {
        status?: ReportStatus;
        page?: number;
        limit?: number;
    }): Promise<{
        reports: {
            reporter: {
                id: string;
                name: string;
                avatar: string | null | undefined;
            };
            contentDetails: {
                title: string;
                content: string;
                author: string;
                name?: undefined;
                role?: undefined;
            } | {
                content: string;
                author: string;
                title?: undefined;
                name?: undefined;
                role?: undefined;
            } | {
                name: string;
                role: import(".prisma/client").$Enums.UserRole;
                title?: undefined;
                content?: undefined;
                author?: undefined;
            } | null;
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.ReportStatus;
            description: string | null;
            postId: string;
            reason: string;
            reviewedAt: Date | null;
            reporterId: string;
            reviewedBy: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    moderateContent(moderatorId: string, reportId: string, action: 'APPROVE' | 'REMOVE' | 'WARN' | 'SUSPEND' | 'BAN', reason?: string, durationDays?: number): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.ReportStatus;
        description: string | null;
        postId: string;
        reason: string;
        reviewedAt: Date | null;
        reporterId: string;
        reviewedBy: string | null;
    }>;
    detectSpam(content: string, metadata?: {
        authorId?: string;
        authorReputation?: number;
        authorAge?: number;
        postFrequency?: number;
    }): Promise<{
        isSpam: boolean;
        confidence: number;
        reasons: string[];
    }>;
    checkContentSafety(content: string): Promise<{
        isSafe: boolean;
        issues: string[];
        safetyScore: number;
    }>;
    getUserSafetyProfile(userId: string): Promise<{
        user: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            verified: boolean;
            joinedAt: Date;
        };
        safetyProfile: {
            safetyScore: number;
            reportsSubmitted: number;
            reportsReceived: number;
            moderationActions: number;
            accountAge: number;
            riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        };
        recentModerationActions: {
            action: any;
            reason: any;
            date: any;
        }[];
    }>;
    blockUser(blockerId: string, blockedId: string, reason?: string): Promise<{
        id: string;
        blockerId: string;
        blockedId: string;
        reason: string | undefined;
    }>;
    private verifyContentExists;
    private checkAutoModeration;
    private updateContentSafetyScore;
    private getContentDetails;
    private applyModerationAction;
    private notifyContentAuthor;
    private calculateRiskLevel;
}
