import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: Request & {
        user: any;
    }): Promise<any>;
    updateProfile(req: Request & {
        user: any;
    }, updateUserDto: UpdateUserDto): Promise<any>;
    getStats(req: Request & {
        user: any;
    }): Promise<{}>;
    getUserById(id: string): Promise<any>;
    activateUser(id: string): Promise<{
        message: string;
    }>;
    deactivateUser(id: string): Promise<{
        message: string;
    }>;
    verifyEmail(id: string): Promise<{
        message: string;
    }>;
}
