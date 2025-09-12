import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthService } from '../auth.service';
import { JwtPayload, UserPayload } from '../types/user.types';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    private configService;
    private authService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, authService: AuthService);
    validate(req: any, payload: JwtPayload): Promise<UserPayload>;
}
export {};
