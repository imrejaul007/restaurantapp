import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { SecurityPerformanceService } from '../security-performance.service';
export declare class CommunityValidationPipe implements PipeTransform {
    private readonly securityPerformanceService;
    constructor(securityPerformanceService: SecurityPerformanceService);
    transform(value: any, metadata: ArgumentMetadata): Promise<any>;
    private validateCreatePost;
    private validateCreateComment;
    private validateSearch;
}
export declare class PostValidationPipe implements PipeTransform {
    private readonly securityPerformanceService;
    constructor(securityPerformanceService: SecurityPerformanceService);
    transform(value: any, metadata: ArgumentMetadata): any;
}
export declare class CommentValidationPipe implements PipeTransform {
    private readonly securityPerformanceService;
    constructor(securityPerformanceService: SecurityPerformanceService);
    transform(value: any, metadata: ArgumentMetadata): any;
}
export declare class SearchValidationPipe implements PipeTransform {
    private readonly securityPerformanceService;
    constructor(securityPerformanceService: SecurityPerformanceService);
    transform(value: any, metadata: ArgumentMetadata): any;
}
