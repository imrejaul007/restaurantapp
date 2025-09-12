import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
declare const JwtRefreshStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    private configService;
    constructor(configService: ConfigService);
    validate(payload: any): Promise<{
        id: any;
        email: any;
        role: any;
    }>;
}
export {};
