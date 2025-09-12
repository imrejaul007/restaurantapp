import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<any>;
    findByEmail(email: string): Promise<any>;
    updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<any>;
    updateUser(id: string, updateData: Partial<UpdateUserDto>): Promise<any>;
    deactivateUser(id: string): Promise<{
        message: string;
    }>;
    activateUser(id: string): Promise<{
        message: string;
    }>;
    verifyEmail(userId: string): Promise<{
        message: string;
    }>;
    getUserStats(userId: string): Promise<{}>;
    private getRestaurantStats;
    private getVendorStats;
    private getEmployeeStats;
    private sanitizeUser;
}
