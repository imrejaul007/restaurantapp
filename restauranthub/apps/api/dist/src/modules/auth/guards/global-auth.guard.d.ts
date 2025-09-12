import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
declare const GlobalAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class GlobalAuthGuard extends GlobalAuthGuard_base {
    private reflector;
    private readonly logger;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
    handleRequest(err: any, user: any, info: any, context: ExecutionContext): any;
}
export {};
