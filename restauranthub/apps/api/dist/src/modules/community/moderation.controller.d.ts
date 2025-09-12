import { ModerationService } from './moderation.service';
import { ReportStatus } from '@prisma/client';
export declare class ModerationController {
    private readonly moderationService;
    constructor(moderationService: ModerationService);
    reportContent(req: any, body: {
        contentId: string;
        contentType: 'POST' | 'COMMENT' | 'USER' | 'GROUP';
        reason: string;
        description?: string;
        category?: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'MISINFORMATION' | 'COPYRIGHT' | 'OTHER';
    }): Promise<{
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
    getReports(status?: ReportStatus, contentType?: 'POST' | 'COMMENT' | 'USER' | 'GROUP', category?: string, assignedTo?: string, page?: string, limit?: string): Promise<{
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
    moderateContent(req: any, reportId: string, body: {
        action: 'APPROVE' | 'REMOVE' | 'WARN' | 'SUSPEND' | 'BAN';
        reason?: string;
        durationDays?: number;
    }): Promise<{
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
    checkSpam(body: {
        content: string;
        metadata?: {
            authorId?: string;
            authorReputation?: number;
            authorAge?: number;
            postFrequency?: number;
        };
    }): Promise<{
        isSpam: boolean;
        confidence: number;
        reasons: string[];
    }>;
    checkSafety(body: {
        content: string;
    }): Promise<{
        isSafe: boolean;
        issues: string[];
        safetyScore: number;
    }>;
    getSafetyProfile(req: any, targetUserId?: string): Promise<{
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
    blockUser(req: any, userId: string, body: {
        reason?: string;
    }): Promise<{
        id: string;
        blockerId: string;
        blockedId: string;
        reason: string | undefined;
    }>;
    getMyReports(req: any, page?: string, limit?: string): Promise<{
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
}
