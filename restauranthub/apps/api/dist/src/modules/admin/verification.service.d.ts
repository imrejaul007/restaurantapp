import { PrismaService } from '../../prisma/prisma.service';
export declare class VerificationService {
    private prisma;
    constructor(prisma: PrismaService);
    verifyRestaurant(restaurantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyVendor(vendorId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getPendingVerifications(): Promise<{
        restaurants: ({
            user: {
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
        })[];
        vendors: ({
            user: {
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
            deletedAt: Date | null;
            businessName: string;
            description: string | null;
            logo: string | null;
            gstNumber: string | null;
            panNumber: string | null;
            bankAccountNumber: string | null;
            bankName: string | null;
            ifscCode: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            rating: number;
            totalReviews: number;
            companyName: string;
            businessType: string;
        })[];
    }>;
}
