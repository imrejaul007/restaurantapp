import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
export interface SearchFilters {
    category?: string[];
    priceRange?: {
        min: number;
        max: number;
    };
    location?: {
        lat: number;
        lng: number;
        radius: number;
    };
    rating?: number;
    availability?: boolean;
    tags?: string[];
    dateRange?: {
        from: Date;
        to: Date;
    };
    status?: string[];
}
export declare class SearchService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    searchRestaurants(query: string, filters: SearchFilters | undefined, pagination: PaginationDto): Promise<any>;
    searchProducts(query: string, filters: SearchFilters | undefined, pagination: PaginationDto): Promise<any>;
    searchJobs(query: string, filters: SearchFilters | undefined, pagination: PaginationDto): Promise<import("../common/dto/pagination.dto").PaginatedResponse<{
        restaurant: {
            id: string;
            user: {
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
                } | null;
                employee: {
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
                } | null;
                vendor: {
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
                } | null;
            };
            businessName: string | null;
        };
        _count: {
            applications: number;
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
    }>>;
    searchUsers(query: string, filters: {
        role?: string[];
        status?: string[];
    } | undefined, pagination: PaginationDto): Promise<import("../common/dto/pagination.dto").PaginatedResponse<{
        id: string;
        createdAt: Date;
        restaurant: {
            id: string;
            businessName: string | null;
        } | null;
        employee: {
            id: string;
            designation: string;
        } | null;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        lastLoginAt: Date | null;
        vendor: {
            id: string;
            businessName: string;
        } | null;
    }>>;
    globalSearch(query: string, pagination: PaginationDto): Promise<{
        restaurants: {
            data: never[];
            meta: {
                totalItems: number;
            };
        };
        products: {
            data: never[];
            meta: {
                totalItems: number;
            };
        };
        jobs: {
            data: never[];
            meta: {
                totalItems: number;
            };
        };
        totalResults?: undefined;
    } | {
        restaurants: any;
        products: any;
        jobs: import("../common/dto/pagination.dto").PaginatedResponse<{
            restaurant: {
                id: string;
                user: {
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
                    } | null;
                    employee: {
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
                    } | null;
                    vendor: {
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
                    } | null;
                };
                businessName: string | null;
            };
            _count: {
                applications: number;
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
        }>;
        totalResults: any;
    }>;
    getSearchSuggestions(query: string, type?: 'restaurants' | 'products' | 'jobs'): Promise<any>;
    private getRestaurantSuggestions;
    private getProductSuggestions;
    private getJobSuggestions;
    private buildOrderBy;
}
