import { DatabaseService } from '../database/database.service';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    pagination?: PaginationMeta;
    meta?: any;
    timestamp: string;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface EndpointDocumentation {
    method: string;
    path: string;
    description: string;
    authentication: boolean;
    rateLimit?: string;
    cache?: string;
    parameters?: ParameterDoc[];
    responseFormat: any;
    examples: {
        request?: any;
        response: any;
    };
}
export interface ParameterDoc {
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: any;
    validation?: string[];
}
export declare class FrontendIntegrationService {
    private readonly databaseService;
    private readonly logger;
    constructor(databaseService: DatabaseService);
    formatResponse<T>(data?: T, message?: string, pagination?: PaginationMeta, meta?: any): ApiResponse<T>;
    formatErrorResponse(error: string, statusCode?: number, meta?: any): ApiResponse;
    generatePaginationMeta(page: number, limit: number, total: number): PaginationMeta;
    getApiDocumentation(): {
        [category: string]: EndpointDocumentation[];
    };
    getFormFieldMappings(): {
        [formType: string]: any;
    };
    getErrorCodeMappings(): {
        [code: string]: any;
    };
    getFrontendIntegrationChecklist(): {
        [category: string]: any[];
    };
    generateTypeScriptInterfaces(): string;
}
