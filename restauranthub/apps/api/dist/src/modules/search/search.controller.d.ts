import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    searchRestaurants(query: string | undefined, page: number, limit: number, sortBy: string, sortOrder: 'asc' | 'desc', category: string[], minPrice: number, maxPrice: number, lat: number | null, lng: number | null, radius: number, minRating: number, availableOnly: boolean, tags: string[]): Promise<any>;
    searchProducts(query: string | undefined, page: number, limit: number, sortBy: string, sortOrder: 'asc' | 'desc', category: string[], minPrice: number, maxPrice: number, availableOnly: boolean, tags: string[]): Promise<any>;
    searchJobs(query: string | undefined, page: number, limit: number, sortBy: string, sortOrder: 'asc' | 'desc', location: string, status: string[], from: string, to: string): Promise<import("../common/dto/pagination.dto").PaginatedResponse<{
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
    searchUsers(query: string | undefined, page: number, limit: number, sortBy: string, sortOrder: 'asc' | 'desc', role: string[], status: string[]): Promise<import("../common/dto/pagination.dto").PaginatedResponse<{
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
    globalSearch(query: string, page: number, limit: number): Promise<{
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
    getSuggestions(query: string, type: 'restaurants' | 'products' | 'jobs'): Promise<any>;
    getFilterCategories(): Promise<{
        restaurants: {
            cuisineTypes: string[];
            priceRanges: {
                label: string;
                min: number;
                max: number;
            }[];
            ratings: number[];
        };
        products: {
            categories: string[];
            priceRanges: {
                label: string;
                min: number;
                max: number;
            }[];
        };
        jobs: {
            departments: string[];
            employmentTypes: string[];
            experienceLevels: string[];
        };
    }>;
}
