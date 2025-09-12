import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ModerateJobDto, ModerationAction, ModerationPriority } from './dto/moderate-job.dto';
export interface ModerationRecord {
    id: string;
    jobId: string;
    moderatorId: string;
    action: ModerationAction;
    moderatorNotes: string;
    feedback?: string;
    priority?: ModerationPriority;
    flagReasons?: string[];
    createdAt: Date;
    requiresFollowUp: boolean;
}
export declare class JobModerationService {
    private prisma;
    private redisService;
    private moderationCache;
    private flaggedJobs;
    constructor(prisma: PrismaService, redisService: RedisService);
    moderateJob(jobId: string, moderationData: ModerateJobDto, moderatorId: string): Promise<{
        job: {
            restaurant: {
                user: {
                    profile: {
                        id: string;
                        userId: string;
                        createdAt: Date;
                        updatedAt: Date;
                        firstName: string;
                        lastName: string;
                        avatar: string | null;
                        bio: string | null;
                        address: string | null;
                        city: string | null;
                        state: string | null;
                        country: string | null;
                        pincode: string | null;
                        dateOfBirth: Date | null;
                    } | null;
                } & {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string;
                    phone: string | null;
                    passwordHash: string;
                    firstName: string | null;
                    lastName: string | null;
                    role: import(".prisma/client").$Enums.UserRole;
                    status: import(".prisma/client").$Enums.UserStatus;
                    isVerified: boolean;
                    emailVerifiedAt: Date | null;
                    isAadhaarVerified: boolean;
                    aadhaarVerificationId: string | null;
                    twoFactorEnabled: boolean;
                    twoFactorSecret: string | null;
                    lastLoginAt: Date | null;
                    refreshToken: string | null;
                    deletedAt: Date | null;
                };
            } & {
                id: string;
                userId: string;
                verifiedAt: Date | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                deletedAt: Date | null;
                businessName: string | null;
                description: string | null;
                logo: string | null;
                banner: string | null;
                cuisineType: string[];
                licenseNumber: string | null;
                gstNumber: string | null;
                fssaiNumber: string | null;
                panNumber: string | null;
                bankAccountNumber: string | null;
                bankName: string | null;
                ifscCode: string | null;
                verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
                rating: number;
                totalReviews: number;
            };
        } & {
            id: string;
            restaurantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.JobStatus;
            description: string;
            title: string;
            viewCount: number;
            requirements: string[];
            skills: string[];
            experienceMin: number;
            experienceMax: number | null;
            salaryMin: number | null;
            salaryMax: number | null;
            location: string;
            jobType: string;
            validTill: Date;
            applicationCount: number;
        };
        moderationRecord: ModerationRecord;
        message: string;
    }>;
    getJobsForModeration(filters?: any): Promise<{
        jobs: {
            moderationHistory: ModerationRecord[];
            isFlagged: boolean;
            flagDetails: any;
            moderationScore: number;
            restaurant: {
                user: {
                    profile: {
                        id: string;
                        userId: string;
                        createdAt: Date;
                        updatedAt: Date;
                        firstName: string;
                        lastName: string;
                        avatar: string | null;
                        bio: string | null;
                        address: string | null;
                        city: string | null;
                        state: string | null;
                        country: string | null;
                        pincode: string | null;
                        dateOfBirth: Date | null;
                    } | null;
                } & {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string;
                    phone: string | null;
                    passwordHash: string;
                    firstName: string | null;
                    lastName: string | null;
                    role: import(".prisma/client").$Enums.UserRole;
                    status: import(".prisma/client").$Enums.UserStatus;
                    isVerified: boolean;
                    emailVerifiedAt: Date | null;
                    isAadhaarVerified: boolean;
                    aadhaarVerificationId: string | null;
                    twoFactorEnabled: boolean;
                    twoFactorSecret: string | null;
                    lastLoginAt: Date | null;
                    refreshToken: string | null;
                    deletedAt: Date | null;
                };
            } & {
                id: string;
                userId: string;
                verifiedAt: Date | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                deletedAt: Date | null;
                businessName: string | null;
                description: string | null;
                logo: string | null;
                banner: string | null;
                cuisineType: string[];
                licenseNumber: string | null;
                gstNumber: string | null;
                fssaiNumber: string | null;
                panNumber: string | null;
                bankAccountNumber: string | null;
                bankName: string | null;
                ifscCode: string | null;
                verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
                rating: number;
                totalReviews: number;
            };
            applications: ({
                employee: {
                    user: {
                        profile: {
                            id: string;
                            userId: string;
                            createdAt: Date;
                            updatedAt: Date;
                            firstName: string;
                            lastName: string;
                            avatar: string | null;
                            bio: string | null;
                            address: string | null;
                            city: string | null;
                            state: string | null;
                            country: string | null;
                            pincode: string | null;
                            dateOfBirth: Date | null;
                        } | null;
                    } & {
                        id: string;
                        isActive: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        phone: string | null;
                        passwordHash: string;
                        firstName: string | null;
                        lastName: string | null;
                        role: import(".prisma/client").$Enums.UserRole;
                        status: import(".prisma/client").$Enums.UserStatus;
                        isVerified: boolean;
                        emailVerifiedAt: Date | null;
                        isAadhaarVerified: boolean;
                        aadhaarVerificationId: string | null;
                        twoFactorEnabled: boolean;
                        twoFactorSecret: string | null;
                        lastLoginAt: Date | null;
                        refreshToken: string | null;
                        deletedAt: Date | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    employeeCode: string;
                    restaurantId: string;
                    branchId: string | null;
                    designation: string;
                    department: string | null;
                    aadharNumber: string | null;
                    aadharVerified: boolean;
                    verifiedAt: Date | null;
                    salary: number | null;
                    joiningDate: Date;
                    relievingDate: Date | null;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.ApplicationStatus;
                reviewedAt: Date | null;
                jobId: string;
                employeeId: string;
                coverLetter: string | null;
                resume: string | null;
                reviewNotes: string | null;
            })[];
            _count: {
                applications: number;
            };
            id: string;
            restaurantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.JobStatus;
            description: string;
            title: string;
            viewCount: number;
            requirements: string[];
            skills: string[];
            experienceMin: number;
            experienceMax: number | null;
            salaryMin: number | null;
            salaryMax: number | null;
            location: string;
            jobType: string;
            validTill: Date;
            applicationCount: number;
        }[];
        total: number;
        flaggedCount: number;
    }>;
    getModerationHistory(jobId: string): Promise<{
        job: {
            restaurant: {
                user: {
                    profile: {
                        id: string;
                        userId: string;
                        createdAt: Date;
                        updatedAt: Date;
                        firstName: string;
                        lastName: string;
                        avatar: string | null;
                        bio: string | null;
                        address: string | null;
                        city: string | null;
                        state: string | null;
                        country: string | null;
                        pincode: string | null;
                        dateOfBirth: Date | null;
                    } | null;
                } & {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string;
                    phone: string | null;
                    passwordHash: string;
                    firstName: string | null;
                    lastName: string | null;
                    role: import(".prisma/client").$Enums.UserRole;
                    status: import(".prisma/client").$Enums.UserStatus;
                    isVerified: boolean;
                    emailVerifiedAt: Date | null;
                    isAadhaarVerified: boolean;
                    aadhaarVerificationId: string | null;
                    twoFactorEnabled: boolean;
                    twoFactorSecret: string | null;
                    lastLoginAt: Date | null;
                    refreshToken: string | null;
                    deletedAt: Date | null;
                };
            } & {
                id: string;
                userId: string;
                verifiedAt: Date | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                deletedAt: Date | null;
                businessName: string | null;
                description: string | null;
                logo: string | null;
                banner: string | null;
                cuisineType: string[];
                licenseNumber: string | null;
                gstNumber: string | null;
                fssaiNumber: string | null;
                panNumber: string | null;
                bankAccountNumber: string | null;
                bankName: string | null;
                ifscCode: string | null;
                verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
                rating: number;
                totalReviews: number;
            };
        } & {
            id: string;
            restaurantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.JobStatus;
            description: string;
            title: string;
            viewCount: number;
            requirements: string[];
            skills: string[];
            experienceMin: number;
            experienceMax: number | null;
            salaryMin: number | null;
            salaryMax: number | null;
            location: string;
            jobType: string;
            validTill: Date;
            applicationCount: number;
        };
        moderationHistory: ModerationRecord[];
        totalModerations: number;
        lastModeration: ModerationRecord;
        isFlagged: boolean;
        flagDetails: any;
    }>;
    getFlaggedJobs(): Promise<{
        flaggedJobs: any[];
        total: number;
    }>;
    resolveFlaggedJob(jobId: string, resolution: 'approved' | 'rejected' | 'escalated', moderatorId: string, notes: string): Promise<{
        resolution: "approved" | "rejected" | "escalated";
        resolutionRecord: ModerationRecord;
        message: string;
    }>;
    getModerationStats(): Promise<{
        jobs: {
            total: number;
            active: number;
            closed: number;
            flagged: number;
        };
        moderations: {
            total: number;
            approved: number;
            rejected: number;
            pendingReview: number;
        };
        moderationRate: string | number;
    }>;
    private calculateModerationScore;
    private notifyModerationDecision;
    bulkModerateJobs(jobIds: string[], action: ModerationAction, notes: string, moderatorId: string): Promise<{
        results: ({
            job: {
                restaurant: {
                    user: {
                        profile: {
                            id: string;
                            userId: string;
                            createdAt: Date;
                            updatedAt: Date;
                            firstName: string;
                            lastName: string;
                            avatar: string | null;
                            bio: string | null;
                            address: string | null;
                            city: string | null;
                            state: string | null;
                            country: string | null;
                            pincode: string | null;
                            dateOfBirth: Date | null;
                        } | null;
                    } & {
                        id: string;
                        isActive: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        phone: string | null;
                        passwordHash: string;
                        firstName: string | null;
                        lastName: string | null;
                        role: import(".prisma/client").$Enums.UserRole;
                        status: import(".prisma/client").$Enums.UserStatus;
                        isVerified: boolean;
                        emailVerifiedAt: Date | null;
                        isAadhaarVerified: boolean;
                        aadhaarVerificationId: string | null;
                        twoFactorEnabled: boolean;
                        twoFactorSecret: string | null;
                        lastLoginAt: Date | null;
                        refreshToken: string | null;
                        deletedAt: Date | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    verifiedAt: Date | null;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    deletedAt: Date | null;
                    businessName: string | null;
                    description: string | null;
                    logo: string | null;
                    banner: string | null;
                    cuisineType: string[];
                    licenseNumber: string | null;
                    gstNumber: string | null;
                    fssaiNumber: string | null;
                    panNumber: string | null;
                    bankAccountNumber: string | null;
                    bankName: string | null;
                    ifscCode: string | null;
                    verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
                    rating: number;
                    totalReviews: number;
                };
            } & {
                id: string;
                restaurantId: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.JobStatus;
                description: string;
                title: string;
                viewCount: number;
                requirements: string[];
                skills: string[];
                experienceMin: number;
                experienceMax: number | null;
                salaryMin: number | null;
                salaryMax: number | null;
                location: string;
                jobType: string;
                validTill: Date;
                applicationCount: number;
            };
            moderationRecord: ModerationRecord;
            message: string;
            jobId: string;
            success: boolean;
            error?: undefined;
        } | {
            jobId: string;
            success: boolean;
            error: string;
        })[];
        successful: number;
        failed: number;
    }>;
}
