import { HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboard(): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            overview: {
                totalUsers: number;
                totalRestaurants: number;
                totalVendors: number;
                totalEmployees: number;
                pendingVerifications: number;
                totalOrders: any;
                monthlyRevenue: any;
                activeUsers: number;
            };
            growth: {
                userGrowth: number;
                restaurantGrowth: number;
                orderGrowth: any;
            };
        };
    }>;
    getUsers(role?: string, status?: string, page?: number, limit?: number): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            users: {
                id: string;
                createdAt: Date;
                restaurant: {
                    verifiedAt: Date | null;
                    businessName: string | null;
                } | null;
                employee: {
                    employeeCode: string;
                    restaurant: {
                        businessName: string | null;
                    };
                } | null;
                email: string;
                phone: string | null;
                firstName: string | null;
                lastName: string | null;
                role: import(".prisma/client").$Enums.UserRole;
                status: import(".prisma/client").$Enums.UserStatus;
                emailVerifiedAt: Date | null;
                lastLoginAt: Date | null;
                vendor: {
                    verifiedAt: Date | null;
                    businessName: string;
                } | null;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getUserById(userId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            restaurant: ({
                employees: {
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
                }[];
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
            }) | null;
            employee: ({
                restaurant: {
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
            }) | null;
            vendor: ({
                products: {
                    id: string;
                    restaurantId: string | null;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    tags: string[];
                    name: string;
                    status: import(".prisma/client").$Enums.ProductStatus;
                    deletedAt: Date | null;
                    description: string | null;
                    rating: number;
                    totalReviews: number;
                    slug: string;
                    images: string[];
                    viewCount: number;
                    sku: string;
                    vendorId: string | null;
                    categoryId: string;
                    price: number;
                    comparePrice: number | null;
                    costPrice: number | null;
                    quantity: number;
                    unit: string;
                    minOrderQuantity: number;
                    maxOrderQuantity: number | null;
                    gstRate: number;
                    hsnCode: string | null;
                    isWholesale: boolean;
                    isBulkOnly: boolean;
                }[];
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
            }) | null;
            sessions: {
                id: string;
                userId: string;
                createdAt: Date;
                token: string;
                ipAddress: string | null;
                userAgent: string | null;
                expiresAt: Date;
            }[];
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
    }>;
    updateUserStatus(userId: string, status: string, reason?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    getPendingRestaurants(page?: number, limit?: number): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            restaurants: ({
                user: {
                    email: string;
                    phone: string | null;
                    firstName: string | null;
                    lastName: string | null;
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
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    approveRestaurant(restaurantId: string, notes?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    rejectRestaurant(restaurantId: string, reason: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    getPendingVendors(page?: number, limit?: number): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            vendors: ({
                user: {
                    email: string;
                    phone: string | null;
                    firstName: string | null;
                    lastName: string | null;
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
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    approveVendor(vendorId: string, notes?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    rejectVendor(vendorId: string, reason: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    getAnalytics(startDate?: string, endDate?: string, type?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            period: {
                startDate: Date;
                endDate: Date;
            };
            userStats: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.UserGroupByOutputType, "role"[]> & {
                _count: number;
            })[];
            orderStats: any;
            revenue: {
                total: any;
                average: number;
            };
            topRestaurants: ({
                _count: {
                    orders: number;
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
            topProducts: ({
                _count: {
                    orderItems: number;
                };
            } & {
                id: string;
                restaurantId: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                tags: string[];
                name: string;
                status: import(".prisma/client").$Enums.ProductStatus;
                deletedAt: Date | null;
                description: string | null;
                rating: number;
                totalReviews: number;
                slug: string;
                images: string[];
                viewCount: number;
                sku: string;
                vendorId: string | null;
                categoryId: string;
                price: number;
                comparePrice: number | null;
                costPrice: number | null;
                quantity: number;
                unit: string;
                minOrderQuantity: number;
                maxOrderQuantity: number | null;
                gstRate: number;
                hsnCode: string | null;
                isWholesale: boolean;
                isBulkOnly: boolean;
            })[];
        };
    }>;
    getFlaggedReviews(page?: number, limit?: number): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            reviews: ({
                user: {
                    id: string;
                    email: string;
                    profile: {
                        firstName: string;
                        lastName: string;
                    } | null;
                };
            } & {
                id: string;
                userId: string;
                restaurantId: string | null;
                createdAt: Date;
                updatedAt: Date;
                rating: number;
                title: string | null;
                images: string[];
                comment: string | null;
                vendorId: string | null;
                productId: string | null;
                isVerifiedPurchase: boolean;
                helpfulCount: number;
            })[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    reviewAction(reviewId: string, action: 'approve' | 'hide' | 'delete', reason?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    getSupportTickets(status?: string, priority?: string, page?: number, limit?: number): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            tickets: never[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    assignTicket(ticketId: string, assigneeId: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    getAuditLogs(userId?: string, action?: string, resource?: string, startDate?: string, endDate?: string, page?: number, limit?: number): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            logs: ({
                user: {
                    email: string;
                    firstName: string | null;
                    lastName: string | null;
                    role: import(".prisma/client").$Enums.UserRole;
                } | null;
            } & {
                id: string;
                userId: string | null;
                createdAt: Date;
                action: string;
                ipAddress: string | null;
                userAgent: string | null;
                entity: string;
                resource: string | null;
                entityId: string | null;
                oldData: import("@prisma/client/runtime/library").JsonValue | null;
                newData: import("@prisma/client/runtime/library").JsonValue | null;
            })[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    toggleMaintenance(enabled: boolean, message?: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    getSystemConfig(): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            maintenance_mode: {
                enabled: boolean;
                message: string;
            };
            max_upload_size: string;
            allowed_file_types: string[];
            payment_enabled: boolean;
        };
    }>;
    updateSystemConfig(config: any): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
}
