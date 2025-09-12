import { DatabaseService } from '../database/database.service';
export interface TestResult {
    testName: string;
    category: string;
    passed: boolean;
    message: string;
    details?: any;
    executionTime: number;
}
export interface ValidationReport {
    overall: {
        totalTests: number;
        passed: number;
        failed: number;
        successRate: number;
        totalExecutionTime: number;
    };
    categories: {
        [category: string]: TestResult[];
    };
    recommendations: string[];
    criticalIssues: string[];
}
export declare class TestingValidationService {
    private readonly databaseService;
    private readonly logger;
    constructor(databaseService: DatabaseService);
    runComprehensiveTests(): Promise<ValidationReport>;
    private testDatabaseSchema;
    private testApiEndpoints;
    private testSecurity;
    private testPerformance;
    private testDataIntegrity;
    private testBusinessLogic;
    private generateValidationReport;
    getProductionReadinessChecklist(): Promise<any>;
}
