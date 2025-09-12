import { HttpStatus } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
export declare class EmployeesController {
    private readonly employeesService;
    constructor(employeesService: EmployeesService);
    create(req: any, createEmployeeDto: CreateEmployeeDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            joiningDate: Date;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            branchId?: string;
            designation: string;
            department?: string;
            salary?: number;
            relievingDate?: string;
            id: string;
            restaurantId: string;
            employeeCode: string;
        };
    }>;
    findAll(req: any, page?: number, limit?: number, filters?: any): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            employees: never[];
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: void;
    }>;
    remove(id: string): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    getProfile(id: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
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
        };
    }>;
    getPerformance(id: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            employeeId: string;
            period: string;
            performance: {
                rating: number;
                completedTasks: number;
                attendance: number;
                punctuality: number;
            };
            feedback: never[];
            goals: never[];
        };
    }>;
    getAttendance(id: string): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            records: any[];
            summary: {
                totalDays: number;
                presentDays: number;
                absentDays: number;
                lateDays: number;
            };
        };
    }>;
    markAttendance(id: string, attendanceData: any): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: any;
    }>;
}
