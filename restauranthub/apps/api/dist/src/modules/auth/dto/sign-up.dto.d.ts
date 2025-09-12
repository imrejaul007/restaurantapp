import { UserRole } from '@prisma/client';
export declare class SignUpDto {
    email: string;
    password: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    phone?: string;
    restaurantName?: string;
    cuisineType?: string[];
    companyName?: string;
    businessType?: string;
    restaurantId?: string;
    designation?: string;
}
