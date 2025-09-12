import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
declare const AuthGuardGlobal_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class AuthGuardGlobal extends AuthGuardGlobal_base {
    private reflector;
    private jwtService;
    constructor(reflector: Reflector, jwtService: JwtService);
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | import("rxjs").Observable<boolean>;
    handleRequest(err: any, user: any, info: any, context: ExecutionContext): any;
}
export {};
