import { FrontendIntegrationService } from './frontend-integration.service';
export declare class FrontendIntegrationController {
    private readonly frontendIntegrationService;
    constructor(frontendIntegrationService: FrontendIntegrationService);
    getApiDocumentation(): import("./frontend-integration.service").ApiResponse<{
        [category: string]: import("./frontend-integration.service").EndpointDocumentation[];
    }>;
    getFormFieldMappings(): import("./frontend-integration.service").ApiResponse<{
        [formType: string]: any;
    }>;
    getErrorCodeMappings(): import("./frontend-integration.service").ApiResponse<{
        [code: string]: any;
    }>;
    getIntegrationChecklist(): import("./frontend-integration.service").ApiResponse<{
        [category: string]: any[];
    }>;
    getTypeScriptInterfaces(): import("./frontend-integration.service").ApiResponse<{
        interfaces: string;
        usage: string;
    }>;
}
