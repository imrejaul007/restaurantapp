import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class SanitizationMiddleware implements NestMiddleware {
    private readonly logger;
    private readonly xssFilter;
    use(req: Request, res: Response, next: NextFunction): void;
    private sanitizeObject;
    private sanitizeValue;
    private removeSQLInjectionPatterns;
}
export declare class SanitizationUtils {
    static sanitizeEmail(email: string): string;
    static sanitizePhoneNumber(phone: string): string;
    static sanitizeAlphanumeric(input: string): string;
    static sanitizeNumeric(input: string): string;
    static sanitizeURL(url: string): string;
    static sanitizeFilename(filename: string): string;
    static sanitizeJSON(input: string): any;
    private static deepSanitizeObject;
}
